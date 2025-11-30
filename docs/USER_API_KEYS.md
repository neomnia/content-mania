# 🔑 Gestion des Clés API Utilisateur

## Vue d'ensemble

Ce système permet aux utilisateurs de l'application de générer des clés API pour accéder à l'API de manière programmatique. Ces clés sont différentes des clés API des providers (AWS, Scaleway, etc.) qui sont stockées dans la table `api_keys` pour la configuration des services externes.

## Architecture

### Tables de Base de Données

#### `user_api_keys`

Stocke les clés API des utilisateurs de manière sécurisée.

```typescript
{
  id: UUID (Primary Key)
  userId: UUID (Foreign Key -> users.id, CASCADE DELETE)
  name: VARCHAR(255)                      // Nom descriptif
  keyHash: VARCHAR(255) UNIQUE            // Hash SHA-256 de la clé
  keyPrefix: VARCHAR(10)                  // Préfixe pour affichage (sk_live_abc)
  permissions: JSONB<string[]>            // Permissions granulaires
  isActive: BOOLEAN DEFAULT true
  expiresAt: TIMESTAMP NULLABLE           // Date d'expiration optionnelle
  lastUsedAt: TIMESTAMP NULLABLE          // Dernière utilisation
  createdAt: TIMESTAMP DEFAULT NOW()
  updatedAt: TIMESTAMP DEFAULT NOW()
}
```

#### `user_api_key_usage`

Traçabilité complète de l'utilisation des clés API.

```typescript
{
  id: UUID (Primary Key)
  apiKeyId: UUID (Foreign Key -> user_api_keys.id, CASCADE DELETE)
  endpoint: VARCHAR(500)                  // URL appelée
  method: VARCHAR(10)                     // GET, POST, etc.
  statusCode: VARCHAR(3)                  // 200, 401, etc.
  ipAddress: VARCHAR(45)                  // IPv4 ou IPv6
  userAgent: TEXT                         // User-Agent du client
  responseTime: VARCHAR(50)               // Temps de réponse en ms
  createdAt: TIMESTAMP DEFAULT NOW()
}
```

## Format des Clés

Les clés API suivent le format standard de l'industrie :

```
sk_[env]_[64_hex_characters]

Exemples:
- sk_live_a1b2c3d4e5f6... (production)
- sk_test_x9y8z7w6v5u4... (test)
```

## Fonctions Disponibles

### Génération et Hashing

```typescript
import { generateApiKey, hashApiKey, getApiKeyPrefix } from '@/lib/apiKeys';

// Générer une nouvelle clé
const key = generateApiKey('live'); // sk_live_...

// Hasher une clé pour stockage
const hash = hashApiKey(key); // SHA-256

// Obtenir le préfixe pour affichage
const prefix = getApiKeyPrefix(key); // "sk_live_abc"
```

### CRUD Operations

```typescript
import {
  createApiKey,
  verifyApiKey,
  listUserApiKeys,
  revokeApiKey,
  deleteApiKey
} from '@/lib/apiKeys';

// Créer une clé API
const newKey = await createApiKey({
  userId: 'user-uuid',
  name: 'Production API Key',
  permissions: ['read:data', 'write:data'],
  expiresAt: new Date('2025-12-31')
});

// ⚠️ IMPORTANT: newKey.key contient la clé en clair
// Elle doit être affichée UNE SEULE FOIS à l'utilisateur
console.log('Votre clé API:', newKey.key);

// Vérifier une clé API
const result = await verifyApiKey(apiKeyFromRequest);
if (result.valid) {
  const { key } = result;
  // Accès autorisé
  console.log('User ID:', key.userId);
  console.log('Permissions:', key.permissions);
} else {
  // Accès refusé
  console.error(result.error);
}

// Lister toutes les clés d'un utilisateur
const keys = await listUserApiKeys(userId);

// Révoquer une clé (soft delete)
await revokeApiKey(keyId, userId);

// Supprimer définitivement une clé
await deleteApiKey(keyId, userId);
```

### Analytics et Traçabilité

```typescript
import { logApiKeyUsage, getApiKeyUsageStats } from '@/lib/apiKeys';

// Enregistrer une utilisation
await logApiKeyUsage({
  apiKeyId: key.id,
  endpoint: '/api/users',
  method: 'GET',
  statusCode: '200',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  responseTime: '124' // ms
});

// Récupérer les statistiques
const stats = await getApiKeyUsageStats(keyId, 100);
```

## Middleware Next.js

Exemple d'implémentation d'un middleware pour vérifier les clés API :

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyApiKey, logApiKeyUsage } from '@/lib/apiKeys';

export async function middleware(request: NextRequest) {
  // Routes protégées par API key
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    const apiKey = request.headers.get('x-api-key') ||
                   request.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    const result = await verifyApiKey(apiKey);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Ajouter les infos de l'utilisateur au header
    const response = NextResponse.next();
    response.headers.set('x-user-id', result.key.userId);
    response.headers.set('x-api-key-id', result.key.id);

    // Logger l'utilisation (en async pour ne pas bloquer)
    const endTime = Date.now();
    logApiKeyUsage({
      apiKeyId: result.key.id,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      statusCode: '200', // Sera mis à jour si erreur
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
      responseTime: String(endTime - startTime)
    }).catch(console.error);

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/v1/:path*',
};
```

## Sécurité

### Bonnes Pratiques

1. **Jamais logger les clés en clair**
   ```typescript
   // ❌ NE PAS FAIRE
   console.log('API Key:', apiKey);

   // ✅ FAIRE
   console.log('API Key Prefix:', getApiKeyPrefix(apiKey));
   ```

2. **HTTPS obligatoire**
   - Toutes les requêtes avec clés API doivent utiliser HTTPS
   - Configurer le middleware pour rejeter HTTP en production

3. **Rate Limiting**
   ```typescript
   // Exemple avec Upstash Rate Limit
   import { Ratelimit } from '@upstash/ratelimit';

   const ratelimit = new Ratelimit({
     redis: redis,
     limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 req/h
   });

   const { success } = await ratelimit.limit(apiKeyHash);
   if (!success) {
     return NextResponse.json(
       { error: 'Rate limit exceeded' },
       { status: 429 }
     );
   }
   ```

4. **Rotation des clés**
   - Implémenter un système d'expiration
   - Notifier les utilisateurs avant expiration
   - Permettre la génération de nouvelles clés

5. **Monitoring**
   - Alertes sur tentatives d'utilisation de clés expirées
   - Dashboard des statistiques d'utilisation
   - Détection d'abus (trop de requêtes, endpoints inhabituels)

## Permissions

Le système de permissions est flexible via JSONB :

```typescript
// Exemples de permissions
const permissions = [
  'read:users',
  'write:users',
  'read:data',
  'write:data',
  'admin:*'
];

// Vérifier une permission
function hasPermission(key: UserApiKey, required: string): boolean {
  return key.permissions.includes(required) ||
         key.permissions.includes('admin:*');
}
```

## Interface Utilisateur

### Page de Gestion des Clés API

Créer une page dans le dashboard utilisateur :

```tsx
// app/(private)/dashboard/api-keys/page.tsx
import { listUserApiKeys } from '@/lib/apiKeys';
import { getServerSession } from 'next-auth';
import { ApiKeysList } from '@/components/api-keys-list';
import { CreateApiKeyButton } from '@/components/create-api-key-button';

export default async function ApiKeysPage() {
  const session = await getServerSession();
  const keys = await listUserApiKeys(session.user.id);

  return (
    <div>
      <h1>Mes Clés API</h1>
      <CreateApiKeyButton />
      <ApiKeysList keys={keys} />
    </div>
  );
}
```

## Déploiement

### Variables d'Environnement

```bash
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
```

### Migration

```bash
# Générer les migrations
pnpm db:generate

# Pousser le schéma (développement)
pnpm db:push

# Appliquer les migrations (production)
pnpm db:migrate
```

### Tests

```bash
# Tester la connexion et le schéma
npx tsx scripts/test-db-connection.ts
```

## Différences avec `api_keys` (Provider Keys)

| Aspect | `user_api_keys` | `api_keys` (providers) |
|--------|----------------|------------------------|
| **Usage** | Accès API par les utilisateurs | Credentials pour services externes |
| **Format** | `sk_live_...` | Clés provider natives |
| **Stockage** | Hash SHA-256 | Chiffrement AES-256-CBC |
| **Scope** | Par utilisateur | Global (admin seulement) |
| **Permissions** | JSONB flexible | Par provider |
| **Exemple** | Utilisateur appelle votre API | App appelle AWS SES |

## Support

Pour toute question :
- Documentation complète : `DATABASE_SETUP.md`
- Tests : `scripts/test-db-connection.ts`
- Schéma : `db/schema.ts` (lignes 338-394)

---

**Dernière mise à jour** : 27 novembre 2025
