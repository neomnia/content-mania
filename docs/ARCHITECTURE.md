# Architecture du Projet NeoSaaS

## 🎯 Vue d'Ensemble

NeoSaaS est une plateforme SaaS Next.js 14+ avec App Router, construite sur une architecture modulaire et scalable.

**Stack Technique Principal:**
- **Framework:** Next.js 14+ (App Router)
- **Base de données:** Neon PostgreSQL + Drizzle ORM
- **Auth:** JWT personnalisé + Cookies httpOnly
- **UI:** Tailwind CSS + shadcn/ui
- **Billing:** Lago
- **Email:** Resend + Scaleway TEM
- **Calendar:** Google Calendar + Outlook intégration
- **Paiement:** Stripe (intégration future)

---

## 📁 Structure du Projet

### Convention de Nommage

```
app/                    # Next.js App Router
├── (public)/          # Routes publiques (sans auth)
├── (private)/         # Routes protégées (auth requise)
├── (errors)/          # Pages d'erreur custom
├── actions/           # Server Actions (logique métier)
├── api/               # API Routes
└── auth/              # Routes d'authentification

components/            # Composants React réutilisables
├── admin/            # Composants admin only
├── chat/             # Module de chat
├── checkout/         # Flux de commande
├── common/           # Composants partagés
├── features/         # Composants par fonctionnalité
├── layout/           # Composants de layout
├── legal/            # Composants légaux
└── ui/               # shadcn/ui components

lib/                   # Utilitaires et helpers
├── auth/             # Authentification
├── calendar/         # Intégration calendrier
├── notifications/    # Système de notifications
├── email/            # Gestion emails
└── data/             # Accès données

db/                    # Database
├── schema.ts         # Schéma Drizzle
└── index.ts          # Configuration DB

types/                 # TypeScript definitions
```

---

## 🏗️ Principes d'Architecture

### 1. Single Source of Truth

**Règle d'Or:** Une fonctionnalité = Un seul fichier de logique

**❌ ANTI-PATTERN:**
```typescript
// NE JAMAIS faire ça
lib/checkout/checkout-service.ts  // Doublon
app/actions/ecommerce.ts          // Original
```

**✅ PATTERN CORRECT:**
```typescript
// Une seule implémentation
app/actions/ecommerce.ts          // ✅ Source unique
```

### 2. Séparation des Responsabilités

#### Server Actions (`app/actions/`)

**Rôle:** Logique métier côté serveur accessible depuis le client

**Utilisation:**
```typescript
// app/actions/ecommerce.ts
'use server'

export async function processCheckout(cartId: string) {
  // Logique métier complète
  // Validations, DB queries, notifications...
}
```

**Imports:**
```typescript
// Dans un composant client
import { processCheckout } from '@/app/actions/ecommerce'
```

#### API Routes (`app/api/`)

**Rôle:** Endpoints REST pour intégrations externes ou webhooks

**Utilisation:**
```typescript
// app/api/checkout/route.ts
export async function POST(request: NextRequest) {
  // Endpoint pour webhook, CLI, ou intégration externe
}
```

**Quand utiliser quoi?**
- **Server Actions:** Interactions client ↔ serveur dans l'app
- **API Routes:** Webhooks, intégrations externes, API publique

#### Bibliothèques (`lib/`)

**Rôle:** Fonctions utilitaires réutilisables, sans logique métier

**Utilisation:**
```typescript
// lib/calendar/sync.ts
export async function syncAppointmentToCalendars(appointmentId: string) {
  // Logique technique pure (pas de business logic)
}
```

---

## 🗺️ Cartographie des Modules Principaux

### Module E-commerce / Checkout

**Source Unique:** `app/actions/ecommerce.ts`

**Fonctions principales:**
- `processCheckout()` - Traitement complet d'une commande
- `applyCoupon()` - Application d'un coupon
- `createLagoSubscription()` - Création subscription

**Dépendances:**
```
app/actions/ecommerce.ts
  ├── lib/lago.ts (Billing)
  ├── lib/notifications/appointment-notifications.ts (Emails)
  ├── lib/notifications/admin-notifications.ts (Chat admin)
  ├── lib/calendar/sync.ts (Sync calendrier)
  └── db/schema.ts (Database)
```

**❌ Ne PAS créer:**
- `lib/checkout/checkout-service.ts`
- `lib/ecommerce/process-order.ts`
- Toute autre implémentation alternative

### Module Calendar

**Architecture:**
```
lib/calendar/
├── sync.ts              # ✅ Synchronisation Google/Outlook
└── icalendar.ts         # ✅ Génération fichiers .ics

app/api/calendar/
├── route.ts             # ✅ GET/DELETE connections
├── connect/route.ts     # ✅ Initiate OAuth
└── callback/route.ts    # ✅ Handle OAuth callback
```

**Flux:**
1. User déclenche OAuth → `app/api/calendar/connect`
2. Callback OAuth → `app/api/calendar/callback`
3. Synchronisation → `lib/calendar/sync.ts`

### Module Chat

**Architecture:**
```
app/api/chat/
├── conversations/       # User chat routes
└── messages/

app/api/admin/chat/      # Admin chat routes

lib/notifications/
└── admin-notifications.ts  # Chat notifications
```

**Types de notifications:**
- **User → Admin:** Via `admin-notifications.ts`
- **Admin → User:** Via routes admin chat

### Module Notifications

**Architecture:**
```
lib/notifications/
├── appointment-notifications.ts  # ✅ Emails RDV (client + admin)
└── admin-notifications.ts        # ✅ Notifications chat admin
```

**Workflow Appointment:**
```typescript
// Dans app/actions/ecommerce.ts
await Promise.all([
  sendAppointmentConfirmationToClient(...),  // Email client
  sendAppointmentNotificationToAdmin(...),   // Email admin
  notifyAdminNewAppointment(...)             // Chat admin
])
```

---

## 🚫 Règles Anti-Doublons

### Checklist Avant Création de Fichier

Avant de créer un nouveau fichier avec de la logique, vérifier:

1. ✅ Cette fonctionnalité existe-t-elle déjà?
   ```bash
   # Rechercher les fonctions similaires
   grep -r "processCheckout" app/ lib/
   ```

2. ✅ Où devrait vivre cette logique selon l'architecture?
   - Logique métier → `app/actions/`
   - Utilitaire technique → `lib/`
   - API externe → `app/api/`

3. ✅ Y a-t-il un fichier existant où ajouter cette fonction?
   - Préférer étendre un fichier existant
   - Créer nouveau fichier si vraiment nécessaire

### Règles d'Import

**✅ AUTORISÉ:**
```typescript
// Server Actions peuvent importer lib
import { syncAppointmentToCalendars } from '@/lib/calendar/sync'

// API Routes peuvent importer actions
import { processCheckout } from '@/app/actions/ecommerce'

// Components peuvent importer actions
import { getUsers } from '@/app/actions/users'
```

**❌ INTERDIT:**
```typescript
// lib/ ne doit PAS importer app/actions
import { processCheckout } from '@/app/actions/ecommerce' // ❌

// Créer un doublon au lieu d'importer
// lib/checkout/checkout-service.ts avec même logique que ecommerce.ts // ❌
```

---

## 📋 Workflow de Développement

### Ajouter une Nouvelle Fonctionnalité

1. **Identifier le module concerné**
   - E-commerce? → `app/actions/ecommerce.ts`
   - Users? → `app/actions/users.ts`
   - Calendar? → `lib/calendar/`

2. **Vérifier l'existant**
   ```bash
   # Recherche semantic
   grep -r "similar_function" app/ lib/
   ```

3. **Choisir l'emplacement**
   - Logique métier = Server Action
   - Utilitaire = lib/
   - Endpoint = API Route

4. **Implémenter**
   - Suivre le pattern existant
   - Réutiliser les helpers de lib/
   - Ajouter gestion d'erreur appropriée

5. **Documenter**
   - JSDoc sur la fonction
   - Mettre à jour ce fichier si nouveau module
   - Ajouter entrée dans ACTION_LOG.md

### Code Review Checklist

- [ ] Pas de doublon de code existant
- [ ] Imports cohérents avec architecture
- [ ] Gestion d'erreur avec try-catch
- [ ] TypeScript types corrects
- [ ] Documentation mise à jour
- [ ] Suit les conventions de nommage

---

## 🔍 Détection Automatique

### Scripts Recommandés

```json
// package.json
{
  "scripts": {
    "lint:unused": "eslint . --ext .ts,.tsx",
    "analyze:dead-code": "npx ts-prune",
    "analyze:duplicates": "npx jscpd app/ lib/"
  }
}
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
npm run type-check
npm run lint
```

---

## 📚 Références

### Documentation Associée

- [ACTION_LOG.md](./ACTION_LOG.md) - Journal des modifications
- [AUDIT_DOUBLONS_COMPLET_2026-01-08.md](./AUDIT_DOUBLONS_COMPLET_2026-01-08.md) - Audit doublons
- [CORRECTIONS_DOUBLONS_2026-01-08.md](./CORRECTIONS_DOUBLONS_2026-01-08.md) - Corrections appliquées
- [VERIFICATION_GLOBALE_2026-01-08.md](./VERIFICATION_GLOBALE_2026-01-08.md) - État de santé

### Modules Documentés

- [APPOINTMENT_BOOKING_CHECKOUT_FLOW.md](./APPOINTMENT_BOOKING_CHECKOUT_FLOW.md) - Flux de réservation
- [CALENDAR_APPOINTMENTS_MODULE.md](./CALENDAR_APPOINTMENTS_MODULE.md) - Module calendrier
- [LIVE_CHAT_MODULE.md](./LIVE_CHAT_MODULE.md) - Module chat
- [EMAIL_SYSTEM_ARCHITECTURE.md](./EMAIL_SYSTEM_ARCHITECTURE.md) - Système d'emails

---

## 🎯 Leçons Apprises

### Cas Concret: Doublon Checkout (Jan 2026)

**Problème:**
- Deux implémentations de `processCheckout()`
- `lib/checkout/checkout-service.ts` (815 lignes - jamais utilisé)
- `app/actions/ecommerce.ts` (version active)

**Cause:**
- Manque de documentation architecture
- Pas de vérification avant création fichier
- Pas de détection automatique

**Solution:**
- Suppression du doublon
- Création de ce document ARCHITECTURE.md
- Mise en place de règles claires

**Prévention:**
- ✅ Consulter ARCHITECTURE.md avant toute création
- ✅ Rechercher fonctionnalités similaires
- ✅ Code review systématique

---

**Date de création:** 8 janvier 2026  
**Dernière mise à jour:** 8 janvier 2026  
**Mainteneurs:** Équipe de développement NeoSaaS
