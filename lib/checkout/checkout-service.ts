/**
 * Service de Checkout Unifié
 * Gère le tunnel d'achat selon le type de produit:
 * - standard: Checkout classique avec paiement
 * - digital: Checkout + email équipe
 * - free: Pas de paiement
 * - appointment: Réservation calendrier + paiement optionnel
 */

import { db } from '@/db'
import {
  products,
  carts,
  cartItems,
  orders,
  orderItems,
  appointments,
  users,
  companies
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getLagoClient } from '@/lib/lago'
import { createTestInvoice, createTestCustomer, shouldUseTestMode, simulateTestPayment } from './lago-test-mode'
import { notifyTeamDigitalProductPurchase, notifyTeamAppointmentBooking } from './team-notifications'
import { notifyAdminNewOrder, notifyAdminNewAppointment } from '@/lib/notifications/admin-notifications'
import { syncAppointmentToCalendars } from '@/lib/calendar/sync'
import { emailRouter } from '@/lib/email'
import type { CheckoutResult, AppointmentBookingData, ProductType, TeamNotification } from './types'

interface CheckoutParams {
  cartId?: string
  appointmentData?: AppointmentBookingData
  userId: string
  userEmail: string
  userName: string
  companyId?: string
}

/**
 * Génère un numéro de commande unique
 */
function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${year}${month}${day}-${random}`
}

/**
 * Récupère ou crée un client Lago
 */
async function getOrCreateLagoCustomer(params: {
  userId: string
  userEmail: string
  userName: string
  companyId?: string
  companyName?: string
}): Promise<{ lagoId: string; testMode: boolean }> {
  const useTestMode = await shouldUseTestMode()

  if (useTestMode) {
    const testCustomer = await createTestCustomer({
      externalId: params.companyId || params.userId,
      email: params.userEmail,
      name: params.companyName || params.userName
    })
    return { lagoId: testCustomer.lagoId, testMode: true }
  }

  // Mode production - utiliser Lago réel
  try {
    const lago = await getLagoClient()

    // Vérifier si le client existe dans la DB
    if (params.companyId) {
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, params.companyId)
      })
      if (company?.lagoId) {
        return { lagoId: company.lagoId, testMode: false }
      }
    }

    // Créer le client dans Lago
    const result = await lago.customers.createCustomer({
      customer: {
        external_id: params.companyId || params.userId,
        name: params.companyName || params.userName,
        email: params.userEmail,
        billing_configuration: {
          invoice_grace_period: 3,
          document_locale: 'fr',
        },
      },
    })

    const lagoId = result.data.customer.lago_id

    // Sauvegarder le Lago ID dans la company si applicable
    if (params.companyId && lagoId) {
      await db.update(companies)
        .set({ lagoId, updatedAt: new Date() })
        .where(eq(companies.id, params.companyId))
    }

    return { lagoId: lagoId || '', testMode: false }
  } catch (error) {
    console.error('[Checkout] Lago customer creation failed, falling back to test mode:', error)
    // Fallback vers le mode test
    const testCustomer = await createTestCustomer({
      externalId: params.companyId || params.userId,
      email: params.userEmail,
      name: params.companyName || params.userName
    })
    return { lagoId: testCustomer.lagoId, testMode: true }
  }
}

/**
 * Crée une facture via Lago (mode réel ou test)
 */
async function createLagoInvoice(params: {
  customerId: string
  customerEmail: string
  customerName: string
  items: { description: string; unitAmountCents: number; quantity: number }[]
  currency: string
  testMode: boolean
}): Promise<{
  invoiceId: string
  invoiceNumber: string
  amount: number
  status: string
  testMode: boolean
}> {
  if (params.testMode) {
    const result = await createTestInvoice({
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      items: params.items,
      currency: params.currency
    })
    return {
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
      amount: result.amount,
      status: result.status,
      testMode: true
    }
  }

  // Mode production
  try {
    const lago = await getLagoClient()

    const invoiceResult = await lago.invoices.createInvoice({
      invoice: {
        external_customer_id: params.customerId,
        currency: params.currency.toUpperCase() as 'EUR' | 'USD' | 'GBP',
        fees: params.items.map(item => ({
          add_on_code: 'checkout_item',
          description: item.description,
          units: item.quantity,
          unit_amount_cents: item.unitAmountCents,
        })),
      },
    })

    const invoice = invoiceResult.data.invoice

    return {
      invoiceId: invoice.lago_id || '',
      invoiceNumber: invoice.number || '',
      amount: invoice.total_amount_cents || 0,
      status: invoice.status || 'pending',
      testMode: false
    }
  } catch (error) {
    console.error('[Checkout] Lago invoice creation failed, falling back to test mode:', error)
    const result = await createTestInvoice({
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      items: params.items,
      currency: params.currency
    })
    return {
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
      amount: result.amount,
      status: result.status,
      testMode: true
    }
  }
}

/**
 * Process un checkout pour des produits de type "appointment"
 */
async function processAppointmentCheckout(params: {
  product: typeof products.$inferSelect
  appointmentData: AppointmentBookingData
  userId: string
  userEmail: string
  userName: string
  companyId?: string
  orderNumber: string
}): Promise<CheckoutResult> {
  const { product, appointmentData, userId, userEmail, userName, companyId, orderNumber } = params

  console.log('[Checkout] Processing appointment checkout:', {
    productId: product.id,
    productTitle: product.title,
    startTime: appointmentData.startTime,
    endTime: appointmentData.endTime
  })

  // 1. Déterminer si c'est payant
  const isPaid = product.type === 'appointment' && (product.hourlyRate || 0) > 0
  const price = product.hourlyRate || 0

  // 2. Créer le rendez-vous
  const [appointment] = await db.insert(appointments).values({
    userId,
    productId: product.id,
    title: product.title,
    description: product.description || `Réservation: ${product.title}`,
    startTime: appointmentData.startTime,
    endTime: appointmentData.endTime,
    timezone: appointmentData.timezone,
    attendeeEmail: appointmentData.attendeeEmail,
    attendeeName: appointmentData.attendeeName,
    attendeePhone: appointmentData.attendeePhone,
    notes: appointmentData.notes,
    status: 'pending',
    type: isPaid ? 'paid' : 'free',
    price: price,
    currency: product.currency || 'EUR',
    isPaid: !isPaid, // Si gratuit, déjà "payé"
    paymentStatus: isPaid ? 'pending' : 'paid',
  }).returning()

  console.log('[Checkout] Appointment created:', {
    appointmentId: appointment.id,
    isPaid,
    price
  })

  // 3. Synchroniser avec le calendrier Neosaas
  try {
    const syncResult = await syncAppointmentToCalendars(appointment.id)
    console.log('[Checkout] Calendar sync result:', syncResult)
  } catch (syncError) {
    console.error('[Checkout] Calendar sync failed (non-blocking):', syncError)
  }

  // 4. Si payant, créer la facture Lago
  let invoiceResult
  let testMode = false

  if (isPaid) {
    // Récupérer ou créer le client Lago
    const lagoCustomer = await getOrCreateLagoCustomer({
      userId,
      userEmail,
      userName,
      companyId
    })
    testMode = lagoCustomer.testMode

    // Créer la facture
    invoiceResult = await createLagoInvoice({
      customerId: lagoCustomer.lagoId,
      customerEmail: userEmail,
      customerName: userName,
      items: [{
        description: `Rendez-vous: ${product.title}`,
        unitAmountCents: price,
        quantity: 1
      }],
      currency: product.currency || 'EUR',
      testMode
    })

    // Mettre à jour le rendez-vous avec l'ID de facture
    await db.update(appointments)
      .set({
        lagoInvoiceId: invoiceResult.invoiceId,
        paymentStatus: invoiceResult.status === 'paid' ? 'paid' : 'pending',
        isPaid: invoiceResult.status === 'paid',
        paidAt: invoiceResult.status === 'paid' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointment.id))

    // Si en mode test avec auto-pay, confirmer le RDV
    if (testMode && invoiceResult.status === 'paid') {
      await db.update(appointments)
        .set({
          status: 'confirmed',
          updatedAt: new Date()
        })
        .where(eq(appointments.id, appointment.id))
    }

    console.log('[Checkout] Invoice created:', {
      invoiceId: invoiceResult.invoiceId,
      amount: invoiceResult.amount,
      testMode
    })
  }

  // 5. Notifier l'équipe
  const teamNotification: TeamNotification = {
    type: 'appointment_booking',
    orderId: appointment.id,
    orderNumber,
    customerEmail: appointmentData.attendeeEmail,
    customerName: appointmentData.attendeeName,
    items: [{
      name: product.title,
      type: 'appointment' as ProductType,
      quantity: 1,
      price: price
    }],
    totalAmount: price,
    currency: product.currency || 'EUR',
    appointmentDetails: {
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      timezone: appointmentData.timezone,
      notes: appointmentData.notes
    }
  }

  await notifyTeamAppointmentBooking(teamNotification)

  // 5b. Notifier l'admin via le système de chat
  try {
    await notifyAdminNewAppointment({
      appointmentId: appointment.id,
      userId,
      userEmail,
      userName,
      productTitle: product.title,
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      attendeeName: appointmentData.attendeeName,
      attendeeEmail: appointmentData.attendeeEmail
    })
    console.log('[Checkout] Admin notification sent for appointment')
  } catch (notifError) {
    console.error('[Checkout] Failed to send admin notification:', notifError)
    // Non-blocking
  }

  // 6. Envoyer email de confirmation au client
  try {
    await emailRouter.sendWithFallback({
      to: [appointmentData.attendeeEmail],
      subject: `Confirmation de votre rendez-vous - ${product.title}`,
      htmlContent: generateAppointmentConfirmationEmail({
        customerName: appointmentData.attendeeName,
        productTitle: product.title,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        timezone: appointmentData.timezone,
        isPaid,
        price,
        currency: product.currency || 'EUR',
        orderNumber,
        testMode
      }),
      tags: ['appointment-confirmation', orderNumber]
    })
  } catch (emailError) {
    console.error('[Checkout] Failed to send confirmation email:', emailError)
  }

  return {
    success: true,
    appointmentId: appointment.id,
    invoiceId: invoiceResult?.invoiceId,
    requiresPayment: isPaid && invoiceResult?.status !== 'paid',
    testMode
  }
}

/**
 * Process un checkout pour des produits digitaux
 */
async function processDigitalProductCheckout(params: {
  cartId: string
  userId: string
  userEmail: string
  userName: string
  companyId?: string
  items: Array<{
    product: typeof products.$inferSelect
    quantity: number
  }>
}): Promise<CheckoutResult> {
  const { cartId, userId, userEmail, userName, companyId, items } = params

  console.log('[Checkout] Processing digital product checkout:', {
    cartId,
    itemCount: items.length
  })

  const orderNumber = generateOrderNumber()
  const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const currency = items[0]?.product.currency || 'EUR'

  // 1. Créer la commande
  const [order] = await db.insert(orders).values({
    userId,
    companyId: companyId || null,
    orderNumber,
    totalAmount,
    currency,
    status: 'processing',
    paymentStatus: totalAmount > 0 ? 'pending' : 'paid'
  }).returning()

  // 2. Créer les items de commande
  for (const item of items) {
    await db.insert(orderItems).values({
      orderId: order.id,
      itemType: 'digital',
      itemId: item.product.id,
      itemName: item.product.title,
      itemDescription: item.product.description || null,
      quantity: item.quantity,
      unitPrice: item.product.price,
      totalPrice: item.product.price * item.quantity,
      deliveryStatus: 'pending'
    })
  }

  // 3. Traiter le paiement si nécessaire
  let invoiceResult
  let testMode = false

  if (totalAmount > 0) {
    const lagoCustomer = await getOrCreateLagoCustomer({
      userId,
      userEmail,
      userName,
      companyId
    })
    testMode = lagoCustomer.testMode

    invoiceResult = await createLagoInvoice({
      customerId: lagoCustomer.lagoId,
      customerEmail: userEmail,
      customerName: userName,
      items: items.map(item => ({
        description: item.product.title,
        unitAmountCents: item.product.price,
        quantity: item.quantity
      })),
      currency,
      testMode
    })

    // Mettre à jour la commande avec l'info de paiement
    await db.update(orders)
      .set({
        paymentStatus: invoiceResult.status === 'paid' ? 'paid' : 'pending',
        status: invoiceResult.status === 'paid' ? 'completed' : 'processing',
        paidAt: invoiceResult.status === 'paid' ? new Date() : null,
        metadata: {
          lagoInvoiceId: invoiceResult.invoiceId,
          lagoInvoiceNumber: invoiceResult.invoiceNumber,
          testMode
        },
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id))

    // Si payé, marquer les items comme livrés
    if (invoiceResult.status === 'paid') {
      await db.update(orderItems)
        .set({
          deliveryStatus: 'delivered',
          deliveredAt: new Date()
        })
        .where(eq(orderItems.orderId, order.id))
    }
  } else {
    // Produits gratuits
    await db.update(orders)
      .set({
        status: 'completed',
        paymentStatus: 'paid',
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id))

    await db.update(orderItems)
      .set({
        deliveryStatus: 'delivered',
        deliveredAt: new Date()
      })
      .where(eq(orderItems.orderId, order.id))
  }

  // 4. Convertir le panier
  await db.update(carts)
    .set({ status: 'converted', updatedAt: new Date() })
    .where(eq(carts.id, cartId))

  // 5. Notifier l'équipe
  const teamNotification: TeamNotification = {
    type: 'digital_product_purchase',
    orderId: order.id,
    orderNumber,
    customerEmail: userEmail,
    customerName: userName,
    items: items.map(item => ({
      name: item.product.title,
      type: 'digital' as ProductType,
      quantity: item.quantity,
      price: item.product.price * item.quantity
    })),
    totalAmount,
    currency
  }

  await notifyTeamDigitalProductPurchase(teamNotification)

  // 5b. Notifier l'admin via le système de chat
  try {
    await notifyAdminNewOrder({
      orderId: order.id,
      orderNumber,
      userId,
      userEmail,
      userName,
      totalAmount,
      currency,
      hasAppointment: false
    })
    console.log('[Checkout] Admin notification sent for digital product order')
  } catch (notifError) {
    console.error('[Checkout] Failed to send admin notification:', notifError)
    // Non-blocking
  }

  // 6. Envoyer email de confirmation au client
  try {
    await emailRouter.sendWithFallback({
      to: [userEmail],
      subject: `Confirmation de votre commande #${orderNumber}`,
      htmlContent: generateOrderConfirmationEmail({
        customerName: userName,
        orderNumber,
        items: items.map(item => ({
          name: item.product.title,
          quantity: item.quantity,
          price: item.product.price * item.quantity
        })),
        totalAmount,
        currency,
        testMode
      }),
      tags: ['order-confirmation', 'digital-product', orderNumber]
    })
  } catch (emailError) {
    console.error('[Checkout] Failed to send confirmation email:', emailError)
  }

  return {
    success: true,
    orderId: order.id,
    invoiceId: invoiceResult?.invoiceId,
    requiresPayment: totalAmount > 0 && invoiceResult?.status !== 'paid',
    testMode
  }
}

/**
 * Point d'entrée principal du checkout
 */
export async function processCheckout(params: CheckoutParams): Promise<CheckoutResult> {
  const { cartId, appointmentData, userId, userEmail, userName, companyId } = params

  console.log('[Checkout] Starting checkout process:', {
    hasCart: !!cartId,
    hasAppointment: !!appointmentData,
    userId,
    userEmail
  })

  try {
    // Si c'est une réservation de rendez-vous directe (sans panier)
    if (appointmentData && !cartId) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, appointmentData.productId)
      })

      if (!product) {
        return { success: false, error: 'Produit non trouvé' }
      }

      if (product.type !== 'appointment') {
        return { success: false, error: 'Ce produit ne supporte pas la réservation de rendez-vous' }
      }

      return processAppointmentCheckout({
        product,
        appointmentData,
        userId,
        userEmail,
        userName,
        companyId,
        orderNumber: generateOrderNumber()
      })
    }

    // Checkout classique avec panier
    if (!cartId) {
      return { success: false, error: 'Panier non spécifié' }
    }

    const cart = await db.query.carts.findFirst({
      where: and(
        eq(carts.id, cartId),
        eq(carts.userId, userId),
        eq(carts.status, 'active')
      ),
      with: {
        items: {
          with: {
            product: true
          }
        }
      }
    })

    if (!cart || cart.items.length === 0) {
      return { success: false, error: 'Panier vide ou non trouvé' }
    }

    // Séparer les produits par type
    const appointmentItems = cart.items.filter(item => item.product.type === 'appointment')
    const digitalItems = cart.items.filter(item => item.product.type === 'digital')
    const standardItems = cart.items.filter(item => item.product.type === 'standard')
    const freeItems = cart.items.filter(item => item.product.type === 'free')

    const results: CheckoutResult[] = []

    // Traiter les rendez-vous
    for (const item of appointmentItems) {
      if (!appointmentData) {
        return { success: false, error: 'Données de rendez-vous requises pour les produits de type appointment' }
      }

      const result = await processAppointmentCheckout({
        product: item.product,
        appointmentData: {
          ...appointmentData,
          productId: item.product.id
        },
        userId,
        userEmail,
        userName,
        companyId,
        orderNumber: generateOrderNumber()
      })
      results.push(result)
    }

    // Traiter les produits digitaux
    if (digitalItems.length > 0) {
      const result = await processDigitalProductCheckout({
        cartId,
        userId,
        userEmail,
        userName,
        companyId,
        items: digitalItems.map(item => ({
          product: item.product,
          quantity: item.quantity
        }))
      })
      results.push(result)
    }

    // Traiter les produits standards et gratuits ensemble
    const otherItems = [...standardItems, ...freeItems]
    if (otherItems.length > 0) {
      const result = await processDigitalProductCheckout({
        cartId,
        userId,
        userEmail,
        userName,
        companyId,
        items: otherItems.map(item => ({
          product: item.product,
          quantity: item.quantity
        }))
      })
      results.push(result)
    }

    // Convertir le panier si tout est OK
    const allSuccessful = results.every(r => r.success)
    if (allSuccessful) {
      await db.update(carts)
        .set({ status: 'converted', updatedAt: new Date() })
        .where(eq(carts.id, cartId))
    }

    // Retourner le résultat combiné
    return {
      success: allSuccessful,
      orderId: results.find(r => r.orderId)?.orderId,
      appointmentId: results.find(r => r.appointmentId)?.appointmentId,
      invoiceId: results.find(r => r.invoiceId)?.invoiceId,
      requiresPayment: results.some(r => r.requiresPayment),
      testMode: results.some(r => r.testMode),
      error: results.find(r => r.error)?.error
    }

  } catch (error) {
    console.error('[Checkout] Checkout failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Checkout failed'
    }
  }
}

/**
 * Simule le paiement en mode test
 */
export async function simulatePayment(appointmentId: string): Promise<CheckoutResult> {
  try {
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId)
    })

    if (!appointment) {
      return { success: false, error: 'Rendez-vous non trouvé' }
    }

    if (appointment.isPaid) {
      return { success: false, error: 'Déjà payé' }
    }

    const payment = await simulateTestPayment(appointment.lagoInvoiceId || '')

    await db.update(appointments)
      .set({
        isPaid: true,
        paymentStatus: 'paid',
        paidAt: payment.paidAt,
        lagoTransactionId: payment.transactionId,
        status: 'confirmed',
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentId))

    return {
      success: true,
      appointmentId,
      testMode: true
    }
  } catch (error) {
    console.error('[Checkout] Payment simulation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment simulation failed'
    }
  }
}

// Helper functions pour les emails

function generateAppointmentConfirmationEmail(params: {
  customerName: string
  productTitle: string
  startTime: Date
  endTime: Date
  timezone: string
  isPaid: boolean
  price: number
  currency: string
  orderNumber: string
  testMode: boolean
}): string {
  const formatDate = (date: Date) => new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: params.timezone
  }).format(date)

  const formatPrice = (amount: number) => new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: params.currency
  }).format(amount / 100)

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

          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #047857;">${params.productTitle}</h3>
            <p><strong>Date:</strong> ${formatDate(params.startTime)}</p>
            <p><strong>Fin prévue:</strong> ${formatDate(params.endTime)}</p>
            <p><strong>Fuseau horaire:</strong> ${params.timezone}</p>
            ${params.isPaid ? `<p><strong>Montant:</strong> ${formatPrice(params.price)}</p>` : '<p><strong>Montant:</strong> Gratuit</p>'}
          </div>

          <p style="color: #6b7280;">Référence: ${params.orderNumber}</p>

          ${params.testMode ? '<p style="background: #fef3c7; padding: 10px; border-radius: 4px; color: #92400e; font-size: 12px;">⚠️ Mode test activé - Ceci est une confirmation de test</p>' : ''}

          <p>À bientôt,<br>L'équipe Neosaas</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateOrderConfirmationEmail(params: {
  customerName: string
  orderNumber: string
  items: { name: string; quantity: number; price: number }[]
  totalAmount: number
  currency: string
  testMode: boolean
}): string {
  const formatPrice = (amount: number) => new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: params.currency
  }).format(amount / 100)

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
          <p>Merci pour votre commande ! Voici le récapitulatif :</p>

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
                <td colspan="2" style="padding: 12px; font-weight: bold;">Total</td>
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
