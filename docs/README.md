# 📚 Documentation NeoSaaS

Bienvenue dans la documentation complète de NeoSaaS. Cette documentation est organisée par catégories pour faciliter la navigation et la maintenance.

## 📖 Table des Matières

### 🚀 [Guides](./guides/)
Guides pratiques pour démarrer et utiliser NeoSaaS :

- **[Quick Start](./guides/QUICK_START.md)** - Démarrage rapide du projet
- **[Authentication Setup](./guides/AUTHENTICATION_SETUP.md)** - Configuration de l'authentification
- **[Auto Database Setup](./guides/AUTO_DATABASE_SETUP.md)** - Configuration automatique de la base de données
- **[Automated Setup](./guides/SETUP_AUTOMATED.md)** - Setup automatisé complet
- **[Troubleshooting](./guides/TROUBLESHOOTING.md)** - Résolution des problèmes courants

### 🏗️ [Architecture](./architecture/)
Documentation technique sur l'architecture et les décisions de conception :

- **[Roles & Permissions System](./architecture/ROLES_PERMISSIONS_SYSTEM.md)** - Système de rôles et permissions
- **[Data Model](./architecture/DATA_MODEL.md)** - Modèle de données (Tables & Champs)

### � [E-Commerce & Admin](./admin/)
Système d'administration et e-commerce :

#### Gestion des Produits (v2.0 - Panneau Unifié) 🆕
- **[Products Summary](./PRODUCTS_SUMMARY.md)** - 📋 Résumé exécutif des modifications
- **[Products Unified Panel](./PRODUCTS_UNIFIED_PANEL.md)** - ⭐ Documentation complète du panneau unifié
- **[Products Unified Panel - Guide](./PRODUCTS_UNIFIED_PANEL_GUIDE.md)** - Guide visuel rapide du panneau
- **[Products Migration Guide](./PRODUCTS_MIGRATION_GUIDE.md)** - Guide technique de migration
- **[Products Changelog](./PRODUCTS_CHANGELOG.md)** - Changelog détaillé v2.0

#### Autres Fonctionnalités
- **[Status Badges System](./STATUS_BADGES_SYSTEM.md)** - Système de badges de statut réutilisables
- **[Products Table Improvements](./PRODUCTS_TABLE_IMPROVEMENTS.md)** - Améliorations du tableau (v1.0)
- **[Products Details Panel System](./PRODUCTS_DETAILS_PANEL_SYSTEM.md)** - Panel de détails (ancien - v1.0)
- **[Debugging & Logging System](./DEBUGGING_LOGGING_SYSTEM.md)** - Système de logs détaillés
- **[Checkout Flow](./CHECKOUT_FLOW.md)** - Documentation du tunnel d'achat avec Lago
- **[Checkout Testing System](./CHECKOUT_TESTING_SYSTEM.md)** - Système de test du tunnel d'achat

### 🔄 [Workflows](./workflows/)

- **[Deployment Status](./workflows/DEPLOYMENT_STATUS.md)** - Statut des déploiements

### 🔌 [API](./api/)
Documentation des endpoints API (à venir)

### 📝 [Decisions](./decisions/)
Architecture Decision Records (ADR) - Décisions techniques importantes (à venir)

## 🤝 Contribuer à la Documentation

### Structure des Documents

Lors de l'ajout de nouvelle documentation, respectez la structure suivante :

\`\`\`markdown
# Titre du Document

## Vue d'Ensemble
[Description brève du contenu]

## [Section 1]
[Contenu...]

## [Section 2]
[Contenu...]
\`\`\`

### Templates Disponibles

Utilisez les templates suivants pour créer de nouveaux documents :

- **ADR** : \`docs/decisions/YYYY-MM-DD-titre-decision.md\`
- **Guide** : \`docs/guides/NOM_DU_GUIDE.md\`
- **API** : \`docs/api/endpoint-name.md\`

### Bonnes Pratiques

1. ✅ Utilisez des titres descriptifs et hiérarchiques
2. ✅ Incluez des exemples de code quand pertinent
3. ✅ Maintenez les liens internes à jour
4. ✅ Ajoutez des captures d'écran si nécessaire
5. ✅ Datez les documents sensibles au temps (workflows, decisions)

## 🔍 Recherche

Pour trouver rapidement de l'information :

1. Utilisez la recherche GitHub (\`/\` puis tapez votre recherche)
2. Consultez le fichier correspondant à votre catégorie
3. Référez-vous à cette table des matières

## 📞 Support

Pour toute question ou suggestion concernant la documentation :
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement

---

**Dernière mise à jour** : 2025-11-27
