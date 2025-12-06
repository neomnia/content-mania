/**
 * Script pour initialiser les templates d'emails par défaut
 * Exécuter avec: npx tsx scripts/seed-email-templates.ts
 */

import { db } from '../db';
import { emailTemplates } from '../db/schema';
import { eq } from 'drizzle-orm';

// Configuration de l'expéditeur par défaut
const DEFAULT_FROM = {
  name: 'NeoSaaS Platform',
  email: 'no-reply@neosaas.tech', // Domaine vérifié
};

interface EmailTemplate {
  type: string;
  name: string;
  description: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

const templates: EmailTemplate[] = [
  // 1. Welcome / Registration
  {
    type: 'registration',
    name: 'Bienvenue - Inscription',
    description: 'Email envoyé lors de l\'inscription d\'un nouvel utilisateur',
    subject: 'Bienvenue sur {{siteName}} ! 🎉',
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Bienvenue ! 🎉</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>{{firstName}}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Nous sommes ravis de vous accueillir sur <strong>{{siteName}}</strong> !
              </p>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Votre compte a été créé avec succès. Vous pouvez dès maintenant vous connecter et découvrir toutes nos fonctionnalités.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Accéder à mon compte
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Besoin d'aide ? N'hésitez pas à nous contacter.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2025 {{siteName}}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: `
Bienvenue sur {{siteName}} !

Bonjour {{firstName}},

Nous sommes ravis de vous accueillir sur {{siteName}} !

Votre compte a été créé avec succès. Vous pouvez dès maintenant vous connecter et découvrir toutes nos fonctionnalités.

Accéder à mon compte : {{actionUrl}}

Besoin d'aide ? N'hésitez pas à nous contacter.

© 2025 {{siteName}}. Tous droits réservés.
    `,
  },

  // 2. Email Verification
  {
    type: 'email_verification',
    name: 'Vérification d\'email',
    description: 'Email de vérification de l\'adresse email',
    subject: 'Vérifiez votre adresse email - {{siteName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vérification email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📧</div>
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: 700;">Vérifiez votre email</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>{{firstName}}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Pour terminer votre inscription sur {{siteName}}, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Vérifier mon email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Ce lien est valable pendant 24 heures.<br>
                Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2025 {{siteName}}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: `
Vérifiez votre adresse email

Bonjour {{firstName}},

Pour terminer votre inscription sur {{siteName}}, veuillez vérifier votre adresse email en utilisant le lien ci-dessous :

{{actionUrl}}

Ce lien est valable pendant 24 heures.
Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.

© 2025 {{siteName}}. Tous droits réservés.
    `,
  },

  // 3. Password Reset
  {
    type: 'password_reset',
    name: 'Réinitialisation de mot de passe',
    description: 'Email pour réinitialiser le mot de passe',
    subject: 'Réinitialisation de votre mot de passe - {{siteName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation mot de passe</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: 700;">Réinitialisation de mot de passe</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>{{firstName}}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Vous avez demandé à réinitialiser votre mot de passe sur {{siteName}}. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  ⚠️ <strong>Important :</strong> Ce lien expire dans 1 heure.
                </p>
              </div>

              <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2025 {{siteName}}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: `
Réinitialisation de mot de passe

Bonjour {{firstName}},

Vous avez demandé à réinitialiser votre mot de passe sur {{siteName}}. Utilisez le lien ci-dessous pour créer un nouveau mot de passe :

{{actionUrl}}

⚠️ IMPORTANT : Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.

© 2025 {{siteName}}. Tous droits réservés.
    `,
  },

  // 4. User Invitation
  {
    type: 'user_invitation',
    name: 'Invitation utilisateur',
    description: 'Email d\'invitation à rejoindre une entreprise',
    subject: 'Vous êtes invité(e) à rejoindre {{companyName}} sur {{siteName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
              <div style="font-size: 48px; margin-bottom: 16px;">✉️</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Vous êtes invité(e) !</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Vous avez été invité(e) à rejoindre <strong>{{companyName}}</strong> sur {{siteName}}.
              </p>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte :
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Accepter l'invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Cette invitation expire dans 7 jours.<br>
                Si vous ne souhaitez pas rejoindre {{companyName}}, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2025 {{siteName}}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: `
Vous êtes invité(e) !

Bonjour,

Vous avez été invité(e) à rejoindre {{companyName}} sur {{siteName}}.

Cliquez sur le lien ci-dessous pour accepter l'invitation et créer votre compte :

{{actionUrl}}

Cette invitation expire dans 7 jours.
Si vous ne souhaitez pas rejoindre {{companyName}}, vous pouvez ignorer cet email.

© 2025 {{siteName}}. Tous droits réservés.
    `,
  },

  // 5. Order Confirmation
  {
    type: 'order_confirmation',
    name: 'Confirmation de commande',
    description: 'Email de confirmation de commande',
    subject: 'Confirmation de votre commande - {{siteName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation commande</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Commande confirmée !</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>{{firstName}}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Merci pour votre commande ! Nous l'avons bien reçue et elle est en cours de traitement.
              </p>

              <!-- Order Details Box -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 6px;">
                <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                  <strong style="color: #333333;">Numéro de commande :</strong> {{orderNumber}}
                </p>
                <p style="margin: 0; color: #666666; font-size: 14px;">
                  <strong style="color: #333333;">Date :</strong> {{orderDate}}
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Voir ma commande
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Vous recevrez un email de suivi dès que votre commande sera expédiée.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2025 {{siteName}}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: `
Commande confirmée !

Bonjour {{firstName}},

Merci pour votre commande ! Nous l'avons bien reçue et elle est en cours de traitement.

Numéro de commande : {{orderNumber}}
Date : {{orderDate}}

Voir ma commande : {{actionUrl}}

Vous recevrez un email de suivi dès que votre commande sera expédiée.

© 2025 {{siteName}}. Tous droits réservés.
    `,
  },

  // 6. General Notification
  {
    type: 'notification',
    name: 'Notification générale',
    description: 'Template pour les notifications générales',
    subject: 'Notification - {{siteName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: 700;">Notification</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>{{firstName}}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                {{notificationMessage}}
              </p>

              <!-- CTA Button (si nécessaire) -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Voir les détails
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2025 {{siteName}}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: `
Notification

Bonjour {{firstName}},

{{notificationMessage}}

Voir les détails : {{actionUrl}}

© 2025 {{siteName}}. Tous droits réservés.
    `,
  },

  // 7. Account Deletion
  {
    type: 'account_deletion',
    name: 'Suppression de compte',
    description: 'Email de confirmation de suppression de compte',
    subject: 'Confirmation de suppression de compte - {{siteName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suppression de compte</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border-radius: 8px 8px 0 0;">
              <div style="font-size: 48px; margin-bottom: 16px;">👋</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Compte supprimé</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>{{firstName}}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Nous vous confirmons que votre compte sur <strong>{{siteName}}</strong> a été supprimé avec succès.
              </p>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Toutes vos données personnelles ont été effacées de nos systèmes, conformément à notre politique de confidentialité.
              </p>

              <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 6px;">
                <p style="margin: 0; color: #666666; font-size: 14px; font-style: italic;">
                  Nous sommes tristes de vous voir partir. Si vous changez d'avis, vous serez toujours le bienvenu pour créer un nouveau compte.
                </p>
              </div>

              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Si vous n'êtes pas à l'origine de cette demande, veuillez nous contacter immédiatement.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2025 {{siteName}}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: `
Compte supprimé

Bonjour {{firstName}},

Nous vous confirmons que votre compte sur {{siteName}} a été supprimé avec succès.

Toutes vos données personnelles ont été effacées de nos systèmes.

Nous sommes tristes de vous voir partir. Si vous changez d'avis, vous serez toujours le bienvenu.

© 2025 {{siteName}}. Tous droits réservés.
    `,
  },
];

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...\n');

  for (const template of templates) {
    try {
      // Vérifier si le template existe déjà
      const existing = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.type, template.type))
        .limit(1);

      if (existing.length > 0) {
        // Mettre à jour le template existant
        await db
          .update(emailTemplates)
          .set({
            name: template.name,
            description: template.description,
            fromName: DEFAULT_FROM.name,
            fromEmail: DEFAULT_FROM.email,
            subject: template.subject,
            htmlContent: template.htmlContent.trim(),
            textContent: template.textContent.trim(),
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(emailTemplates.type, template.type));

        console.log(`✅ Updated: ${template.name} (${template.type})`);
      } else {
        // Créer un nouveau template
        await db.insert(emailTemplates).values({
          type: template.type,
          name: template.name,
          description: template.description,
          fromName: DEFAULT_FROM.name,
          fromEmail: DEFAULT_FROM.email,
          subject: template.subject,
          htmlContent: template.htmlContent.trim(),
          textContent: template.textContent.trim(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✅ Created: ${template.name} (${template.type})`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${template.name}:`, error);
    }
  }

  console.log('\n🎉 Email templates seeded successfully!');
  console.log(`\n📝 Total templates: ${templates.length}`);
  console.log('\n💡 Variables disponibles dans les templates:');
  console.log('   - {{firstName}}, {{lastName}}, {{email}}');
  console.log('   - {{companyName}}, {{siteName}}');
  console.log('   - {{actionUrl}}');
  console.log('   - {{orderNumber}}, {{orderDate}}');
  console.log('   - {{notificationMessage}}');
}

seedEmailTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding templates:', error);
    process.exit(1);
  });
