# NeoSaaS - Configuration de la Base de Données Neon

## 📌 État actuel

### ✅ Configuration Neon installée
- Package `@neondatabase/serverless` v1.0.2 installé
- Fichier `app/actions.ts` créé avec la fonction `getData()`
- Fichier `.env.example` avec template DATABASE_URL

### 🏗️ Architecture des Pages

#### Pages Publiques
- **`app/(public)/page.tsx`** - Page d'accueil NeoSaaS
- **`app/(public)/pricing/page.tsx`** - Pricing
- **`app/(public)/features/page.tsx`** - Features
- **`app/(public)/docs/`** - Documentation

#### Pages Privées (Dashboard)
Les pages suivantes existent et sont prêtes à être connectées à la base de données :

- **`app/dashboard/page.tsx`** - Vue d'ensemble
- **`app/dashboard/users/page.tsx`** - Gestion des utilisateurs
- **`app/dashboard/analytics/page.tsx`** - Analytics
- **`app/dashboard/payments/page.tsx`** - Paiements
- **`app/dashboard/storage/page.tsx`** - Stockage
- **`app/dashboard/email/page.tsx`** - Emails

#### Pages d'Authentification
- **`app/auth/login/page.tsx`** - Connexion
- **`app/auth/register/page.tsx`** - Inscription
- **`app/auth/recover-password/page.tsx`** - Récupération de mot de passe

## 🔌 Comment connecter les pages privées à Neon

### Étape 1 : Configuration de la variable d'environnement

Créez un fichier `.env.local` à la racine :

\`\`\`bash
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
\`\`\`

> **Note** : Obtenez votre DATABASE_URL depuis votre dashboard Neon : https://console.neon.tech

### Étape 2 : Créer votre schéma de base de données

Exemple de schéma pour la table `users` :

\`\`\`sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (name, email, role, status) VALUES
('Emily Johnson', 'emily@example.com', 'Admin', 'Active'),
('Michael Brown', 'michael@example.com', 'User', 'Active'),
('Sarah Wilson', 'sarah@example.com', 'User', 'Inactive');
\`\`\`

### Étape 3 : Modifier `app/actions.ts` selon vos besoins

Exemple pour récupérer les utilisateurs :

\`\`\`typescript
// app/actions.ts
"use server";
import { neon } from "@neondatabase/serverless";

export async function getData() {
    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    return data;
}

export async function getUser(id: number) {
    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`SELECT * FROM users WHERE id = ${id}`;
    return data[0];
}

export async function createUser(name: string, email: string) {
    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`
        INSERT INTO users (name, email)
        VALUES (${name}, ${email})
        RETURNING *
    `;
    return data[0];
}
\`\`\`

### Étape 4 : Utiliser dans les pages dashboard

Exemple pour `app/dashboard/users/page.tsx` :

\`\`\`typescript
import { getData } from "@/app/actions"

export default async function UsersPage() {
  const users = await getData()

  return (
    <div>
      <h1>Users from Neon Database</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
\`\`\`

## 🔒 Authentification

### État actuel
Les pages d'authentification (`/auth/login`, `/auth/register`) existent mais ne sont pas encore fonctionnelles.

### Prochaines étapes pour l'authentification
1. Installer un système d'auth (ex: NextAuth.js, Better Auth, Clerk)
2. Créer une table `users` avec mots de passe hashés
3. Protéger les routes `/dashboard` avec middleware
4. Ajouter la logique de session

## 📊 Résumé

| Élément | État |
|---------|------|
| Connexion Neon | ✅ Configurée |
| Server Actions | ✅ Créées (`app/actions.ts`) |
| Pages Dashboard | ✅ Créées (données en dur pour l'instant) |
| Pages Auth | ✅ Créées (UI seulement) |
| Protection des routes | ⚠️ À implémenter |
| Authentification complète | ⚠️ À implémenter |

## 🚀 Déploiement sur Vercel

N'oubliez pas d'ajouter `DATABASE_URL` dans les variables d'environnement Vercel :
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Ajoutez `DATABASE_URL` avec votre URL Neon

---

**Pour toute question, consultez** :
- [Documentation Neon](https://neon.tech/docs)
- [Documentation Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
