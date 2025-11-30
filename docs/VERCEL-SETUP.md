# 🚀 Configuration Vercel - NEXTAUTH_SECRET

## ❌ Problème rencontré

```
Error: NEXTAUTH_SECRET doit faire au moins 32 caractères
```

**Cause :** La clé actuelle fait seulement 28 caractères.

---

## ✅ Solution

### 1. Nouvelle clé générée (44 caractères)

```
fZTfNSS0oGYOjKAoG5870CEOAKALXjWYFSjDJ2vh7qA=
```

### 2. Configuration Vercel

#### Étape A : Accéder aux variables d'environnement

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner votre projet **neosaas-website**
3. Cliquer sur **Settings** (menu de gauche)
4. Cliquer sur **Environment Variables** (menu de gauche)

#### Étape B : Modifier/Ajouter NEXTAUTH_SECRET

**Si la variable existe déjà :**
1. Trouver `NEXTAUTH_SECRET` dans la liste
2. Cliquer sur les **trois points (...)** → **Edit**
3. Remplacer la valeur par : `fZTfNSS0oGYOjKAoG5870CEOAKALXjWYFSjDJ2vh7qA=`
4. **IMPORTANT** : Cocher TOUS les environnements :
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Cliquer sur **Save**

**Si la variable n'existe pas :**
1. Cliquer sur **Add New**
2. Remplir :
   - **Name:** `NEXTAUTH_SECRET`
   - **Value:** `fZTfNSS0oGYOjKAoG5870CEOAKALXjWYFSjDJ2vh7qA=`
   - **Environments:** Cocher ✅ Production, ✅ Preview, ✅ Development
3. Cliquer sur **Save**

#### Étape C : Redéployer

**Option 1 : Redéploiement automatique**
```bash
git add .
git commit -m "fix: Update NEXTAUTH_SECRET configuration"
git push
```

**Option 2 : Redéploiement manuel**
1. Aller dans **Deployments**
2. Trouver le dernier déploiement
3. Cliquer sur **...** (trois points)
4. Sélectionner **Redeploy**
5. Cliquer sur **Redeploy** pour confirmer

---

## ✅ Vérification

Après le redéploiement :

1. Aller sur votre application déployée
2. Se connecter
3. Aller sur `/admin/api`
4. Essayer d'ajouter une clé API (Scaleway, Resend, etc.)

**Résultat attendu :**
- ✅ Pas d'erreur de cryptage
- ✅ Message "Configuration saved"
- ✅ Clé cryptée en base de données

---

## 🔍 Diagnostic

### Vérifier localement

```bash
# Vérifier la longueur de votre clé
npx tsx scripts/check-nextauth-secret.ts
```

**Résultat attendu :**
```
✅ NEXTAUTH_SECRET est défini
   Longueur: 44 caractères
✅ Longueur valide (>= 32 caractères)
```

### Vérifier sur Vercel

1. Vercel → Settings → Environment Variables
2. Vérifier que `NEXTAUTH_SECRET` est défini pour **tous les environnements**
3. Vérifier qu'il n'y a **pas d'espaces** avant/après la valeur

---

## 🚨 Troubleshooting

### Erreur persiste après redéploiement

**Cause possible :** Cache Vercel
**Solution :**
1. Settings → General
2. Descendre jusqu'à "Clear Cache"
3. Cliquer sur "Clear Cache"
4. Redéployer

### Variables non chargées

**Cause possible :** Environnement non coché
**Solution :**
1. Vérifier que TOUS les environnements sont cochés :
   - Production ✅
   - Preview ✅
   - Development ✅

### Ancienne clé toujours utilisée

**Cause possible :** Déploiement non redémarré
**Solution :**
1. Aller dans Deployments
2. Trouver le déploiement actif
3. Cliquer sur "Redeploy"
4. Attendre la fin du build

---

## 📚 Références

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [NEXTAUTH_SECRET Documentation](https://next-auth.js.org/configuration/options#secret)

---

## 🔐 Sécurité

⚠️ **Ne JAMAIS commiter `.env.local` dans Git**

✅ Le fichier est déjà dans `.gitignore`

✅ Seul `.env.example` doit être versionné (sans vraies valeurs)
