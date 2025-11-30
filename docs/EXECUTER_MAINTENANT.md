# ⚡ EXÉCUTER MAINTENANT - Configuration Vercel Preview

## 🎯 Action Immédiate (30 secondes)

Votre token est déjà configuré dans le script. Exécutez simplement :

\`\`\`bash
# Sur votre machine locale (pas dans le sandbox)
cd /chemin/vers/neosaas-website
bash configure-vercel-preview.sh
\`\`\`

**C'est tout !** Le script va automatiquement :
- ✅ Vérifier votre token Vercel
- ✅ Configurer DATABASE_URL pour Preview
- ✅ Générer et configurer NEXTAUTH_SECRET pour Preview
- ✅ Configurer ADMIN_SECRET_KEY pour Preview

---

## 📋 Que se passe-t-il ensuite ?

### 1. Redéploiement automatique (~2 minutes)
Vercel va détecter les nouvelles variables et redéployer automatiquement votre branche Preview.

### 2. Trouver votre URL Preview
Votre URL Preview se trouve dans :
- **GitHub** : Pull Request → Checks → Vercel → Details
- **Format** : `https://neosaas-website-git-[branch]-[team].vercel.app`

### 3. Vérifier que les variables sont configurées
\`\`\`bash
curl https://[votre-url-preview].vercel.app/api/debug/env
\`\`\`

**Réponse attendue :**
\`\`\`json
{
  "variables": {
    "DATABASE_URL": { "status": "✅ CONFIGURED" },
    "NEXTAUTH_SECRET": { "status": "✅ CONFIGURED" },
    "ADMIN_SECRET_KEY": { "status": "✅ CONFIGURED" }
  }
}
\`\`\`

### 4. Initialiser la base de données
\`\`\`bash
curl -X POST https://[votre-url-preview].vercel.app/api/setup \
  -H "Content-Type: application/json" \
  -d '{"secretKey":"change-this-in-production"}'
\`\`\`

**Réponse attendue :**
\`\`\`json
{
  "status": "success",
  "message": "Database initialized successfully"
}
\`\`\`

### 5. Tester l'inscription
Ouvrez dans votre navigateur :
\`\`\`
https://[votre-url-preview].vercel.app/auth/register
\`\`\`

Remplissez le formulaire et créez un utilisateur admin.

---

## 🐛 Si le script échoue

### Token invalide ou expiré
**Erreur** : `❌ Token invalide ou expiré`

**Solution** : Créez un nouveau token
1. Allez sur https://vercel.com/account/tokens
2. Cliquez sur "Create Token"
3. Name: "Preview Setup"
4. Scope: **Full Account**
5. Expiration: 30 days
6. Copiez le token
7. Remplacez dans le script ligne 9 :
   \`\`\`bash
   VERCEL_TOKEN="votre_nouveau_token"
   \`\`\`

### Projet introuvable
**Erreur** : `❌ Projet introuvable`

**Solution** : Vérifiez le nom du projet
1. Allez sur https://vercel.com/dashboard
2. Notez le nom exact du projet
3. Modifiez ligne 11 du script :
   \`\`\`bash
   PROJECT_NAME="nom_exact_du_projet"
   \`\`\`

---

## 🔧 Alternative : Configuration Manuelle via Web

Si le script ne fonctionne pas, configurez manuellement :

1. **Allez sur** https://vercel.com/team_CcA0AyPtSPVhRijEsDRmyjpa/neosaas-website/settings/environment-variables

2. **Ajoutez ces 3 variables pour Preview** :

| Name | Value | Target |
|------|-------|--------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_cRzIrOmJwo38@ep-calm-lab-agkv7stu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require` | ✅ Preview |
| `NEXTAUTH_SECRET` | Généré avec `openssl rand -base64 32` | ✅ Preview |
| `ADMIN_SECRET_KEY` | `change-this-in-production` | ✅ Preview |

3. **Redéployez** : Vercel redéploiera automatiquement

---

## ✅ Checklist de Vérification

- [ ] Script exécuté avec succès (aucune erreur ❌)
- [ ] Redéploiement Vercel terminé (~2 min d'attente)
- [ ] URL Preview trouvée dans GitHub PR
- [ ] `/api/debug/env` retourne toutes les variables ✅
- [ ] `/api/setup` exécuté avec succès
- [ ] Page `/auth/register` accessible
- [ ] Création d'un utilisateur test réussie

---

## 📊 État Actuel du Projet

### ✅ Déjà Configuré
- Drizzle ORM installé et configuré
- Schéma de base de données (companies, users)
- API routes d'authentification (/api/auth/*)
- Pages de login et register
- Endpoints de debug et health check
- Endpoint d'initialisation automatique (/api/setup)

### ⏳ En Attente
- Configuration des variables d'environnement sur Vercel Preview
- Initialisation des tables en base de données

### 🎯 Objectif Final
Avoir un système d'authentification fonctionnel avec :
- Inscription de nouveaux utilisateurs
- Connexion avec email/password
- Gestion des rôles (admin, finance)
- Multi-tenant (companies)

---

## 🚀 Temps Estimé

- **Exécution du script** : 30 secondes
- **Redéploiement Vercel** : 2 minutes
- **Tests et vérification** : 3 minutes

**Total : ~5 minutes** ⏱️

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez `TROUBLESHOOTING.md`
2. Vérifiez les logs Vercel : https://vercel.com/dashboard
3. Testez `/api/debug/env` pour voir l'état des variables
