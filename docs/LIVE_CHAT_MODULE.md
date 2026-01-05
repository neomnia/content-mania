# Module de Chat Support en Direct

## Vue d'ensemble

Le module de chat support permet aux visiteurs (invités) et aux utilisateurs enregistrés de communiquer directement avec l'équipe de support. Il inclut :

- **Widget public** : Bouton flottant sur toutes les pages publiques
- **Interface utilisateur** : Page de chat dans le dashboard
- **Console admin** : Gestion complète des conversations

## Architecture

### Base de données

```
chat_conversations     # Conversations (guests + utilisateurs)
├── chat_messages      # Messages individuels
├── chat_quick_responses # Réponses rapides prédéfinies
└── chat_settings      # Configuration du système
```

### Tables

#### `chat_conversations`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| userId | UUID? | Utilisateur connecté (null pour guest) |
| guestEmail | text? | Email du visiteur |
| guestName | text? | Nom du visiteur |
| guestSessionId | text? | ID de session pour le suivi |
| subject | text | Sujet de la conversation |
| status | text | 'open' \| 'pending' \| 'resolved' \| 'closed' |
| priority | text | 'low' \| 'normal' \| 'high' \| 'urgent' |
| assignedAdminId | UUID? | Admin assigné |
| lastMessageAt | timestamp | Dernier message |

#### `chat_messages`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| conversationId | UUID | Référence conversation |
| senderId | UUID? | Expéditeur (null pour guest) |
| senderType | text | 'guest' \| 'user' \| 'admin' \| 'system' |
| content | text | Contenu du message |
| messageType | text | 'text' \| 'image' \| 'file' \| 'system' |
| isRead | boolean | Lu par le destinataire |

## API Endpoints

### Conversations (Public/User)

```
GET  /api/chat/conversations              # Liste des conversations
POST /api/chat/conversations              # Nouvelle conversation
GET  /api/chat/conversations/[id]         # Détail conversation
PATCH /api/chat/conversations/[id]        # Modifier conversation
GET  /api/chat/conversations/[id]/messages # Liste messages
POST /api/chat/conversations/[id]/messages # Envoyer message
```

### Admin

```
GET  /api/admin/chat                      # Toutes les conversations
POST /api/admin/chat/[id]/assign          # Assigner à un admin
POST /api/admin/chat/[id]/read            # Marquer comme lu
GET  /api/admin/chat/quick-responses      # Réponses rapides
POST /api/admin/chat/quick-responses      # Créer réponse rapide
```

## Utilisation

### Widget Public

Le widget est automatiquement inclus sur toutes les pages publiques via `ChatWidgetWrapper` dans le layout public.

```tsx
// app/(public)/layout.tsx
import { ChatWidgetWrapper } from "@/components/chat/chat-widget-wrapper"

// Le widget gère automatiquement :
// - Les visiteurs anonymes (sessionId stocké en localStorage)
// - Les utilisateurs connectés (via UserProvider)
```

### Créer une conversation (API)

```typescript
// Guest
const response = await fetch('/api/chat/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Question sur le produit',
    message: 'Bonjour, je voudrais...',
    guestEmail: 'visiteur@example.com',
    guestName: 'Jean Dupont'
  })
})

// Le response inclut guestSessionId à stocker pour les prochaines requêtes
```

### Envoyer un message

```typescript
// Utilisateur connecté
await fetch(`/api/chat/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Merci pour votre réponse !',
  })
})

// Guest (avec sessionId)
await fetch(`/api/chat/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Merci pour votre réponse !',
    guestSessionId: storedSessionId
  })
})
```

## Interface Admin

Accessible via `/admin/chat`

### Fonctionnalités

1. **Vue d'ensemble** : Stats (ouvertes, en attente, non assignées)
2. **Liste des conversations** : Filtrable par statut, recherche
3. **Chat en temps réel** : Interface de messagerie
4. **Assignation** : Prendre en charge / assigner à un collègue
5. **Statuts** : Ouvert → En attente → Résolu → Fermé

### Workflow typique

1. Visiteur envoie un message → Statut "Ouvert"
2. Admin répond → Statut "En attente" (attend réponse utilisateur)
3. Utilisateur répond → Retour à "Ouvert"
4. Admin résout → Statut "Résolu" ou "Fermé"

## Interface Utilisateur

Accessible via `/dashboard/chat`

### Fonctionnalités

- Liste des conversations existantes
- Créer une nouvelle conversation
- Voir les réponses du support
- Continuer une conversation

## Personnalisation

### Styles du widget

Le widget utilise les variables CSS du thème. Personnalisez via Tailwind :

```css
/* Couleur primaire du widget */
.chat-widget-button {
  @apply bg-primary text-primary-foreground;
}
```

### Messages système

Les messages système (assignation, fermeture) sont automatiquement ajoutés avec `senderType: 'system'` et `messageType: 'system'`.

## Sécurité

- Les guests sont identifiés par `guestSessionId` (UUID)
- Les utilisateurs connectés via JWT cookie
- Les admins vérifient leur rôle avant d'accéder aux fonctions admin
- Les conversations sont filtrées par propriétaire (userId ou guestSessionId)

## Intégration future

Le module est préparé pour l'intégration avec des LLM (voir `LLM_INTEGRATION.md`) pour des réponses automatiques.
