# Configuration de Scaleway Transactional Email (TEM)

Ce guide vous explique comment configurer et utiliser Scaleway TEM pour l'envoi d'emails transactionnels dans votre application.

## Prérequis

1. Un compte Scaleway
2. Un projet Scaleway créé
3. Un domaine vérifié dans Scaleway TEM

## Étape 1 : Obtenir les identifiants Scaleway

### 1.1 Accéder à la console Scaleway

Rendez-vous sur https://console.scaleway.com/project/credentials

### 1.2 Récupérer le Project ID

- Dans la console Scaleway, cliquez sur votre nom de projet en haut de la page
- Copiez le **Project ID** qui s'affiche

### 1.3 Créer une clé API

1. Allez dans **Identity and Access Management (IAM)**
2. Cliquez sur **API Keys**
3. Créez une nouvelle clé API avec les permissions suivantes :
   - `TransactionalEmailFullAccess` ou au minimum `TransactionalEmailEmailManager`
4. Copiez le **Secret Key** (il ne sera plus visible après)

## Étape 2 : Vérifier votre domaine

### 2.1 Ajouter un domaine dans TEM

1. Allez dans **Transactional Email** dans la console Scaleway
2. Cliquez sur **Add domain**
3. Entrez votre nom de domaine (ex: `example.com`)

### 2.2 Configurer les enregistrements DNS

Ajoutez les enregistrements SPF, DKIM et autres requis dans votre zone DNS :

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.scw-tem.cloud ~all

Type: TXT
Name: scw1._domainkey
Value: [Valeur fournie par Scaleway]

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:postmaster@example.com
```

### 2.3 Vérifier le domaine

Une fois les DNS propagés (peut prendre jusqu'à 48h), cliquez sur **Verify** dans la console Scaleway.

## Étape 3 : Configurer l'application

### 3.1 Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```bash
# Scaleway Transactional Email (TEM)
SCW_PROJECT_ID=your-scaleway-project-id
SCW_SECRET_KEY=your-scaleway-secret-key
SCW_REGION=fr-par
```

### 3.2 Initialiser la configuration en base de données

Deux options s'offrent à vous :

#### Option A : Via l'endpoint de debug (développement uniquement)

```bash
curl http://localhost:3000/api/debug/seed-email
```

Cet endpoint va :
- Lire les variables d'environnement `SCW_PROJECT_ID` et `SCW_SECRET_KEY`
- Créer une configuration Scaleway TEM chiffrée en base de données
- Activer cette configuration par défaut

#### Option B : Via l'API de configuration

```bash
curl -X POST http://localhost:3000/api/email/config \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "scaleway-tem",
    "isActive": true,
    "isDefault": true,
    "config": {
      "projectId": "your-project-id",
      "secretKey": "your-secret-key",
      "region": "fr-par",
      "plan": "essential"
    }
  }'
```

## Étape 4 : Tester l'envoi d'emails

### 4.1 Via l'API

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinataire@example.com",
    "from": "expediteur@votre-domaine.com",
    "fromName": "Votre Application",
    "subject": "Test email",
    "htmlContent": "<h1>Bonjour</h1><p>Ceci est un email de test.</p>",
    "textContent": "Bonjour\n\nCeci est un email de test.",
    "provider": "scaleway-tem"
  }'
```

### 4.2 Vérifier l'envoi

Consultez les logs de votre application pour voir :
- La confirmation d'envoi avec le message ID
- Les éventuelles erreurs

Vous pouvez aussi consulter les statistiques dans la console Scaleway TEM.

## Étape 5 : Vérifier la configuration

Utilisez le script de vérification :

```bash
npm run db:push  # Assurez-vous que la base est à jour
npx tsx scripts/check-email-config.ts
```

Ce script affichera :
- Les providers configurés
- L'état d'activation
- Les identifiants (masqués)

## Plans et limites

### Plan Essential (gratuit)
- 1 000 emails par jour
- Support basic

### Plan Scale
- 100 000 emails par jour
- Support prioritaire
- Webhooks avancés

Pour changer de plan, modifiez la propriété `plan` dans la configuration :
```typescript
{
  "plan": "scale"  // ou "essential"
}
```

## Troubleshooting

### Erreur : "Domain not verified"

Vérifiez que :
- Votre domaine est bien vérifié dans la console Scaleway
- Vous utilisez une adresse email du domaine vérifié comme `from`

### Erreur : "Authentication failed"

Vérifiez que :
- Le `SCW_SECRET_KEY` est correct
- La clé API a les bonnes permissions
- Le `SCW_PROJECT_ID` correspond au projet où le domaine est configuré

### Erreur : "Rate limit exceeded"

Vous avez dépassé la limite du plan :
- Essential : 1 000 emails/jour
- Scale : 100 000 emails/jour

### Emails non reçus

1. Vérifiez les enregistrements DNS (SPF, DKIM, DMARC)
2. Consultez les logs dans la console Scaleway TEM
3. Vérifiez les dossiers spam
4. Assurez-vous que le domaine expéditeur est vérifié

## Ressources

- [Documentation officielle Scaleway TEM](https://www.scaleway.com/en/docs/managed-services/transactional-email/)
- [API Reference](https://www.scaleway.com/en/developers/api/transactional-email/)
- [Console Scaleway](https://console.scaleway.com/transactional-email)

## Support

Pour toute question ou problème :
1. Consultez d'abord ce guide
2. Vérifiez les logs de l'application
3. Consultez la documentation Scaleway
4. Contactez le support Scaleway si nécessaire
