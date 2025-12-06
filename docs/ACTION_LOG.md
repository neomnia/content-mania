# Journal des Actions et Modifications

Ce document retrace l'historique des modifications, des nouvelles fonctionnalités et des actions de maintenance effectuées sur le projet NeoSaaS.

## [2025-12-06] - Mise à jour de la gestion d'entreprise et du profil utilisateur

### Base de données
- **Table `companies`** :
  - Ajout de la colonne `zip_code` (Code Postal).
  - Ajout de la colonne `siret` (Numéro SIRET).
- **Table `users`** :
  - Ajout de la colonne `position` (Poste/Fonction).

### API
- **Route `/api/company` (PUT)** :
  - Prise en charge des champs `zipCode` et `siret` lors de la mise à jour ou création d'une entreprise.
- **Route `/api/profile` (POST)** :
  - Ajout de la méthode `POST` pour la mise à jour du profil (en plus de `PUT`).
  - Prise en charge du champ `position`.

### Interface Utilisateur (Dashboard)
- **Page `company-management`** :
  - Ajout des champs de saisie pour "ZIP Code" et "SIRET" dans le formulaire d'édition.
  - Affichage de ces nouvelles informations dans la vue lecture seule.
- **Page `profile`** :
  - Déplacement du bouton "Edit" dans la section "Personal Information".
  - Ajout du champ "Position" dans le formulaire d'édition.
  - Utilisation de la méthode `POST` pour la sauvegarde du profil.

### Déploiement
- **Script `db/push-schema.ts`** :
  - Mise à jour des instructions SQL de création de table pour inclure les nouvelles colonnes (`zip_code`, `siret`, `position`).
  - Cela garantit que lors d'un redéploiement (qui recrée le schéma), les nouvelles colonnes sont bien présentes.

## [2025-12-06] - Optimisation du déploiement et nettoyage

### Configuration
- **`package.json`** :
  - Suppression des dépendances inutilisées et lourdes : `sqlite3`, `mysql2`, `knex`, `expo-sqlite`, `postgres`, `gel`, `@aws-sdk/*`, `@cloudflare/*`, `@vercel/postgres`.
  - Mise à jour de `typescript` vers `^5.7.2`.
  - Mise à jour de `@types/react` et `@types/react-dom` vers `^19` pour la compatibilité Next.js 16.
- **`vercel.json`** :
  - Création du fichier pour forcer l'installation avec `pnpm install --no-frozen-lockfile` afin de résoudre les problèmes de lockfile obsolète sur Vercel.
- **`next.config.mjs`** :
  - Suppression du bloc `eslint` obsolète.

### Base de données
- **Script `db/push-schema.ts`** :
  - Ajout de l'initialisation automatique du Super Admin (`admin@exemple.com`) et des rôles/permissions lors du déploiement.

### Sécurité
- **`package.json`** :
  - Mise à jour de `next` vers `latest` pour corriger la vulnérabilité CVE-2025-66478.

### Fonctionnalités
- **Route `/api/profile/image`** :
  - **Transformation SVG & Recadrage** : Les images uploadées sont désormais encapsulées dans un conteneur SVG généré à la volée.
  - **Avantage** : Cela permet de forcer un format carré (512x512) via l'attribut `preserveAspectRatio="xMidYMid slice"` sans nécessiter de lourdes bibliothèques de traitement d'image.
  - **Stockage** : L'SVG résultant est stocké en Base64 dans la base de données, contournant les limitations du système de fichiers Vercel.



---
*Ce journal est mis à jour automatiquement par l'assistant IA lors des interventions majeures.*
