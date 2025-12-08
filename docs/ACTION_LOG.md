# Journal des Actions et Modifications

Ce document retrace l'historique des modifications, des nouvelles fonctionnalités et des actions de maintenance effectuées sur le projet NeoSaaS.

## [2025-12-08] - Correction du mode maintenance et erreurs Turbopack

### Intégration Google Tag Manager et Code Personnalisé
- **`app/layout.tsx`** :
  - Injection automatique du script GTM (Google Tag Manager) si un ID est configuré.
  - Support de l'injection de code personnalisé dans le `<head>` et avant la fermeture du `<body>`.
- **`lib/config.ts`** :
  - Mise à jour de `getPlatformConfig` pour inclure `gtmCode`, `customHeaderCode` et `customFooterCode`.

### Correction du mode maintenance
Le mode maintenance ne fonctionnait pas car les layouts étaient mis en cache par Next.js. Les corrections suivantes ont été apportées :

- **`app/(public)/layout.tsx`** :
  - Ajout de `export const dynamic = 'force-dynamic'` pour forcer le rendu dynamique
  - Le mode maintenance est maintenant vérifié à chaque requête

- **`app/auth/layout.tsx`** :
  - Ajout de `export const dynamic = 'force-dynamic'`
  - Ajout de la vérification du mode maintenance (redirection vers `/maintenance`)
  - Les pages d'authentification sont aussi bloquées en mode maintenance

- **`app/api/config/route.ts`** :
  - Ajout de `maintenanceMode` dans la réponse de l'API publique

### Fonctionnement du mode maintenance (Next.js 16)
Puisque `middleware.ts` n'existe plus dans Next.js 16, le mode maintenance est géré via :
1. **Layouts dynamiques** : Chaque layout vérifie `platformConfig.maintenanceMode`
2. **Redirection serveur** : `redirect("/maintenance")` pour les non-admins
3. **Admins exemptés** : Les utilisateurs avec rôle `admin` ou `super_admin` peuvent accéder au site

### Correction des erreurs Turbopack
- **Conflit de route `/maintenance`** : Suppression du dossier dupliqué `/app/maintenance/` (conflictait avec `/(errors)/maintenance`)
- **Polices Google** : Remplacement de `Inter` (Google Fonts) par `GeistSans` (police locale du package `geist`)
- **Connexion DB au build** : Implémentation d'une initialisation paresseuse (lazy) de la connexion Neon pour éviter les erreurs lors du build

### Fichiers modifiés
| Fichier | Modification |
|---------|--------------|
| `app/(public)/layout.tsx` | `dynamic = 'force-dynamic'` |
| `app/auth/layout.tsx` | `dynamic = 'force-dynamic'` + check maintenance |
| `app/api/config/route.ts` | Ajout `maintenanceMode` |
| `app/layout.tsx` | Police `GeistSans` au lieu de `Inter` |
| `db/index.ts` | Connexion lazy via Proxy |

---

## [2025-12-06] - Configuration dynamique du site et gestion des droits admin

### Contexte React pour la configuration de la plateforme
- **Nouveau fichier `contexts/platform-config-context.tsx`** :
  - Création d'un contexte React `PlatformConfigProvider` pour partager la configuration du site (siteName, logo) dans tous les composants client.
  - Hook `usePlatformConfig()` pour accéder aux données de configuration.

### API publique de configuration
- **Nouveau fichier `app/api/config/route.ts`** :
  - Endpoint GET public (sans authentification) pour récupérer le nom du site et le logo.
  - Fallback sur "NeoSaaS" si aucune configuration n'est définie en base.

### Layouts mis à jour
- **`app/(public)/layout.tsx`** : Ajout du `PlatformConfigProvider` pour les pages publiques.
- **`app/(private)/layout.tsx`** et **`layout-client.tsx`** : Passage de la configuration aux composants privés.
- **`app/auth/layout.tsx`** : Nom du site dynamique dans les métadonnées et le header.
- **`app/(public)/dashboard-exemple/layout.tsx`** : Métadonnées dynamiques.

### Composants mis à jour pour affichage dynamique
- **`components/layout/site-header.tsx`** : Logo et nom du site récupérés depuis le contexte.
- **`components/layout/site-footer.tsx`** : Nom du site dynamique dans le header et le copyright.
- **`components/layout/minimal-footer.tsx`** : Copyright dynamique.
- **`components/layout/mobile-menu.tsx`** : Nom du site dynamique.
- **`components/layout/private-dashboard/sidebar.tsx`** : Logo et initiales dynamiques.
- **`components/features/brand/brand-icon.tsx`** : Logo récupéré depuis la configuration.

### Correction de l'API admin/config
- **`app/api/admin/config/route.ts`** :
  - **Bug corrigé** : Utilisation de `currentUser.roles` (tableau) au lieu de `currentUser.role` (inexistant).
  - La vérification des droits admin utilise maintenant : `roles?.some(role => role === 'admin' || role === 'super_admin')`.

### Système de droits admin/super_admin
- **`lib/auth/server.ts`** :
  - Nouvelle fonction `isSuperAdmin(userId)` : vérifie si l'utilisateur a le rôle `super_admin`.
  - Nouvelle fonction `requireSuperAdmin()` : redirige vers `/dashboard` si non super_admin.
- **`lib/contexts/user-context.tsx`** :
  - Ajout de `isSuperAdmin` dans le contexte pour vérification côté client.
- **`app/(private)/admin/users/page.tsx`** :
  - Protection avec `await requireSuperAdmin()` : seuls les super_admin peuvent gérer les utilisateurs.
- **`components/layout/private-dashboard/sidebar.tsx`** :
  - Filtrage des items admin : le lien "Users" n'est visible que pour les super_admin.
  - Ajout du flag `superAdminOnly: true` sur l'item Users.

### Règles d'accès finales
| Page | Admin | Super Admin |
|------|-------|-------------|
| `/admin` (Dashboard) | ✅ | ✅ |
| `/admin/api` | ✅ | ✅ |
| `/admin/pages` | ✅ | ✅ |
| `/admin/mail` | ✅ | ✅ |
| `/admin/logs` | ✅ | ✅ |
| `/admin/users` | ❌ | ✅ |

### Mapping Base de Données (table `platform_config`)
Les données de la page `/admin` sont stockées dans la table `platform_config` avec les clés suivantes :
- `site_name` : Nom du site affiché partout
- `logo` : Logo en SVG Base64 (encapsulé dans un conteneur SVG 100x100)
- `auth_enabled` : Activation de l'authentification
- `maintenance_mode` : Mode maintenance
- `maintenance_message` : Message de maintenance personnalisé
- `custom_header_code` : Code injecté dans `<head>`
- `custom_footer_code` : Code injecté avant `</body>`
- `gtm_code` : ID Google Tag Manager
- `seo_settings` : JSON des paramètres SEO (titleTemplate, baseUrl, description, keywords, ogTitle, ogDescription)
- `social_links` : JSON des liens sociaux (twitter, facebook, linkedin, instagram, github)

---

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
