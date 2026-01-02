# Admin Dashboard - Organisation et Responsivité

> **Dernière mise à jour :** 2 janvier 2026  
> **Auteur :** Système  
> **Objectif :** Documentation de la page `/admin` (Business Dashboard)

---

## 📋 Vue d'ensemble

La page **Admin** (`/admin`) est le tableau de bord principal pour la gestion business de la plateforme. Elle affiche les statistiques, paiements, factures et la configuration Lago.

**URL** : `/admin`  
**Fichier** : `app/(private)/admin/page.tsx`  
**Accès** : Administrateurs uniquement

---

## Structure des onglets

### Organisation (3 onglets)

La page est organisée en **3 onglets principaux** :

1. **Overview** - Vue d'ensemble des statistiques
2. **Payments & Invoices** - Paiements et factures (fusionnés)
3. **Lago Parameters** - Configuration de l'instance Lago

### Avant vs Après

#### ❌ Avant (4 onglets)
```
┌──────────┬──────────┬──────────┬──────────┐
│ Overview │ Payments │ Invoices │   Lago   │
└──────────┴──────────┴──────────┴──────────┘
```
**Problème** : Doublon entre Payments et Invoices

#### ✅ Après (3 onglets)
```
┌──────────┬────────────────────┬──────────┐
│ Overview │ Payments & Invoices│   Lago   │
└──────────┴────────────────────┴──────────┘
```
**Avantage** : 
- Élimination du doublon
- Interface plus épurée
- Meilleure utilisation de l'espace

---

## Responsivité des onglets

### TabsList responsive

```tsx
<TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
```

**Comportement** :
- **Mobile (< 640px)** : 1 onglet par ligne (empilés verticalement)
- **Tablette et Desktop (≥ 640px)** : 3 onglets sur une ligne

### Texte adaptatif

```tsx
<TabsTrigger value="payments">
  <span className="hidden sm:inline">Payments & Invoices</span>
  <span className="sm:hidden">Payments</span>
</TabsTrigger>

<TabsTrigger value="lago">
  <span className="hidden sm:inline">Lago Parameters</span>
  <span className="sm:hidden">Lago</span>
</TabsTrigger>
```

**Résultat** :
- **Mobile** : "Payments" et "Lago" (texte court)
- **Desktop** : "Payments & Invoices" et "Lago Parameters" (texte complet)

---

## Onglet 1 : Overview

**Composant** : `components/admin/dashboard-stats.tsx`

### A. Métriques (4 cartes)

**Grille responsive** :
```tsx
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

| Écran | Colonnes | Layout |
|-------|----------|--------|
| Mobile (< 640px) | 1 | Empilées verticalement |
| Tablette (640-1024px) | 2 | 2x2 grille |
| Desktop (≥ 1024px) | 4 | 1x4 ligne |

**Métriques affichées** :
1. 💰 **Total Revenue** - Revenu total à vie
2. 👥 **Total Subscriptions** - Nombre total d'abonnements
3. 💳 **Active Plans** - Plans actuellement actifs
4. 🏢 **Total Companies** - Entreprises enregistrées

---

### B. Graphiques principaux (2 sections)

#### Section Revenue Overview + Recent Invoices

**Grille responsive** :
```tsx
grid-cols-1 lg:grid-cols-7
```

| Écran | Layout |
|-------|--------|
| Mobile/Tablette (< 1024px) | Empilés verticalement (pleine largeur) |
| Desktop (≥ 1024px) | 2 colonnes (4 cols / 3 cols) |

##### 1. Revenue Overview (Graphique en barres)

**Classe** : `lg:col-span-4`

**Hauteur responsive** :
```tsx
h-[250px] sm:h-[300px] lg:h-[350px]
```
- Mobile : 250px
- Tablette : 300px
- Desktop : 350px

**Contenu** :
- Graphique en barres (BarChart)
- Revenu mensuel des 6 derniers mois
- Axe Y en dollars (`$`)
- Tooltip au survol

##### 2. Recent Invoices (Liste)

**Classe** : `lg:col-span-3`

**Contenu** :
- 5 dernières factures
- Pour chaque facture :
  - Nom de l'entreprise
  - Numéro de commande
  - Montant
  - Date
- Bouton "View All" → `/admin/invoices`

---

#### Section Growth Analysis + New Writers

**Grille responsive** :
```tsx
grid-cols-1 md:grid-cols-2
```

| Écran | Layout |
|-------|--------|
| Mobile (< 768px) | Empilés verticalement |
| Tablette/Desktop (≥ 768px) | 2 colonnes |

##### 1. Growth Analysis (Courbes doubles)

**Hauteur** : `h-[250px] sm:h-[300px]`

**Contenu** :
- Graphique LineChart à 2 courbes
- 🔵 **Registrations** - Nouvelles inscriptions
- 🟢 **Activations (Paid)** - Premiers achats
- Permet de visualiser le taux de conversion

##### 2. New Writers (Area Chart)

**Hauteur** : `h-[250px] sm:h-[300px]`

**Contenu** :
- Graphique AreaChart
- Courbe orange avec dégradé
- Évolution des inscriptions de "writers" (rôle individuel)

---

### C. Tableau des inscriptions récentes

**Titre** : Recent Registrations & Active Companies

**Responsivité** :
```tsx
<div className="overflow-x-auto">
  <Table>
    ...
  </Table>
</div>
```

**Colonnes** :
1. Company
2. Email
3. Registration Date
4. Status (Badge)
5. Plan

**Mobile** : Scroll horizontal activé pour préserver toutes les colonnes

---

## Onglet 2 : Payments & Invoices

**Composants fusionnés** :
- `components/admin/dashboard-payments.tsx`
- `components/admin/dashboard-invoices.tsx`

**Structure** :
```tsx
<div className="space-y-6">
  <DashboardPayments />
  <DashboardInvoices />
</div>
```

**Espacement** : `space-y-6` (24px entre les deux sections)

### A. Recent Payments

**Composant** : `PaymentsTable`

**Contenu** :
- Liste des paiements récents
- Informations par paiement :
  - Utilisateur
  - Montant
  - Statut
  - Date
  - Méthode de paiement

### B. Recent Invoices

**Composant** : `InvoicesTable`

**Contenu** :
- Liste des factures récentes
- Informations par facture :
  - Numéro de facture
  - Client
  - Montant
  - Statut
  - Date d'émission

**Avantage de la fusion** :
- Vue complète des transactions financières sur un seul écran
- Pas besoin de basculer entre onglets
- Meilleure vision d'ensemble

---

## Onglet 3 : Lago Parameters

**Composant** : `components/admin/payment-settings.tsx`

**Contenu** :
- Configuration de l'instance Lago
- API Key
- API URL
- Mode (Production/Test)

**Note** : Lago est un système de billing externe utilisé pour la gestion des abonnements et factures.

---

## Système de filtrage (Overview)

### Sélecteur de période

```tsx
<Select defaultValue="30d">
  <SelectContent>
    <SelectItem value="7d">Last 7 days</SelectItem>
    <SelectItem value="30d">Last 30 days</SelectItem>
    <SelectItem value="90d">Last 3 months</SelectItem>
    <SelectItem value="12m">Last year</SelectItem>
  </SelectContent>
</Select>
```

**Valeur par défaut** : 30 jours

---

## États de chargement

### Vérification des droits

```tsx
if (isChecking) {
  return (
    <Shield className="h-12 w-12 animate-pulse text-[#CD7F32]" />
    <p>Vérification des droits d'accès...</p>
  )
}
```

### Chargement des données

```tsx
if (loading) {
  return (
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  )
}
```

---

## Améliorations de responsivité

### ✅ 1. Grilles adaptatives

| Élément | Mobile | Tablette | Desktop |
|---------|--------|----------|---------|
| Métriques | 1 col | 2 cols | 4 cols |
| Graphiques principaux | Stack | Stack | 2 cols (4/3) |
| Growth/Writers | Stack | 2 cols | 2 cols |

### ✅ 2. Hauteurs dynamiques

- Graphiques plus petits sur mobile (250px)
- Graphiques moyens sur tablette (300px)
- Graphiques grands sur desktop (350px)

### ✅ 3. Tableaux scrollables

- `overflow-x-auto` sur tableaux complexes
- Préserve toutes les colonnes sur mobile
- Scroll horizontal naturel

### ✅ 4. Texte adaptatif

- Labels courts sur mobile
- Labels complets sur desktop
- Meilleure UX tactile

---

## Breakpoints utilisés

```css
/* Tailwind breakpoints */
sm:  640px   /* Tablette portrait */
md:  768px   /* Tablette paysage */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
```

---

## Fichiers concernés

### Pages
- `app/(private)/admin/page.tsx` - Page principale

### Composants
- `components/admin/dashboard-stats.tsx` - Overview et statistiques
- `components/admin/dashboard-payments.tsx` - Tableau des paiements
- `components/admin/dashboard-invoices.tsx` - Tableau des factures
- `components/admin/payment-settings.tsx` - Configuration Lago
- `components/admin/metric-card.tsx` - Cartes de métriques
- `components/admin/payments-table.tsx` - Table des paiements
- `components/admin/invoices-table.tsx` - Table des factures

### Actions
- `app/actions/admin-dashboard.ts` - Actions serveur pour récupérer les données

### Hooks
- `lib/hooks/use-require-admin.ts` - Vérification des droits admin

---

## Graphiques utilisés

**Bibliothèque** : Recharts

**Types de graphiques** :
1. **BarChart** - Revenue Overview (barres verticales)
2. **LineChart** - Growth Analysis (courbes doubles)
3. **AreaChart** - New Writers (area avec gradient)

**Configuration commune** :
```tsx
<ResponsiveContainer width="100%" height="100%">
  {/* Chart */}
</ResponsiveContainer>
```

---

## Données affichées

### Métriques
```typescript
interface Metrics {
  revenue: number          // Revenu total
  subscriptions: number    // Nombre d'abonnements
  activePlans: number      // Plans actifs
  companies: number        // Entreprises enregistrées
}
```

### Chart Data
```typescript
interface ChartData {
  name: string            // Mois (ex: "Jan", "Feb")
  revenue: number         // Revenu du mois
  registrations: number   // Inscriptions du mois
  activations: number     // Activations du mois
  writers: number         // Nouveaux writers du mois
}
```

---

## Documentation connexe

- [Admin Responsive Design](./ADMIN_RESPONSIVE_DESIGN.md)
- [Admin UX Patterns](./ADMIN_UX_PATTERNS.md)
- [Lago Configuration](./LAGO_CONFIGURATION.md)
- [Admin Tables Responsive Rules](./ADMIN_TABLES_RESPONSIVE_RULES.md)

---

## Changelog

### 2 janvier 2026
- ✅ Fusion des onglets Payments et Invoices en un seul
- ✅ Réduction de 4 à 3 onglets
- ✅ Amélioration de la responsivité des grilles (1/2/4 colonnes)
- ✅ Hauteurs adaptatives pour tous les graphiques
- ✅ Texte adaptatif sur les onglets (mobile vs desktop)
- ✅ Ajout de `overflow-x-auto` sur le tableau des inscriptions
- ✅ Navigation tactile améliorée sur mobile
