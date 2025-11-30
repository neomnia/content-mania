# 🔐 Système de Rôles et Permissions

## 📋 Vue d'Ensemble

Ce document décrit le système complet d'authentification et d'autorisation avec **2 types d'utilisateurs distincts** et un système de **rôles/permissions flexible**.

## 👥 Types d'Utilisateurs

### 1️⃣ Admins Backend (SaaS Platform Administrators)

**Table** : `saas_admins`

**Description** : Administrateurs de la plateforme SaaS qui gèrent la configuration globale de l'application.

**Accès** :
- Backend d'administration
- Configuration globale
- Gestion des entreprises clientes

**Champs** :
\`\`\`typescript
{
  id: UUID
  email: string (unique)
  password: string (hashed)
  firstName: string
  lastName: string
  createdAt: timestamp
  updatedAt: timestamp
}
\`\`\`

**Exemple d'utilisation** :
- Gérer les paramètres de l'application
- Voir toutes les entreprises clientes
- Support technique

---

### 2️⃣ Users Frontend (SaaS Customers)

**Table** : `users`

**Description** : Utilisateurs des entreprises clientes qui utilisent l'application SaaS.

**Accès** :
- Frontend de l'application
- Données de leur entreprise uniquement
- Fonctionnalités selon leurs permissions

**Champs** :
\`\`\`typescript
{
  id: UUID
  email: string (unique)
  password: string (hashed)
  firstName: string
  lastName: string
  companyId: UUID (FK → companies)
  isOwner: boolean  // Le créateur du compte entreprise
  isActive: boolean // Peut être désactivé
  createdAt: timestamp
  updatedAt: timestamp
}
\`\`\`

---

## 🏢 Structure des Entreprises

**Table** : `companies`

Chaque entreprise cliente a :
- Un **owner** (le créateur du compte)
- Plusieurs **users** (invités par l'owner ou d'autres admins)
- Des **rôles** assignés à chaque user

\`\`\`typescript
{
  id: UUID
  name: string
  email: string (unique)
  createdAt: timestamp
  updatedAt: timestamp
}
\`\`\`

---

## 🎭 Système de Rôles

**Table** : `roles`

### Rôles Prédéfinis

| Rôle | Description | Cas d'usage |
|------|-------------|-------------|
| **owner** | Propriétaire avec accès complet | Créateur du compte entreprise |
| **editor** | Peut lire et modifier | Collaborateurs actifs |
| **viewer** | Lecture seule | Consultants, observateurs |

\`\`\`typescript
{
  id: UUID
  name: string (unique)
  description: string
  createdAt: timestamp
}
\`\`\`

---

## 🔑 Système de Permissions

**Table** : `permissions`

### Permissions Disponibles

| Permission | Description | Actions |
|------------|-------------|---------|
| **read** | Voir les données | Accès en lecture aux analytics, documents, etc. |
| **write** | Créer/Modifier | Créer et modifier des données |
| **invite** | Inviter des utilisateurs | Inviter de nouveaux membres dans l'entreprise |
| **manage_users** | Gérer les utilisateurs | Désactiver, changer les rôles, supprimer |

\`\`\`typescript
{
  id: UUID
  name: string (unique)
  description: string
  createdAt: timestamp
}
\`\`\`

---

## 🔗 Associations

### User Roles (Many-to-Many)

**Table** : `user_roles`

Un utilisateur peut avoir **plusieurs rôles** :

\`\`\`typescript
{
  userId: UUID (FK → users)
  roleId: UUID (FK → roles)
  assignedAt: timestamp
  PRIMARY KEY (userId, roleId)
}
\`\`\`

**Exemple** : Un user peut être à la fois `editor` et avoir des permissions d'`invite`.

---

### Role Permissions (Many-to-Many)

**Table** : `role_permissions`

Définit quelles permissions chaque rôle possède :

\`\`\`typescript
{
  roleId: UUID (FK → roles)
  permissionId: UUID (FK → permissions)
  createdAt: timestamp
  PRIMARY KEY (roleId, permissionId)
}
\`\`\`

### Configuration Par Défaut

| Rôle | read | write | invite | manage_users |
|------|------|-------|--------|--------------|
| **owner** | ✅ | ✅ | ✅ | ✅ |
| **editor** | ✅ | ✅ | ❌ | ❌ |
| **viewer** | ✅ | ❌ | ❌ | ❌ |

---

## 🎯 Cas d'Usage

### Scénario 1 : Création d'un Compte Entreprise

\`\`\`typescript
// 1. User crée un compte
POST /api/auth/register
{
  "email": "john@company.com",
  "password": "secure123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "My Company",
  "companyEmail": "contact@company.com"
}

// Résultat :
// - Company créée
// - User créé avec isOwner = true
// - Rôle "owner" assigné automatiquement
// - User a toutes les permissions
\`\`\`

### Scénario 2 : Invitation d'un Collaborateur

\`\`\`typescript
// Owner invite un editor
POST /api/users/invite
{
  "email": "jane@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "editor"  // ou "viewer"
}

// Résultat :
// - Invitation email envoyée
// - User créé avec isOwner = false
// - Rôle "editor" assigné
// - User a permissions read + write
\`\`\`

### Scénario 3 : Vérification des Permissions

\`\`\`typescript
// Middleware de vérification
async function requirePermission(permission: 'read' | 'write' | 'invite' | 'manage_users') {
  const user = await getCurrentUser();

  // Récupérer les permissions du user via ses rôles
  const userPermissions = await db
    .select({ name: permissions.name })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, user.id));

  const hasPermission = userPermissions.some(p => p.name === permission);

  if (!hasPermission) {
    throw new Error('Permission denied');
  }
}
\`\`\`

### Scénario 4 : Changement de Rôle

\`\`\`typescript
// Owner change le rôle d'un user
POST /api/users/:userId/role
{
  "role": "viewer"  // Dégrade de editor à viewer
}

// Vérifications :
// 1. User authentifié a permission "manage_users"
// 2. Target user appartient à la même company
// 3. On ne peut pas dégrader l'owner
\`\`\`

---

## 🗄️ Schéma de Base de Données Complet

\`\`\`mermaid
erDiagram
    SAAS_ADMINS {
        uuid id PK
        text email UK
        text password
        text first_name
        text last_name
        timestamp created_at
        timestamp updated_at
    }

    COMPANIES {
        uuid id PK
        text name
        text email UK
        timestamp created_at
        timestamp updated_at
    }

    USERS {
        uuid id PK
        text email UK
        text password
        text first_name
        text last_name
        uuid company_id FK
        boolean is_owner
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ROLES {
        uuid id PK
        text name UK
        text description
        timestamp created_at
    }

    PERMISSIONS {
        uuid id PK
        text name UK
        text description
        timestamp created_at
    }

    USER_ROLES {
        uuid user_id FK
        uuid role_id FK
        timestamp assigned_at
    }

    ROLE_PERMISSIONS {
        uuid role_id FK
        uuid permission_id FK
        timestamp created_at
    }

    COMPANIES ||--o{ USERS : "has many"
    USERS ||--o{ USER_ROLES : "has many"
    ROLES ||--o{ USER_ROLES : "assigned to"
    ROLES ||--o{ ROLE_PERMISSIONS : "has many"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "granted to"
\`\`\`

---

## 🚀 Déploiement Automatique

### Lors du Build Vercel

Le script `db/push-schema.ts` :

1. ✅ Nettoie l'ancien schéma (si existe)
2. ✅ Crée les 7 tables
3. ✅ Crée tous les index de performance
4. ✅ Insère les 3 rôles par défaut (owner, editor, viewer)
5. ✅ Insère les 4 permissions par défaut (read, write, invite, manage_users)
6. ✅ Associe automatiquement les permissions aux rôles

### Vérification

\`\`\`bash
# Après déploiement, vérifiez :
curl https://[preview-url]/api/health

# Vous devriez voir :
{
  "tables": {
    "exist": true,
    "found": [
      "saas_admins",
      "companies",
      "users",
      "roles",
      "permissions",
      "user_roles",
      "role_permissions"
    ]
  }
}
\`\`\`

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Mots de passe** : Toujours hashés avec bcrypt (10 rounds)
2. **Tokens JWT** : Expiration 7 jours, stockés en HTTP-only cookies
3. **Validation** : Toujours vérifier que user appartient à la bonne company
4. **Isolation** : Un user ne peut jamais voir les données d'une autre company
5. **Cascade Delete** : Si company supprimée → tous ses users sont supprimés

### Middleware de Protection

\`\`\`typescript
// Vérifier que le user a une permission
export async function requirePermission(permission: string) {
  const user = await getCurrentUser();
  const hasPermission = await checkUserPermission(user.id, permission);
  if (!hasPermission) throw new Error('Permission denied');
}

// Vérifier que le user appartient à la company
export async function requireSameCompany(targetUserId: string) {
  const currentUser = await getCurrentUser();
  const targetUser = await getUserById(targetUserId);
  if (currentUser.companyId !== targetUser.companyId) {
    throw new Error('Access denied - different company');
  }
}
\`\`\`

---

## 📊 Requêtes Utiles

### Obtenir les Permissions d'un User

\`\`\`typescript
const userPermissions = await db
  .select({
    permission: permissions.name,
    description: permissions.description
  })
  .from(userRoles)
  .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
  .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
  .where(eq(userRoles.userId, userId));
\`\`\`

### Obtenir Tous les Users d'une Company

\`\`\`typescript
const companyUsers = await db
  .select({
    id: users.id,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    isOwner: users.isOwner,
    isActive: users.isActive,
    roles: sql<string[]>`array_agg(DISTINCT ${roles.name})`
  })
  .from(users)
  .leftJoin(userRoles, eq(users.id, userRoles.userId))
  .leftJoin(roles, eq(userRoles.roleId, roles.id))
  .where(eq(users.companyId, companyId))
  .groupBy(users.id);
\`\`\`

### Vérifier une Permission Spécifique

\`\`\`typescript
async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(permissions.name, permissionName)
      )
    );

  return result[0].count > 0;
}
\`\`\`

---

## 🔄 Migration depuis l'Ancien Schéma

Si vous aviez l'ancien schéma avec `role` enum et `isSaasAdmin` :

### Données à Migrer

\`\`\`typescript
// Ancien user avec isSaasAdmin = true
// → Créer un saas_admin

// Ancien user avec role = 'admin'
// → User avec rôle 'owner'

// Ancien user avec role = 'finance'
// → User avec rôle 'viewer' ou 'editor'
\`\`\`

Le script `db/push-schema.ts` supprime automatiquement l'ancien enum `role` pour éviter les conflits.

---

## 📝 TODO : Routes API à Créer

### Routes Nécessaires

- [ ] `POST /api/auth/register` - Inscription (créer company + owner)
- [ ] `POST /api/auth/login` - Connexion (users OU saas_admins)
- [ ] `POST /api/auth/logout` - Déconnexion
- [ ] `GET /api/auth/me` - Infos user + permissions
- [ ] `POST /api/users/invite` - Inviter un user (require: invite)
- [ ] `GET /api/users` - Liste users de la company (require: read)
- [ ] `PATCH /api/users/:id/role` - Changer rôle (require: manage_users)
- [ ] `PATCH /api/users/:id/activate` - Activer/Désactiver (require: manage_users)
- [ ] `DELETE /api/users/:id` - Supprimer user (require: manage_users)

### Routes Admin Backend

- [ ] `POST /api/admin/login` - Connexion saas_admin
- [ ] `GET /api/admin/companies` - Liste toutes les companies
- [ ] `GET /api/admin/companies/:id` - Détails d'une company
- [ ] `GET /api/admin/stats` - Statistiques globales

---

## ✅ Avantages du Système

1. **Flexibilité** : Ajoutez facilement de nouveaux rôles ou permissions
2. **Granularité** : Permissions fines (read, write, invite, manage_users)
3. **Évolutivité** : Un user peut avoir plusieurs rôles
4. **Isolation** : Séparation claire backend admins / frontend users
5. **Multi-tenant** : Isolation complète entre companies
6. **Sécurité** : Vérification à chaque requête via middleware

---

## 🎓 Ressources

- [Drizzle ORM Relations](https://orm.drizzle.team/docs/rls)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)
- [JWT Security](https://jwt.io/introduction)

---

**Dernière mise à jour** : 2025-11-24
