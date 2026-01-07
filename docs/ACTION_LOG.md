# Journal des Actions et Modifications

Ce document retrace l'historique des modifications, des nouvelles fonctionnalités et des actions de maintenance effectuées sur le projet NeoSaaS.

## [2026-01-07] - Feature: Admin Appointment Request & Client Confirmation System

### New: Admin Can Request Appointments with Clients

**Objective:**
Enable administrators to proactively request appointments with clients. Clients receive the request and can confirm it with one click.

### Features Implemented

#### 1. Admin Appointment Request API

**File:** `app/api/admin/appointments/route.ts`

**New Action: `create`**
- Allows admins to create appointment requests for clients
- Validates client exists by email lookup
- Creates appointment with `status: pending`
- Automatically assigns requesting admin (`assignedAdminId`)
- Pre-fills client information (name, email, phone)

**Request Example:**
```json
POST /api/admin/appointments
{
  "action": "create",
  "clientEmail": "client@example.com",
  "title": "Technical Consultation",
  "description": "Project discussion",
  "startTime": "2026-01-20T10:00:00Z",
  "endTime": "2026-01-20T11:00:00Z",
  "type": "free",
  "location": "Paris Office",
  "meetingUrl": "https://meet.google.com/abc",
  "notes": "VIP client"
}
```

**Validations:**
- Client must exist in database (404 if not found)
- Required fields: `clientEmail`, `title`, `startTime`, `endTime`

#### 2. Admin Calendar View

**File:** `app/(private)/admin/appointments/calendar/page.tsx` (NEW)

**Features:**
- Full calendar interface using `react-big-calendar`
- Displays ALL appointments from all users (group-wide)
- 4 view modes: Month, Week, Day, Agenda
- Color-coded by status:
  - 🟡 Yellow: Pending
  - 🟢 Green: Confirmed
  - ⚪ Gray: Completed
  - 🔴 Red: Cancelled/No Show
- Click time slot → Opens appointment request dialog
- Click event → Navigate to appointment details
- Navigation to/from list view

**Dialog Form:**
- Client email (required, autocomplete)
- Title (required)
- Description
- Type: Free/Paid (with price input)
- Location
- Meeting URL
- Internal notes (admin only)

#### 3. Client Confirmation Interface

**File:** `app/(private)/dashboard/appointments/page.tsx`

**New Section:**
- Yellow/gold card displayed at top when pending appointments exist
- Shows all appointments requiring confirmation
- Each card displays:
  - Title and description
  - Date, time, location
  - "Détails" button (view full info)
  - "Confirmer" button (one-click confirmation)

**Confirmation Logic:**
```typescript
const handleConfirmAppointment = async (appointmentId: string) => {
  await fetch(`/api/appointments/${appointmentId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'confirmed' })
  })
}
```

#### 4. Updated Permissions

**File:** `app/api/appointments/[id]/route.ts`

**Changed Logic:**
- **Before:** Only admins could confirm appointments
- **After:** 
  - Clients can confirm THEIR OWN pending appointments
  - Admins can update any appointment to any status
  - Only admins can mark appointments as completed

**Security Rules:**
```typescript
if (validated.status === 'confirmed') {
  const isOwnAppointment = existing.userId === user.userId
  const wasPending = existing.status === 'pending'
  
  if (!userIsAdmin && (!isOwnAppointment || !wasPending)) {
    return 403 // Forbidden
  }
}
```

#### 5. Navigation Enhancements

**Admin List Page:** Added "Calendar View" button
**Admin Calendar Page:** Added "List View" button
**Bidirectional navigation** between views

### User Flows

**Admin → Client Request:**
1. Admin goes to `/admin/appointments/calendar`
2. Clicks time slot
3. Fills client email and appointment details
4. System creates `pending` appointment
5. Client sees yellow card on dashboard

**Client → Confirmation:**
1. Client logs in to `/dashboard/appointments`
2. Sees yellow pending confirmation card
3. Reviews appointment details
4. Clicks "Confirmer"
5. Status changes to `confirmed`
6. Admin calendar shows green event

### Files Created
- `app/(private)/admin/appointments/calendar/page.tsx` - Admin calendar view
- `docs/ADMIN_APPOINTMENT_REQUEST_SYSTEM.md` - Implementation guide

### Files Modified
- `app/api/admin/appointments/route.ts` - Added create action
- `app/api/appointments/[id]/route.ts` - Updated confirmation permissions
- `app/(private)/admin/appointments/page.tsx` - Added calendar link
- `app/(private)/dashboard/appointments/page.tsx` - Added confirmation section
- `docs/CALENDAR_APPOINTMENTS_MODULE.md` - Updated with new features

### Technical Details

**Database:**
- Uses existing `appointments` table
- Field `assignedAdminId` for admin assignment
- Field `status` with value `pending` for requests

**Security:**
- JWT authentication via `verifyAuth()`
- Role-based permissions (admin vs client)
- Email validation for client existence

**UI/UX:**
- Yellow/gold cards for pending items (visual priority)
- One-click confirmation (no extra forms)
- Real-time calendar updates
- Responsive design (mobile-friendly)

### Next Steps (Recommended)

1. **Email Notifications:**
   - Send email to client when admin creates request
   - Send email to admin when client confirms
   - Use existing email system

2. **Push Notifications:**
   - Real-time notification badge
   - WebSocket or Server-Sent Events

3. **Appointment History:**
   - Log who created/confirmed
   - Timestamp audit trail

4. **iCal Export:**
   - Allow clients to add to external calendars

---

## [2026-01-07] - Fix: Admin-Only Appointment Confirmation

### Security: Client Self-Confirmation Removed

**Problem:**
Clients could confirm their own appointments via the dashboard detail page, which was illogical. Only administrators should be able to confirm appointments. Additionally, there was no way to assign an appointment to a specific admin.

### Changes Implemented

#### 1. Database Schema (`db/schema.ts`)

Added new field to appointments table:
- `assignedAdminId` - UUID reference to users table (admin who handles this appointment)

Updated relations:
- Added `assignedAdmin` relation with proper `relationName` for self-referential relations

#### 2. Client Dashboard (`app/(private)/dashboard/appointments/[id]/page.tsx`)

**Removed:**
- `handleConfirm()` function
- "Confirmer" button when status is pending

**Added:**
- Information message: "En attente de confirmation par l'administrateur"
- AlertCircle icon to indicate pending state

#### 3. API Route (`app/api/appointments/[id]/route.ts`)

**Security enforcement:**
- Added `isAdmin` check from `@/lib/auth/server`
- Added `assignedAdminId` to update schema
- **Admin-only confirmation:** Status changes to 'confirmed' or 'completed' now require admin role
- **Admin-only assignment:** Only admins can set `assignedAdminId`
- Admins can now access all appointments (not just their own) for management

```typescript
// Enforce admin-only confirmation
if (validated.status === 'confirmed' || validated.status === 'completed') {
  if (!userIsAdmin) {
    return NextResponse.json(
      { error: 'Only administrators can confirm or complete appointments' },
      { status: 403 }
    )
  }
}
```

#### 4. Admin Appointments Page (`app/(private)/admin/appointments/page.tsx`)

**New features:**
- "Assigné à" (Assigned to) column in the appointments table
- Confirmation dialog with admin assignment dropdown
- Fetch and display list of admin users
- "Confirmer et assigner" button opens assignment dialog

**New Components:**
- Confirmation dialog with:
  - Appointment summary
  - Admin selection dropdown
  - Optional assignment (can confirm without assignment)

#### 5. New API Route (`app/api/admin/users/admins/route.ts`)

New endpoint to fetch admin users for assignment dropdown:
- **GET /api/admin/users/admins**
- Returns users with `admin` or `super_admin` role
- Fields: id, firstName, lastName, email

### Updated Workflow

```
Client Flow:
1. Client → Creates appointment request (status: pending)
2. Client → Can view details, cancel, but CANNOT confirm
3. Client → Sees "Waiting for admin confirmation" message

Admin Flow:
1. Admin → Views all appointments in /admin/appointments
2. Admin → Clicks "Confirmer et assigner" on pending appointment
3. Admin → Selects admin to assign (optional)
4. Admin → Confirms → Status becomes 'confirmed', assignedAdminId set
5. Admin → Can later mark as completed
```

### Files Modified

| File | Changes |
|------|---------|
| `db/schema.ts` | Added `assignedAdminId` field and relation |
| `app/api/appointments/[id]/route.ts` | Admin-only confirmation enforcement |
| `app/api/admin/appointments/route.ts` | Include assignedAdmin in query results |
| `app/api/admin/users/admins/route.ts` | **NEW** - Fetch admin users list |
| `app/(private)/dashboard/appointments/[id]/page.tsx` | Removed self-confirmation |
| `app/(private)/admin/appointments/page.tsx` | Admin assignment dialog |
| `docs/ACTION_LOG.md` | This entry |

### Database Migration Required

After deploying, run `db:push` to add the new `assigned_admin_id` column to the appointments table.

---

## [2026-01-07] - Feature: Dedicated Email Templates for Appointments

### New: Separate Email Templates for Orders and Appointments

**Context:**
The original implementation used a single email template that combined payment and appointment information. This has been split into dedicated templates for better clarity.

### New File: `lib/checkout/email-templates.ts`

This file centralizes all checkout-related email templates:

| Template | Usage |
|----------|-------|
| `generateOrderConfirmationEmail` | Payment/order validation (🎉 Commande confirmée) |
| `generateAppointmentBookingEmail` | Calendar/appointment confirmation without payment (📅 Rendez-vous confirmé) |
| `generateAppointmentRequestEmail` | Pending appointment request before admin validation (⏳ Demande reçue) |
| `generateAppointmentWithPaymentEmail` | Appointment with payment details (✅ RDV + paiement) |

### Template Features

**Order Confirmation Email:**
- Purple gradient header
- Items table with quantities and prices
- Total amount paid
- Order reference number

**Appointment Booking Email (Calendar-focused):**
- Green gradient header
- Date, time, duration details
- Location and meeting URL (if available)
- Timezone information
- Helpful reminder about connecting early

**Appointment Request Email:**
- Orange/amber gradient header
- Requested time slot details
- Information about next steps (admin validation)
- Client's notes

**Appointment with Payment Email:**
- Green gradient header
- All appointment details
- Payment status and amount
- Combined confirmation

### Changes to `checkout-service.ts`

- Email templates moved to dedicated `email-templates.ts` file
- Smart template selection:
  - If paid → uses `generateAppointmentWithPaymentEmail`
  - If free → uses `generateAppointmentBookingEmail`
- Includes location and meeting URL from product

### Files Modified

| File | Changes |
|------|---------|
| `lib/checkout/email-templates.ts` | **NEW** - Centralized email templates |
| `lib/checkout/checkout-service.ts` | Import templates, smart template selection |
| `docs/ACTION_LOG.md` | This entry |

---

## [2026-01-07] - Standardization: English Code Comments & Error Messages

### Fix: Translate French Comments and Error Messages to English

**Context:**
The project should be fully in English (code comments, error messages, function documentation). French content was found in API routes and service files.

**Files Translated:**

### 1. app/api/checkout/available-slots/route.ts

| French | English |
|--------|---------|
| `productId requis` | `productId required` |
| `Produit non trouvé` | `Product not found` |
| `Ce produit ne supporte pas les réservations` | `This product does not support bookings` |
| `Erreur lors de la récupération des créneaux` | `Error fetching available slots` |

### 2. lib/checkout/checkout-service.ts

**File header and function documentation translated:**
- `Service de Checkout Unifié` → `Unified Checkout Service`
- `Génère un numéro de commande unique` → `Generates a unique order number`
- `Récupère ou crée un client Lago` → `Gets or creates a Lago customer`
- `Crée une facture via Lago` → `Creates an invoice via Lago`
- `Process un checkout pour des produits de type...` → `Process checkout for ... type products`
- `Point d'entrée principal du checkout` → `Main checkout entry point`
- `Simule le paiement en mode test` → `Simulate payment in test mode`

**Error messages translated:**
| French | English |
|--------|---------|
| `Produit non trouvé` | `Product not found` |
| `Ce produit ne supporte pas la réservation de rendez-vous` | `This product does not support appointment booking` |
| `Panier non spécifié` | `Cart not specified` |
| `Panier vide ou non trouvé` | `Cart empty or not found` |
| `Données de rendez-vous requises pour les produits de type appointment` | `Appointment data required for appointment-type products` |
| `Rendez-vous non trouvé` | `Appointment not found` |
| `Déjà payé` | `Already paid` |

**Code comments translated (40+ comments):**
All inline comments in French were translated to English while preserving the code logic.

**Note:** Email templates remain in French as they are user-facing content for French users. Only code-level documentation and error messages were translated.

### Files Modified

| File | Changes |
|------|---------|
| `app/api/checkout/available-slots/route.ts` | Error messages translated |
| `lib/checkout/checkout-service.ts` | Comments, docs, and error messages translated |
| `docs/ACTION_LOG.md` | This entry |

---

## [2026-01-07] - Fix: Checkout Flow pour Produits Appointment

### Fix : Correction de la conversion Date/String dans le checkout

**Problèmes identifiés :**
1. Le service checkout (`checkout-service.ts`) recevait des dates au format string mais tentait de les utiliser comme objets Date
2. Les notifications admin et les emails recevaient des strings au lieu d'objets Date
3. Le type `ProductType` ne contenait pas `'appointment'` (utilisé avec cast forcé)
4. Le type `TeamNotification` ne contenait pas `'appointment_booking'`
5. La propriété `consultingMode` dans `appointmentDetails` était obligatoire mais non fournie

**Solutions implémentées :**

### 1. Conversion Date/String dans checkout-service.ts

Ajout d'une conversion robuste au début de `processAppointmentCheckout`:

```typescript
// Convert string dates to Date objects if needed
const startTime = appointmentData.startTime instanceof Date
  ? appointmentData.startTime
  : new Date(appointmentData.startTime as unknown as string)
const endTime = appointmentData.endTime instanceof Date
  ? appointmentData.endTime
  : new Date(appointmentData.endTime as unknown as string)
```

Cette conversion est utilisée ensuite pour :
- La création du rendez-vous dans la base de données
- Les notifications à l'équipe
- Les notifications admin via chat
- L'envoi des emails de confirmation

### 2. Correction des types dans types.ts

| Type | Modification |
|------|--------------|
| `ProductType` | Ajout de `'appointment'` |
| `TeamNotification.type` | Ajout de `'appointment_booking'` |
| `TeamNotification.appointmentDetails.consultingMode` | Rendu **optionnel** |

### Fichiers Modifiés

| Fichier | Modification |
|---------|--------------|
| `lib/checkout/checkout-service.ts` | Conversion Date/String, utilisation des objets Date |
| `lib/checkout/types.ts` | Ajout types appointment, consultingMode optionnel |
| `docs/ACTION_LOG.md` | Ce fichier |

---

## [2026-01-07] - Amélioration du Flux de Rendez-vous Client/Admin

### Fix : Cohérence du Système de Rendez-vous

**Problèmes identifiés :**
1. L'option "Paiement" était visible côté client (inutile - c'est l'admin qui décide)
2. Le participant était requis alors qu'une demande de RDV est dirigée vers l'admin
3. La page de liste (`/dashboard/appointments`) redirigeait vers le calendrier
4. Aucune notification n'était envoyée à l'admin lors d'une demande de RDV

**Solutions implémentées :**

### 1. Formulaire Client Simplifié (`/dashboard/appointments/new`)

Le formulaire a été transformé en "Demande de rendez-vous" :

| Avant | Après |
|-------|-------|
| Option paiement visible | Option paiement **retirée** (géré par admin) |
| Participant requis | Participant **non requis** (l'admin gère) |
| Titre "Nouveau rendez-vous" | Titre "**Demander un rendez-vous**" |
| Bouton "Créer le rendez-vous" | Bouton "**Envoyer la demande**" |

**Nouveau flux client :**
- Client remplit : titre, description, créneau souhaité, lieu (optionnel)
- Type automatiquement défini sur "free" (l'admin peut modifier)
- Statut automatiquement défini sur "pending"
- Message informatif expliquant le processus

### 2. Notification Admin Automatique

Lors de la création d'un RDV, une notification est envoyée via le chat admin avec :
- Informations du client (nom, email)
- Détails du rendez-vous (titre, date, heure, lieu)
- Lien vers la page du rendez-vous
- Instruction pour confirmer/refuser et configurer le paiement si nécessaire

### 3. Page Liste des Rendez-vous (`/dashboard/appointments`)

Création d'une vraie page de liste avec :
- Recherche par titre, participant, email ou description
- Filtres par statut et type
- Affichage groupé par date
- Navigation vers le calendrier et les détails

### Flux Complet Client → Admin

```
1. Client → Envoie une demande de RDV (titre, description, créneau)
2. Système → Crée le RDV avec status="pending", type="free"
3. Système → Envoie notification à l'admin via chat
4. Admin → Reçoit notification, consulte le RDV
5. Admin → Configure le paiement si nécessaire
6. Admin → Confirme ou refuse le RDV
7. Client → Notifié de la confirmation (+ paiement si requis)
```

### Fichiers Modifiés

| Fichier | Modification |
|---------|--------------|
| `app/(private)/dashboard/appointments/new/page.tsx` | Formulaire simplifié - Demande de RDV |
| `app/(private)/dashboard/appointments/page.tsx` | Page liste des rendez-vous |
| `app/api/appointments/route.ts` | Ajout notification admin |
| `docs/ACTION_LOG.md` | Ce fichier |
| `docs/CALENDAR_APPOINTMENTS_MODULE.md` | Documentation mise à jour |

---

## [2026-01-05] - Correction Redirection Première Connexion

### Fix : Redirection vers Page Entreprise
- **Problème** : Lors de la première connexion sans entreprise assignée, l'utilisateur était redirigé vers `/dashboard/enterprise` (404)
- **Solution** : Correction de la redirection vers `/dashboard/company-management` (page existante)
- **Fichiers Modifiés** :
  - `app/auth/login/page.tsx` : Correction de la redirection lors de l'onboarding
  - `docs/ACTION_LOG.md` : Mise à jour de la référence à la page

### Comportement Onboarding
- Si l'utilisateur n'a **pas de companyId** → Redirection vers `/dashboard/company-management` pour configurer l'entreprise
- Si l'utilisateur a **un companyId** → Redirection vers `/dashboard` (tableau de bord principal)

---

## [2026-01-02] - Réorganisation Admin et Améliorations UX

### Page Admin Settings - Réorganisation des Modules
- **Fusion et Réorganisation des Sections** :
  - **SEO Metadata** : Module indépendant créé sous "Site Status"
    - Title Template, Base URL, Meta Description
    - Plus visible et accessible
  - **HTTPS Configuration** : Déplacé dans le module "Site Status"
    - Logiquement groupé avec Maintenance Mode
    - **Par défaut activé** (Force HTTPS = true)
    - Message de recommandation sécurité affiché
  - **Custom HTTP Headers** : Intégré dans "Custom Code Injection"
    - Cohérence des injections (GTM, Header, Footer, Headers)
    - Exemples d'en-têtes de sécurité fournis
  - **Social Sharing & Links** : Module indépendant
    - Open Graph Metadata (OG Title, Description, Image)
    - Liens sociaux (Twitter, Facebook, LinkedIn, Instagram, GitHub)

### Page Admin Dashboard - Fusion des Onglets
- **Réduction 4 → 3 onglets** :
  - ✅ Overview (inchangé)
  - ✅ **Payments & Invoices** (fusionnés - élimination du doublon)
  - ✅ Lago Parameters (inchangé)
- **Texte adaptatif sur mobile** :
  - "Payments & Invoices" → "Payments" (mobile)
  - "Lago Parameters" → "Lago" (mobile)

### Améliorations de Responsivité - Dashboard Admin
- **Grilles Adaptatives** :
  - Métriques Overview : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
    - 1 colonne mobile → 2 tablette → 4 desktop
  - Graphiques principaux : `grid-cols-1 lg:grid-cols-7`
    - Pleine largeur mobile → 2 colonnes desktop (split 4/3)
  - Growth/Writers : `grid-cols-1 md:grid-cols-2`
    - Pleine largeur mobile → 2 colonnes tablette+

- **Hauteurs Dynamiques des Graphiques** :
  - Revenue Overview : `h-[250px] sm:h-[300px] lg:h-[350px]`
  - Growth Analysis & Writers : `h-[250px] sm:h-[300px]`
  - Optimisation de l'espace selon l'écran

- **Tableaux Responsives** :
  - Tableau "Recent Registrations" avec `overflow-x-auto`
  - Scroll horizontal sur mobile pour préserver toutes les colonnes

- **Navigation Tactile Améliorée** :
  - TabsList : `grid-cols-1 sm:grid-cols-3`
  - 1 onglet par ligne mobile → 3 onglets desktop
  - Meilleure accessibilité tactile

### Documentation Créée
- ✅ `ADMIN_SETTINGS_ORGANIZATION.md` - Organisation de la page Settings
- ✅ `ADMIN_DASHBOARD_ORGANIZATION.md` - Structure du Dashboard Admin
- ✅ Mise à jour `ADMIN_RESPONSIVE_DESIGN.md` - Dashboard responsive
- ✅ Mise à jour `HTTP_HEADERS_CONFIG.md` - Nouvelle localisation
- ✅ Mise à jour `index.md` - Liens vers nouvelle documentation

### Fichiers Modifiés
**Pages & Composants** :
- `app/(private)/admin/page.tsx` - Fusion onglets, responsive
- `app/(private)/admin/settings/page.tsx` - Réorganisation modules
- `components/admin/dashboard-stats.tsx` - Grilles et hauteurs responsive

**Documentation** :
- `docs/ADMIN_SETTINGS_ORGANIZATION.md` (nouveau)
- `docs/ADMIN_DASHBOARD_ORGANIZATION.md` (nouveau)
- `docs/ADMIN_RESPONSIVE_DESIGN.md` (mis à jour)
- `docs/HTTP_HEADERS_CONFIG.md` (mis à jour)
- `docs/index.md` (mis à jour)
- `docs/ACTION_LOG.md` (ce fichier)

---

## [2026-01-02] - Panneau Unifié de Gestion des Produits

### Refonte Complète de l'Interface Produits
- **Consolidation des Modes** : Fusion des deux modes de gestion (fenêtre calque + page pleine) en **un seul panneau unifié**.
  - Création ET modification complètes dans la même interface
  - Plus besoin de naviguer vers une page séparée
  - Expérience utilisateur cohérente et fluide

### Nouvelles Fonctionnalités du Panneau
- **Gestion Complète de l'Identité Visuelle** :
  - Upload d'image directement dans le panneau (avec preview)
  - Sélection d'icône de secours parmi 12 options
  - Suppression d'image en un clic
  - Preview en temps réel des changements
- **Informations Produit Complètes** :
  - Tous les champs éditables (titre, description, type, statut)
  - Interface organisée en sections claires
  - Labels explicites et placeholders informatifs
- **Tarification Avancée** :
  - Saisie du prix HT avec validation
  - Sélection du taux de TVA
  - **Calcul automatique en temps réel** du prix TTC
  - Affichage dynamique de la TVA et du total

### Amélioration Technique
- **Gestion Optimisée des Images** :
  - Pour les nouveaux produits : stockage temporaire jusqu'à la sauvegarde
  - Pour les produits existants : upload immédiat
  - Upload automatique post-création pour les nouveaux produits
- **États et Transitions** :
  - 3 modes : Visualisation, Édition, Création
  - Transitions fluides entre les modes
  - Préservation du contexte lors des annulations

### UX/UI Design
- **Boutons Sticky** : Boutons Save/Cancel toujours visibles en bas du panneau
- **Validation Temps Réel** : Messages d'erreur clairs et immédiats
- **Calculs Dynamiques** : Prix TTC recalculé à chaque changement
- **Interface Responsive** : S'adapte à toutes les tailles d'écran
- **Accès Rapide** : Lien direct vers la gestion des taux de TVA depuis le panneau

### Correctifs de Bugs
- **🐛 Erreur de Déploiement Turbopack** (Ligne 1352) :
  - **Problème** : Fragment JSX dupliqué causant une erreur de parsing : `Unexpected token. Did you mean {'}'}` or `&rbrace;`?`
  - **Cause** : Ligne 1190-1191 contenait `<>` en double dans le mode lecture du panneau
  - **Solution** : Suppression du fragment JSX dupliqué
  - **Impact** : Déblocage du déploiement Vercel

### Internationalisation
- **Page Panier (FR → EN)** :
  - Traduction complète de tous les textes de l'interface
  - Messages toast en anglais
  - Labels des boutons et titres

### Unification UX - Gestion de la TVA
- **Transformation en Sheet** :
  - Remplacement du Dialog par un Sheet (drawer) cohérent avec le panneau produits
  - Ouverture depuis le panneau de création/édition de produit
  - Plusieurs calques possibles : Produit → TVA → workflow fluide
- **Enregistrement Immédiat Sans Rechargement** :
  - Callback `onRatesUpdated` avec données mises à jour
  - État local `currentVatRates` dans ProductsPageClient
  - Plus de `window.location.reload()` qui faisait perdre le travail
  - Mise à jour instantanée des selects de TVA dans le panneau produit
- **Amélioration Visuelle** :
  - Icône Percent avec badge bronze dans le header
  - Formulaire compact avec labels en `.text-xs`
  - Bouton "Cancel Edit" pour annuler l'édition en cours
  - Symbole % dans l'input de taux
  - Section "Existing VAT Rates" clairement identifiée
  - Boutons CTA avec couleur bronze cohérente

### Amélioration UX - Panneau Produits
- **Sélecteurs Visuels Dynamiques** :
  - **Type de Produit** : Boutons visuels avec icônes et couleurs (Digital bleu, Appointment violet)
  - **Statut de Publication** : Boutons visuels (Published vert, Draft orange) avec descriptions
  - Feedback visuel avec check mark sur sélection active
  - Effet hover avec scale pour meilleure affordance
- **Sélecteur d'Icônes Optimisé** :
  - Grille 6 colonnes occupant toute la largeur disponible
  - Boutons visuels carrés avec aperçu de l'icône
  - Check mark bronze sur l'icône sélectionnée
  - Tooltip avec nom de l'icône au survol
  - Plus UX-friendly qu'un select classique
- **Contenu Marketing pour Page Pricing** :
  - **Subtitle** : Sous-titre affiché sous le titre (ex: "Ideal for solo dev or small team")
  - **Focus Areas** : Liste de points forts avec checkmarks (ex: "2-hours live walkthrough", "Docker setup")
  - **Deliverables** : Liste "You'll receive" avec ce qui est inclus
  - Éditeur multilignes avec un item par ligne
  - Police monospace pour meilleure lisibilité lors de l'édition
  - Hints visuels expliquant l'affichage final
  - Stockage en JSON dans le champ `features` (structure: `{focusAreas: [], deliverables: []}`)

### Fichiers Modifiés
| Fichier | Modification |
|---------|--------------|
| `app/(private)/admin/products/products-table.tsx` | Refonte complète du panneau + Correctif bug JSX (ligne 1190) |
| `app/(public)/cart/page.tsx` | Traduction FR → EN (15 remplacements) |
| `components/admin/vat-rates-dialog.tsx` | **Transformation Dialog → Sheet + Callbacks sans rechargement** |
| `app/(private)/admin/products/products-page-client.tsx` | **État local currentVatRates + Callback onRatesUpdated** |
| `docs/PRODUCTS_UNIFIED_PANEL.md` | Documentation détaillée du nouveau système |

### Pages Obsolètes (Non Supprimées)
- `/admin/products/new/page.tsx` - Remplacé par le panneau
- `/admin/products/[id]/page.tsx` - Remplacé par le panneau
- `product-form.tsx` - Composant de formulaire obsolète

> **Note** : Ces pages existent encore mais ne sont plus utilisées dans l'interface.

### Avantages
- ✅ **Cohérence** : Même interface pour créer et modifier
- ✅ **Rapidité** : Pas de rechargement de page
- ✅ **Efficacité** : Tout accessible en un seul endroit
- ✅ **Contexte** : Tableau toujours visible en arrière-plan
- ✅ **Fluidité** : Transitions douces entre les modes
- ✅ **Déploiement** : Erreur Turbopack corrigée
- ✅ **UX Unifiée** : Sheet pour TVA cohérent avec panneau produits
- ✅ **Workflow Multi-Calques** : Création produit → Ajout TVA → Sans perte de données

---

## [2025-12-11] - Upsell, Correctifs Critiques & Refonte Admin

### Fonctionnalité Upsell (Vente Additionnelle)
- **Base de Données** : Ajout de la relation `upsellProductId` sur la table `products` (auto-référentielle).
- **Administration** : Mise à jour du formulaire produit (`ProductForm`) pour sélectionner un produit d'upsell associé.
- **Checkout** :
  - Détection automatique d'une offre d'upsell liée aux articles du panier.
  - Affichage d'une vignette "Special Offer" dans le résumé de commande.
  - Ajout en un clic au panier via un bouton dédié.

### Correctifs Critiques
- **Alertes Admin** : Correction de la persistance des alertes après configuration. Ajout d'un événement `refreshAdminAlerts` pour une mise à jour immédiate de l'interface.
- **Checkout "Fantôme"** : Correction du bug où l'accès direct via `?module=ID` affichait le produit sans créer de panier en base. Forçage de la création du panier (`addToCart`) au chargement.
- **Boucle de Redirection** : Résolution de la boucle infinie "Payment Method Missing" en redirigeant correctement l'utilisateur vers le portail client Lago pour ajouter un moyen de paiement.

### Refonte UX/UI Admin
- **Organisation** :
  - Renommage de la section "Admin" en **"Business"** dans la barre latérale.
  - Suppression du doublon "General Settings" dans le Dashboard Business.
  - Centralisation de la configuration du site (Nom, URL, Email, GDPR) dans **Parameters** (`/admin/settings`).
- **Navigation** : Amélioration de la logique de surbrillance du menu latéral (`sidebar.tsx`) pour gérer intelligemment les sous-pages et les racines (`/dashboard`, `/admin`).

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `db/schema.ts` | Ajout colonne `upsellProductId` |
| `app/actions/ecommerce.ts` | Logique Upsell & Checkout |
| `app/(private)/dashboard/checkout/page.tsx` | UI Upsell & Correctifs Panier |
| `app/(private)/admin/products/product-form.tsx` | Sélecteur Upsell |
| `app/(private)/admin/page.tsx` | Nettoyage onglets (Business Dashboard) |
| `app/(private)/admin/settings/page.tsx` | Ajout champs config site |
| `components/layout/private-dashboard/sidebar.tsx` | Logique navigation & Renommage |

## [2025-12-10] - Intégration Paiement Lago & Configuration Admin

### Intégration Lago (Billing)
- **Configuration Admin** : Ajout d'un onglet "Billing (Lago)" dans `/admin/settings`.
  - Permet de configurer l'API Key, l'URL de l'API et le mode (Test/Production).
  - Lien direct vers la documentation officielle Lago.
- **Backend** :
  - Mise à jour de `lib/lago.ts` pour utiliser une configuration dynamique stockée en base de données (via `platformConfig`) au lieu des variables d'environnement statiques.
  - Adaptation des routes API (`api/customers`, `api/lago/*`) pour utiliser ce client dynamique.
- **Tunnel de Vente (Checkout)** :
  - Implémentation de `processCheckout` dans `app/actions/ecommerce.ts`.
  - Création automatique du client et de la facture dans Lago lors de la validation du panier.
  - Enregistrement de la commande locale (`orders`) liée à la facture Lago.
  - Envoi automatique d'un email de confirmation de commande.

### Nettoyage Interface
- **Menu Admin** : Suppression de l'entrée "Products" dans la barre latérale d'administration (`sidebar.tsx`) pour simplifier la navigation.

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `app/(private)/admin/settings/page.tsx` | Ajout onglet Billing/Lago |
| `app/api/admin/config/route.ts` | Sauvegarde config Lago |
| `lib/lago.ts` | Client Lago dynamique |
| `app/actions/ecommerce.ts` | Logique Checkout & Email |
| `components/layout/private-dashboard/sidebar.tsx` | Retrait lien Products |

## [2025-12-10] - Améliorations E-Commerce & Admin UX

### E-Commerce & Produits
- **Catégorisation des Produits** : Distinction entre "Produit Digital" et "Rendez-vous" (Appointment) dans le schéma et l'interface.
- **Enrichissement des Données** : Ajout des champs `subtitle` et `features` (liste à puces) pour une présentation plus commerciale.
- **Interface Admin Refondue** :
  - Remplacement de la liste simple par un **Tableau de Données** (`ProductsTable`) avec colonnes triables.
  - Ajout de la fonctionnalité de **Suppression** avec confirmation (`AlertDialog`).
  - Formulaire d'édition/création (`ProductForm`) complet avec gestion dynamique des champs selon le type de produit.
- **Simplification UX** : Suppression de la page `/dashboard/marketplace` (redondante) au profit d'une intégration directe dans le Dashboard.

### Administration & Sécurité
- **Système d'Alertes Admin** : Intégration d'un bandeau d'alertes dans `/admin` (`AdminAlerts`).
  - Détecte l'absence de configuration Email (critique).
  - Signale les profils administrateurs incomplets (Nom, Prénom).
  - Vérifie la présence d'un numéro de téléphone de contact.

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `db/schema.ts` | Ajout colonnes `type`, `subtitle`, `features` à `products` |
| `app/actions/ecommerce.ts` | Mise à jour `upsertProduct`, ajout `deleteProduct` |
| `app/(private)/admin/products/page.tsx` | Intégration `ProductsTable` |
| `app/(private)/admin/products/product-form.tsx` | Nouveau formulaire unifié |
| `app/(private)/admin/layout.tsx` | Ajout `AdminAlerts` |
| `app/actions/admin-alerts.ts` | Logique de vérification des alertes |

## [2025-12-10] - Module E-Commerce & Marketplace Privée

### Nouvelles Fonctionnalités
- **Module E-Commerce** : Implémentation complète du backend pour la gestion de produits numériques et services.
- **Marketplace Privée** : Ajout d'une nouvelle section "Marketplace" dans le tableau de bord client (`/dashboard/marketplace`), permettant aux utilisateurs connectés de voir et d'acheter les offres publiées.
- **Administration Produits** : Ajout d'une section "Products" dans l'interface d'administration (`/admin/products`) pour gérer le catalogue.

### Base de Données
- Ajout des tables `products`, `carts`, `cart_items`, `orders`, `outlook_integrations`.
- Mise à jour du schéma Drizzle et migration effectuée (`db:push`).

### Documentation
- Création de `docs/modules/ECOMMERCE.md` détaillant l'architecture et le déploiement du module.

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `db/schema.ts` | Ajout tables E-commerce |
| `app/actions/ecommerce.ts` | Server Actions (CRUD Produits, Panier) |
| `components/layout/private-dashboard/sidebar.tsx` | Ajout lien Marketplace & Admin Products |
| `app/(private)/dashboard/marketplace/page.tsx` | Nouvelle page Marketplace Client |
| `app/(private)/admin/products/page.tsx` | Nouvelle page Admin Produits |

## [2025-12-09] - Personnalisation Avancée du Logo & Correctifs Déploiement

### Personnalisation du Logo
- **Recadrage d'Image (Cropper)** :
  - Intégration de la librairie `react-easy-crop` pour permettre aux administrateurs de recadrer et zoomer leur logo avant l'upload.
  - Nouveau composant `ImageCropper` (`components/ui/image-cropper.tsx`) intégré dans la page d'administration (`/admin`).
- **Modes d'Affichage** :
  - Ajout d'une option "Display Mode" dans les paramètres généraux (`/admin`).
  - Choix possibles :
    - **Logo Only** : Affiche uniquement l'image du logo.
    - **Text Only** : Affiche uniquement le nom du site.
    - **Both** : Affiche le logo ET le nom du site (comportement par défaut).
  - Cette configuration est respectée sur :
    - Le Header du site public (`components/layout/site-header.tsx`).
    - La Sidebar du dashboard privé (`components/layout/private-dashboard/sidebar.tsx`).
    - La Sidebar gère intelligemment le mode "réduit" (collapsed) en affichant toujours une icône (logo ou initiales).

### Correctifs Déploiement & Build
- **Erreur JSX Sidebar** : Correction d'une duplication de code dans `components/layout/private-dashboard/sidebar.tsx` qui provoquait une erreur de syntaxe (balises mal fermées) et bloquait le build Vercel.
- **Dépendances** : Ajout de `react-easy-crop` aux dépendances du projet.

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `app/(private)/admin/page.tsx` | Intégration Cropper & Selecteur Display Mode |
| `components/ui/image-cropper.tsx` | Nouveau composant de recadrage |
| `components/layout/private-dashboard/sidebar.tsx` | Support Display Mode & Fix Build |
| `components/layout/site-header.tsx` | Support Display Mode |
| `lib/config.ts` | Ajout `logoDisplayMode` au schéma config |
| `app/api/admin/config/route.ts` | Sauvegarde `logoDisplayMode` |
| `contexts/platform-config-context.tsx` | Diffusion `logoDisplayMode` |

## [2025-12-09] - Correctifs & Améliorations UX (Admin Legal)

### Correctifs Critiques
- **Erreur 500 Admin Legal** : Correction d'un problème de sérialisation des objets `Date` entre les Server Components et Client Components (`consentedAt`, `updatedAt`). Conversion explicite en chaînes ISO.
- **Déploiement (DB Reset)** : Modification du script `build-with-db.sh` pour détecter automatiquement l'environnement Vercel. Le reset de la base de données (`db:push --force`) est désormais automatique pour les environnements `preview` et `development`, et désactivé pour `production`.
- **Toggle Cookie Popup** : Correction d'un bug React où le changement d'état du switch "Enable Cookie Popup" ne se reflétait pas immédiatement dans l'interface.

### Améliorations UX & Fonctionnalités
- **Prévisualisation Temps Réel** : Ajout d'un composant de simulation dans `/admin/legal`. Les administrateurs peuvent désormais voir un aperçu fidèle du popup de cookies (style, logo, texte) directement depuis le panneau de configuration, sans avoir à aller sur le site public.
- **Contenu Dynamique (Pages Légales)** :
  - Les pages `/legal/terms` et `/legal/privacy` ne contiennent plus de texte "lorem ipsum" ou hardcodé.
  - Elles récupèrent désormais dynamiquement les informations de l'entreprise (Nom, Adresse, Email) et du Site Manager via `getLegalCompanyDetails`.
  - Ajout d'une section spécifique pour la conformité **DSA (Digital Services Act)** et la représentation dans l'UE.

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `app/(private)/admin/legal/page.tsx` | Fix sérialisation Date |
| `app/(private)/admin/legal/legal-management.tsx` | Intégration Preview & Fix UI |
| `app/(private)/admin/legal/cookie-consent-preview.tsx` | Nouveau composant Preview |
| `components/legal/cookie-consent.tsx` | Fix useEffect & Props |
| `app/(public)/legal/terms/page.tsx` | Contenu dynamique |
| `app/(public)/legal/privacy/page.tsx` | Contenu dynamique & Section DSA |
| `scripts/build-with-db.sh` | Logique de reset DB auto |

## [2025-12-09] - Module Légal (DSA/RGPD) & Refonte UI

### Module Légal & Conformité
- **Refonte Admin UI** (`/admin/legal`) :
  - **Simplification** : Suppression du système de versioning des Terms of Service (jugé obsolète).
  - **Focus RGPD** : L'onglet "Terms of Service" a été remplacé par une configuration complète du popup de cookies.
  - **Configuration Cookies** :
    - Activation/Désactivation globale du service.
    - Personnalisation du message avec support de tags dynamiques (`{site_name}`).
    - Toggle pour le logo.
  - **Logs** : Conservation de l'onglet de logs et d'export CSV.
  - **Interface d'édition améliorée** (Supprimé) : Le versioning complexe a été retiré au profit d'une gestion simplifiée.
- **Responsable du Site (Site Manager)** :
  - Ajout d'un flag `isSiteManager` dans la table `users`.
  - Nouvelle action dans l'admin utilisateurs (`/admin/users`) pour désigner un "Site Manager".
  - Ce rôle est utilisé pour afficher dynamiquement l'identité légale sur les pages publiques (prioritaire sur les infos génériques de l'entreprise).
- **Pages Publiques** (`/legal/*`) :
  - **Privacy Policy** : Refonte complète avec Shadcn UI, typographie soignée, et carte d'identité légale dynamique.
  - **Terms of Service** : Redirection temporaire vers Privacy Policy (en attente de contenu final).
  - **Layout** : Correction du layout pour éviter la duplication des headers/footers (suppression du layout spécifique légal au profit du layout racine).
  - **Contact** : Ajout de boutons d'action directs (mailto) pour contacter l'équipe légale.
- **Consentement Cookies (RGPD)** :
  - Nouveau composant `CookieConsent` avec design moderne "Glassmorphism".
  - Positionnement non-intrusif (flottant en bas à gauche) et animation fluide.
  - Intégration dynamique du logo du site dans la popup (configurable).
  - **Backend** : Enregistrement des consentements en base de données (IP, User Agent, Statut).
  - **Restriction** : Affichage limité aux pages publiques (masqué sur le Dashboard/Admin).

### Déploiement & Scripts
- **Scripts Vercel** :
  - **Optimisation `build-with-db.sh`** : Passage en mode "Persistant" par défaut (`db:push` au lieu de `db:hard-reset`).
  - Ajout de la variable `FORCE_DB_RESET` pour forcer la réinitialisation si nécessaire.
  - Mise à jour de `setup-vercel-env.sh` pour la configuration automatique des variables d'environnement.
  - Ajout de `vercel-api-setup.sh` pour la gestion des clés API en déploiement.
- **Documentation** :
  - Mise à jour du journal des actions.
  - Mise à jour de `DEPLOYMENT.md` (nouveau comportement DB).
  - Mise à jour de `guides/LEGAL_MODULE.md` (détails RGPD backend).

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `components/legal/cookie-consent.tsx` | Nouveau composant popup RGPD (connecté backend) |
| `app/actions/cookie-consent.ts` | Server Actions pour logs RGPD |
| `db/schema.ts` | Ajout table `cookie_consents` |
| `app/(public)/layout.tsx` | Intégration CookieConsent (Public only) |

### Correctifs & Maintenance
- **Correction Erreur 500 (`/admin/legal`)** :
  - Problème : Sérialisation des objets `Date` (consentedAt, updatedAt) entre Server Component et Client Component.
  - Solution : Conversion explicite en ISO string avant le passage aux props.
  - Nettoyage : Suppression du code mort lié à l'ancien système de versioning des CGU.
- **Déploiement Vercel** :
  - **Réinitialisation Automatique (Preview/Dev)** : Le script `build-with-db.sh` force désormais automatiquement `FORCE_DB_RESET="true"` pour les environnements `preview` et `development`.
  - Cela garantit un environnement propre et iso-prod pour chaque déploiement de test.

| `app/(private)/admin/legal/legal-management.tsx` | Admin RGPD (Logs, Export, Config) |
| `scripts/build-with-db.sh` | Sécurisation déploiement (db:push) |
| `app/(public)/legacy/about/page.tsx` | Mise à jour contenu (Neomnia/Scaleway) |

---

## [2025-12-08] - Gestion des Emails Transactionnels et Membres d'Équipe

### Emails Transactionnels
- **Traduction et Standardisation** :
  - Traduction de tous les templates d'email en anglais (`scripts/seed-email-templates.ts`).
  - Standardisation des clés de templates et des variables.
- **Nouveaux Templates** :
  - `email_update_notification` : Notification de sécurité lors du changement d'email.
  - `password_reset` : Envoi du lien de réinitialisation de mot de passe.
  - `account_deletion` : Mise à jour avec branding NeoSaaS et confirmation de suppression des données.
- **Corrections Backend** :
  - **Inscription** : Correction de la clé `email_verification` et de la variable `actionUrl`.
  - **Invitation** : Correction du mapping `actionUrl` et gestion du `companyId` pour les admins plateforme.
  - **Provider Scaleway** : Correction de l'extraction du domaine d'envoi pour supporter le format `Nom <email>`.

### Gestion d'Équipe (Dashboard)
- **Nouvelles Fonctionnalités** :
  - **Annuler une invitation** : Possibilité de révoquer une invitation en attente.
  - **Retirer un membre** : Possibilité de supprimer un utilisateur de l'entreprise.
- **Interface Utilisateur** :
  - Ajout de boutons d'action (Corbeille) avec confirmation pour ces opérations.
  - Affichage conditionnel selon les permissions.

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `scripts/seed-email-templates.ts` | Traduction EN, ajout templates reset/update |
| `app/api/auth/register/route.ts` | Fix template key & variables |
| `app/api/users/invite/route.ts` | Fix variables, companyId logic |
| `app/actions/users.ts` | Ajout notification update email |
| `app/actions/auth.ts` | Implémentation `recoverPassword` |
| `app/auth/recover-password/page.tsx` | Connexion frontend/backend |
| `app/actions/company-users.ts` | Création actions cancel/remove |
| `app/(private)/dashboard/company-management/page.tsx` | UI gestion membres |
| `lib/email/providers/scaleway/provider.ts` | Fix parsing adresse email |

---

## [2025-12-08] - Amélioration UI Gestion Utilisateurs

### Interface Utilisateur
- **Tableau des Utilisateurs** :
  - Suppression des actions redondantes dans le menu déroulant "Actions" (changement de rôle et de statut).
  - Ces fonctionnalités sont déjà accessibles directement via les colonnes "Role" et "Status" du tableau.
  - Simplification de l'interface pour éviter la confusion.

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `components/admin/users-table.tsx` | Nettoyage du menu d'actions |

---

## [2025-12-08] - Système de Validation d'Email et Mises à jour Entreprise

### Fonctionnalités
- **Validation d'Email** :
  - Modification du flux d'inscription : l'utilisateur n'est plus connecté automatiquement.
  - Envoi d'un email contenant un lien de validation (token sécurisé).
  - Nouvelle page `/auth/verify` pour valider le token et connecter l'utilisateur.
  - Redirection vers `/dashboard/profile` après validation pour compléter le profil.
- **Gestion Entreprise** :
  - Ajout du champ `Code Postal` (zipCode) dans le formulaire et l'affichage de la page Enterprise.
  - Vérification de la présence du champ `SIRET` dans la gestion d'entreprise.

### Modifications Base de Données
- **Table `users`** : Ajout du champ `emailVerified` (timestamp).
- **Nouvelle Table `verificationTokens`** :
  - `identifier` (email)
  - `token` (unique)
  - `expires` (date d'expiration)
  - Clé primaire composite sur (identifier, token).

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `db/schema.ts` | Ajout `emailVerified` et table `verificationTokens` |
| `app/api/auth/register/route.ts` | Génération token + envoi email validation |
| `app/auth/verify/page.tsx` | Nouvelle page de validation de compte |
| `app/(private)/dashboard/company-management/page.tsx` | Ajout champ Code Postal |

### Impact Déploiement
- Les modifications de schéma sont prises en charge par le script `build-with-db.sh` via `db:hard-reset` (ou `db:push` si configuré autrement).
- Le système d'envoi d'email existant (`emailRouter`) est utilisé pour l'envoi des tokens.

---

## [2025-12-08] - Correction envoi emails Scaleway TEM

### Contexte du bug
L'envoi d'emails transactionnels via Scaleway TEM échouait. Le formulaire de configuration API dans `/admin/api` ne collectait pas correctement les champs requis par l'API Scaleway TEM.

### Cause racine
L'API Scaleway TEM requiert **2 informations** pour envoyer des emails :
- `secretKey` - Clé secrète (utilisée dans le header `X-Auth-Token`)
- `projectId` - ID du projet Scaleway (utilisé dans les appels API)

> **Note** : L'`accessKey` (identifiant de la clé) n'est **pas requis** par l'API TEM.

### Corrections apportées

#### Interface Admin (`app/(private)/admin/api/page.tsx`)
- Ajout du champ `projectId` dans le formulaire Scaleway
- Réorganisation des champs : Secret Key et Project ID en premier (requis), Access Key en dernier (optionnel)
- Validation mise à jour : seuls `secretKey` et `projectId` sont obligatoires
- Labels clarifiés avec indication "optionnel" pour Access Key

#### Route de test API (`app/api/services/[service]/test/route.ts`)
- Test direct de l'API TEM (au lieu de l'API Instance)
- Validation : seuls `secretKey` et `projectId` sont requis
- Affichage du nombre de domaines vérifiés en cas de succès

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `app/(private)/admin/api/page.tsx` | Formulaire Scaleway corrigé |
| `app/api/services/[service]/test/route.ts` | Test API TEM + validation |

### Comment configurer Scaleway TEM
1. **Secret Key** : IAM → API Keys → Créer une clé avec permissions TEM
2. **Project ID** : Console Scaleway → Settings → Project Settings

### Impact
Les utilisateurs doivent fournir la **Secret Key** et le **Project ID** dans `/admin/api`. L'Access Key est optionnel.

---

## [2025-12-08] - Amélioration UX Gestion Utilisateurs & Login

### Fonctionnalités
- **Login Flexible** : Possibilité de se connecter via Email ou Nom d'utilisateur (Username).
- **Gestion Utilisateurs (Admin)** :
  - Ajout du champ `username` dans la table des utilisateurs.
  - Popup d'édition améliorée : modification du rôle, username, email, et autres infos dans une seule interface.
  - Affichage du `username` dans le tableau des utilisateurs.

### Modifications Techniques
- **Base de données (`db/schema.ts`)** : Ajout de la colonne `username` (unique) à la table `users`.
- **Actions Serveur (`app/actions/users.ts`)** :
  - Mise à jour de `createUser` et `updateUser` pour gérer le `username`.
  - Vérification d'unicité pour le `username`.
- **API Auth** :
  - `app/api/auth/login/route.ts` : Support de la recherche par email OU username.
  - `app/api/auth/register/route.ts` : Support du champ `username` à l'inscription.
- **Scripts** :
  - `scripts/seed-database.ts` : Ajout d'un username par défaut ('admin') pour le super admin.

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `db/schema.ts` | Ajout colonne `username` |
| `app/actions/users.ts` | Logique CRUD username |
| `app/api/auth/login/route.ts` | Login par username |
| `app/api/auth/register/route.ts` | Register avec username |
| `components/admin/users-table.tsx` | UI tableau et formulaires |
| `scripts/seed-database.ts` | Seed admin username |

---

## [2025-12-08] - Correction du mode maintenance et erreurs Turbopack

### Intégration Google Tag Manager et Code Personnalisé
- **`app/layout.tsx`** :
  - Injection automatique du script GTM (Google Tag Manager) si un ID est configuré.
  - Support de l'injection de code personnalisé dans le `<head>` et avant la fermeture du `<body>`.
- **`lib/config.ts`** :
  - Mise à jour de `getPlatformConfig` pour inclure `gtmCode`, `customHeaderCode` et `customFooterCode`.

### Correction du mode maintenance
Le mode maintenance ne fonctionnait pas car les layouts étaient mis en cache par Next.js. Les corrections suivantes ont été apportées :

- **`app/(public)/layout.tsx`** :
  - Ajout de `export const dynamic = 'force-dynamic'` pour forcer le rendu dynamique
  - Le mode maintenance est maintenant vérifié à chaque requête

- **`app/auth/layout.tsx`** :
  - Ajout de `export const dynamic = 'force-dynamic'`
  - Ajout de la vérification du mode maintenance (redirection vers `/maintenance`)
  - Les pages d'authentification sont aussi bloquées en mode maintenance

- **`app/api/config/route.ts`** :
  - Ajout de `maintenanceMode` dans la réponse de l'API publique

### Fonctionnement du mode maintenance (Next.js 16)
Puisque `middleware.ts` n'existe plus dans Next.js 16, le mode maintenance est géré via :
1. **Layouts dynamiques** : Chaque layout vérifie `platformConfig.maintenanceMode`
2. **Redirection serveur** : `redirect("/maintenance")` pour les non-admins
3. **Admins exemptés** : Les utilisateurs avec rôle `admin` ou `super_admin` peuvent accéder au site

### Correction des erreurs Turbopack
- **Conflit de route `/maintenance`** : Suppression du dossier dupliqué `/app/maintenance/` (conflictait avec `/(errors)/maintenance`)
- **Polices Google** : Remplacement de `Inter` (Google Fonts) par `GeistSans` (police locale du package `geist`)
- **Connexion DB au build** : Implémentation d'une initialisation paresseuse (lazy) de la connexion Neon pour éviter les erreurs lors du build

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `app/(public)/layout.tsx` | `dynamic = 'force-dynamic'` |
| `app/auth/layout.tsx` | `dynamic = 'force-dynamic'` + check maintenance |
| `app/api/config/route.ts` | Ajout `maintenanceMode` |
| `app/layout.tsx` | Police `GeistSans` au lieu de `Inter` |
| `db/index.ts` | Connexion lazy via Proxy |

---

## [2025-12-06] - Configuration dynamique du site et gestion des droits admin

### Contexte React pour la configuration de la plateforme
- **Nouveau fichier `contexts/platform-config-context.tsx`** :
  - Création d'un contexte React `PlatformConfigProvider` pour partager la configuration du site (siteName, logo) dans tous les composants client.
  - Hook `usePlatformConfig()` pour accéder aux données de configuration.

### API publique de configuration
- **Nouveau fichier `app/api/config/route.ts`** :
  - Endpoint GET public (sans authentification) pour récupérer le nom du site et le logo.
  - Fallback sur "NeoSaaS" si aucune configuration n'est définie en base.

### Layouts mis à jour
- **`app/(public)/layout.tsx`** : Ajout du `PlatformConfigProvider` pour les pages publiques.
- **`app/(private)/layout.tsx`** et **`layout-client.tsx`** : Passage de la configuration aux composants privés.
- **`app/auth/layout.tsx`** : Nom du site dynamique dans les métadonnées et le header.
- **`app/(public)/dashboard-exemple/layout.tsx`** : Métadonnées dynamiques.

### Composants mis à jour pour affichage dynamique
- **`components/layout/site-header.tsx`** : Logo et nom du site récupérés depuis le contexte.
- **`components/layout/site-footer.tsx`** : Nom du site dynamique dans le header et le copyright.
- **`components/layout/minimal-footer.tsx`** : Copyright dynamique.
- **`components/layout/mobile-menu.tsx`** : Nom du site dynamique.
- **`components/layout/private-dashboard/sidebar.tsx`** : Logo et initiales dynamiques.
- **`components/features/brand/brand-icon.tsx`** : Logo récupéré depuis la configuration.

### Correction de l'API admin/config
- **`app/api/admin/config/route.ts`** :
  - **Bug corrigé** : Utilisation de `currentUser.roles` (tableau) au lieu de `currentUser.role` (inexistant).
  - La vérification des droits admin utilise maintenant : `roles?.some(role => role === 'admin' || role === 'super_admin')`.

### Système de droits admin/super_admin
- **`lib/auth/server.ts`** :
  - Nouvelle fonction `isSuperAdmin(userId)` : vérifie si l'utilisateur a le rôle `super_admin`.
  - Nouvelle fonction `requireSuperAdmin()` : redirige vers `/dashboard` si non super_admin.
- **`lib/contexts/user-context.tsx`** :
  - Ajout de `isSuperAdmin` dans le contexte pour vérification côté client.
- **`app/(private)/admin/users/page.tsx`** :
  - Protection avec `await requireSuperAdmin()` : seuls les super_admin peuvent gérer les utilisateurs.
- **`components/layout/private-dashboard/sidebar.tsx`** :
  - Filtrage des items admin : le lien "Users" n'est visible que pour les super_admin.
  - Ajout du flag `superAdminOnly: true` sur l'item Users.

### Règles d'accès finales
| Page | Admin | Super Admin |
|------|-------|-------------|
| `/admin` (Dashboard) | ✅ | ✅ |
| `/admin/api` | ✅ | ✅ |
| `/admin/pages` | ✅ | ✅ |
| `/admin/mail` | ✅ | ✅ |
| `/admin/logs` | ✅ | ✅ |
| `/admin/users` | ❌ | ✅ |

### Mapping Base de Données (table `platform_config`)
Les données de la page `/admin` sont stockées dans la table `platform_config` avec les clés suivantes :
- `site_name` : Nom du site affiché partout
- `logo` : Logo en SVG Base64 (encapsulé dans un conteneur SVG 100x100)
- `auth_enabled` : Activation de l'authentification
- `maintenance_mode` : Mode maintenance
- `maintenance_message` : Message de maintenance personnalisé
- `custom_header_code` : Code injecté dans `<head>`
- `custom_footer_code` : Code injecté avant `</body>`
- `gtm_code` : ID Google Tag Manager
- `seo_settings` : JSON des paramètres SEO (titleTemplate, baseUrl, description, keywords, ogTitle, ogDescription)
- `social_links` : JSON des liens sociaux (twitter, facebook, linkedin, instagram, github)

---

## [2025-12-06] - Mise à jour de la gestion d'entreprise et du profil utilisateur

### Base de données
- **Table `companies`** :
  - Ajout de la colonne `zip_code` (Code Postal).
  - Ajout de la colonne `siret` (Numéro SIRET).
- **Table `users`** :
  - Ajout de la colonne `position` (Poste/Fonction).

### API
- **Route `/api/company` (PUT)** :
  - Prise en charge des champs `zipCode` et `siret` lors de la mise à jour ou création d'une entreprise.
- **Route `/api/profile` (POST)** :
  - Ajout de la méthode `POST` pour la mise à jour du profil (en plus de `PUT`).
  - Prise en charge du champ `position`.

### Interface Utilisateur (Dashboard)
- **Page `company-management`** :
  - Ajout des champs de saisie pour "ZIP Code" et "SIRET" dans le formulaire d'édition.
  - Affichage de ces nouvelles informations dans la vue lecture seule.
- **Page `profile`** :
  - Déplacement du bouton "Edit" dans la section "Personal Information".
  - Ajout du champ "Position" dans le formulaire d'édition.
  - Utilisation de la méthode `POST` pour la sauvegarde du profil.

### Déploiement
- **Script `db/push-schema.ts`** :
  - Mise à jour des instructions SQL de création de table pour inclure les nouvelles colonnes (`zip_code`, `siret`, `position`).
  - Cela garantit que lors d'un redéploiement (qui recrée le schéma), les nouvelles colonnes sont bien présentes.

## [2025-12-06] - Optimisation du déploiement et nettoyage

### Configuration
- **`package.json`** :
  - Suppression des dépendances inutilisées et lourdes : `sqlite3`, `mysql2`, `knex`, `expo-sqlite`, `postgres`, `gel`, `@aws-sdk/*`, `@cloudflare/*`, `@vercel/postgres`.
  - Mise à jour de `typescript` vers `^5.7.2`.
  - Mise à jour de `@types/react` et `@types/react-dom` vers `^19` pour la compatibilité Next.js 16.
- **`vercel.json`** :
  - Création du fichier pour forcer l'installation avec `pnpm install --no-frozen-lockfile` afin de résoudre les problèmes de lockfile obsolète sur Vercel.
- **`next.config.mjs`** :
  - Suppression du bloc `eslint` obsolète.

### Base de données
- **Script `db/push-schema.ts`** :
  - Ajout de l'initialisation automatique du Super Admin (`admin@exemple.com`) et des rôles/permissions lors du déploiement.

### Sécurité
- **`package.json`** :
  - Mise à jour de `next` vers `latest` pour corriger la vulnérabilité CVE-2025-66478.

### Fonctionnalités
- **Route `/api/profile/image`** :
  - **Transformation SVG & Recadrage** : Les images uploadées sont désormais encapsulées dans un conteneur SVG généré à la volée.
  - **Avantage** : Cela permet de forcer un format carré (512x512) via l'attribut `preserveAspectRatio="xMidYMid slice"` sans nécessiter de lourdes bibliothèques de traitement d'image.
  - **Stockage** : L'SVG résultant est stocké en Base64 dans la base de données, contournant les limitations du système de fichiers Vercel.



---
*Ce journal est mis à jour automatiquement par l'assistant IA lors des interventions majeures.*
