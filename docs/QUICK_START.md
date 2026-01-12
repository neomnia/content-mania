# Guide de Demarrage Rapide - Content Mania

## Prerequisites

- Node.js 18+
- pnpm (recommande) ou npm
- Un compte Neon PostgreSQL (https://neon.tech)

## Etape 1 : Cloner le projet

```bash
git clone <repository-url>
cd content-mania
```

## Etape 2 : Configuration de la base de donnees Neon

### 2.1 Creer un projet Neon

1. Connectez-vous a [Neon Console](https://console.neon.tech)
2. Cliquez sur "New Project"
3. Choisissez une region (ex: `eu-central-1` pour l'Europe)
4. Nommez votre projet (ex: `content-mania-dev`)

### 2.2 Recuperer les identifiants

Depuis le dashboard Neon, copiez les valeurs suivantes :

| Variable | Description | Ou la trouver |
|----------|-------------|---------------|
| `DATABASE_URL` | URL avec pooler | Connection string (Pooled) |
| `DATABASE_URL_UNPOOLED` | URL directe | Connection string (Direct) |
| `PGHOST` | Host avec pooler | Hostname (avec `-pooler`) |
| `PGUSER` | Utilisateur | Role name |
| `PGPASSWORD` | Mot de passe | Password |
| `PGDATABASE` | Nom de la base | Database name |

### 2.3 Configurer les variables d'environnement

Copiez le fichier exemple et remplissez-le :

```bash
cp .env.example .env
```

Editez `.env` avec vos valeurs Neon :

```env
# URL principale (avec pooler PgBouncer - recommande)
DATABASE_URL=postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[database]?sslmode=require

# URL directe (pour migrations)
DATABASE_URL_UNPOOLED=postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[database]?sslmode=require

# Configuration NextAuth
NEXTAUTH_SECRET=votre-cle-secrete-32-caracteres-minimum
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Generer une cle secrete :**

```bash
openssl rand -base64 32
```

## Etape 3 : Installation des dependances

```bash
pnpm install
```

## Etape 4 : Initialisation de la base de donnees

```bash
# Synchroniser le schema avec la base de donnees
pnpm db:push

# (Optionnel) Peupler avec les donnees initiales
pnpm db:seed

# (Optionnel) Initialiser les templates d'email
pnpm seed:email-templates

# (Optionnel) Synchroniser les permissions des pages
pnpm seed:pages
```

## Etape 5 : Lancer l'application

```bash
pnpm dev
```

L'application est maintenant accessible sur http://localhost:3000

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Lancer en mode developpement |
| `pnpm build` | Compiler pour la production |
| `pnpm start` | Lancer la version compilee |
| `pnpm db:push` | Synchroniser le schema DB |
| `pnpm db:studio` | Ouvrir Drizzle Studio (interface visuelle DB) |
| `pnpm db:seed` | Peupler la base avec des donnees initiales |
| `pnpm db:reset` | Reinitialiser la base de donnees |
| `pnpm db:hard-reset` | Reset complet + seed |

## Structure des fichiers de configuration

```
project/
├── .env                    # Variables d'environnement (NE PAS COMMITTER)
├── .env.example            # Template des variables
├── drizzle.config.ts       # Configuration Drizzle ORM
├── db/
│   └── schema.ts           # Schema de la base de donnees
└── scripts/
    ├── build-with-db.sh    # Script de build avec sync DB
    ├── seed-database.ts    # Script de seeding
    └── reset-db.ts         # Script de reset
```

## Deploiement

Pour deployer sur Vercel, consultez [DEPLOYMENT.md](./DEPLOYMENT.md).

## Depannage

### Erreur de connexion a la base de donnees

1. Verifiez que votre projet Neon est actif
2. Verifiez que `sslmode=require` est present dans l'URL
3. N'utilisez pas `channel_binding=require` (non supporte)

### Erreur "relation does not exist"

```bash
pnpm db:push
```

### Reinitialisation complete

```bash
pnpm db:hard-reset
```

Pour plus d'aide, consultez [TROUBLESHOOTING.md](./guides/TROUBLESHOOTING.md).
