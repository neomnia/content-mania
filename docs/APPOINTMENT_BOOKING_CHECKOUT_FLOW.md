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
- ✅ Validation avant paiement : tous les créneaux doivent être sélectionnés
- ✅ Stockage des données de rendez-vous dans un Map

**États ajoutés:**
```tsx
const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
const [currentAppointmentProduct, setCurrentAppointmentProduct] = useState<any | null>(null)
const [appointmentsData, setAppointmentsData] = useState<Map<string, any>>(new Map())
```

#### 3. Système de Notifications Admin
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
- Un bouton "Sélectionner un créneau" est affiché

### 4. Sélection du créneau
- Click sur "Sélectionner un créneau"
- Ouverture de la modale `AppointmentModal`
- Sélection de la date et de l'heure
- Remplissage des informations participant
- Validation

### 5. Validation de la commande
- Click sur "Payer X€"
- Vérification : tous les créneaux sont sélectionnés ?
  - ❌ Non → Ouverture de la modale pour le premier rendez-vous manquant
  - ✅ Oui → Traitement du checkout

### 6. Traitement backend
1. Création de la commande
2. Création du rendez-vous dans `appointments`
3. Synchronisation avec le calendrier
4. Création de la facture Lago (si payant)
5. **Envoi de notification admin via `/chat`**
6. Envoi d'email de confirmation au client

### 7. Notification admin
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

### Email client - Rendez-vous
Template : `appointment-confirmation`

**Contenu:**
- Nom du produit/service
- Date et heure du rendez-vous
- Fuseau horaire
- Informations de paiement
- Instructions de préparation
- Lien de modification/annulation

### Email client - Commande
Template : `order-confirmation`

**Contenu:**
- Numéro de commande
- Liste des produits
- Total payé
- Informations de facturation
- Lien vers la facture

## Tests

### Test manuel

1. Créer un produit de type "appointment" dans `/admin/products`
2. Ajouter au panier
3. Aller au checkout
4. Vérifier le badge "Rendez-vous"
5. Cliquer sur "Sélectionner un créneau"
6. Sélectionner une date et heure
7. Remplir les informations
8. Valider
9. Voir le statut "Créneau sélectionné" ✅
10. Cliquer sur "Payer"
11. Vérifier dans `/admin/chat` la nouvelle notification

### Test de validation

1. Ajouter 2 produits avec rendez-vous au panier
2. Sélectionner le créneau pour le premier uniquement
3. Essayer de valider
4. → La modale s'ouvre pour le 2ème produit
5. Sélectionner le créneau
6. Valider
7. ✅ Commande créée

## Logs de débogage

Tous les logs sont préfixés par `[Checkout]` ou `[AdminNotification]`

**Exemples:**
```
[Checkout] Appointment created: { appointmentId, isPaid, price }
[Checkout] Admin notification sent for appointment
[AdminNotification] ✅ Notification sent { conversationId, type, subject }
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
