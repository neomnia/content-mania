'use server'

import { emailRouter } from '@/lib/email'
import { db } from '@/db'
import { platformConfig, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendAdminNotification } from './admin-notifications'

interface AppointmentEmailParams {
  appointmentId: string
  productTitle: string
  startTime: Date
  endTime: Date
  timezone: string
  attendeeName: string
  attendeeEmail: string
  attendeePhone?: string
  price: number
  currency: string
  notes?: string
}

/**
 * Format date for French locale
 */
function formatDateFR(date: Date, timezone: string = 'Europe/Paris'): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  }).format(date)
}

/**
 * Format price for display
 */
function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount / 100)
}

/**
 * Get site configuration
 */
async function getSiteConfig(): Promise<{ siteName: string, siteUrl: string, adminEmail: string }> {
  try {
    const configs = await db.select()
      .from(platformConfig)
      .where(
        eq(platformConfig.key, 'site_name')
      )

    const siteNameConfig = configs.find(c => c.key === 'site_name')

    // Get admin email from first admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'admin')
    })

    return {
      siteName: siteNameConfig?.value || 'NeoSaaS',
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://neosaas.tech',
      adminEmail: adminUser?.email || 'admin@neomia.net'
    }
  } catch (error) {
    console.error('[AppointmentNotifications] Failed to get site config:', error)
    return {
      siteName: 'NeoSaaS',
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://neosaas.tech',
      adminEmail: 'admin@neomia.net'
    }
  }
}

/**
 * Send appointment confirmation email to client
 */
export async function sendAppointmentConfirmationToClient(params: AppointmentEmailParams): Promise<{ success: boolean, error?: string }> {
  const { siteName, siteUrl } = await getSiteConfig()

  const formattedDate = formatDateFR(params.startTime, params.timezone)
  const formattedEndTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: params.timezone
  }).format(params.endTime)

  const priceDisplay = params.price > 0 ? formatPrice(params.price, params.currency) : 'Gratuit'

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de rendez-vous</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #CD7F32 0%, #B8860B 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Rendez-vous confirme !</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${params.attendeeName}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Votre rendez-vous a ete confirme avec succes. Voici les details :
              </p>

              <!-- Appointment Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Service :</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${params.productTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Date :</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Fin :</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${formattedEndTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Prix :</td>
                    <td style="padding: 8px 0; color: #CD7F32; font-size: 16px; font-weight: 700; text-align: right;">${priceDisplay}</td>
                  </tr>
                </table>
              </div>

              ${params.notes ? `
              <div style="background-color: #FEF3C7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">
                  <strong>Notes :</strong> ${params.notes}
                </p>
              </div>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0; width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${siteUrl}/dashboard/appointments" style="display: inline-block; padding: 14px 32px; background-color: #CD7F32; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Voir mes rendez-vous
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Des questions ? N'hesitez pas a nous contacter.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                &copy; 2026 ${siteName}. Tous droits reserves.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const textContent = `
Rendez-vous confirme !

Bonjour ${params.attendeeName},

Votre rendez-vous a ete confirme avec succes. Voici les details :

Service : ${params.productTitle}
Date : ${formattedDate}
Fin : ${formattedEndTime}
Prix : ${priceDisplay}
${params.notes ? `Notes : ${params.notes}` : ''}

Voir mes rendez-vous : ${siteUrl}/dashboard/appointments

Des questions ? N'hesitez pas a nous contacter.

&copy; 2026 ${siteName}. Tous droits reserves.
  `

  try {
    console.log('[AppointmentNotifications] Sending confirmation email to client:', params.attendeeEmail)

    const result = await emailRouter.sendEmail({
      to: [params.attendeeEmail],
      subject: `Confirmation de votre rendez-vous - ${params.productTitle}`,
      htmlContent,
      textContent
    })

    console.log('[AppointmentNotifications] Client email result:', result)
    return { success: result.success, error: result.error }
  } catch (error: any) {
    console.error('[AppointmentNotifications] Failed to send client email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send appointment notification email to admin
 */
export async function sendAppointmentNotificationToAdmin(params: AppointmentEmailParams): Promise<{ success: boolean, error?: string }> {
  const { siteName, siteUrl, adminEmail } = await getSiteConfig()

  const formattedDate = formatDateFR(params.startTime, params.timezone)
  const formattedEndTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: params.timezone
  }).format(params.endTime)

  const priceDisplay = params.price > 0 ? formatPrice(params.price, params.currency) : 'Gratuit'

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau rendez-vous</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Nouveau rendez-vous !</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Un nouveau rendez-vous vient d'etre reserve sur <strong>${siteName}</strong>.
              </p>

              <!-- Client Info -->
              <div style="background-color: #EBF5FF; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px; color: #1E40AF; font-size: 16px;">Informations client</h3>
                <p style="margin: 4px 0; color: #333333; font-size: 14px;"><strong>Nom :</strong> ${params.attendeeName}</p>
                <p style="margin: 4px 0; color: #333333; font-size: 14px;"><strong>Email :</strong> ${params.attendeeEmail}</p>
                ${params.attendeePhone ? `<p style="margin: 4px 0; color: #333333; font-size: 14px;"><strong>Telephone :</strong> ${params.attendeePhone}</p>` : ''}
              </div>

              <!-- Appointment Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #333333; font-size: 16px;">Details du rendez-vous</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Service :</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${params.productTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Date :</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Fin :</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${formattedEndTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Prix :</td>
                    <td style="padding: 8px 0; color: #10B981; font-size: 16px; font-weight: 700; text-align: right;">${priceDisplay}</td>
                  </tr>
                </table>
              </div>

              ${params.notes ? `
              <div style="background-color: #FEF3C7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">
                  <strong>Notes du client :</strong> ${params.notes}
                </p>
              </div>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0; width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${siteUrl}/admin/calendar" style="display: inline-block; padding: 14px 32px; background-color: #10B981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Voir le calendrier
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
                Notification automatique de ${siteName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const textContent = `
Nouveau rendez-vous !

Un nouveau rendez-vous vient d'etre reserve sur ${siteName}.

INFORMATIONS CLIENT
Nom : ${params.attendeeName}
Email : ${params.attendeeEmail}
${params.attendeePhone ? `Telephone : ${params.attendeePhone}` : ''}

DETAILS DU RENDEZ-VOUS
Service : ${params.productTitle}
Date : ${formattedDate}
Fin : ${formattedEndTime}
Prix : ${priceDisplay}
${params.notes ? `Notes : ${params.notes}` : ''}

Voir le calendrier : ${siteUrl}/admin/calendar

Notification automatique de ${siteName}
  `

  try {
    console.log('[AppointmentNotifications] Sending notification email to admin:', adminEmail)

    const result = await emailRouter.sendEmail({
      to: [adminEmail],
      subject: `[NOUVEAU RDV] ${params.productTitle} - ${params.attendeeName}`,
      htmlContent,
      textContent
    })

    console.log('[AppointmentNotifications] Admin email result:', result)
    return { success: result.success, error: result.error }
  } catch (error: any) {
    console.error('[AppointmentNotifications] Failed to send admin email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send all appointment notifications (client email, admin email, admin chat notification)
 */
export async function sendAllAppointmentNotifications(params: AppointmentEmailParams & { userId?: string }): Promise<{
  clientEmail: { success: boolean, error?: string }
  adminEmail: { success: boolean, error?: string }
  adminChat: { success: boolean, error?: string }
}> {
  console.log('[AppointmentNotifications] Sending all notifications for appointment:', params.appointmentId)

  // Send all notifications in parallel
  const [clientEmailResult, adminEmailResult, adminChatResult] = await Promise.all([
    // 1. Email to client
    sendAppointmentConfirmationToClient(params),

    // 2. Email to admin
    sendAppointmentNotificationToAdmin(params),

    // 3. Chat notification to admin
    sendAdminNotification({
      subject: `Nouveau RDV: ${params.productTitle}`,
      message: `**Nouveau rendez-vous reserve !**

**Client:** ${params.attendeeName}
**Email:** ${params.attendeeEmail}
${params.attendeePhone ? `**Telephone:** ${params.attendeePhone}` : ''}

**Service:** ${params.productTitle}
**Date:** ${formatDateFR(params.startTime, params.timezone)}
**Prix:** ${params.price > 0 ? formatPrice(params.price, params.currency) : 'Gratuit'}

${params.notes ? `**Notes:** ${params.notes}` : ''}`,
      type: 'appointment',
      userId: params.userId,
      userEmail: params.attendeeEmail,
      userName: params.attendeeName,
      priority: 'high',
      metadata: {
        appointmentId: params.appointmentId,
        productTitle: params.productTitle,
        startTime: params.startTime.toISOString(),
        endTime: params.endTime.toISOString(),
        price: params.price,
        currency: params.currency
      }
    }).then(() => ({ success: true })).catch((error) => ({ success: false, error: error.message }))
  ])

  console.log('[AppointmentNotifications] Results:', {
    clientEmail: clientEmailResult,
    adminEmail: adminEmailResult,
    adminChat: adminChatResult
  })

  return {
    clientEmail: clientEmailResult,
    adminEmail: adminEmailResult,
    adminChat: adminChatResult
  }
}
