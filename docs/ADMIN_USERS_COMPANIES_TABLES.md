# Tableaux Users et Companies - Admin Dashboard

> **Dernière mise à jour :** 5 janvier 2026  
> **Auteur :** Système  
> **Objectif :** Documentation des tableaux de gestion des utilisateurs et entreprises

---

## 📋 Vue d'ensemble

Les tableaux **Users** et **Companies** ont été modernisés pour offrir une meilleure expérience utilisateur avec des fonctionnalités avancées de tri, filtrage et édition.

**URLs** :
- `/admin/users` - Gestion des utilisateurs
- Intégré dans `/admin/users` via onglets - Gestion des entreprises

**Fichiers** :
- `components/admin/users-table.tsx` - Tableau des utilisateurs
- `components/admin/companies-table.tsx` - Tableau des entreprises
- `components/admin/user-edit-sheet.tsx` - Panneau d'édition utilisateur
- `components/admin/company-edit-sheet.tsx` - Panneau d'édition entreprise

---

## 🎯 Fonctionnalités Principales

### 1. Structure des Colonnes

#### Tableau Users

| Colonne | Type | Tri | Description |
|---------|------|-----|-------------|
| ☑️ | Checkbox | - | Sélection multiple |
| **ID** | UUID | ✅ | Identifiant unique (8 premiers caractères) |
| **Name** | Texte | ✅ | Prénom + Nom avec avatar |
| **Username** | Texte | ✅ | Nom d'utilisateur (optionnel) |
| **Email** | Email | ✅ | Adresse email |
| **Company** | Relation | ✅ | Entreprise liée |
| **Role** | Badge | ✅ | Rôle (reader, writer, admin, super_admin) |
| **Status** | Switch | - | Active/Inactive |
| **Created** | Date | ✅ | Date et heure de création |
| **Updated** | Date | ✅ | Date et heure de dernière modification |
| **Actions** | Icônes | - | Éditer, Supprimer |

#### Tableau Companies

| Colonne | Type | Tri | Description |
|---------|------|-----|-------------|
| ☑️ | Checkbox | - | Sélection multiple |
| **ID** | UUID | ✅ | Identifiant unique (8 premiers caractères) |
| **Company** | Texte | ✅ | Nom de l'entreprise avec SIRET |
| **Email** | Email | ✅ | Adresse email de contact |
| **Location** | Texte | ✅ | Ville et code postal |
| **Users** | Compteur | ✅ | Nombre d'utilisateurs (cliquable) |
| **Status** | Badge | - | Active/Inactive |
| **Created** | Date | ✅ | Date et heure de création |
| **Updated** | Date | ✅ | Date et heure de dernière modification |
| **Actions** | Icônes | - | Éditer, Voir utilisateurs, Supprimer |

---

## 🔄 Système de Tri

### Tri Multi-colonnes

**Implémentation** :
```tsx
const [sortField, setSortField] = useState<"id" | "name" | "email" | ... | null>(null)
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
```

**Comportement** :
1. **Premier clic** : Tri croissant (↑)
2. **Deuxième clic** : Tri décroissant (↓)
3. **Troisième clic** : Retour à l'ordre par défaut

**Indicateurs visuels** :
- Flèche **↑** : Tri croissant actif
- Flèche **↓** : Tri décroissant actif
- Pas de flèche : Colonne non triée

### Colonnes triables

#### Users Table
- **ID** : Tri alphabétique UUID
- **Name** : Tri par nom complet (firstName + lastName)
- **Username** : Tri alphabétique
- **Email** : Tri alphabétique
- **Company** : Tri par nom d'entreprise
- **Role** : Tri par nom de rôle
- **Created** : Tri chronologique
- **Updated** : Tri chronologique

#### Companies Table
- **ID** : Tri alphabétique UUID
- **Name** : Tri alphabétique
- **Email** : Tri alphabétique
- **City** : Tri alphabétique
- **Users** : Tri par nombre d'utilisateurs
- **Created** : Tri chronologique
- **Updated** : Tri chronologique

---

## 🎨 Design & UX

### Affichage des Dates

**Format standardisé** :
```tsx
<TableCell className="text-xs text-muted-foreground">
  <div>{new Date(item.createdAt).toLocaleDateString()}</div>
  <div className="text-[10px]">{new Date(item.createdAt).toLocaleTimeString()}</div>
</TableCell>
```

**Exemple** :
```
05/01/2026
14:23:45
```

### Affichage des IDs

**Format tronqué** :
```tsx
<TableCell className="font-mono text-xs text-muted-foreground">
  {user.id.substring(0, 8)}...
</TableCell>
```

**Exemple** :
```
a7b3c4d5...
```

**Raison** : Les UUIDs complets (36 caractères) sont trop longs pour l'affichage en tableau

### Actions Directes

**❌ Avant** : Menu dropdown avec `<MoreHorizontal>`
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreHorizontal />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**✅ Après** : Icônes directes
```tsx
<div className="flex items-center justify-end gap-1">
  <Button variant="ghost" size="icon" onClick={handleEdit}>
    <Pencil className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="icon" onClick={handleDelete}>
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

**Avantages** :
- ⚡ Accès immédiat (1 clic au lieu de 2)
- 👁️ Visibilité des actions disponibles
- 🎯 Ergonomie améliorée
- 📱 Meilleur sur mobile (cibles plus grandes)

---

## 📱 Panneaux d'Édition (Sheets)

### UserEditSheet

**Fichier** : `components/admin/user-edit-sheet.tsx`

**Fonctionnalités** :
1. **Upload d'image de profil**
   - Preview de l'image actuelle
   - Upload via bouton
   - Suppression de l'image
   - Format Avatar circulaire

2. **Métadonnées visibles**
   ```tsx
   <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
     <div>
       <p className="text-xs text-muted-foreground">Created</p>
       <p className="text-sm font-medium">{date}</p>
       <p className="text-xs text-muted-foreground">{time}</p>
     </div>
     <div>
       <p className="text-xs text-muted-foreground">Last Updated</p>
       <p className="text-sm font-medium">{date}</p>
       <p className="text-xs text-muted-foreground">{time}</p>
     </div>
   </div>
   ```

3. **Recherche d'entreprise**
   - Combobox avec recherche
   - Affichage nom + email
   - Option "No Company (Platform Admin)"
   ```tsx
   <Popover>
     <PopoverTrigger asChild>
       <Button variant="outline" role="combobox">
         {selectedCompany === "none" 
           ? "No Company (Platform Admin)"
           : companies.find(c => c.id === selectedCompany)?.name}
         <ChevronsUpDown className="ml-2 h-4 w-4" />
       </Button>
     </PopoverTrigger>
     <PopoverContent>
       <Command>
         <CommandInput placeholder="Search company..." />
         <CommandGroup>
           {/* Liste des entreprises */}
         </CommandGroup>
       </Command>
     </PopoverContent>
   </Popover>
   ```

4. **Formulaire complet**
   - Username (optionnel)
   - First Name + Last Name
   - Email + Phone
   - Company (recherche)
   - Role (select)
   - Position
   - Adresse complète (Address, City, Postal Code, Country)

### CompanyEditSheet

**Fichier** : `components/admin/company-edit-sheet.tsx`

**Fonctionnalités** :
1. **Icône d'entreprise**
   ```tsx
   <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
     <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 bg-background">
       <Building2 className="h-8 w-8 text-muted-foreground" />
     </div>
     <div>
       <p className="font-semibold">{company.name}</p>
       <p className="text-sm text-muted-foreground">{company.email}</p>
     </div>
   </div>
   ```

2. **Métadonnées visibles**
   - Date de création
   - Date de dernière modification
   - Format identique à UserEditSheet

3. **Formulaire complet**
   - Company Name + Email
   - Phone + SIRET
   - VAT Number
   - Adresse complète (Address, City, Zip Code)

### Design Cohérent

**Boutons d'action** :
```tsx
<div className="flex gap-3 pt-4 border-t">
  <Button
    type="button"
    variant="outline"
    onClick={() => onOpenChange(false)}
    className="flex-1"
  >
    Cancel
  </Button>
  <Button
    type="submit"
    disabled={isLoading}
    className="flex-1 bg-[#CD7F32] hover:bg-[#B86F28]"
  >
    {isLoading ? "Saving..." : "Save Changes"}
  </Button>
</div>
```

**Couleur bronze** : `#CD7F32` (cohérent avec le thème admin)

---

## 🔍 Filtres et Recherche

### Barre de recherche

**Users Table** :
```tsx
const filteredUsers = users.filter((user) => {
  const matchesSearch =
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())

  return matchesSearch && matchesStatus
})
```

**Companies Table** :
```tsx
const filteredCompanies = companies.filter((company) => {
  const matchesSearch =
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.siret?.toLowerCase().includes(searchQuery.toLowerCase())

  return matchesSearch && matchesStatus
})
```

### Filtre de statut

**Dropdown** :
```tsx
<Select value={statusFilter} onValueChange={setStatusFilter}>
  <SelectTrigger className="w-32">
    <SelectValue placeholder="Status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Status</SelectItem>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="inactive">Inactive</SelectItem>
  </SelectContent>
</Select>
```

**Logique** :
```tsx
const matchesStatus =
  statusFilter === "all" ||
  (statusFilter === "active" && item.isActive) ||
  (statusFilter === "inactive" && !item.isActive)
```

---

## ✅ Actions Groupées (Bulk Actions)

### Sélection Multiple

**Checkbox dans header** :
```tsx
<Checkbox
  checked={selectedItems.length === sortedItems.length && sortedItems.length > 0}
  onCheckedChange={handleSelectAll}
/>
```

**Checkbox par ligne** :
```tsx
<Checkbox
  checked={selectedItems.includes(item.id)}
  onCheckedChange={(checked) => handleSelectItem(item.id, checked)}
/>
```

### Actions disponibles

**Users** :
- ✅ Activate (activer plusieurs utilisateurs)
- ❌ Revoke (révoquer plusieurs utilisateurs)

**Companies** :
- ✅ Activate (activer plusieurs entreprises + tous leurs utilisateurs)
- ❌ Revoke (révoquer plusieurs entreprises + tous leurs utilisateurs)

**Confirmation** :
```tsx
if (!confirm(`Are you sure you want to ${action} ${selectedItems.length} item(s)?`)) return
```

---

## 📤 Import / Export

### Export CSV

**Fonctionnalités** :
- Export de tous les items OU seulement les sélectionnés
- Génération de fichier CSV avec toutes les colonnes
- Nom de fichier : `users_export.csv` ou `companies_export_YYYY-MM-DD.csv`

**Code** :
```tsx
const handleExportCSV = () => {
  const itemsToExport = selectedItems.length > 0 
    ? items.filter(i => selectedItems.includes(i.id))
    : items

  const headers = ["ID", "Name", "Email", ...]
  const rows = itemsToExport.map(item => [
    item.id,
    item.name,
    item.email,
    ...
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "export.csv"
  link.click()
}
```

### Import CSV

**Format attendu - Users** :
```csv
username,firstName,lastName,email,password,companyId,role
john_doe,John,Doe,john@example.com,Password123,company-uuid-here,reader
```

**Format attendu - Companies** :
```csv
name,email,phone,address,city,zipCode,siret,vatNumber
Acme Corp,contact@acme.com,0123456789,1 rue de Paris,Paris,75001,12345678900010,FR12345678901
```

**Gestion des erreurs** :
- Compteur d'imports réussis
- Compteur d'erreurs
- Toast de confirmation avec résumé

---

## 📱 Responsivité

### Version Desktop

**TableHeader avec tri** :
```tsx
<TableHead>
  <Button
    variant="ghost"
    size="sm"
    className="h-8 px-2 -ml-2"
    onClick={() => handleSort("name")}
  >
    Name
    {sortField === "name" && (
      <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
    )}
  </Button>
</TableHead>
```

### Version Mobile (Cards)

**Layout** :
```tsx
<div className="md:hidden space-y-3">
  {sortedItems.map((item) => (
    <div key={item.id} className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header avec checkbox + avatar + nom */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Checkbox ... />
          <Avatar ... />
          <div>
            <p className="font-medium text-sm">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.email}</p>
          </div>
        </div>
      </div>
      
      {/* Grille d'infos */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Username:</span>
          <p className="font-medium">{item.username}</p>
        </div>
        {/* ... */}
      </div>
      
      {/* Boutons d'actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" className="flex-1">
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-red-600">
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  ))}
</div>
```

**Breakpoints** :
- `hidden md:block` : Tableau (masqué sur mobile)
- `md:hidden` : Cards (masquées sur desktop)
- Breakpoint : `768px` (md)

---

## 🔐 Permissions

### Protection des actions

**Suppression désactivée pour soi-même** :
```tsx
<Button
  onClick={handleDelete}
  disabled={user.id === currentUserId}
  title={user.id === currentUserId ? "Cannot delete yourself" : "Delete user"}
>
  <Trash2 />
</Button>
```

**Entreprises avec utilisateurs** :
```tsx
const handleDeleteCompany = async (companyId: string) => {
  const company = companies.find(c => c.id === companyId)
  if (company && company.users.length > 0) {
    toast.error(`Cannot delete company with ${company.users.length} user(s). 
                 Reassign or delete users first.`)
    return
  }
  // Procéder à la suppression
}
```

---

## 🎯 Bonnes Pratiques

### 1. Gestion du State

**Use sortedItems, pas filteredItems** :
```tsx
// ❌ Mauvais
{filteredItems.map(item => ...)}

// ✅ Bon
{sortedItems.map(item => ...)}
```

**Raison** : `sortedItems` contient déjà le filtrage ET le tri

### 2. Performance

**Éviter les re-renders inutiles** :
```tsx
const sortedItems = useMemo(() => {
  return [...filteredItems].sort((a, b) => {
    // Logique de tri
  })
}, [filteredItems, sortField, sortOrder])
```

### 3. Accessibilité

**Titres sur les boutons** :
```tsx
<Button title="Edit user">
  <Pencil />
</Button>
```

**Screen readers** :
```tsx
<span className="sr-only">Open menu</span>
```

### 4. Feedback Utilisateur

**Toast notifications** :
```tsx
import { toast } from "sonner"

toast.success("User updated successfully")
toast.error("Failed to update user")
```

**Loading states** :
```tsx
<Button disabled={isLoading}>
  {isLoading ? "Saving..." : "Save Changes"}
</Button>
```

---

## 📊 Métriques Affichées

### Users Table
- Total d'utilisateurs filtrés
- Nombre d'utilisateurs sélectionnés
- Invitations en attente (affichées dans le tableau)

### Companies Table
- Total d'entreprises filtrées
- Nombre d'entreprises sélectionnées
- Nombre d'utilisateurs par entreprise (cliquable)

---

## 🔗 Liens et Navigation

### Users → Company

**Cliquer sur le nom d'entreprise** :
```tsx
<Button
  variant="link"
  className="p-0 h-auto"
  onClick={() => setEditingCompany(user.company)}
>
  {user.company.name}
</Button>
```
→ Ouvre le panneau d'édition de l'entreprise

### Companies → Users

**Cliquer sur le compteur d'utilisateurs** :
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => setViewingUsers(company)}
>
  <Users className="mr-1 h-3 w-3" />
  {company.users.length} user(s)
</Button>
```
→ Ouvre un Dialog listant tous les utilisateurs de l'entreprise

---

## 🚀 Améliorations Futures

### Fonctionnalités Potentielles

1. **Export Excel/PDF** (en plus du CSV)
2. **Filtres avancés** (par rôle, par date de création, etc.)
3. **Sauvegarde des préférences de tri**
4. **Colonnes personnalisables** (masquer/afficher des colonnes)
5. **Pagination** (pour très grandes listes)
6. **Recherche en temps réel** (debounced)
7. **Actions groupées étendues** (changement de rôle, transfert d'entreprise)
8. **Historique des modifications**
9. **Drag & drop pour réorganisation**
10. **Mode sombre optimisé**

### Optimisations Techniques

1. **Virtual scrolling** pour grandes listes (>1000 items)
2. **Lazy loading** des images de profil
3. **Mise en cache** des résultats de recherche
4. **Debounce** sur la recherche (300ms)
5. **Optimistic updates** pour les actions

---

## 📝 Changelog

### Version 1.0 - 5 janvier 2026

**✨ Nouvelles fonctionnalités** :
- ✅ Colonne ID avec UUID tronqué
- ✅ Colonnes Created et Updated avec dates complètes
- ✅ Tri croissant/décroissant sur toutes les colonnes
- ✅ Actions directes (icônes au lieu de dropdown)
- ✅ Panneaux latéraux (Sheet) pour l'édition
- ✅ Upload d'image de profil (Users)
- ✅ Recherche d'entreprise avec Combobox (Users)
- ✅ Métadonnées visibles dans les panneaux
- ✅ Design cohérent bronze (#CD7F32)

**🔧 Améliorations** :
- Performance du tri optimisée
- Meilleure expérience mobile
- Feedback utilisateur amélioré
- Accessibilité renforcée

**🐛 Corrections** :
- N/A (nouveau système)

---

## 🤝 Contribution

Pour modifier ces tableaux :

1. **Users Table** : Éditer `components/admin/users-table.tsx`
2. **Companies Table** : Éditer `components/admin/companies-table.tsx`
3. **User Sheet** : Éditer `components/admin/user-edit-sheet.tsx`
4. **Company Sheet** : Éditer `components/admin/company-edit-sheet.tsx`

**Tester les modifications** :
```bash
npm run dev
# Naviguer vers /admin/users
```

**Standards de code** :
- TypeScript strict
- Composants fonctionnels avec hooks
- Tailwind CSS pour le styling
- Shadcn/ui pour les composants

---

## 📚 Ressources

- [Shadcn/ui Table](https://ui.shadcn.com/docs/components/table)
- [Shadcn/ui Sheet](https://ui.shadcn.com/docs/components/sheet)
- [Shadcn/ui Command](https://ui.shadcn.com/docs/components/command)
- [React Hook Form](https://react-hook-form.com/)
- [Sonner Toasts](https://sonner.emilkowal.ski/)
