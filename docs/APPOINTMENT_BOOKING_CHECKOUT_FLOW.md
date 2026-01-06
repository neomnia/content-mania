# Tunnel de Vente avec Rendez-vous Intégré

## Vue d'ensemble

Ce système permet de gérer un tunnel d'achat complet avec intégration de prise de rendez-vous pour les produits de type "appointment". Lorsqu'un client commande un produit nécessitant un rendez-vous, une fenêtre modale apparaît pour sélectionner un créneau disponible avant la validation finale de la commande.

## Architecture

### Composants créés

#### 1. `AppointmentModal` 
**Fichier:** `components/checkout/appointment-modal.tsx`

Modal qui s'ouvre pendant le checkout pour permettre la sélection d'un rendez-vous.

**Props:**
- `isOpen`: État d'ouverture de la modale
- `onClose`: Callback de fermeture
- `product`: Informations du produit (id, title, price, currency)
- `onAppointmentBooked`: Callback après sélection du créneau

**Utilisation:**
```tsx
<AppointmentModal
  isOpen={appointmentModalOpen}
  onClose={() => setAppointmentModalOpen(false)}
  product={{
    id: "uuid",
    title: "Consultation",
    price: 99,
    currency: "EUR"
  }}
  onAppointmentBooked={(data) => {
    // Sauvegarder les données du rendez-vous
    console.log(data)
  }}
/>
```

#### 2. Page de Checkout améliorée
**Fichier:** `app/(private)/dashboard/checkout/page.tsx`

Modifications apportées :
- ✅ Détection automatique des produits de type "appointment" dans le panier
- ✅ Badge visuel pour identifier les produits avec rendez-vous
- ✅ Bouton "Sélectionner un créneau" pour chaque produit avec rendez-vous
- ✅ Chargement dynamique des méthodes de paiement selon le mode Lago
- ✅ Support du mode DEV (Lago bypassed)
- ✅ **Création automatique des rendez-vous pendant le checkout**
- ✅ **Envoi automatique des emails de confirmation**
- ✅ Redirection vers page de confirmation avec récapitulatif complet

**États ajoutés:**
```tsx
const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
const [currentAppointmentProduct, setCurrentAppointmentProduct] = useState<any | null>(null)
const [appointmentsData, setAppointmentsData] = useState<Map<string, any>>(new Map())
const [paymentConfig, setPaymentConfig] = useState({
  lagoMode: 'dev' as 'dev' | 'test' | 'production',
  stripeEnabled: false,
  paypalEnabled: false
})
```

**Nouveau comportement:**
- Les rendez-vous sont maintenant créés **directement dans la base de données** lors du processus de checkout
- Les données de rendez-vous (`appointmentsData`) sont passées à la fonction `processCheckout`
- Plus besoin de page de planification post-achat séparée
- Envoi automatique des notifications email (client + admin) après création

#### 3. Page de Planification Post-Achat
**Fichier:** `app/(private)/dashboard/appointments/book/page.tsx`

Page dédiée à la planification des rendez-vous après validation de la commande.

**Fonctionnalités:**
- ✅ Chargement de la commande via `/api/orders/[id]`
- ✅ Filtrage des produits de type "appointment"
- ✅ Barre de progression pour plusieurs rendez-vous
- ✅ Utilisation du composant `AppointmentBooking`
- ✅ Création des rendez-vous via `/api/appointments`
- ✅ **Popup de confirmation avec prochaines étapes** (email, contact, calendrier)
- ✅ Récapitulatif des rendez-vous confirmés
- ✅ Redirection vers confirmation finale

**États:**
```tsx
const [order, setOrder] = useState<Order | null>(null)
const [bookedAppointments, setBookedAppointments] = useState<Map<string, BookedAppointment>>(new Map())
const [currentItemIndex, setCurrentItemIndex] = useState(0)
```

#### 4. API Endpoint - Récupération Commande
**Fichier:** `app/api/orders/[id]/route.ts`

Endpoint pour récupérer les détails d'une commande avec ses articles **et ses rendez-vous**.

**Méthode:** `GET /api/orders/:id`

**Réponse:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-xxx",
    "status": "completed",
    "items": [
      {
        "id": "uuid",
        "itemType": "appointment",
        "itemId": "product-uuid",
        "itemName": "Consultation",
        "quantity": 1,
        "unitPrice": 9900
      }
    ],
    "appointments": [
      {
        "id": "uuid",
        "title": "Consultation",
        "startTime": "2024-01-15T14:00:00Z",
        "endTime": "2024-01-15T15:00:00Z",
        "attendeeEmail": "client@example.com",
        "attendeeName": "John Doe",
        "attendeePhone": "+33612345678",
        "status": "confirmed",
        "paymentStatus": "paid"
      }
    ]
  }
}
```

**Nouveauté:**
- Le endpoint retourne maintenant un tableau `appointments` contenant tous les rendez-vous liés à la commande
- Les rendez-vous sont filtrés via `metadata.orderId` qui correspond à l'ID de la commande
- Permet d'afficher les rendez-vous sur la page de confirmation

#### 5. Système de Notifications Email pour Rendez-vous
**Fichier:** `lib/notifications/appointment-notifications.ts`

Système complet d'envoi d'emails pour les rendez-vous confirmés.

**Fonctions:**

##### `sendAppointmentConfirmationToClient()`
Envoie un email HTML de confirmation au client avec les détails du rendez-vous.

**Contenu de l'email:**
- En-tête avec branding (gradient bronze #CD7F32)
- Détails du rendez-vous (service, date, heure, prix)
- Notes du client si présentes
- Bouton CTA "Voir mes rendez-vous"
- Footer avec copyright

##### `sendAppointmentNotificationToAdmin()`
Envoie un email HTML de notification à l'admin pour chaque nouveau rendez-vous.

**Contenu de l'email:**
- En-tête avec branding vert (#10B981)
- Informations client (nom, email, téléphone)
- Détails du rendez-vous
- Notes du client
- Bouton CTA "Voir le calendrier"

##### `sendAllAppointmentNotifications()`
Fonction combinée qui envoie en parallèle:
1. Email de confirmation au client
2. Email de notification à l'admin
3. Notification chat à l'admin

**Utilisation:**
```typescript
import { sendAllAppointmentNotifications } from '@/lib/notifications/appointment-notifications'

const results = await sendAllAppointmentNotifications({
  appointmentId: "uuid",
  productTitle: "Consultation",
  startTime: new Date("2026-01-20T10:00:00"),
  endTime: new Date("2026-01-20T11:00:00"),
  timezone: "Europe/Paris",
  attendeeName: "Jean Dupont",
  attendeeEmail: "jean@example.com",
  attendeePhone: "+33612345678",
  price: 9900,
  currency: "EUR",
  notes: "Question sur...",
  userId: "uuid"
})
// results = { clientEmail, adminEmail, adminChat }
```

#### 6. API Endpoint - Envoi Notifications
**Fichier:** `app/api/appointments/[id]/notify/route.ts`

Endpoint pour déclencher l'envoi des notifications après création d'un rendez-vous.

**Méthode:** `POST /api/appointments/:id/notify`

**Authentification:** Requise (vérifie que l'utilisateur est propriétaire du rendez-vous)

**Réponse:**
```json
{
  "success": true,
  "results": {
    "clientEmail": { "success": true },
    "adminEmail": { "success": true },
    "adminChat": { "success": true }
  }
}
```

#### 7. Système de Notifications Admin (Chat)
**Fichier:** `lib/notifications/admin-notifications.ts`

Fonctions principales :

##### `sendAdminNotification()`
Fonction générique pour envoyer une notification via le système de chat.

**Paramètres:**
- `subject`: Sujet de la notification
- `message`: Contenu (markdown supporté)
- `type`: 'order' | 'appointment' | 'support' | 'system'
- `userId`, `userEmail`, `userName`: Infos de l'utilisateur
- `priority`: 'low' | 'normal' | 'high' | 'urgent'
- `metadata`: Données supplémentaires

**Comportement:**
1. Cherche ou crée une conversation dans `chat_conversations`
2. Ajoute un message de type 'system' dans `chat_messages`
3. Le message apparaît comme non lu dans `/admin/chat`

##### `notifyAdminNewOrder()`
Notification spécifique pour les nouvelles commandes.

**Utilisation:**
```typescript
await notifyAdminNewOrder({
  orderId: "uuid",
  orderNumber: "ORD-20240115-1234",
  userId: "uuid",
  userEmail: "client@example.com",
  userName: "Jean Dupont",
  totalAmount: 29900, // en centimes
  currency: "EUR",
  hasAppointment: true,
  appointmentDetails: {
    startTime: new Date("2024-01-20T10:00:00"),
    endTime: new Date("2024-01-20T11:00:00"),
    attendeeName: "Jean Dupont"
  }
})
```

##### `notifyAdminNewAppointment()`
Notification pour les rendez-vous réservés.

**Utilisation:**
```typescript
await notifyAdminNewAppointment({
  appointmentId: "uuid",
  userId: "uuid",
  userEmail: "client@example.com",
  userName: "Jean Dupont",
  productTitle: "Consultation Stratégie",
  startTime: new Date("2024-01-20T10:00:00"),
  endTime: new Date("2024-01-20T11:00:00"),
  attendeeName: "Jean Dupont",
  attendeeEmail: "jean@example.com"
})
```

### Intégrations

#### Dans `lib/checkout/checkout-service.ts`

**Modifications:**
1. Import des fonctions de notification
2. Appel de `notifyAdminNewAppointment()` après création d'un rendez-vous
3. Appel de `notifyAdminNewOrder()` après création d'une commande digitale

**Code ajouté:**
```typescript
import { notifyAdminNewOrder, notifyAdminNewAppointment } from '@/lib/notifications/admin-notifications'

// Après création d'un rendez-vous
await notifyAdminNewAppointment({
  appointmentId: appointment.id,
  userId,
  userEmail,
  userName,
  productTitle: product.title,
  startTime: appointmentData.startTime,
  endTime: appointmentData.endTime,
  attendeeName: appointmentData.attendeeName,
  attendeeEmail: appointmentData.attendeeEmail
})

// Après création d'une commande
await notifyAdminNewOrder({
  orderId: order.id,
  orderNumber,
  userId,
  userEmail,
  userName,
  totalAmount,
  currency,
  hasAppointment: false
})
```

## Flux utilisateur

### 1. Ajout au panier
L'utilisateur ajoute un produit de type "appointment" au panier.

### 2. Accès au checkout
Navigation vers `/dashboard/checkout`

### 3. Affichage du panier
- Les produits avec rendez-vous ont un badge 📅 "Rendez-vous"
- Un bouton "Sélectionner un créneau" est affiché pour chaque produit

### 4. Sélection du créneau (OBLIGATOIRE)
- Click sur "Sélectionner un créneau" dans le récapitulatif
- Ouverture de la modale `AppointmentModal`
- Sélection de la date et de l'heure
- Remplissage des informations participant (nom, email, téléphone, notes)
- Validation
- **Les données sont stockées dans `appointmentsData` Map**

### 5. Validation de la commande
- Click sur "Payer X€" (ou "Valider la commande" en mode DEV)
- Appel à `processCheckout(cartId, appointmentsData)` avec les données de rendez-vous
- **Création automatique de la commande ET des rendez-vous en base de données**
- **Envoi automatique des notifications:**
  - Email de confirmation au client
  - Email de notification à l'admin
  - Notification chat admin

### 6. Traitement backend - Fonction `processCheckout`
**Fichier:** `app/actions/ecommerce.ts`

**Signature:**
```typescript
export async function processCheckout(
  cartId: string,
  appointmentsData?: Record<string, AppointmentData>
)
```

**Paramètre `appointmentsData`:**
```typescript
Record<productId, {
  startTime: Date,
  endTime: Date,
  timezone: string,
  attendeeEmail: string,
  attendeeName: string,
  attendeePhone?: string,
  notes?: string
}>
```

**Processus:**
1. Récupération du panier et de l'utilisateur
2. Création de la commande dans `orders`
3. Création des `orderItems` pour chaque produit
4. **Si `appointmentsData` fourni:**
   - Pour chaque produit de type "appointment":
     - Création du rendez-vous dans la table `appointments`
     - Liaison via `metadata.orderId`
     - Appel à `sendAllAppointmentNotifications()` pour envoyer:
       * Email client (HTML formaté)
       * Email admin (HTML formaté)
       * Notification chat admin
5. Vidage du panier
6. Retour de `orderId` pour redirection

### 7. Page de confirmation
**Fichier:** `app/(private)/dashboard/checkout/confirmation/page.tsx`

- URL: `/dashboard/checkout/confirmation?orderId=xxx`
- Appel API à `/api/orders/:id` qui retourne:
  - Détails de la commande
  - Liste des articles
  - **Liste des rendez-vous associés** (via `metadata.orderId`)
- Affichage:
  - Numéro de commande
  - Statut de paiement
  - Liste des produits
  - **Section rendez-vous avec:**
    - Icône calendrier
    - Date et heure formatées
    - Nom et email du participant
    - Téléphone (si fourni)
    - Badge statut (confirmé, en attente, etc.)
    - Badge paiement (payé, gratuit, etc.)
    - Notes (si fournies)
  - Message "Des emails de confirmation ont été envoyés"
  - Boutons "Voir mon calendrier" et "Retour au dashboard"

### 8. Notification admin
L'admin reçoit une notification dans `/admin/chat` :
- Type : "appointment" (priorité haute)
- Contenu : Détails du rendez-vous
- Lien direct vers le calendrier

## Schéma technique - Liaison commande/rendez-vous

Les rendez-vous créés lors du checkout sont liés à la commande via le champ `metadata.orderId`:

```typescript
// Création du rendez-vous
const appointment = await db.insert(appointments).values({
  id: uuidv4(),
  userId: userId,
  title: product.title,
  startTime: appointmentData.startTime,
  endTime: appointmentData.endTime,
  timezone: appointmentData.timezone,
  attendeeEmail: appointmentData.attendeeEmail,
  attendeeName: appointmentData.attendeeName,
  attendeePhone: appointmentData.attendeePhone,
  notes: appointmentData.notes,
  status: 'confirmed',
  paymentStatus: 'paid',
  metadata: {
    orderId: orderId,        // ← Liaison avec la commande
    productId: productId,
    price: product.price,
    currency: product.currency
  }
})
```

**Récupération des rendez-vous d'une commande:**
```typescript
// Dans /api/orders/[id]
const orderAppointments = await db
  .select()
  .from(appointments)
  .where(eq(appointments.userId, order.userId))

// Filtrage côté applicatif
const filteredAppointments = orderAppointments.filter(appt => 
  appt.metadata?.orderId === orderId
)
```

## Tables de base de données utilisées

### `chat_conversations`
Stocke les conversations de notification admin.

```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  guest_email TEXT,
  guest_name TEXT,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assigned_admin_id UUID REFERENCES users(id),
  last_message_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `chat_messages`
Stocke les messages de notification.

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id),
  sender_id UUID REFERENCES users(id),
  sender_type TEXT NOT NULL, -- 'system' pour les notifications auto
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Gestion Admin

### Interface `/admin/chat`

L'admin accède à `/admin/chat` pour voir toutes les notifications :

**Filtres disponibles:**
- Statut : open, pending, resolved, closed
- Priorité : low, normal, high, urgent
- Recherche par client

**Actions possibles:**
- Marquer comme lu
- Assigner à un admin
- Répondre au client
- Fermer la conversation
- Voir les détails (metadata)

**Notifications visibles:**
- 📦 Nouvelles commandes
- 📅 Nouveaux rendez-vous
- 💬 Messages support
- ⚙️ Événements système

## Emails de validation

### Email client - Rendez-vous confirmé
**Fichier:** `lib/notifications/appointment-notifications.ts` → `sendAppointmentConfirmationToClient()`

**Template HTML avec:**
- En-tête gradient bronze (#CD7F32 → #B8860B)
- Titre "Rendez-vous confirmé !"
- Message personnalisé avec nom du client
- Tableau récapitulatif:
  - Service (nom du produit)
  - Date complète en français (ex: "lundi 20 janvier 2026 à 10:00")
  - Heure de fin
  - Prix (formaté ou "Gratuit")
- Section notes si présentes (fond jaune)
- Bouton CTA "Voir mes rendez-vous" → `/dashboard/appointments`
- Footer avec copyright

**Envoi via:** Scaleway TEM (`emailRouter.sendEmail()`)

### Email admin - Nouveau rendez-vous
**Fichier:** `lib/notifications/appointment-notifications.ts` → `sendAppointmentNotificationToAdmin()`

**Template HTML avec:**
- En-tête gradient vert (#10B981 → #059669)
- Titre "Nouveau rendez-vous !"
- Section informations client (fond bleu clair):
  - Nom
  - Email
  - Téléphone (si fourni)
- Tableau détails du rendez-vous:
  - Service
  - Date/heure
  - Prix
- Notes du client si présentes
- Bouton CTA "Voir le calendrier" → `/admin/calendar`

**Envoi via:** Scaleway TEM (`emailRouter.sendEmail()`)

### Email client - Commande
Template : `order-confirmation`

**Contenu:**
- Numéro de commande
- Liste des produits
- Total payé
- Informations de facturation
- Lien vers la facture

## Tests

### Test manuel - Flux complet

1. Configurer le mode DEV dans Admin > Settings > Payments
2. Créer un produit de type "appointment" dans `/admin/products`
3. Se connecter en tant qu'utilisateur normal
4. Ajouter le produit au panier depuis `/store` ou `/dashboard`
5. Aller au checkout `/dashboard/checkout`
6. Vérifier le badge "Rendez-vous" sur le produit
7. **Cliquer sur "Sélectionner un créneau"**
8. **Dans la modale:**
   - Choisir une date et heure
   - Remplir nom, email, téléphone (optionnel)
   - Ajouter des notes (optionnel)
   - Valider
9. **Valider la commande** (bouton "Valider la commande (Test)" en mode DEV)
10. **Vérifier la redirection** vers `/dashboard/checkout/confirmation?orderId=xxx`
11. **Sur la page de confirmation, vérifier:**
   - Affichage du numéro de commande
   - Liste des produits commandés
   - **Section "Vos rendez-vous" avec:**
     - Date et heure du rendez-vous
     - Nom et email du participant
     - Téléphone (si fourni)
     - Notes (si fournies)
     - Badge statut "Confirmé"
     - Badge paiement "Payé"
   - Message "Des emails de confirmation ont été envoyés"
12. **Vérifier les emails reçus:**
   - Email client avec récapitulatif du rendez-vous
   - Email admin avec détails client et rendez-vous
13. **Vérifier la notification admin:**
   - Aller sur `/admin/chat`
   - Voir la notification de nouveau rendez-vous
14. **Vérifier la base de données:**
   - Table `orders`: commande créée
   - Table `order_items`: produit lié à la commande
   - Table `appointments`: rendez-vous créé avec `metadata.orderId`
7. Cliquer sur "Valider la commande (Test)"
8. **Redirection automatique vers `/dashboard/appointments/book?orderId=xxx`**
9. Sélectionner une date disponible
10. Sélectionner un créneau horaire
11. Vérifier que les informations participant sont pré-remplies depuis le profil
12. Confirmer la réservation
13. **Vérifier le toast "Rendez-vous confirmé ! Un email de confirmation vous a été envoyé."**
14. **Voir le récapitulatif des rendez-vous confirmés**
15. Cliquer sur "Terminer"
16. **Vérifier la réception de l'email client** (boîte de réception)
17. **Vérifier la réception de l'email admin** (boîte admin)
18. Vérifier dans `/admin/chat` la nouvelle notification

### Test avec plusieurs rendez-vous

1. Ajouter 2 produits avec rendez-vous au panier
2. Valider la commande
3. → Redirection vers page de planification
4. Voir la barre de progression "1 / 2"
5. Planifier le premier rendez-vous
6. La page passe automatiquement au 2ème produit
7. Planifier le second rendez-vous
8. Voir le récapitulatif avec les 2 rendez-vous
9. Terminer

### Test de sortie anticipée

1. Ajouter 2 produits avec rendez-vous au panier
2. Valider la commande
3. Planifier uniquement le premier rendez-vous
4. Cliquer sur "Terminer sans planifier les autres"
5. → Redirection vers confirmation
6. Le 2ème rendez-vous reste non planifié

## Logs de débogage

Tous les logs sont préfixés pour faciliter le débogage.

**Préfixes disponibles:**
- `[Checkout]` - Page de checkout
- `[BookAppointment]` - Page de planification post-achat
- `[API /appointments]` - API création rendez-vous
- `[API /appointments/notify]` - API envoi notifications
- `[AppointmentNotifications]` - Système d'envoi emails
- `[AdminNotification]` - Notifications chat admin

**Exemples:**
```
[API /appointments] Creating appointment: { title, startTime, endTime, type, isPaid }
[API /appointments] Appointment created successfully: uuid
[BookAppointment] Sending notifications for appointment: uuid
[API /appointments/notify] Sending notifications for appointment: uuid
[AppointmentNotifications] Sending confirmation email to client: client@example.com
[AppointmentNotifications] Client email result: { success: true }
[AppointmentNotifications] Sending notification email to admin: admin@neomia.net
[AppointmentNotifications] Admin email result: { success: true }
[AdminNotification] ✅ Notification sent { conversationId, type, subject }
[BookAppointment] Notification result: { success: true, results: {...} }
```

## Variables d'environnement

Aucune nouvelle variable requise. Utilise les configurations existantes :
- Base de données Neon (déjà configurée)
- Système de chat (déjà en place)
- Lago pour les paiements (déjà configuré)

## Améliorations futures

### Phase 2
- [ ] Notification push en temps réel (WebSocket)
- [ ] Dashboard admin avec compteurs de notifications non lues
- [ ] Filtrage avancé des notifications
- [ ] Templates de réponses rapides pour l'admin
- [ ] Historique des notifications archivées

### Phase 3
- [ ] Gestion des rappels automatiques 24h avant le rendez-vous
- [ ] Système de reprogrammation de rendez-vous
- [ ] Notifications SMS (via Twilio)
- [ ] Intégration avec Google Meet/Zoom pour créer les liens de visio automatiquement

## Support

Pour toute question ou problème :
1. Vérifier les logs dans la console navigateur
2. Vérifier les logs serveur avec préfixe `[Checkout]` ou `[AdminNotification]`
3. Consulter la table `chat_messages` pour voir si les notifications sont bien créées
4. Tester avec le mode test Lago pour éviter les vrais paiements

---

**Dernière mise à jour:** Janvier 2026  
**Version:** 1.0.0
