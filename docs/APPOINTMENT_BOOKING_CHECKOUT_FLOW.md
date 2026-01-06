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
- ✅ Redirection vers page de planification post-achat pour les rendez-vous

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

#### 3. Page de Planification Post-Achat
**Fichier:** `app/(private)/dashboard/appointments/book/page.tsx`

Page dédiée à la planification des rendez-vous après validation de la commande.

**Fonctionnalités:**
- ✅ Chargement de la commande via `/api/orders/[id]`
- ✅ Filtrage des produits de type "appointment"
- ✅ Barre de progression pour plusieurs rendez-vous
- ✅ Utilisation du composant `AppointmentBooking`
- ✅ Création des rendez-vous via `/api/appointments`
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

Endpoint pour récupérer les détails d'une commande avec ses articles.

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
    ]
  }
}
```

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
- Un bouton "Sélectionner un créneau" est affiché (optionnel - pré-sélection)

### 4. Pré-sélection du créneau (Optionnel)
- Click sur "Sélectionner un créneau" dans le récapitulatif
- Ouverture de la modale `AppointmentModal`
- Sélection de la date et de l'heure
- Remplissage des informations participant
- Validation

### 5. Validation de la commande
- Click sur "Payer X€" (ou "Valider la commande" en mode DEV)
- Traitement du checkout
- Création de la commande

### 6. Page de planification post-achat
**Fichier:** `app/(private)/dashboard/appointments/book/page.tsx`

Après validation de la commande, si des produits de type "appointment" sont présents:
- Redirection vers `/dashboard/appointments/book?orderId=xxx`
- Affichage des produits avec rendez-vous à planifier
- Barre de progression si plusieurs rendez-vous
- Pour chaque produit:
  - Affichage du composant `AppointmentBooking`
  - Sélection de la date et de l'heure
  - Remplissage des informations participant
  - Création du rendez-vous via `/api/appointments`
- Possibilité de terminer sans planifier tous les rendez-vous
- Redirection finale vers la page de confirmation

### 7. Traitement backend
1. Création de la commande
2. Redirection vers page de planification
3. Création du rendez-vous dans `appointments` (lors de la sélection)
4. Synchronisation avec le calendrier
5. **Appel à `/api/appointments/:id/notify`** qui déclenche:
   - Email de confirmation au client (via Scaleway TEM)
   - Email de notification à l'admin (via Scaleway TEM)
   - Notification chat admin (via système de chat interne)

### 8. Page de confirmation
**Fichier:** `app/(private)/dashboard/checkout/confirmation/page.tsx`

- Récapitulatif de tous les rendez-vous confirmés
- Liens vers le calendrier et le dashboard
- Message de confirmation avec détails

### 9. Notification admin
L'admin reçoit une notification dans `/admin/chat` :
- Type : "appointment" (priorité haute)
- Contenu : Détails du rendez-vous
- Lien direct vers le calendrier

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
