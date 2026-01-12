# Configuration Vercel via CLI

## 🚀 Méthode Rapide : Script Automatique

J'ai créé un script qui configure automatiquement toutes les variables d'environnement.

### Prérequis

Vous devez avoir Node.js installé sur votre machine locale.

### Exécution du Script

\`\`\`bash
# 1. Clonez le projet (si pas déjà fait)
git clone https://github.com/content-maniatech/content-mania-website.git
cd content-mania-website

# 2. Checkout la branche
git checkout claude/verify-login-drizzle-01HF1jqGHBTx6NzXTUqr3suS

# 3. Exécutez le script
bash scripts/setup-vercel-env.sh
\`\`\`

Le script va :
- ✅ Vérifier que Vercel CLI est installé
- ✅ Vous connecter à Vercel (si nécessaire)
- ✅ Configurer DATABASE_URL
- ✅ Générer et configurer NEXTAUTH_SECRET
- ✅ Configurer NEXTAUTH_URL
- ✅ Configurer ADMIN_SECRET_KEY

---

## 📝 Méthode Manuelle : Commandes CLI

Si le script ne fonctionne pas, utilisez ces commandes :

### 1. Installer Vercel CLI

\`\`\`bash
npm install -g vercel
# ou
pnpm add -g vercel
\`\`\`

### 2. Se Connecter

\`\`\`bash
vercel login
\`\`\`

Suivez les instructions pour vous connecter avec votre compte Vercel.

### 3. Lier le Projet

\`\`\`bash
cd /path/to/content-mania-website
vercel link
\`\`\`

Sélectionnez votre projet `content-mania-website`.

### 4. Ajouter les Variables

**DATABASE_URL**
\`\`\`bash
vercel env add DATABASE_URL production preview development
\`\`\`
Quand demandé, entrez :
\`\`\`
postgresql://neondb_owner:npg_cRzIrOmJwo38@ep-calm-lab-agkv7stu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
\`\`\`

**NEXTAUTH_SECRET**
\`\`\`bash
# Générer une clé
openssl rand -base64 32

# L'ajouter
vercel env add NEXTAUTH_SECRET production preview development
\`\`\`
Collez la clé générée.

**NEXTAUTH_URL** (Production uniquement)
\`\`\`bash
vercel env add NEXTAUTH_URL production
\`\`\`
Entrez : `https://votre-projet.vercel.app`

**ADMIN_SECRET_KEY**
\`\`\`bash
vercel env add ADMIN_SECRET_KEY production preview development
\`\`\`
Entrez : `change-this-in-production`

### 5. Vérifier

\`\`\`bash
vercel env ls
\`\`\`

Vous devriez voir toutes vos variables listées.

### 6. Redéployer

\`\`\`bash
vercel --prod
\`\`\`

---

## 🔧 Commandes Utiles

### Lister les Variables

\`\`\`bash
vercel env ls
\`\`\`

### Supprimer une Variable

\`\`\`bash
vercel env rm VARIABLE_NAME production
\`\`\`

### Récupérer les Variables Localement

\`\`\`bash
vercel env pull .env.local
\`\`\`

Cela télécharge toutes les variables dans `.env.local` pour le développement local.

### Voir à Qui Vous Êtes Connecté

\`\`\`bash
vercel whoami
\`\`\`

---

## 🌐 Alternative : Interface Web

Si vous préférez l'interface graphique :

1. **Allez sur** [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Sélectionnez** votre projet `content-mania-website`
3. **Cliquez** sur **Settings**
4. **Cliquez** sur **Environment Variables**
5. **Ajoutez** chaque variable avec le bouton "Add New"

### Variables à Ajouter

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_cRzIrOmJwo38@...` | ✅ Production<br>✅ Preview<br>✅ Development |
| `NEXTAUTH_SECRET` | Généré avec `openssl rand -base64 32` | ✅ Production<br>✅ Preview<br>✅ Development |
| `NEXTAUTH_URL` | `https://votre-projet.vercel.app` | ✅ Production |
| `ADMIN_SECRET_KEY` | `change-this-in-production` | ✅ Production<br>✅ Preview<br>✅ Development |

⚠️ **N'oubliez pas de redéployer après !**

---

## 🧪 Vérification

Après configuration et redéploiement, testez :

**1. Variables configurées**
\`\`\`bash
curl https://votre-projet.vercel.app/api/debug/env
\`\`\`

Vous devriez voir :
\`\`\`json
{
  "variables": {
    "DATABASE_URL": { "status": "✅ CONFIGURED" },
    "NEXTAUTH_SECRET": { "status": "✅ CONFIGURED" }
  }
}
\`\`\`

**2. Base de données connectée**
\`\`\`bash
curl https://votre-projet.vercel.app/api/health
\`\`\`

**3. Initialiser la base**
\`\`\`bash
curl -X POST https://votre-projet.vercel.app/api/setup \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "change-this-in-production"}'
\`\`\`

**4. Tester l'inscription**
\`\`\`bash
curl -X POST https://votre-projet.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "admin"
  }'
\`\`\`

---

## 🐛 Dépannage

### "No credentials found"

**Problème** : Pas connecté à Vercel CLI

**Solution** :
\`\`\`bash
vercel login
\`\`\`

### "Project not linked"

**Problème** : Le projet n'est pas lié à votre compte

**Solution** :
\`\`\`bash
vercel link
\`\`\`
Sélectionnez votre projet dans la liste.

### "Command not found: vercel"

**Problème** : Vercel CLI n'est pas installé

**Solution** :
\`\`\`bash
npm install -g vercel
\`\`\`

### Variables non prises en compte

**Problème** : Les variables sont ajoutées mais l'app ne les voit pas

**Solution** : Redéployez !
\`\`\`bash
vercel --prod
\`\`\`

---

## 🔒 Sécurité

### Clés Secrètes

**Ne partagez JAMAIS :**
- ❌ `DATABASE_URL` (contient le mot de passe de la DB)
- ❌ `NEXTAUTH_SECRET` (clé de chiffrement)
- ❌ `ADMIN_SECRET_KEY` (clé d'admin)

**Bonnes Pratiques :**
- ✅ Générez des clés aléatoires avec `openssl rand -base64 32`
- ✅ Utilisez des clés différentes en développement et production
- ✅ Ne commitez jamais les fichiers `.env*` dans Git
- ✅ Changez les clés si elles sont compromises

### Audit des Variables

Listez régulièrement vos variables :
\`\`\`bash
vercel env ls
\`\`\`

Supprimez les variables inutilisées :
\`\`\`bash
vercel env rm OLD_VARIABLE production
\`\`\`

---

## 📋 Checklist Complète

- [ ] Vercel CLI installé (`npm install -g vercel`)
- [ ] Connecté à Vercel (`vercel login`)
- [ ] Projet lié (`vercel link`)
- [ ] `DATABASE_URL` ajoutée (production, preview, development)
- [ ] `NEXTAUTH_SECRET` ajoutée (production, preview, development)
- [ ] `NEXTAUTH_URL` ajoutée (production)
- [ ] `ADMIN_SECRET_KEY` ajoutée (production, preview, development)
- [ ] Variables vérifiées (`vercel env ls`)
- [ ] Projet redéployé (`vercel --prod`)
- [ ] Endpoint de debug testé (`/api/debug/env`)
- [ ] Base de données initialisée (`/api/setup`)
- [ ] Inscription testée (`/auth/register`)

---

## 🎯 Workflow Complet

\`\`\`bash
# 1. Installation et connexion
npm install -g vercel
vercel login

# 2. Lier le projet
cd /path/to/content-mania-website
vercel link

# 3. Ajouter les variables (automatique)
bash scripts/setup-vercel-env.sh

# 4. Vérifier
vercel env ls

# 5. Redéployer
vercel --prod

# 6. Tester
curl https://votre-projet.vercel.app/api/debug/env
curl https://votre-projet.vercel.app/api/health

# 7. Initialiser la base
curl -X POST https://votre-projet.vercel.app/api/setup \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "change-this-in-production"}'

# 8. C'est prêt ! 🎉
\`\`\`

---

## 💡 Astuce Pro

Créez un alias pour faciliter les commandes :

**~/.bashrc ou ~/.zshrc**
\`\`\`bash
alias vc='vercel'
alias vcp='vercel --prod'
alias vce='vercel env'
alias vcel='vercel env ls'
\`\`\`

Puis utilisez :
\`\`\`bash
vce add DATABASE_URL production preview development
vcel
vcp
\`\`\`

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Consultez les logs Vercel : `vercel logs`
2. Testez `/api/debug/env` pour voir les variables
3. Vérifiez que vous êtes connecté : `vercel whoami`
4. Relisez `TROUBLESHOOTING.md`

**Temps estimé : 2-3 minutes** ⏱️
