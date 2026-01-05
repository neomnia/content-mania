# Règles UX pour l'Interface Admin

> **Dernière mise à jour :** 2 janvier 2026  
> **Auteur :** Système  
> **Objectif :** Définir les patterns UX cohérents pour toute l'interface d'administration

---

## 📋 Table des Matières

1. [Sheet vs Dialog](#sheet-vs-dialog)
2. [TabsList Full Width](#tabslist-full-width)
3. [Tables Responsives](#tables-responsives)
4. [Formulaires](#formulaires)
5. [Actions et Confirmations](#actions-et-confirmations)

---

## 1. Sheet vs Dialog

### 🎯 Règle Générale

**✅ UTILISER `<Sheet>` (panneau latéral) pour :**
- Formulaires de création/édition
- Détails d'un élément
- Panneaux d'informations riches
- Tout contenu nécessitant de l'espace vertical
- Formulaires multi-étapes

**❌ UTILISER `<Dialog>` (popup centrée) UNIQUEMENT pour :**
- Confirmations simples (ex: suppression)
- Alertes critiques
- Messages courts nécessitant une action immédiate
- Modales bloquantes (2-3 boutons max)

### 📐 Pourquoi Sheet ?

| Critère | Sheet | Dialog |
|---------|-------|--------|
| **Espace vertical** | ✅ Scrollable, adapté aux longs formulaires | ❌ Limité, scrolling difficile |
| **Contexte** | ✅ Garde la vue principale visible | ❌ Masque tout le contenu |
| **Mobile** | ✅ Natif mobile (slide from bottom) | ⚠️ Peut être trop grand sur petit écran |
| **Multi-tâche** | ✅ Permet de voir la liste principale | ❌ Focus exclusif |
| **UX moderne** | ✅ Pattern 2024+ (drawer pattern) | ⚠️ Pattern classique |

### 🛠️ Implémentation Sheet

#### Structure de Base

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
    <SheetHeader>
      <SheetTitle>Titre du panneau</SheetTitle>
      <SheetDescription>
        Description optionnelle (améliore l'accessibilité)
      </SheetDescription>
    </SheetHeader>
    
    {/* Contenu scrollable */}
    <div className="space-y-6 py-6">
      {/* Formulaire ou contenu */}
    </div>
    
    {/* Actions en bas */}
    <div className="flex gap-3 pt-6 border-t">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>
        Save
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

#### Classes Importantes

```tsx
// Largeur responsive
className="w-full sm:max-w-xl"          // Mobile: pleine largeur, Desktop: 576px max
className="w-full sm:max-w-2xl"         // Pour contenus plus larges
className="w-full sm:max-w-lg"          // Pour contenus plus compacts

// Scroll
className="overflow-y-auto"             // TOUJOURS inclure pour éviter débordement

// Position (par défaut: droite)
side="right"   // Défaut, vient de la droite
side="left"    // Vient de la gauche
side="bottom"  // Mobile-first, vient du bas
side="top"     // Vient du haut
```

#### Exemple Complet : Création/Édition Utilisateur

```tsx
const [isUserPanelOpen, setIsUserPanelOpen] = useState(false)
const [editingUser, setEditingUser] = useState<User | null>(null)
const [isNewUser, setIsNewUser] = useState(false)

<Sheet open={isUserPanelOpen} onOpenChange={(open) => {
  setIsUserPanelOpen(open)
  if (!open) {
    setEditingUser(null)
    setIsNewUser(false)
  }
}}>
  <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
    <SheetHeader>
      <SheetTitle>
        {isNewUser ? "Create New User" : "Edit User"}
      </SheetTitle>
      <SheetDescription>
        {isNewUser 
          ? "Fill in the information to create a new user account" 
          : "Update user information and permissions"}
      </SheetDescription>
    </SheetHeader>

    <div className="space-y-6 py-6">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input 
          id="firstName" 
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>

      {/* Autres champs... */}
    </div>

    <div className="flex gap-3 pt-6 border-t">
      <Button 
        variant="outline" 
        onClick={() => setIsUserPanelOpen(false)}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button 
        onClick={handleSave}
        disabled={isSaving}
        className="flex-1"
      >
        {isSaving ? "Saving..." : isNewUser ? "Create" : "Update"}
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

### 🛠️ Implémentation Dialog (Confirmations)

**À utiliser UNIQUEMENT pour confirmations et alertes**

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the user
        account and all associated data.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleConfirmDelete}
        className="bg-red-600 hover:bg-red-700"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 2. TabsList Full Width

### ✅ Règle Obligatoire

**Tous les `<TabsList>` doivent utiliser `grid w-full grid-cols-N`**

```tsx
// ❌ MAUVAIS - width: fit-content
<TabsList>
  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
</TabsList>

// ✅ BON - pleine largeur responsive
<TabsList className="grid w-full grid-cols-2">
  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
</TabsList>
```

### 📊 Exemples par Nombre d'Onglets

```tsx
// 2 onglets
<TabsList className="grid w-full grid-cols-2">

// 3 onglets
<TabsList className="grid w-full grid-cols-3">

// 4 onglets
<TabsList className="grid w-full grid-cols-4">

// 5+ onglets → Considérer un autre pattern (dropdown, navigation)
```

### 🎨 Style des Triggers

```tsx
<TabsTrigger 
  value="users" 
  className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white"
>
  <Users className="mr-2 h-4 w-4" />
  Users
</TabsTrigger>
```

**Couleur de marque :** `#CD7F32` (bronze)

---

## 3. Tables Responsives

Voir documentation complète : 
- [ADMIN_TABLES_RESPONSIVE_RULES.md](./ADMIN_TABLES_RESPONSIVE_RULES.md)
- [ADMIN_USERS_COMPANIES_TABLES.md](./ADMIN_USERS_COMPANIES_TABLES.md)

### Résumé des Règles

```tsx
// Desktop: Table
<div className="hidden md:block">
  <Table>...</Table>
</div>

// Mobile: Cards
<div className="md:hidden space-y-4">
  {items.map(item => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

**Breakpoint :** `md:` (768px)

### Colonnes Standard pour Tables Admin

Toutes les tables admin doivent inclure les colonnes suivantes :

```tsx
// Colonne ID (première colonne)
<TableHead className="w-[100px]">ID</TableHead>
<TableCell className="font-mono text-xs text-muted-foreground">
  {item.id.substring(0, 8)}...
</TableCell>

// Colonnes de dates (dernières colonnes)
<TableHead>Created</TableHead>
<TableCell className="text-xs text-muted-foreground">
  <div>{formatDate(item.createdAt)}</div>
  <div className="text-[10px] opacity-70">{formatTime(item.createdAt)}</div>
</TableCell>

<TableHead>Updated</TableHead>
<TableCell className="text-xs text-muted-foreground">
  <div>{formatDate(item.updatedAt)}</div>
  <div className="text-[10px] opacity-70">{formatTime(item.updatedAt)}</div>
</TableCell>
```

### Tri des Colonnes

**Toutes les colonnes doivent être triables**

```tsx
// State pour le tri
const [sortField, setSortField] = useState<string | null>(null)
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

// Fonction de tri
const handleSort = (field: string) => {
  if (sortField === field) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  } else {
    setSortField(field)
    setSortDirection('asc')
  }
}

// Header avec tri
<TableHead>
  <Button
    variant="ghost"
    onClick={() => handleSort('name')}
    className="hover:bg-transparent"
  >
    Name
    {sortField === 'name' && (
      <span className="ml-2">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    )}
  </Button>
</TableHead>

// Implémentation du tri
const sortedItems = React.useMemo(() => {
  if (!sortField) return filteredItems
  
  return [...filteredItems].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    // Tri numérique
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    // Tri date
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc' 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime()
    }
    
    // Tri texte
    const aStr = String(aValue).toLowerCase()
    const bStr = String(bValue).toLowerCase()
    return sortDirection === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr)
  })
}, [filteredItems, sortField, sortDirection])
```

### Actions en Ligne (Icônes Directes)

**Privilégier les icônes directes au lieu de dropdown menus**

```tsx
// ❌ ÉVITER - Dropdown menu (trop de clics)
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// ✅ PRÉFÉRER - Icônes directes (1 clic)
<TableCell className="text-right">
  <div className="flex justify-end gap-2">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setEditing(item)}
      title="Edit"
    >
      <Pencil className="h-4 w-4" />
    </Button>
    
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleDelete(item.id)}
      title="Delete"
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

---

## 4. Formulaires

### Structure Standard

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Champ simple */}
  <div className="space-y-2">
    <Label htmlFor="fieldName">Label</Label>
    <Input 
      id="fieldName" 
      name="fieldName"
      placeholder="Placeholder text"
      required
    />
    <p className="text-xs text-muted-foreground">
      Helper text (optionnel)
    </p>
  </div>

  {/* Champ avec Select */}
  <div className="space-y-2">
    <Label htmlFor="role">Role</Label>
    <Select value={role} onValueChange={setRole}>
      <SelectTrigger id="role">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="user">User</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Grid pour 2 colonnes sur desktop */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="firstName">First Name</Label>
      <Input id="firstName" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastName">Last Name</Label>
      <Input id="lastName" />
    </div>
  </div>

  {/* Textarea */}
  <div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea 
      id="description"
      className="min-h-[100px]"
      placeholder="Enter description..."
    />
  </div>

  {/* Switch/Toggle */}
  <div className="flex items-center justify-between space-x-2">
    <div className="space-y-0.5">
      <Label htmlFor="isActive">Active Status</Label>
      <p className="text-xs text-muted-foreground">
        Enable or disable this account
      </p>
    </div>
    <Switch
      id="isActive"
      checked={isActive}
      onCheckedChange={setIsActive}
    />
  </div>
</form>
```

### Spacing Classes

```tsx
space-y-2    // Entre label et input
space-y-4    // Entre groupes de champs simples
space-y-6    // Entre sections de formulaire
gap-4        // Dans les grids
```

---

## 5. Actions et Confirmations

### Boutons d'Action Primaires

```tsx
// Création
<Button className="bg-[#CD7F32] hover:bg-[#B86F28] text-white">
  <Plus className="mr-2 h-4 w-4" />
  Create New
</Button>

// Modification
<Button>
  <Pencil className="mr-2 h-4 w-4" />
  Edit
</Button>

// Suppression
<Button variant="destructive">
  <Trash2 className="mr-2 h-4 w-4" />
  Delete
</Button>

// Annulation
<Button variant="outline">
  Cancel
</Button>
```

### Actions Groupées

```tsx
{selectedIds.size > 0 && (
  <div className="flex gap-2">
    <Button
      variant="destructive"
      size="sm"
      onClick={handleBulkDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
      Delete ({selectedIds.size})
    </Button>

    <Button
      variant="outline"
      size="sm"
      onClick={handleBulkExport}
    >
      <Download className="mr-2 h-4 w-4" />
      Export Selected
    </Button>
  </div>
)}
```

### Confirmations Destructives

**TOUJOURS utiliser AlertDialog pour les actions destructives**

```tsx
const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

<AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the
        selected item and all associated data.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleConfirmDelete}
        className="bg-red-600 hover:bg-red-700"
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 📚 Exemples de Référence

### Sheet (Panneaux Latéraux)

1. **Products Table** : [app/(private)/admin/products/products-table.tsx](../app/(private)/admin/products/products-table.tsx)
   - Lignes 1258-1934
   - Création/édition de produit
   - Upload d'images
   - Formulaire multi-sections
   - **Référence principale pour Sheet**

2. **User Edit Sheet** : [components/admin/user-edit-sheet.tsx](../components/admin/user-edit-sheet.tsx)
   - Édition utilisateur
   - Upload d'image de profil
   - Recherche d'entreprise avec Combobox
   - Métadonnées (dates de création/modification)
   - **Référence pour Sheet avec upload et search**

3. **Company Edit Sheet** : [components/admin/company-edit-sheet.tsx](../components/admin/company-edit-sheet.tsx)
   - Édition entreprise
   - Formulaire multi-champs (coordonnées, adresse, SIRET, TVA)
   - Métadonnées
   - **Référence pour Sheet avec formulaire business**

### Dialog (Confirmations)

1. **Products Table** : [app/(private)/admin/products/products-table.tsx](../app/(private)/admin/products/products-table.tsx)
   - Lignes 1237-1256
   - Confirmation de suppression
   - **Référence pour AlertDialog**

2. **VAT Rates Dialog** : [components/admin/vat-rates-dialog.tsx](../components/admin/vat-rates-dialog.tsx)
   - ⚠️ **À CONVERTIR EN SHEET**
   - Gestion des taux de TVA

### TabsList Full Width

1. **Organization Page** : [app/(private)/admin/users/page.tsx](../app/(private)/admin/users/page.tsx)
   - `grid w-full grid-cols-2`
   
2. **Admin Dashboard** : [app/(private)/admin/page.tsx](../app/(private)/admin/page.tsx)
   - `grid w-full grid-cols-4`

---

## ✅ Checklist de Migration Dialog → Sheet

Pour convertir un Dialog existant en Sheet :

- [ ] Remplacer imports `Dialog` par `Sheet`
- [ ] Changer `<Dialog>` → `<Sheet>`
- [ ] Changer `<DialogContent>` → `<SheetContent className="w-full sm:max-w-xl overflow-y-auto">`
- [ ] Changer `<DialogHeader>` → `<SheetHeader>`
- [ ] Changer `<DialogTitle>` → `<SheetTitle>`
- [ ] Changer `<DialogDescription>` → `<SheetDescription>`
- [ ] Supprimer `<DialogFooter>` et repositionner boutons en bas du contenu
- [ ] Ajouter `space-y-6 py-6` au conteneur principal
- [ ] Ajouter bordure supérieure aux boutons : `pt-6 border-t`
- [ ] Tester sur mobile et desktop
- [ ] Vérifier le scroll du contenu

---

## 🎨 Thème et Couleurs

### Couleur de Marque

```tsx
// Bronze principal
#CD7F32

// Bronze hover
#B86F28

// Utilisation
className="bg-[#CD7F32] hover:bg-[#B86F28] text-white"
className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white"
```

### Variants de Boutons

```tsx
variant="default"     // Bleu par défaut
variant="destructive" // Rouge pour suppression
variant="outline"     // Bordure uniquement
variant="ghost"       // Transparent, hover subtil
variant="secondary"   // Gris
```

---

## 📱 Responsive Breakpoints

```tsx
// Tailwind breakpoints
sm: 640px   // Petit desktop
md: 768px   // Tablette → **breakpoint principal pour tables**
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Très large desktop

// Utilisation
className="hidden md:block"       // Desktop only
className="md:hidden"             // Mobile only
className="w-full sm:max-w-xl"    // Responsive width
className="grid-cols-1 md:grid-cols-2"  // 1 col mobile, 2 desktop
```

---

## 🚀 Bonnes Pratiques

### DO ✅

- Utiliser Sheet pour tous les formulaires
- TabsList en pleine largeur
- Toujours inclure `overflow-y-auto` sur SheetContent
- Confirmations avec AlertDialog
- Feedback utilisateur avec toast
- Loading states avec `<Loader2 className="animate-spin" />`
- Icônes de Lucide React
- Accessibilité : `aria-label`, `title`, labels explicites

### DON'T ❌

- Ne pas utiliser Dialog pour formulaires
- Ne pas utiliser TabsList sans `grid w-full`
- Ne pas oublier le responsive (desktop + mobile)
- Ne pas supprimer sans confirmation
- Ne pas oublier les états de chargement
- Ne pas utiliser des couleurs custom sans raison
- Ne pas oublier la validation des formulaires

---

## 📞 Questions Fréquentes

**Q : Quand utiliser Dialog au lieu de Sheet ?**  
R : Uniquement pour les confirmations simples (suppression, alerte) nécessitant 2-3 boutons maximum.

**Q : Quelle largeur pour un Sheet ?**  
R : `sm:max-w-xl` (576px) par défaut, `sm:max-w-2xl` (672px) si plus de contenu.

**Q : Comment gérer les longs formulaires ?**  
R : Sheet avec `overflow-y-auto` permet le scroll infini. Diviser en sections avec `space-y-6`.

**Q : TabsList avec 6+ onglets ?**  
R : Éviter. Privilégier une navigation secondaire ou un dropdown menu.

**Q : Comment tester le responsive ?**  
R : DevTools → Toggle device toolbar → Tester mobile (375px) et desktop (1280px).

---

**Note :** Ce document doit être consulté avant toute création/modification de composant admin.
