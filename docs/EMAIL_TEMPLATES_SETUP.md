# Configuration des Templates d'Email

Ce document explique comment configurer et utiliser les templates d'email dans NeoSaaS.

## Templates Disponibles

Le système inclut 4 templates d'email principaux :

1. **user_invitation** - Invitation à rejoindre une entreprise
2. **registration** - Email de bienvenue après inscription
3. **account_update** - Notification de modification de compte
4. **admin_notification** - Notifications pour les super admins

## Installation des Templates

### Méthode 1 : Via l'API Admin (Recommandé)

1. Connectez-vous en tant qu'administrateur
2. Utilisez curl ou Postman pour appeler l'endpoint de seed :

```bash
curl -X POST http://localhost:3000/api/admin/email-templates/seed \
  -H "Cookie: authToken=YOUR_AUTH_TOKEN"
```

Cette méthode créera ou mettra à jour automatiquement tous les templates dans la base de données.

### Méthode 2 : Via le Script (Alternative)

Si vous avez accès direct à la base de données :

```bash
npx tsx scripts/seed-email-templates.ts
```

**Note :** Cette méthode nécessite que toutes les dépendances soient correctement installées.

## Configuration du Provider Email

Avant d'envoyer des emails, vous devez configurer un provider email (actuellement seul Scaleway TEM est supporté) :

1. Allez dans **Admin > API Management**
2. Configurez Scaleway TEM avec vos credentials :
   - Project ID
   - Secret Key
   - Region
   - Domain vérifié

## Variables Disponibles dans les Templates

### Template `user_invitation`
- `{{inviterName}}` - Nom de la personne qui invite
- `{{companyName}}` - Nom de l'entreprise
- `{{siteName}}` - Nom du site (NeoSaaS)
- `{{roleName}}` - Rôle assigné (Reader/Writer)
- `{{inviteUrl}}` - Lien d'acceptation de l'invitation

### Template `registration`
- `{{firstName}}` - Prénom de l'utilisateur
- `{{email}}` - Email de l'utilisateur
- `{{companyName}}` - Nom de l'entreprise
- `{{siteName}}` - Nom du site
- `{{actionUrl}}` - Lien vers le dashboard

### Template `account_update`
- `{{firstName}}`, `{{lastName}}` - Nom complet
- `{{email}}` - Email
- `{{companyName}}` - Entreprise
- `{{updateDetails}}` - Détails des modifications
- `{{dashboardUrl}}` - Lien vers le profil

### Template `admin_notification`
- `{{notificationType}}` - Type de notification
- `{{eventDetails}}` - Détails de l'événement
- `{{timestamp}}` - Horodatage
- `{{userInfo}}` - Informations utilisateur
- `{{adminUrl}}` - Lien vers l'admin

## Vérification

Pour vérifier que les templates sont bien installés :

1. Allez dans **Admin > Mail Management**
2. Vous devriez voir les 4 templates listés et actifs
3. Vous pouvez tester l'envoi depuis cette interface

## Envoi d'Email de Test

Pour tester l'envoi d'emails :

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=YOUR_AUTH_TOKEN" \
  -d '{
    "to": ["test@example.com"],
    "templateId": "registration",
    "variables": {
      "firstName": "Test",
      "companyName": "Test Company",
      "siteName": "NeoSaaS",
      "actionUrl": "http://localhost:3000/dashboard"
    }
  }'
```

## Troubleshooting

### Les emails ne sont pas envoyés

1. **Vérifier la configuration du provider**
   - Admin > API Management > Scaleway
   - Assurez-vous que la configuration est active

2. **Vérifier que les templates sont actifs**
   - Admin > Mail Management
   - Statut doit être "Active"

3. **Vérifier les logs**
   - Admin > Logs > System Logs
   - Catégorie "email"
   - Recherchez les erreurs d'envoi

### Template non trouvé

Si vous voyez l'erreur "template not found or inactive":

1. Exécutez l'endpoint de seed : `/api/admin/email-templates/seed`
2. Vérifiez que le template existe en base de données
3. Vérifiez que `isActive = true`

## Personnalisation des Templates

Pour personnaliser un template :

1. Allez dans **Admin > Mail Management**
2. Cliquez sur "Edit" pour le template souhaité
3. Modifiez le HTML ou le texte
4. Sauvegardez les modifications

**Note :** Les modifications manuelles seront écrasées si vous ré-exécutez le script de seed.

## Notification des Super Admins

Pour activer les notifications admin lors de changements importants (création/modification d'utilisateurs) :

1. Les super admins recevront automatiquement des emails
2. Configurez l'expéditeur dans le template `admin_notification`
3. Les événements suivants déclenchent une notification :
   - Création d'un nouvel utilisateur
   - Modification des informations utilisateur
   - Changement de rôle
   - Désactivation de compte

## Support

Pour toute question ou problème, consultez :
- Documentation complète : `/docs/EMAIL_SYSTEM_ARCHITECTURE.md`
- Logs système : Admin > Logs
- Support : contact@neosaas.tech
