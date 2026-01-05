# Système de Checkout et Réservation de Rendez-vous

## Vue d'ensemble

Ce module implémente un tunnel d'achat unifié qui gère différents types de produits:

- **Standard**: Produits payants classiques
- **Digital**: Produits numériques (avec notification email à l'équipe)
- **Free**: Produits gratuits
- **Appointment**: Réservation de rendez-vous (avec calendrier + paiement optionnel)

## Architecture

```
lib/checkout/
├── index.ts                  # Export principal
├── types.ts                  # Types TypeScript
├── checkout-service.ts       # Service de checkout principal
├── lago-test-mode.ts         # Mode test pour Lago
└── team-notifications.ts     # Notifications email équipe

app/api/checkout/
├── route.ts                  # API principale de checkout
├── simulate-payment/route.ts # Simulation de paiement (test)
└── available-slots/route.ts  # Créneaux disponibles

components/checkout/
├── index.ts                  # Export composants
└── appointment-booking.tsx   # UI de réservation

app/(public)/book/[productId]/
└── page.tsx                  # Page de réservation publique
```

## Flux de Checkout

### 1. Produits de type "Appointment"

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Sélection      │ --> │  Informations   │ --> │  Paiement       │
│  du créneau     │     │  client         │     │  (si requis)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        v
                        ┌─────────────────────────────────────────────┐
                        │  Actions automatiques:                      │
                        │  1. Création du RDV dans DB                 │
                        │  2. Sync avec calendrier Neosaas            │
                        │  3. Création facture Lago (si payant)       │
                        │  4. Email notification équipe               │
                        │  5. Email confirmation client               │
                        └─────────────────────────────────────────────┘
```

### 2. Produits Digitaux

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Ajout au       │ --> │  Checkout       │ --> │  Paiement       │
│  panier         │     │                 │     │  Lago           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        v
                        ┌─────────────────────────────────────────────┐
                        │  Actions automatiques:                      │
                        │  1. Création commande                       │
                        │  2. Création facture Lago                   │
                        │  3. Email notification équipe               │
                        │  4. Email confirmation client               │
                        │  5. Accès aux fichiers digitaux             │
                        └─────────────────────────────────────────────┘
```

## Mode Test Lago

Le système supporte un mode test qui permet de tester l'intégralité du flux sans connexion à un payment provider réel.

### Activation

Le mode test est activé automatiquement si:
- `NODE_ENV === 'development'`
- `lago_mode === 'test'` dans la configuration platform

### Comportement en mode test

1. Les clients Lago sont simulés avec des IDs `test_cus_xxx`
2. Les factures sont simulées avec des IDs `test_inv_xxx`
3. Les paiements peuvent être simulés via l'API `/api/checkout/simulate-payment`
4. Les factures sont auto-marquées comme payées (optionnel)

### Simulation de paiement

```bash
# Simuler le paiement d'un rendez-vous
POST /api/checkout/simulate-payment
{
  "appointmentId": "uuid-du-rdv"
}

# Simuler le paiement d'une commande
POST /api/checkout/simulate-payment
{
  "orderId": "uuid-de-la-commande"
}
```

## API Endpoints

### POST /api/checkout

Traite un checkout complet.

**Body (panier):**
```json
{
  "cartId": "uuid-du-panier"
}
```

**Body (rendez-vous direct):**
```json
{
  "appointmentData": {
    "productId": "uuid-du-produit",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "timezone": "Europe/Paris",
    "attendeeEmail": "client@example.com",
    "attendeeName": "Jean Dupont",
    "attendeePhone": "+33612345678",
    "notes": "Information complémentaire"
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "appointmentId": "uuid",
    "invoiceId": "test_inv_xxx",
    "requiresPayment": false,
    "testMode": true
  }
}
```

### GET /api/checkout/available-slots

Récupère les créneaux disponibles pour un produit de type appointment.

**Paramètres:**
- `productId` (requis): ID du produit
- `date`: Date de début (format YYYY-MM-DD)
- `timezone`: Fuseau horaire (défaut: Europe/Paris)

**Réponse:**
```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "productTitle": "Consultation 1h",
    "productPrice": 5000,
    "currency": "EUR",
    "timezone": "Europe/Paris",
    "slots": {
      "2024-01-15": [
        {
          "startTime": "2024-01-15T09:00:00+01:00",
          "endTime": "2024-01-15T10:00:00+01:00",
          "available": true
        },
        {
          "startTime": "2024-01-15T10:00:00+01:00",
          "endTime": "2024-01-15T11:00:00+01:00",
          "available": false
        }
      ]
    }
  }
}
```

## Notifications Email

### Notification Équipe (Produit Digital)

Envoyée automatiquement aux administrateurs lors d'un achat de produit digital.

**Destinataires:**
1. Utilisateurs avec rôle `admin` ou `super_admin`
2. Fallback: email configuré dans `notification_email` ou `NOTIFICATION_EMAIL`

**Contenu:**
- Détails de la commande
- Informations client
- Liste des produits achetés
- Montant total

### Notification Équipe (Rendez-vous)

Envoyée lors d'une nouvelle réservation de rendez-vous.

**Contenu:**
- Détails du rendez-vous
- Date et heure
- Informations client
- Notes éventuelles

### Confirmation Client

Email automatique envoyé au client après:
- Réservation d'un rendez-vous
- Commande de produits digitaux

## Composant React: AppointmentBooking

Widget complet pour la réservation de rendez-vous.

### Utilisation

```tsx
import { AppointmentBooking } from '@/components/checkout'

function BookingPage() {
  const handleBook = async (data) => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ appointmentData: { productId, ...data } })
    })
    return res.json()
  }

  return (
    <AppointmentBooking
      productId="uuid"
      productTitle="Consultation"
      productPrice={5000}
      currency="EUR"
      onBook={handleBook}
      onCancel={() => router.back()}
    />
  )
}
```

### Étapes du composant

1. **Sélection de la date**: Calendrier hebdomadaire avec disponibilités
2. **Sélection de l'heure**: Grille des créneaux disponibles
3. **Informations**: Formulaire client (nom, email, téléphone, notes)
4. **Confirmation**: Récapitulatif avant validation

## Configuration

### Variables d'environnement

```env
# Mode Lago (optionnel, peut être configuré via admin)
LAGO_API_KEY=lago_xxx
LAGO_API_KEY_TEST=lago_test_xxx
LAGO_API_URL=https://api.getlago.com/v1

# Email de notification fallback
NOTIFICATION_EMAIL=team@example.com
```

### Configuration Platform (DB)

| Clé | Description |
|-----|-------------|
| `lago_mode` | 'test' ou 'production' |
| `lago_api_key` | Clé API production |
| `lago_api_key_test` | Clé API test |
| `lago_api_url` | URL API Lago |
| `notification_email` | Email de notification équipe |

## Test du Flux Complet

### 1. Créer un produit de type "appointment"

Via l'admin panel, créer un produit avec:
- Type: `appointment`
- Prix ou taux horaire configuré

### 2. Configurer les disponibilités

Créer des `appointment_slots` pour définir les créneaux disponibles.

### 3. Tester la réservation

1. Aller sur `/book/[productId]`
2. Sélectionner un créneau
3. Remplir les informations
4. Confirmer

### 4. Simuler le paiement (mode test)

```bash
curl -X POST http://localhost:3000/api/checkout/simulate-payment \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": "uuid"}'
```

### 5. Vérifier

- Le rendez-vous est créé dans la DB
- L'email de confirmation est envoyé
- L'équipe reçoit la notification
- Le calendrier est synchronisé
