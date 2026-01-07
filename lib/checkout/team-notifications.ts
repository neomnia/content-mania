/**
 * Notification service for the Neosaas team
 * Sends notification emails for various purchase events
 */

import { db } from '@/db'
import { users, roles, userRoles, platformConfig } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { emailRouter } from '@/lib/email'
import type { TeamNotification, ProductType } from './types'

/**
 * Get admin team emails for notifications
 */
async function getAdminEmails(): Promise<string[]> {
  // Look for the admin role
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

  // Get users with these roles
  const adminUsers = await db.query.userRoles.findMany({
    where: (ur, { inArray }) => inArray(ur.roleId, roleIds),
    with: {
      user: true
    }
  })

  const emails = adminUsers
    .filter(ur => ur.user && ur.user.isActive && ur.user.email)
    .map(ur => ur.user.email)

  // Remove duplicates
  return [...new Set(emails)]
}

/**
 * Get the configured notification email (fallback)
 */
async function getNotificationEmail(): Promise<string | null> {
  const config = await db.query.platformConfig.findFirst({
    where: eq(platformConfig.key, 'notification_email')
  })

  return config?.value || process.env.NOTIFICATION_EMAIL || null
}

/**
 * Format price for display
 */
function formatPrice(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amountCents / 100)
}

/**
 * Format date for display
 */
function formatDate(date: Date, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone || 'Europe/Paris'
  }).format(date)
}

/**
 * Generate HTML email content for a digital product
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
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New digital product order</h1>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #166534; font-weight: 600;">
              Order #${notification.orderNumber}
            </p>
          </div>

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Customer information</h2>
          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Name:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500;">${notification.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0; color: #111827;">
                <a href="mailto:${notification.customerEmail}" style="color: #4f46e5;">${notification.customerEmail}</a>
              </td>
            </tr>
          </table>

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Products ordered</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
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
              <strong>⚠️ Action required:</strong> Please ensure the customer has access to the digital files associated with their order.
            </p>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This email was sent automatically by Neosaas
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML email content for an appointment booking
 */
function generateAppointmentEmailHtml(notification: TeamNotification): string {
  const appointmentInfo = notification.appointmentDetails
    ? `
      <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Appointment details</h2>
      <table style="width: 100%; margin-bottom: 24px; background-color: #f0f9ff; border-radius: 8px; padding: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Date and time:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">
            ${formatDate(notification.appointmentDetails.startTime, notification.appointmentDetails.timezone)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Expected end:</td>
          <td style="padding: 8px 0; color: #111827;">
            ${formatDate(notification.appointmentDetails.endTime, notification.appointmentDetails.timezone)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Timezone:</td>
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
          <h1 style="color: white; margin: 0; font-size: 24px;">📅 New appointment booking</h1>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #047857; font-weight: 600;">
              Booking #${notification.orderNumber}
            </p>
          </div>

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Customer information</h2>
          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Name:</td>
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

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Service booked</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Service</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${notification.items.map(item => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${item.price > 0 ? formatPrice(item.price, notification.currency) : 'Free'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; font-weight: 600;">Total</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #059669;">
                  ${notification.totalAmount > 0 ? formatPrice(notification.totalAmount, notification.currency) : 'Free'}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>📌 Reminder:</strong> The appointment has been added to the Neosaas calendar. Remember to confirm with the customer if necessary.
            </p>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This email was sent automatically by Neosaas
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send a notification to the team for a digital product purchase
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
    const subject = `[Neosaas] New digital product order #${notification.orderNumber}`

    const result = await emailRouter.sendWithFallback({
      to: recipients,
      subject,
      htmlContent,
      textContent: `New digital product order #${notification.orderNumber} by ${notification.customerName} (${notification.customerEmail}). Total: ${formatPrice(notification.totalAmount, notification.currency)}`,
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
 * Send a notification to the team for an appointment booking
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
    const subject = `[Neosaas] New appointment booking #${notification.orderNumber}`

    const result = await emailRouter.sendWithFallback({
      to: recipients,
      subject,
      htmlContent,
      textContent: `New appointment booking #${notification.orderNumber} by ${notification.customerName} (${notification.customerEmail}). ${notification.appointmentDetails ? `Date: ${formatDate(notification.appointmentDetails.startTime, notification.appointmentDetails.timezone)}` : ''}`,
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
 * Generate HTML email content for a physical product
 */
function generatePhysicalProductEmailHtml(notification: TeamNotification): string {
  const itemsList = notification.items
    .map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${item.isFree ? 'Free' : formatPrice(item.price, notification.currency)}
        </td>
      </tr>
    `)
    .join('')

  const shippingInfo = notification.shippingAddress
    ? `
      <h2 style="color: #374151; margin: 24px 0 16px 0; font-size: 18px;">📦 Shipping address</h2>
      <div style="background-color: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">${notification.shippingAddress.name}</p>
        <p style="margin: 0 0 4px 0;">${notification.shippingAddress.street}</p>
        <p style="margin: 0 0 4px 0;">${notification.shippingAddress.postalCode} ${notification.shippingAddress.city}</p>
        <p style="margin: 0 0 4px 0;">${notification.shippingAddress.country}</p>
        ${notification.shippingAddress.phone ? `<p style="margin: 8px 0 0 0; color: #6b7280;">📞 ${notification.shippingAddress.phone}</p>` : ''}
      </div>
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
        <div style="background-color: #ea580c; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📦 New physical product order</h1>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #c2410c; font-weight: 600;">
              ⚡ ACTION REQUIRED: Order #${notification.orderNumber} - To be shipped
            </p>
          </div>

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Customer information</h2>
          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Name:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500;">${notification.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0; color: #111827;">
                <a href="mailto:${notification.customerEmail}" style="color: #ea580c;">${notification.customerEmail}</a>
              </td>
            </tr>
          </table>

          ${shippingInfo}

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Products ordered</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="background-color: #f9fafb;">
                <td colspan="2" style="padding: 12px; font-weight: 600;">Total</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #ea580c;">
                  ${notification.totalAmount > 0 ? formatPrice(notification.totalAmount, notification.currency) : 'Free'}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; color: #b91c1c; font-size: 14px;">
              <strong>🚨 Important:</strong> Please ship this order as soon as possible and update the shipping status in admin.
            </p>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/admin/orders" style="display: inline-block; background-color: #ea580c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              Manage order
            </a>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This email was sent automatically by Neosaas
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML email content for consulting
 */
function generateConsultingEmailHtml(notification: TeamNotification): string {
  const appointmentInfo = notification.appointmentDetails
    ? `
      <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Appointment details</h2>
      <table style="width: 100%; margin-bottom: 24px; background-color: #f5f3ff; border-radius: 8px; padding: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Date and time:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">
            ${formatDate(notification.appointmentDetails.startTime, notification.appointmentDetails.timezone)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Expected end:</td>
          <td style="padding: 8px 0; color: #111827;">
            ${formatDate(notification.appointmentDetails.endTime, notification.appointmentDetails.timezone)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Mode:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">
            ${notification.appointmentDetails.consultingMode === 'packaged' ? '📦 Package (paid)' : '⏱️ Hourly (post-session billing)'}
          </td>
        </tr>
        ${notification.appointmentDetails.hourlyRate ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Hourly rate:</td>
            <td style="padding: 8px 0; color: #111827;">${formatPrice(notification.appointmentDetails.hourlyRate, notification.currency)}/h</td>
          </tr>
        ` : ''}
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
        <div style="background-color: #7c3aed; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">👥 New consulting booking</h1>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #6d28d9; font-weight: 600;">
              Booking #${notification.orderNumber}
            </p>
          </div>

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Customer information</h2>
          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Name:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500;">${notification.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0; color: #111827;">
                <a href="mailto:${notification.customerEmail}" style="color: #7c3aed;">${notification.customerEmail}</a>
              </td>
            </tr>
          </table>

          ${appointmentInfo}

          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Service booked</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Service</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${notification.items.map(item => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${item.isFree ? 'Free' : item.price > 0 ? formatPrice(item.price, notification.currency) : 'On quote'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; font-weight: 600;">Total</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #7c3aed;">
                  ${notification.totalAmount > 0 ? formatPrice(notification.totalAmount, notification.currency) : 'Free / On quote'}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>📌 Reminder:</strong> The appointment has been added to the calendar. Remember to confirm with the customer if necessary.
            </p>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This email was sent automatically by Neosaas
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send a notification to the team for a physical product purchase
 */
export async function notifyTeamPhysicalProductPurchase(
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

    const htmlContent = generatePhysicalProductEmailHtml(notification)
    const subject = `[URGENT] New physical order to ship #${notification.orderNumber}`

    const result = await emailRouter.sendWithFallback({
      to: recipients,
      subject,
      htmlContent,
      textContent: `URGENT: New physical order #${notification.orderNumber} by ${notification.customerName} (${notification.customerEmail}). Total: ${formatPrice(notification.totalAmount, notification.currency)}. Ship as soon as possible.`,
      tags: ['team-notification', 'physical-product', 'urgent', notification.orderNumber]
    })

    if (result.success) {
      console.log('[Team Notifications] Physical product notification sent:', {
        orderNumber: notification.orderNumber,
        recipients: recipients.length,
        messageId: result.messageId
      })
    } else {
      console.error('[Team Notifications] Failed to send physical product notification:', result.error)
    }

    return { success: result.success, error: result.error }
  } catch (error) {
    console.error('[Team Notifications] Error sending physical product notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send a notification to the team for a consulting booking
 */
export async function notifyTeamConsultingBooking(
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

    const htmlContent = generateConsultingEmailHtml(notification)
    const subject = `[Neosaas] New consulting booking #${notification.orderNumber}`

    const result = await emailRouter.sendWithFallback({
      to: recipients,
      subject,
      htmlContent,
      textContent: `New consulting booking #${notification.orderNumber} by ${notification.customerName} (${notification.customerEmail}). ${notification.appointmentDetails ? `Date: ${formatDate(notification.appointmentDetails.startTime, notification.appointmentDetails.timezone)}` : ''}`,
      tags: ['team-notification', 'consulting', notification.orderNumber]
    })

    if (result.success) {
      console.log('[Team Notifications] Consulting notification sent:', {
        orderNumber: notification.orderNumber,
        recipients: recipients.length,
        messageId: result.messageId
      })
    } else {
      console.error('[Team Notifications] Failed to send consulting notification:', result.error)
    }

    return { success: result.success, error: result.error }
  } catch (error) {
    console.error('[Team Notifications] Error sending consulting notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send a generic notification to the team for a new order
 */
export async function notifyTeamNewOrder(
  notification: TeamNotification
): Promise<{ success: boolean; error?: string }> {
  // Dispatcher vers le bon type de notification
  const hasPhysicalProducts = notification.items.some(item => item.type === 'physical')
  const hasDigitalProducts = notification.items.some(item => item.type === 'digital')
  const hasConsulting = notification.items.some(item => item.type === 'consulting')
  const hasAppointments = notification.items.some(item => item.type === 'appointment')

  const results: { success: boolean; error?: string }[] = []

  if (hasPhysicalProducts) {
    const physicalNotification = {
      ...notification,
      items: notification.items.filter(item => item.type === 'physical')
    }
    results.push(await notifyTeamPhysicalProductPurchase(physicalNotification))
  }

  if (hasDigitalProducts) {
    const digitalNotification = {
      ...notification,
      items: notification.items.filter(item => item.type === 'digital')
    }
    results.push(await notifyTeamDigitalProductPurchase(digitalNotification))
  }

  if (hasConsulting) {
    results.push(await notifyTeamConsultingBooking(notification))
  }

  if (hasAppointments) {
    results.push(await notifyTeamAppointmentBooking(notification))
  }

  // Si pas de produits spéciaux, envoyer une notification générique
  if (!hasPhysicalProducts && !hasDigitalProducts && !hasConsulting && !hasAppointments) {
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
