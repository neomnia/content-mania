# Guide de Deploiement - Content Mania

## Architecture de branches

```
dev      → Développement (auto-deploy sur Vercel Preview)
preview  → Pré-production (auto-deploy sur Vercel Preview)
main     → Production (auto-deploy sur Vercel Production)
```

## Variables d'environnement

### Configuration Neon PostgreSQL

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL avec pooler PgBouncer (recommande) | `postgresql://user:pass@host-pooler.region.aws.neon.tech/db?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | URL directe (pour migrations) | `postgresql://user:pass@host.region.aws.neon.tech/db?sslmode=require` |

### Parametres individuels PostgreSQL (optionnel)

| Variable | Description |
|----------|-------------|
| `PGHOST` | Hostname avec pooler |
| `PGHOST_UNPOOLED` | Hostname direct |
| `PGUSER` | Nom d'utilisateur |
| `PGPASSWORD` | Mot de passe |
| `PGDATABASE` | Nom de la base |

### Variables Vercel Postgres (compatibilite)

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | URL avec pooler |
| `POSTGRES_URL_NON_POOLING` | URL directe |
| `POSTGRES_USER` | Utilisateur |
| `POSTGRES_HOST` | Hostname |
| `POSTGRES_PASSWORD` | Mot de passe |
| `POSTGRES_DATABASE` | Base de donnees |
| `POSTGRES_PRISMA_URL` | URL optimisee pour Prisma |

### Configuration NextAuth

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Secret pour JWT + Cryptage (min 32 chars) | `bGpraDUyNDk4Nzk4Nzk4Nzk4Nw==` |
| `NEXTAUTH_URL` | URL de l'application | `https://app.content-mania.com` |

### Configuration Vercel

1. **Settings** → **Environment Variables**
2. Ajouter les variables ci-dessus pour :
   - ✅ Production
   - ✅ Preview
   - ✅ Development

## Workflow de déploiement

### 1. Développement local

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Initialiser les templates d'emails
npx tsx scripts/seed-email-templates.ts

# Initialiser les permissions de pages
npx tsx scripts/sync-pages.ts

# Tester le cryptage
npx tsx scripts/test-api-encryption.ts

# Tester l'API
bash scripts/test-api-flow.sh

### 2. Déploiement Automatisé (Vercel)

Le processus de déploiement sur Vercel est entièrement automatisé via le script `scripts/build-with-db.sh`. Ce script orchestre l'exécution de toutes les fonctions nécessaires à la mise en production :

1.  **Vérification de l'environnement** : Détection du mode Vercel et des variables DB.
2.  **Synchronisation Base de Données** :
    *   **Par défaut (Mode Persistant)** : Exécute `pnpm db:push` pour mettre à jour le schéma sans perdre de données (Production).
    *   **Mode Reset (Automatique en Preview/Dev)** : Si l'environnement est `preview` ou `development`, ou si `FORCE_DB_RESET=true`, exécute `pnpm db:hard-reset` (Reset + Seed) pour garantir un environnement propre.
3.  **Configuration des Emails** (`pnpm seed:email-templates`) :
    *   Injection/Mise à jour des templates d'emails transactionnels (SendGrid/Scaleway).
4.  **Synchronisation des Permissions** (`pnpm seed:pages`) :
    *   Scan des routes de l'application.
    *   Mise à jour des permissions et rôles en base.
5.  **Build Next.js** : Compilation de l'application frontend/backend.

> **Note** : Ce processus garantit que chaque déploiement dispose d'une base de données à jour.

### Scripts Utiles

- `scripts/setup-vercel-env.sh` : Configure automatiquement les variables d'environnement sur Vercel (Production, Preview, Development) à partir de votre fichier `.env`.
- `scripts/vercel-api-setup.sh` : Configure spécifiquement les clés API (CRON_SECRET, API_KEY) sur Vercel.
- `scripts/check-email-config.ts` : Vérifie la configuration des emails transactionnels.

```

### 2. Intégration dans le processus de déploiement (CI/CD)

Chaque script ou exécutable critique pour le fonctionnement de l'application doit être intégré dans le processus de déploiement automatisé.
Le point d'entrée de ce processus est le script `scripts/build-with-db.sh`, qui est exécuté par Vercel lors du build (`package.json` > `scripts` > `build`).

Actuellement, les scripts suivants sont exécutés automatiquement :

1.  **Mise à jour de la BDD** :
    *   `drizzle-kit push` : Applique les changements de schéma (nouvelles tables, colonnes) sans perte de données.
    *   *Optionnel* : `scripts/reset-db.ts` et `scripts/seed-database.ts` si `FORCE_DB_RESET=true`.
2.  **Templates d'emails** (`pnpm seed:email-templates`) :
    *   `scripts/seed-email-templates.ts` : Initialise les modèles d'emails dans la BDD.
3.  **Permissions des pages** (`pnpm seed:pages`) :
    *   `scripts/sync-pages.ts` : Synchronise les permissions d'accès aux pages.
4.  **Configuration Email (Preview/Dev)** :
    *   `scripts/fix-email-provider-defaults.ts` : Ajuste la configuration pour les environnements de test.

**⚠️ Important :** Si vous ajoutez un nouveau script qui doit être exécuté lors du déploiement (ex: migration de données, seeding spécifique), vous **devez** l'ajouter dans `scripts/build-with-db.sh`.

**📚 Changements de Schéma Importants :**
- **Système de Types de Produits** (Jan 2026) : Nouvelle table `product_leads` + refonte du champ `products.type`. Voir [PRODUCTS_TYPE_SYSTEM.md](./PRODUCTS_TYPE_SYSTEM.md) pour les détails.

### 3. Push vers `dev`

```bash
git checkout dev
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin dev
```

→ Déploiement automatique sur **Vercel Preview**

### 3. Merge vers `preview`

```bash
git checkout preview
git merge dev
git push origin preview
```

→ Déploiement automatique sur **Vercel Preview** (URL stable)

### 4. Merge vers `main` (Production)

```bash
# Après validation sur preview
git checkout main
git merge preview
git push origin main
```

→ Déploiement automatique sur **Vercel Production**

## Checklist pré-déploiement

- [ ] Variables d'environnement configurées sur Vercel
- [ ] Tests locaux passent (`npm run test` si configuré)
- [ ] Build local réussit (`npm run build`)
- [ ] Migrations de base de données appliquées (`npm run db:push` ou `drizzle-kit migrate`)
- [ ] Pas d'erreurs TypeScript (`npx tsc --noEmit`)

## Mises à jour de la Base de Données

Lors de l'ajout de nouveaux composants nécessitant des changements de schéma (ex: système d'emails, logs, etc.), il est impératif de mettre à jour la base de données.

### Option 1 : Push direct (Développement / Test)
Attention : Cette commande peut réinitialiser les données si le schéma a changé de manière incompatible.

```bash
npm run db:push
# ou
npx tsx db/push-schema.ts
```

### Option 2 : Migrations (Production)
Utilisez `drizzle-kit` pour générer et appliquer des migrations sans perte de données.

```bash
npm run db:generate
# Appliquer les migrations (commande à configurer selon l'environnement)
```

### Initialisation des données
Après une mise à jour du schéma, pensez à réinitialiser les données de référence :

```bash
# Templates d'emails
npx tsx scripts/seed-email-templates.ts

# Permissions
npx tsx scripts/sync-pages.ts
```

## Monitoring

### Vérifier le déploiement

1. **Vercel Dashboard** → Deployments
2. Vérifier les logs de build
3. Tester l'URL de déploiement
4. Vérifier que l'authentification fonctionne

### Rollback si nécessaire

1. Vercel Dashboard → Deployments
2. Cliquer sur un déploiement précédent
3. **Promote to Production**

## Troubleshooting

### Erreur : "NEXTAUTH_SECRET is required"

**Cause** : Variable d'environnement manquante
**Solution** :
1. Vercel → Settings → Environment Variables
2. Ajouter `NEXTAUTH_SECRET` pour tous les environnements
3. Redéployer

### Erreur : "relation does not exist"

**Cause** : Tables de base de données non créées
**Solution** :
1. Aller sur Neon Console
2. Exécuter `db/create-service-api-tables.sql`
3. Ou lancer : `npm run db:push`

### Erreur : Cryptage échoue

**Cause** : `NEXTAUTH_SECRET` trop court (<32 caractères)
**Solution** : Générer une nouvelle clé :
```bash
openssl rand -base64 32
```

## Support

Pour toute question :
- GitHub Issues : [content-maniatech/content-mania-website](https://github.com/content-maniatech/content-mania-website)
- Documentation : `/docs`
