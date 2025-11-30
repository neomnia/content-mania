# 🚀 Guide de Déploiement - NeoSaaS

## Architecture de branches

```
dev      → Développement (auto-deploy sur Vercel Preview)
preview  → Pré-production (auto-deploy sur Vercel Preview)
main     → Production (auto-deploy sur Vercel Production)
```

## Variables d'environnement

### Obligatoires pour tous les environnements

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Secret pour JWT + Cryptage (min 32 chars) | `bGpraDUyNDk4Nzk4Nzk4Nzk4Nw==` |
| `NEXTAUTH_URL` | URL de l'application | `https://app.neosaas.com` |
| `DATABASE_URL` | PostgreSQL Neon | `postgresql://user:pass@host/db` |

### Configuration Vercel

1. **Settings** → **Environment Variables**
2. Ajouter les variables ci-dessus pour :
   - ✅ Production
   - ✅ Preview
   - ✅ Development

## Workflow de déploiement

### 1. Développement local

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Tester le cryptage
npx tsx scripts/test-api-encryption.ts

# Tester l'API
bash scripts/test-api-flow.sh
```

### 2. Push vers `dev`

```bash
git checkout dev
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin dev
```

→ Déploiement automatique sur **Vercel Preview**

### 3. Merge vers `preview`

```bash
git checkout preview
git merge dev
git push origin preview
```

→ Déploiement automatique sur **Vercel Preview** (URL stable)

### 4. Merge vers `main` (Production)

```bash
# Après validation sur preview
git checkout main
git merge preview
git push origin main
```

→ Déploiement automatique sur **Vercel Production**

## Checklist pré-déploiement

- [ ] Variables d'environnement configurées sur Vercel
- [ ] Tests locaux passent (`npm run test` si configuré)
- [ ] Build local réussit (`npm run build`)
- [ ] Migrations de base de données appliquées
- [ ] Pas d'erreurs TypeScript (`npx tsc --noEmit`)

## Monitoring

### Vérifier le déploiement

1. **Vercel Dashboard** → Deployments
2. Vérifier les logs de build
3. Tester l'URL de déploiement
4. Vérifier que l'authentification fonctionne

### Rollback si nécessaire

1. Vercel Dashboard → Deployments
2. Cliquer sur un déploiement précédent
3. **Promote to Production**

## Troubleshooting

### Erreur : "NEXTAUTH_SECRET is required"

**Cause** : Variable d'environnement manquante
**Solution** :
1. Vercel → Settings → Environment Variables
2. Ajouter `NEXTAUTH_SECRET` pour tous les environnements
3. Redéployer

### Erreur : "relation does not exist"

**Cause** : Tables de base de données non créées
**Solution** :
1. Aller sur Neon Console
2. Exécuter `db/create-service-api-tables.sql`
3. Ou lancer : `npm run db:push`

### Erreur : Cryptage échoue

**Cause** : `NEXTAUTH_SECRET` trop court (<32 caractères)
**Solution** : Générer une nouvelle clé :
```bash
openssl rand -base64 32
```

## Support

Pour toute question :
- GitHub Issues : [neosaastech/neosaas-website](https://github.com/neosaastech/neosaas-website)
- Documentation : `/docs`
