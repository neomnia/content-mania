# 🚀 Configuration Vercel & Déploiement

Ce guide détaille la configuration nécessaire pour déployer l'application sur Vercel.

## 1. Variables d'Environnement

Pour que l'application fonctionne correctement, vous devez configurer les variables suivantes dans les paramètres de votre projet Vercel (**Settings** > **Environment Variables**).

### Variables Obligatoires

| Variable | Description | Environnements |
|----------|-------------|----------------|
| `DATABASE_URL` | URL de connexion PostgreSQL (Neon DB). Doit inclure `?sslmode=require`. | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Clé de chiffrement pour l'authentification. **Doit faire au moins 32 caractères.** | Production, Preview, Development |
| `NEXTAUTH_URL` | URL canonique de l'application (ex: `https://votre-projet.vercel.app`). | Production |

### Variables Optionnelles

| Variable | Description | Environnements |
|----------|-------------|----------------|
| `ADMIN_SECRET_KEY` | Clé secrète pour les opérations d'administration. | Production, Preview, Development |
| `CRON_SECRET` | Pour sécuriser les routes API appelées par des Cron Jobs. | Production, Preview |

---

## 2. Initialisation de la Base de Données

Le processus de déploiement a été automatisé pour gérer la base de données.

### Script de Build Personnalisé
Le fichier `package.json` utilise un script de build personnalisé :
```json
"build": "bash scripts/build-with-db.sh"
```

Ce script effectue automatiquement les actions suivantes lors du déploiement sur Vercel :
1. **Synchronisation du Schéma** (`pnpm db:push`) : Met à jour la structure de la base de données.
2. **Initialisation des Templates** (`pnpm seed:email-templates`) : Crée ou met à jour les modèles d'emails.
3. **Initialisation des Permissions** (`pnpm seed:pages`) : Configure les permissions par défaut des pages (ACL).
4. **Compilation** (`next build`) : Construit l'application Next.js.

### ⚠️ Important
Pour que ce processus fonctionne, la variable `DATABASE_URL` **doit être définie** dans l'environnement Vercel. Si elle est absente, la synchronisation sera ignorée.

---

## 3. Dépannage (Troubleshooting)

### Erreur : `NEXTAUTH_SECRET` trop court
```
Error: NEXTAUTH_SECRET doit faire au moins 32 caractères
```
**Solution :** Générez une nouvelle clé plus longue.
```bash
openssl rand -base64 32
```
Mettez à jour la variable dans Vercel et redéployez.

### Erreur : `DATABASE_URL environment variable is not set`
**Solution :** Vérifiez que vous avez bien ajouté `DATABASE_URL` dans les variables d'environnement Vercel et coché les cases pour **Production** et **Preview**.

### Les tables n'existent pas après le déploiement
**Cause :** Le script de synchronisation a peut-être échoué ou a été ignoré.
**Solution :**
1. Vérifiez les logs de build dans Vercel.
2. Assurez-vous que `DATABASE_URL` est correcte.
3. Vous pouvez forcer une synchronisation locale avec `pnpm db:push` si vous avez accès à la base de production depuis votre machine.

### Problèmes de Cache
Si des modifications de configuration ne semblent pas prises en compte :
1. Allez dans **Settings** > **Data Cache**.
2. Cliquez sur **Purge Everything**.
3. Redéployez l'application.

---

## 4. Sécurité

- **Ne jamais commiter `.env.local`**.
- Utilisez des secrets différents pour **Development**, **Preview** et **Production**.
- La clé `NEXTAUTH_SECRET` est critique pour la sécurité des sessions.
