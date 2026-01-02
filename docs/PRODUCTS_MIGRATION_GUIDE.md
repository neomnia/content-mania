# Migration vers le Panneau Unifié - Guide Technique

## Vue d'ensemble

Ce document explique la migration de l'ancien système à deux modes vers le nouveau panneau unifié.

## Ancien Système (Avant)

### Architecture
```
app/(private)/admin/products/
├── page.tsx                    # Liste des produits
├── products-page-client.tsx   # Client component
├── products-table.tsx          # Tableau avec panneau basique
├── new/
│   └── page.tsx               # Page création (PLEINE PAGE)
├── [id]/
│   └── page.tsx               # Page édition (PLEINE PAGE)
└── product-form.tsx           # Formulaire complet
```

### Problèmes Identifiés
1. **Incohérence UX** : Deux interfaces différentes (panneau vs page pleine)
2. **Complexité** : Deux composants séparés (`products-table.tsx` et `product-form.tsx`)
3. **Navigation** : Changement de page = perte de contexte
4. **Redondance** : Code dupliqué entre panneau basique et formulaire complet
5. **Limitations** : Panneau basique sans upload d'image ni sélection d'icône

## Nouveau Système (Maintenant)

### Architecture
```
app/(private)/admin/products/
├── page.tsx                    # Liste des produits (inchangé)
├── products-page-client.tsx   # Client component (inchangé)
├── products-table.tsx          # ⭐ TOUT-EN-UN: Table + Panneau Complet
├── new/
│   └── page.tsx               # ⚠️ OBSOLÈTE (non supprimé)
├── [id]/
│   └── page.tsx               # ⚠️ OBSOLÈTE (non supprimé)
└── product-form.tsx           # ⚠️ OBSOLÈTE (non supprimé)
```

### Avantages
1. ✅ **Interface Unique** : Même panneau pour création et modification
2. ✅ **Fonctionnalités Complètes** : Upload image, sélection icône, tous les champs
3. ✅ **Contexte Préservé** : Pas de changement de page
4. ✅ **Code Centralisé** : Tout dans `products-table.tsx`
5. ✅ **UX Améliorée** : Transitions fluides, calculs temps réel

## Modifications Techniques

### États Ajoutés
```typescript
// Gestion de l'image
const [imagePreview, setImagePreview] = useState<string | null>(null)
const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)

// Ajout du champ icon dans editValues
const [editValues, setEditValues] = useState<{
  // ... autres champs
  icon: string; // ⭐ NOUVEAU
}>({ 
  // ... valeurs par défaut
  icon: 'ShoppingBag' // ⭐ NOUVEAU
})
```

### Fonctions Ajoutées
```typescript
// Upload d'image dans le panneau
const handleImageUploadInPanel = async (file: File) => {
  if (isNewProduct) {
    // Stockage temporaire + preview
    setPendingImageFile(file)
    // Preview base64
  } else {
    // Upload immédiat pour produits existants
  }
}

// Suppression d'image dans le panneau
const removeImageInPanel = async () => {
  if (isNewProduct) {
    // Juste effacer la preview
  } else {
    // Supprimer de la DB via upsertProduct
  }
}
```

### Logique de Sauvegarde Modifiée
```typescript
const handleSaveFromPanel = async () => {
  // 1. Validation
  // 2. Préparation des données (avec icon maintenant)
  const productData = {
    // ... autres champs
    icon: editValues.icon // ⭐ NOUVEAU
  }
  
  // 3. Sauvegarde du produit
  const result = await upsertProduct(productData)
  
  // 4. ⭐ NOUVEAU: Upload de l'image après création si nécessaire
  if (isNewProduct && pendingImageFile && result.data?.id) {
    const imgFormData = new FormData()
    imgFormData.append("image", pendingImageFile)
    imgFormData.append("productId", result.data.id)
    
    await fetch("/api/products/image", {
      method: "POST",
      body: imgFormData
    })
  }
  
  // 5. Fermeture et refresh
}
```

### Interface du Panneau
#### Avant (Basique)
- ✅ Affichage des détails
- ✅ Changement de statut Published/Draft
- ❌ Pas d'upload d'image
- ❌ Pas de sélection d'icône
- ❌ Édition limitée (juste un bouton "Edit" qui redirige)

#### Maintenant (Complet)
- ✅ Affichage des détails (mode lecture)
- ✅ Édition complète inline (mode édition)
- ✅ Upload d'image avec preview
- ✅ Sélection d'icône de secours
- ✅ Tous les champs éditables
- ✅ Calcul automatique TVA
- ✅ Validation en temps réel
- ✅ Sticky buttons (Save/Cancel)

## Points d'Attention

### Comportement de l'Image

#### Nouveau Produit
```typescript
// 1. Utilisateur upload une image
setPendingImageFile(file)
setImagePreview(base64String) // Preview locale

// 2. Utilisateur clique "Create Product"
const result = await upsertProduct({...}) // Crée le produit

// 3. Upload de l'image avec l'ID du nouveau produit
if (result.data?.id && pendingImageFile) {
  uploadImage(result.data.id, pendingImageFile)
}
```

#### Produit Existant
```typescript
// Upload immédiat lors du changement d'image
const handleImageUploadInPanel = async (file: File) => {
  if (!isNewProduct && detailsProduct) {
    await uploadImage(detailsProduct.id, file)
    router.refresh() // Rafraîchit pour voir la nouvelle image
  }
}
```

### Gestion des Modes

```typescript
// Mode Lecture (Visualisation)
isEditingInPanel = false
isNewProduct = false
detailsProductId = "uuid-du-produit"

// Mode Édition
isEditingInPanel = true
isNewProduct = false
detailsProductId = "uuid-du-produit"

// Mode Création
isEditingInPanel = true
isNewProduct = true
detailsProductId = "new"
```

### Initialisation des Valeurs

```typescript
// Lors de l'ouverture d'un produit existant
useEffect(() => {
  if (detailsProduct) {
    setEditValues({
      title: detailsProduct.title,
      description: detailsProduct.description || '',
      price: (detailsProduct.price / 100).toFixed(2),
      type: detailsProduct.type || 'digital',
      vatRateId: detailsProduct.vatRateId || '',
      isPublished: detailsProduct.isPublished,
      icon: detailsProduct.icon || 'ShoppingBag' // ⭐ NOUVEAU
    })
    setImagePreview(detailsProduct.imageUrl) // ⭐ NOUVEAU
    setPendingImageFile(null) // ⭐ NOUVEAU
  }
}, [detailsProduct])
```

## Compatibilité

### Rétrocompatibilité
✅ **Tous les produits existants fonctionnent sans modification**
- Produits sans icône : affichent `Package` par défaut
- Produits avec image : affichent l'image
- Produits sans image ni icône : affichent `Package`

### API Inchangée
✅ **Aucune modification des actions serveur**
- `upsertProduct()` : Même signature, accepte juste `icon` en plus
- `/api/products/image` : Inchangé
- `deleteProduct()` : Inchangé

### Base de Données
✅ **Aucune migration nécessaire**
- La colonne `icon` existe déjà
- Tous les produits peuvent avoir ou non une icône
- Valeur par défaut gérée côté client

## Nettoyage (Optionnel)

### Fichiers Obsolètes à Supprimer
Une fois que vous êtes sûr que le nouveau système fonctionne :

```bash
# ⚠️ ATTENTION: Supprimez uniquement si vous êtes certain !

# Pages d'édition pleine page (obsolètes)
rm -r app/(private)/admin/products/new/
rm -r app/(private)/admin/products/[id]/

# Composant de formulaire (obsolète)
rm app/(private)/admin/products/product-form.tsx
```

### Avant de Supprimer
✅ Testez le nouveau panneau avec :
1. Création d'un nouveau produit
2. Modification d'un produit existant
3. Upload d'image sur nouveau et existant
4. Changement d'icône
5. Validation des champs
6. Annulation d'édition

## Tests de Régression

### Scénarios à Tester

#### 1. Création Basique
- [ ] Créer un produit avec titre uniquement
- [ ] Créer un produit avec tous les champs
- [ ] Créer un produit sans image (seulement icône)
- [ ] Créer un produit avec image (sans icône)

#### 2. Upload d'Image
- [ ] Upload image sur nouveau produit → vérifier l'upload post-création
- [ ] Upload image sur produit existant → vérifier upload immédiat
- [ ] Changer l'image d'un produit
- [ ] Supprimer l'image d'un produit

#### 3. Édition
- [ ] Modifier le titre d'un produit
- [ ] Modifier le prix et vérifier le calcul TTC
- [ ] Changer le type (Digital ↔ Appointment)
- [ ] Changer le statut (Published ↔ Draft)
- [ ] Modifier la TVA et vérifier le recalcul

#### 4. Annulation
- [ ] Créer un produit puis annuler → panneau se ferme
- [ ] Modifier un produit puis annuler → revient en mode lecture
- [ ] Modifier plusieurs champs puis annuler → valeurs restaurées

#### 5. Edge Cases
- [ ] Créer un produit avec prix = 0
- [ ] Créer un produit sans TVA
- [ ] Créer un produit avec description vide
- [ ] Upload d'une très grande image (> 5MB)
- [ ] Upload d'un format invalide (PDF, TXT, etc.)

## Dépannage

### Problème : L'image ne s'affiche pas après création
**Cause** : L'upload post-création a échoué  
**Solution** : Vérifier les logs dans la console, vérifier les permissions du dossier `public/profiles/`

### Problème : Le calcul TVA est incorrect
**Cause** : Taux de TVA en pourcentage au lieu de basis points  
**Solution** : Les taux sont stockés en basis points (ex: 2000 = 20.00%). La division par 10000 est correcte.

### Problème : Le panneau ne se ferme pas
**Cause** : État `detailsProductId` non réinitialisé  
**Solution** : Vérifier que `setDetailsProductId(null)` est appelé

### Problème : Les modifications ne sont pas sauvegardées
**Cause** : Validation échouée ou erreur réseau  
**Solution** : 
1. Vérifier les logs console préfixés `[ProductsTable]`
2. Vérifier la validation des champs (titre et prix requis)
3. Vérifier la connexion réseau

## Logs de Debug

Tous les logs sont préfixés par `[ProductsTable]` :

```typescript
// Logs de création/modification
'[ProductsTable] handleSaveFromPanel - Starting save'
'[ProductsTable] handleSaveFromPanel - Product data to save:'
'[ProductsTable] handleSaveFromPanel - Result:'

// Logs d'upload d'image
'[ProductsTable] handleImageUploadInPanel - File:'
'[ProductsTable] handleImageUploadInPanel - Response status:'

// Logs de suppression
'[ProductsTable] removeImageInPanel - isNewProduct:'
```

Activez le mode verbose dans la console pour voir tous les détails.

## Performance

### Optimisations Appliquées
- ✅ **Preview locale** : Image encodée en base64 côté client (pas de round-trip serveur)
- ✅ **Upload conditionnel** : Image uploadée seulement si modifiée
- ✅ **Calcul local** : Prix TTC calculé côté client (pas d'appel API)
- ✅ **Debounce implicite** : Calculs uniquement sur changement de valeur

### Métriques Attendues
- Création produit : < 2s (avec image)
- Modification produit : < 1s
- Upload image : < 3s (selon taille)
- Ouverture panneau : < 100ms
- Fermeture panneau : < 100ms

---

**Version** : 2.0  
**Date de migration** : 2 janvier 2026  
**Rétrocompatibilité** : ✅ Oui  
**Migration DB requise** : ❌ Non
