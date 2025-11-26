# Content-Mania

**Content-Mania** est une plateforme de gestion de contenu avec une équipe robotique. Construit sur le framework Neosaas, ce projet offre un socle complet pour gérer et automatiser la création et distribution de contenu.

---

## 🚀 Fonctionnalités principales

- 📊 **Analytics** avec [Plausible](https://plausible.io/)
- 📩 **Emailing** via **Mailchimp**, **Resend**, ou **SMTP**
- 🗂️ **Stockage** de fichiers avec **AWS S3**
- 💳 **Paiements** intégrés avec **Stripe**, **PayPal**, ou **FastSpring**
- 🤖 **Équipe robotique** pour l'automatisation du contenu
- 📚 **Documentation** complète
- ⏱️ **Tâches planifiées** via `node-cron`
- ☁️ **Déploiement simple** sur **Vercel** ou **Railway**

---

## 🧱 Stack technique

- **Next.js 16 (app directory)**
- **TypeScript**
- **Tailwind CSS**
- **ShadCN/UI**
- **Drizzle ORM + PostgreSQL**
- **Authentification sécurisée**
- **Zod** pour la validation
- **REST API**

---

## 🛠️ Installation locale

### 1. Clone le repo

```bash
git clone https://github.com/neomnia/content-mania.git
cd content-mania
```

### 2. Installe les dépendances

```bash
npm install --legacy-peer-deps
# ou
pnpm install
```

> **Note:** L'option `--legacy-peer-deps` est nécessaire avec npm pour résoudre les conflits de dépendances entre certains packages.

### 3. Configure les variables d'environnement

Crée un fichier `.env.local` à partir de `.env.example` :

```bash
cp .env.example .env.local
```

Renseigne les clés API nécessaires :
- `DATABASE_URL`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- etc.

### 4. Lance le projet

```bash
npm run dev
# ou
pnpm dev
```

Accède à l'application sur : [http://localhost:3000](http://localhost:3000)

---

## 🧪 Développement

- Les routes API sont dans `app/api/`
- Le dashboard est dans `app/(private)/dashboard`
- Les composants UI réutilisables sont dans `components/ui/`
- Les schémas de base de données sont dans `db/schema.ts`

### Commandes utiles

```bash
npm run dev         # Démarre le serveur de dev
npm run build       # Build pour la prod
npm run start       # Lance l'app en mode production
npm run lint        # Vérifie le code
npm run db:push     # Pousse le schéma vers la DB
npm run db:studio   # Ouvre Drizzle Studio
```

---

## 🧭 Déploiement

Content-Mania est conçu pour être déployé facilement sur :

- [Vercel](https://vercel.com/) : Déploiement automatique avec intégration GitHub
- [Railway](https://railway.app/) : Base de données, storage, Node.js hosting
- [Fly.io](https://fly.io/) : Haute performance avec configuration minimale

---

## 📝 Licence

Ce projet est sous licence **MIT**. Tu es libre de le modifier, l'utiliser, et le redistribuer à ta guise.

Voir [`LICENSE`](./LICENSE) pour plus d'informations.

---

## 🤝 Contribuer

Tu veux contribuer ? Fork le projet, crée une branche et propose un **pull request** 🙌

---

## 📫 Contact

Projet maintenu par [NEOMNIA](https://github.com/neomnia)

---

> Content-Mania — Gestion de contenu intelligente avec équipe robotique.

## 🙏 Remerciements

Ce projet est basé sur le framework [Neosaas](https://github.com/neosaastech/neosaas-website) qui nous a fourni une excellente base pour démarrer.
