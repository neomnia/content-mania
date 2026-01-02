# Système de Types de Produits

## Vue d'ensemble

Le système e-commerce supporte maintenant **4 types de produits distincts** pour une meilleure clarté et flexibilité :

1. **Standard** (`standard`) - Produits payants classiques (icône Package 📦 - vert)
2. **Digital** (`digital`) - Produits digitaux accessibles en ligne (icône Rocket 🚀 - bleu)
3. **Gratuit** (`free`) - Produits téléchargeables gratuits (icône Download - amber)
4. **Rendez-vous** (`appointment`) - Produits de prise de rendez-vous / génération de leads (icône Calendar 📅 - violet)

> **Mise à jour du 2 janvier 2026** : Ajout du type `digital` pour distinguer les produits digitaux accessibles des produits standards.

---

## 1. Produits Standard (`standard`)

### Caractéristiques
- ✅ **Prix unitaire** requis
- ✅ **TVA** applicable
- ✅ **Paiement** requis au checkout
- ✅ **URL de téléchargement** optionnelle (fournie après achat)

### Cas d'usage
- Modules SaaS payants
- Produits digitaux (ebooks, templates, etc.)
- Services avec paiement immédiat

### Configuration
```typescript
{
  type: "standard",
  price: 9900,  // 99.00 EUR en centimes
  vatRateId: "uuid-du-taux-tva",
  fileUrl: "https://s3.../download-link" // Optionnel
}
```

---

## 2. Produits Digital (`digital`)

### Caractéristiques
- ✅ **Prix unitaire** requis
- ✅ **TVA** applicable
- ✅ **Paiement** requis au checkout
- ✅ **URL de téléchargement** pour accès digital
- 🚀 **Icône Rocket** pour identification rapide

### Cas d'usage
- Produits digitaux accessibles en ligne
- Accès à des plateformes SaaS
- Contenu digital premium
- Formations en ligne

### Configuration
```typescript
{
  type: "digital",
  price: 4900,  // 49.00 EUR en centimes
  vatRateId: "uuid-du-taux-tva",
  fileUrl: "https://app.example.com/access" // URL d'accès
}
```

### Différence avec Standard
- **Standard** : Produits physiques ou services classiques
- **Digital** : Produits 100% digitaux avec accès en ligne

---

## 3. Produits Gratuits (`free`)

### Caractéristiques
- ✅ **Prix = 0** (automatiquement défini)
- ❌ **Pas de TVA**
- ❌ **Pas de paiement**
- ✅ **URL de téléchargement** immédiatement accessible

### Cas d'usage
- Ressources gratuites (guides, templates)
- Lead magnets
- Démonstrations / échantillons

### Configuration
```typescript
{
  type: "free",
  price: 0,  // Toujours 0
  fileUrl: "https://s3.../free-download"  // Requis
}
```

### Comportement au checkout
- L'utilisateur peut "acheter" le produit sans payer
- Une commande est créée avec `paymentStatus = "completed"` et `totalAmount = 0`
- Le lien de téléchargement est fourni immédiatement

---

## 4. Produits Rendez-vous (`appointment`)

### Caractéristiques
- ✅ **Taux horaire** (pour affichage uniquement)
- ❌ **Pas de paiement**
- ✅ **Génération de lead** automatique
- ✅ **Intégration Outlook** pour booking (optionnel)

### Cas d'usage
- Consultations
- Sessions de coaching
- Rendez-vous de qualification
- Démos personnalisées

### Configuration
```typescript
{
  type: "appointment",
  price: 0,  // Pas de paiement
  hourlyRate: 15000,  // 150.00 EUR/h (affichage uniquement)
  outlookEventTypeId: "event-type-id"  // Optionnel
}
```

### Comportement au checkout
1. **Pas de paiement** traité
2. **Lead créé** dans `product_leads` :
   ```typescript
   {
     productId: "...",
     userId: "...", // ou null si anonyme
     userEmail: "user@example.com",
     userName: "John Doe",
     status: "new",
     source: "website",
     metadata: { /* infos additionnelles */ }
   }
   ```
3. **Notifications** envoyées :
   - Email de confirmation au client
   - Notification à l'admin pour suivi

### Table `product_leads`
```sql
CREATE TABLE product_leads (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID,  -- Nullable
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_phone TEXT,
  status TEXT DEFAULT 'new',  -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  source TEXT DEFAULT 'website',
  notes TEXT,
  scheduled_at TIMESTAMP,
  converted_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Interface Admin

### Formulaire de création/édition

Le formulaire affiche maintenant un **sélecteur de type** clair :

```tsx
<Select value={formData.type}>
  <SelectItem value="standard">
    Standard Product - Paid product with unit price
  </SelectItem>
  <SelectItem value="free">
    Free Download - Free downloadable product (no payment)
  </SelectItem>
  <SelectItem value="appointment">
    Appointment / Lead - Booking product (no payment, lead generation)
  </SelectItem>
</Select>
```

### Champs conditionnels

- **Standard** : Prix + TVA + URL téléchargement (optionnel)
- **Free** : URL téléchargement (requis)
- **Appointment** : Taux horaire (affichage) + Event Type ID

---

## Migration depuis l'ancien système

### Ancien système (à supprimer)
```typescript
// ❌ Ancien : checkboxes confuses
hasDigital: boolean
hasAppointment: boolean
isFree: boolean
```

### Nouveau système
```typescript
// ✅ Nouveau : type explicite
type: "standard" | "free" | "appointment"
```

### Mapping automatique

Les produits existants peuvent être migrés :

| Ancien | Nouveau |
|--------|---------||
| `type: "digital"` | Reste `"digital"` (nouveau type dédié) |
| `type: "standard"` + `price > 0` | `type: "standard"` |
| `type: "standard"` + `price = 0` | `type: "free"` |
| `type: "appointment"` | `type: "appointment"` |

> **Note** : Le type `digital` est maintenant un type à part entière avec sa propre icône Rocket 🚀

---

## Actions Serveur

### Créer un lead (appointment uniquement)

```typescript
import { createProductLead } from "@/app/actions/ecommerce"

const result = await createProductLead({
  productId: "uuid-du-produit",
  userEmail: "client@example.com",
  userName: "John Doe",
  userPhone: "+33 6 12 34 56 78",
  metadata: {
    preferredDate: "2024-01-15",
    message: "Je souhaite discuter de..."
  }
})

if (result.success) {
  console.log("Lead créé :", result.leadId)
}
```

---

## Checkout Logic

### Standard Products
1. Ajout au panier → Checkout → Paiement Stripe → Commande créée
2. `processCheckout()` gère le paiement complet

### Free Products
1. Ajout au panier → Checkout immédiat (no payment)
2. Commande créée avec `totalAmount = 0`, `paymentStatus = "completed"`
3. Lien de téléchargement fourni

### Appointment Products
1. Formulaire de contact → `createProductLead()`
2. **Aucun panier, aucune commande**
3. Lead enregistré dans `product_leads`
4. Emails de notification envoyés

---

## Avantages du nouveau système

✅ **Clarté** : Un seul champ `type` au lieu de 3 checkboxes  
✅ **Séparation** : Logique distincte pour chaque type  
✅ **Tracking** : Table dédiée pour les leads  
✅ **Flexibilité** : Facile d'ajouter de nouveaux types  
✅ **UX** : Interface plus intuitive pour les admins  

---

## TODO / Améliorations futures

- [ ] Créer une page admin `/admin/leads` pour gérer les leads
- [ ] Implémenter les emails de notification pour les appointments
- [ ] Ajouter un workflow de conversion lead → client
- [ ] Dashboard analytics pour les leads
- [ ] Intégration CRM pour le suivi des leads
- [ ] Rappels automatiques pour les rendez-vous non confirmés

---

## Notes de déploiement

### Déploiement Automatique via Vercel

Le système de déploiement est entièrement automatisé via `scripts/build-with-db.sh` :

1. **Push vers la branche** :
   ```bash
   git add .
   git commit -m "feat: système de types de produits refactorisé"
   git push origin e-commerce-bugs
   ```

2. **Vercel exécute automatiquement** :
   - ✅ `drizzle-kit push` → Crée la table `product_leads` et met à jour le schéma
   - ✅ `scripts/seed-email-templates.ts` → Templates d'emails
   - ✅ `scripts/sync-pages.ts` → Permissions de pages
   - ✅ `next build` → Compilation de l'application

3. **Aucune action manuelle requise** - Le schéma est automatiquement appliqué

### Migration de Données

Les produits existants **conservent leur type actuel** :
- `type: "digital"` reste `"digital"` (sera migré manuellement si nécessaire)
- Les **nouveaux produits** utilisent le type par défaut : `"standard"`

Pour migrer les anciens produits vers le nouveau système, utilisez le script SQL suivant en production :

```sql
-- Migrer les produits digitaux payants vers 'standard'
UPDATE products 
SET type = 'standard' 
WHERE type = 'digital' AND price > 0;

-- Migrer les produits digitaux gratuits vers 'free'
UPDATE products 
SET type = 'free' 
WHERE type = 'digital' AND price = 0;

-- Les produits 'appointment' gardent leur type
```

### Tests Post-Déploiement

1. ✅ Vérifier que la table `product_leads` existe
2. ✅ Créer un produit de chaque type
3. ✅ Tester le checkout pour chaque type
4. ✅ Vérifier la création de leads pour les appointments

---