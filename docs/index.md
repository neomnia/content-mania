# Documentation du projet

Bienvenue dans la documentation principale du projet.

## 🏗️ Architecture & Maintenance

- [**ARCHITECTURE**](./ARCHITECTURE.md) - Structure du projet, règles anti-doublons, workflow de développement (⭐ LECTURE OBLIGATOIRE)
- [**ACTION_LOG**](./ACTION_LOG.md) - Journal des modifications et actions de maintenance
- [**Vérification Globale 2026-01-08**](./VERIFICATION_GLOBALE_2026-01-08.md) - État de santé du projet et recommandations
- [**Audit Doublons Complet**](./AUDIT_DOUBLONS_COMPLET_2026-01-08.md) - Audit des doublons dans Calendar/Chat/E-commerce
- [**Corrections Doublons**](./CORRECTIONS_DOUBLONS_2026-01-08.md) - Corrections appliquées suite à l'audit

## Liens utiles

- [Guide de démarrage rapide](./QUICK_START.md)
- [Guide de dépannage](./TROUBLESHOOTING.md)
- [README principal](./README.md)

## Modules Principaux

### Chat & Support
- [**Module de Chat Support**](./LIVE_CHAT_MODULE.md) - Chat en direct pour visiteurs et utilisateurs (⭐ NOUVEAU)
- [**Intégration LLM**](./LLM_INTEGRATION.md) - Réponses automatiques avec Mistral, OpenAI, Anthropic (⭐ NOUVEAU)

### Calendrier & Rendez-vous
- [**Module Calendrier & Rendez-vous**](./CALENDAR_APPOINTMENTS_MODULE.md) - Gestion des rendez-vous et synchronisation calendriers

## E-commerce & Produits

- [Gestion des images de produits](./PRODUCT_IMAGE_MANAGEMENT.md) - Système SVG pour dimensions cohérentes
- [Système de gestion des produits](./PRODUCTS_UNIFIED_PANEL.md)
- [Améliorations du tableau de produits](./PRODUCTS_TABLE_IMPROVEMENTS.md)
- [Flux de checkout](./CHECKOUT_FLOW.md)
- [**Tunnel de vente avec rendez-vous**](./APPOINTMENT_BOOKING_CHECKOUT_FLOW.md) - Intégration du système de réservation dans le checkout (⭐ NOUVEAU)
- [**Système d'Upsell & Coupons**](./UPSELL_COUPON_SYSTEM.md) - Produits complémentaires et codes de réduction (⭐ NOUVEAU)
- [**Résumé des implémentations**](./IMPLEMENTATION_SUMMARY.md) - État des fonctionnalités récentes (⭐ NOUVEAU)

## Administration
- [**Patterns UX pour l'interface admin**](./ADMIN_UX_PATTERNS.md) - Sheet vs Dialog, formulaires, actions (⭐ LECTURE OBLIGATOIRE)
- [**Tableaux Users & Companies**](./ADMIN_USERS_COMPANIES_TABLES.md) - Documentation des tableaux de gestion users/companies avec tri, filtres, Sheet panels (⭐ NOUVEAU)
- [**Design responsive admin**](./ADMIN_RESPONSIVE_DESIGN.md) - Implémentation complète mobile/tablette pour tous les tableaux (⭐ NOUVEAU)
- [**Système de recherche universel**](./ADMIN_SEARCH_SYSTEM.md) - Recherche dynamique dans tout le site (front, dashboard, admin, docs) avec filtrage par permissions (⭐ NOUVEAU)
- [**Organisation du Dashboard Admin**](./ADMIN_DASHBOARD_ORGANIZATION.md) - Structure, onglets fusionnés, responsivité (⭐ NOUVEAU)
- [**Organisation de la page Settings**](./ADMIN_SETTINGS_ORGANIZATION.md) - Modules réorganisés, HTTPS par défaut (⭐ NOUVEAU)
- [Règles de design responsive pour tableaux admin](./ADMIN_TABLES_RESPONSIVE_RULES.md) - Standards mobile-friendly pour tous les tableaux
- [Format d'import CSV](./CSV_IMPORT_FORMAT.md) - Format pour import Users et Companies
- [Configuration HTTP Headers](./HTTP_HEADERS_CONFIG.md) - En-têtes de sécurité et configuration
- [Configuration Google Tag Manager](./GTM_CONFIGURATION.md) - Validation et injection GTM

## Conformité & Légal
- [**Système RGPD & DPO**](./RGPD_DPO_SYSTEM.md) - Gestion automatique du Data Protection Officer et conformité RGPD (⭐ NOUVEAU)

Pour plus d’informations sur l’authentification, consultez le dossier [`app/api/auth/`](../app/api/auth/).
Pour la configuration serveur et base de données, voir [`SERVER/`](../SERVER/).
