/**
 * Email Templates for Checkout Flow
 *
 * This file contains all email templates used in the checkout process:
 * - Order confirmation (payment validation)
 * - Appointment booking confirmation (calendar validation)
 * - Appointment request (pending admin validation)
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format date for French locale
 */
function formatDateFR(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone
  }).format(date)
}

/**
 * Format price for French locale
 */
function formatPriceFR(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount / 100)
}

// =============================================================================
// ORDER CONFIRMATION EMAIL (Payment Validation)
// =============================================================================

export interface OrderConfirmationEmailParams {
  customerName: string
  orderNumber: string
  items: { name: string; quantity: number; price: number }[]
  totalAmount: number
  currency: string
  testMode: boolean
}

/**
 * Generate order confirmation email
 * Used when a payment is validated
 */
export function generateOrderConfirmationEmail(params: OrderConfirmationEmailParams): string {
  const formatPrice = (amount: number) => formatPriceFR(amount, params.currency)

  const itemsHtml = params.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Commande confirmée</h1>
        </div>
        <div style="padding: 30px;">
          <p>Bonjour ${params.customerName},</p>
          <p>Merci pour votre commande ! Votre paiement a été validé avec succès.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left;">Produit</th>
                <th style="padding: 12px; text-align: center;">Qté</th>
                <th style="padding: 12px; text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f9fafb;">
                <td colspan="2" style="padding: 12px; font-weight: bold;">Total payé</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; color: #4f46e5;">${formatPrice(params.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="color: #6b7280;">Commande #${params.orderNumber}</p>

          ${params.testMode ? '<p style="background: #fef3c7; padding: 10px; border-radius: 4px; color: #92400e; font-size: 12px;">⚠️ Mode test activé - Ceci est une confirmation de test</p>' : ''}

          <p>À bientôt,<br>L'équipe Neosaas</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// =============================================================================
// APPOINTMENT BOOKING EMAIL (Calendar Validation)
// =============================================================================

export interface AppointmentBookingEmailParams {
  customerName: string
  productTitle: string
  startTime: Date
  endTime: Date
  timezone: string
  location?: string
  meetingUrl?: string
  notes?: string
  orderNumber: string
  testMode: boolean
}

/**
 * Generate appointment booking confirmation email
 * Used when an appointment is confirmed/validated by admin
 * Focuses on calendar details (date, time, location)
 */
export function generateAppointmentBookingEmail(params: AppointmentBookingEmailParams): string {
  const formatDate = (date: Date) => formatDateFR(date, params.timezone)

  // Calculate duration
  const durationMs = params.endTime.getTime() - params.startTime.getTime()
  const durationMinutes = Math.round(durationMs / (1000 * 60))
  const durationText = durationMinutes >= 60
    ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? durationMinutes % 60 : ''}`
    : `${durationMinutes} min`

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">📅 Rendez-vous confirmé</h1>
        </div>
        <div style="padding: 30px;">
          <p>Bonjour ${params.customerName},</p>
          <p>Votre rendez-vous a été confirmé et ajouté à votre calendrier.</p>

          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #047857;">${params.productTitle}</h3>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;">📆 Date</td>
                <td style="padding: 8px 0; font-weight: 500;">${formatDate(params.startTime)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">⏱️ Durée</td>
                <td style="padding: 8px 0; font-weight: 500;">${durationText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">🌍 Fuseau</td>
                <td style="padding: 8px 0;">${params.timezone}</td>
              </tr>
              ${params.location ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">📍 Lieu</td>
                <td style="padding: 8px 0;">${params.location}</td>
              </tr>
              ` : ''}
              ${params.meetingUrl ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">🔗 Lien</td>
                <td style="padding: 8px 0;"><a href="${params.meetingUrl}" style="color: #059669;">${params.meetingUrl}</a></td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${params.notes ? `
          <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Notes:</strong> ${params.notes}</p>
          </div>
          ` : ''}

          <div style="background: #eff6ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              💡 <strong>Rappel:</strong> Pensez à vous connecter quelques minutes avant l'heure prévue.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 12px;">Référence: ${params.orderNumber}</p>

          ${params.testMode ? '<p style="background: #fef3c7; padding: 10px; border-radius: 4px; color: #92400e; font-size: 12px;">⚠️ Mode test activé - Ceci est une confirmation de test</p>' : ''}

          <p>À bientôt,<br>L'équipe Neosaas</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// =============================================================================
// APPOINTMENT REQUEST EMAIL (Pending Validation)
// =============================================================================

export interface AppointmentRequestEmailParams {
  customerName: string
  productTitle: string
  requestedStartTime: Date
  requestedEndTime: Date
  timezone: string
  notes?: string
  orderNumber: string
  testMode: boolean
}

/**
 * Generate appointment request email
 * Used when a client submits an appointment request (before admin validation)
 */
export function generateAppointmentRequestEmail(params: AppointmentRequestEmailParams): string {
  const formatDate = (date: Date) => formatDateFR(date, params.timezone)

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #f59e0b, #fbbf24); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⏳ Demande de rendez-vous reçue</h1>
        </div>
        <div style="padding: 30px;">
          <p>Bonjour ${params.customerName},</p>
          <p>Nous avons bien reçu votre demande de rendez-vous. Notre équipe va l'examiner et vous confirmer le créneau dans les plus brefs délais.</p>

          <div style="background: #fffbeb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #b45309;">${params.productTitle}</h3>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">📆 Créneau demandé</td>
                <td style="padding: 8px 0;">${formatDate(params.requestedStartTime)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">🌍 Fuseau horaire</td>
                <td style="padding: 8px 0;">${params.timezone}</td>
              </tr>
            </table>
          </div>

          ${params.notes ? `
          <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Votre message:</strong> ${params.notes}</p>
          </div>
          ` : ''}

          <div style="background: #f0fdf4; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #047857; font-size: 14px;">
              ✅ <strong>Prochaine étape:</strong> Vous recevrez un email de confirmation une fois votre rendez-vous validé par notre équipe.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 12px;">Référence: ${params.orderNumber}</p>

          ${params.testMode ? '<p style="background: #fef3c7; padding: 10px; border-radius: 4px; color: #92400e; font-size: 12px;">⚠️ Mode test activé - Ceci est une confirmation de test</p>' : ''}

          <p>À bientôt,<br>L'équipe Neosaas</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// =============================================================================
// APPOINTMENT WITH PAYMENT EMAIL (Combined)
// =============================================================================

export interface AppointmentWithPaymentEmailParams {
  customerName: string
  productTitle: string
  startTime: Date
  endTime: Date
  timezone: string
  location?: string
  meetingUrl?: string
  isPaid: boolean
  price: number
  currency: string
  orderNumber: string
  testMode: boolean
}

/**
 * Generate appointment confirmation with payment details
 * Used when appointment is booked AND payment is required/completed
 */
export function generateAppointmentWithPaymentEmail(params: AppointmentWithPaymentEmailParams): string {
  const formatDate = (date: Date) => formatDateFR(date, params.timezone)
  const formatPrice = (amount: number) => formatPriceFR(amount, params.currency)

  // Calculate duration
  const durationMs = params.endTime.getTime() - params.startTime.getTime()
  const durationMinutes = Math.round(durationMs / (1000 * 60))
  const durationText = durationMinutes >= 60
    ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? durationMinutes % 60 : ''}`
    : `${durationMinutes} min`

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Rendez-vous confirmé</h1>
        </div>
        <div style="padding: 30px;">
          <p>Bonjour ${params.customerName},</p>
          <p>Votre rendez-vous a été enregistré avec succès.</p>

          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #047857;">${params.productTitle}</h3>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;">📆 Date</td>
                <td style="padding: 8px 0; font-weight: 500;">${formatDate(params.startTime)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">⏱️ Durée</td>
                <td style="padding: 8px 0; font-weight: 500;">${durationText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">🌍 Fuseau</td>
                <td style="padding: 8px 0;">${params.timezone}</td>
              </tr>
              ${params.location ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">📍 Lieu</td>
                <td style="padding: 8px 0;">${params.location}</td>
              </tr>
              ` : ''}
              ${params.meetingUrl ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">🔗 Lien</td>
                <td style="padding: 8px 0;"><a href="${params.meetingUrl}" style="color: #059669;">${params.meetingUrl}</a></td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${params.isPaid ? `
          <div style="background: #eff6ff; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0;">
              <strong style="color: #1e40af;">💳 Paiement:</strong>
              <span style="color: #047857; font-weight: bold;">${formatPrice(params.price)}</span>
              <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">✓ Payé</span>
            </p>
          </div>
          ` : `
          <div style="background: #f0fdf4; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #047857;"><strong>💰 Montant:</strong> Gratuit</p>
          </div>
          `}

          <p style="color: #6b7280; font-size: 12px;">Référence: ${params.orderNumber}</p>

          ${params.testMode ? '<p style="background: #fef3c7; padding: 10px; border-radius: 4px; color: #92400e; font-size: 12px;">⚠️ Mode test activé - Ceci est une confirmation de test</p>' : ''}

          <p>À bientôt,<br>L'équipe Neosaas</p>
        </div>
      </div>
    </body>
    </html>
  `
}
