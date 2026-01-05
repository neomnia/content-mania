/**
 * Service de notifications pour l'équipe Neosaas
 * Envoie des emails de notification pour les différents événements d'achat
 */

import { db } from '@/db'
import { users, roles, userRoles, platformConfig } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { emailRouter } from '@/lib/email'
import type { TeamNotification, ProductType } from './types'

/**
 * Récupère les emails de l'équipe admin pour les notifications
 */
async function getAdminEmails(): Promise<string[]> {
  // Chercher le rôle admin
  const adminRole = await db.query.roles.findFirst({
    where: eq(roles.name, 'admin')
  })

  const superAdminRole = await db.query.roles.findFirst({
    where: eq(roles.name, 'super_admin')
  })

  const roleIds = [adminRole?.id, superAdminRole?.id].filter(Boolean) as string[]

  if (roleIds.length === 0) {
    console.warn('[Team Notifications] No admin roles found')
    return []
  }

  // Récupérer les utilisateurs avec ces rôles
  const adminUsers = await db.query.userRoles.findMany({
    where: (ur, { inArray }) => inArray(ur.roleId, roleIds),
    with: {
      user: true
    }
  })

  const emails = adminUsers
    .filter(ur => ur.user && ur.user.isActive && ur.user.email)
    .map(ur => ur.user.email)

  // Dédupliquer
  return [...new Set(emails)]
}

/**
 * Récupère l'email de notification configuré (fallback)
 */
async function getNotificationEmail(): Promise<string | null> {
  const config = await db.query.platformConfig.findFirst({
    where: eq(platformConfig.key, 'notification_email')
  })

  return config?.value || process.env.NOTIFICATION_EMAIL || null
}

/**
 * Formate le prix pour l'affichage
 */
function formatPrice(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amountCents / 100)
}

/**
 * Formate la date pour l'affichage
 */
function formatDate(date: Date, timezone?: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone || 'Europe/Paris'
  }).format(date)
}

/**
 * Génère le contenu HTML de l'email pour un produit digital
 */
function generateDigitalProductEmailHtml(notification: TeamNotification): string {
  const itemsList = notification.items
    .map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price, notification.currency)}</td>
      </tr>
    `)
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Nouvelle commande de produit digital</h1>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #166534; font-weight: 600;">
              Commande #${notification.orderNumber}
            </p>
          </div>

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Informations client</h2>
          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Nom:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500;">${notification.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0; color: #111827;">
                <a href="mailto:${notification.customerEmail}" style="color: #4f46e5;">${notification.customerEmail}</a>
              </td>
            </tr>
          </table>

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Produits commandés</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Produit</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qté</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="background-color: #f9fafb;">
                <td colspan="2" style="padding: 12px; font-weight: 600;">Total</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #4f46e5;">
                  ${formatPrice(notification.totalAmount, notification.currency)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⚠️ Action requise:</strong> Veuillez vous assurer que le client a bien accès aux fichiers digitaux associés à sa commande.
            </p>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Cet email a été envoyé automatiquement par Neosaas
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Génère le contenu HTML de l'email pour une réservation de RDV
 */
function generateAppointmentEmailHtml(notification: TeamNotification): string {
  const appointmentInfo = notification.appointmentDetails
    ? `
      <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Détails du rendez-vous</h2>
      <table style="width: 100%; margin-bottom: 24px; background-color: #f0f9ff; border-radius: 8px; padding: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Date et heure:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">
            ${formatDate(notification.appointmentDetails.startTime, notification.appointmentDetails.timezone)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Fin prévue:</td>
          <td style="padding: 8px 0; color: #111827;">
            ${formatDate(notification.appointmentDetails.endTime, notification.appointmentDetails.timezone)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Fuseau horaire:</td>
          <td style="padding: 8px 0; color: #111827;">${notification.appointmentDetails.timezone}</td>
        </tr>
        ${notification.appointmentDetails.notes ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Notes:</td>
            <td style="padding: 8px 0; color: #111827;">${notification.appointmentDetails.notes}</td>
          </tr>
        ` : ''}
      </table>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background-color: #059669; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📅 Nouvelle réservation de rendez-vous</h1>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #047857; font-weight: 600;">
              Réservation #${notification.orderNumber}
            </p>
          </div>

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Informations client</h2>
          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Nom:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500;">${notification.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0; color: #111827;">
                <a href="mailto:${notification.customerEmail}" style="color: #059669;">${notification.customerEmail}</a>
              </td>
            </tr>
          </table>

          ${appointmentInfo}

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Service réservé</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Service</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${notification.items.map(item => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${item.price > 0 ? formatPrice(item.price, notification.currency) : 'Gratuit'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; font-weight: 600;">Total</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #059669;">
                  ${notification.totalAmount > 0 ? formatPrice(notification.totalAmount, notification.currency) : 'Gratuit'}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>📌 Rappel:</strong> Le rendez-vous a été ajouté au calendrier Neosaas. Pensez à confirmer avec le client si nécessaire.
            </p>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Cet email a été envoyé automatiquement par Neosaas
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Envoie une notification à l'équipe pour un achat de produit digital
 */
export async function notifyTeamDigitalProductPurchase(
  notification: TeamNotification
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmails = await getAdminEmails()
    const fallbackEmail = await getNotificationEmail()

    const recipients = adminEmails.length > 0
      ? adminEmails
      : fallbackEmail
        ? [fallbackEmail]
        : []

    if (recipients.length === 0) {
      console.warn('[Team Notifications] No recipients configured for team notifications')
      return { success: false, error: 'No recipients configured' }
    }

    const htmlContent = generateDigitalProductEmailHtml(notification)
    const subject = `[Neosaas] Nouvelle commande de produit digital #${notification.orderNumber}`

    const result = await emailRouter.sendWithFallback({
      to: recipients,
      subject,
      htmlContent,
      textContent: `Nouvelle commande de produit digital #${notification.orderNumber} par ${notification.customerName} (${notification.customerEmail}). Total: ${formatPrice(notification.totalAmount, notification.currency)}`,
      tags: ['team-notification', 'digital-product', notification.orderNumber]
    })

    if (result.success) {
      console.log('[Team Notifications] Digital product notification sent:', {
        orderNumber: notification.orderNumber,
        recipients: recipients.length,
        messageId: result.messageId
      })
    } else {
      console.error('[Team Notifications] Failed to send digital product notification:', result.error)
    }

    return { success: result.success, error: result.error }
  } catch (error) {
    console.error('[Team Notifications] Error sending digital product notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Envoie une notification à l'équipe pour une réservation de RDV
 */
export async function notifyTeamAppointmentBooking(
  notification: TeamNotification
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmails = await getAdminEmails()
    const fallbackEmail = await getNotificationEmail()

    const recipients = adminEmails.length > 0
      ? adminEmails
      : fallbackEmail
        ? [fallbackEmail]
        : []

    if (recipients.length === 0) {
      console.warn('[Team Notifications] No recipients configured for team notifications')
      return { success: false, error: 'No recipients configured' }
    }

    const htmlContent = generateAppointmentEmailHtml(notification)
    const subject = `[Neosaas] Nouvelle réservation de RDV #${notification.orderNumber}`

    const result = await emailRouter.sendWithFallback({
      to: recipients,
      subject,
      htmlContent,
      textContent: `Nouvelle réservation de RDV #${notification.orderNumber} par ${notification.customerName} (${notification.customerEmail}). ${notification.appointmentDetails ? `Date: ${formatDate(notification.appointmentDetails.startTime, notification.appointmentDetails.timezone)}` : ''}`,
      tags: ['team-notification', 'appointment', notification.orderNumber]
    })

    if (result.success) {
      console.log('[Team Notifications] Appointment notification sent:', {
        orderNumber: notification.orderNumber,
        recipients: recipients.length,
        messageId: result.messageId
      })
    } else {
      console.error('[Team Notifications] Failed to send appointment notification:', result.error)
    }

    return { success: result.success, error: result.error }
  } catch (error) {
    console.error('[Team Notifications] Error sending appointment notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Envoie une notification générique à l'équipe pour une nouvelle commande
 */
export async function notifyTeamNewOrder(
  notification: TeamNotification
): Promise<{ success: boolean; error?: string }> {
  // Dispatcher vers le bon type de notification
  const hasDigitalProducts = notification.items.some(item => item.type === 'digital')
  const hasAppointments = notification.items.some(item => item.type === 'appointment')

  const results: { success: boolean; error?: string }[] = []

  if (hasDigitalProducts) {
    const digitalNotification = {
      ...notification,
      items: notification.items.filter(item => item.type === 'digital')
    }
    results.push(await notifyTeamDigitalProductPurchase(digitalNotification))
  }

  if (hasAppointments) {
    results.push(await notifyTeamAppointmentBooking(notification))
  }

  // Si pas de produits spéciaux, envoyer une notification générique
  if (!hasDigitalProducts && !hasAppointments) {
    // On peut utiliser le template digital product comme base
    results.push(await notifyTeamDigitalProductPurchase(notification))
  }

  const allSuccessful = results.every(r => r.success)
  const errors = results.filter(r => r.error).map(r => r.error).join(', ')

  return {
    success: allSuccessful,
    error: errors || undefined
  }
}
