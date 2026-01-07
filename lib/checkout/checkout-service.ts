/**
 * Unified Checkout Service
 * Handles the purchase flow based on product type:
 * - standard: Classic checkout with payment
 * - digital: Checkout + team email notification
 * - free: No payment required
 * - appointment: Calendar booking + optional payment
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
import {
  generateOrderConfirmationEmail,
  generateAppointmentBookingEmail,
  generateAppointmentWithPaymentEmail
} from './email-templates'

interface CheckoutParams {
  cartId?: string
  appointmentData?: AppointmentBookingData
  userId: string
  userEmail: string
  userName: string
  companyId?: string
}

/**
 * Generates a unique order number
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
 * Gets or creates a Lago customer
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

  // Production mode - use real Lago
  try {
    const lago = await getLagoClient()

    // Check if customer exists in DB
    if (params.companyId) {
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, params.companyId)
      })
      if (company?.lagoId) {
        return { lagoId: company.lagoId, testMode: false }
      }
    }

    // Create customer in Lago
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

    // Save Lago ID in company if applicable
    if (params.companyId && lagoId) {
      await db.update(companies)
        .set({ lagoId, updatedAt: new Date() })
        .where(eq(companies.id, params.companyId))
    }

    return { lagoId: lagoId || '', testMode: false }
  } catch (error) {
    console.error('[Checkout] Lago customer creation failed, falling back to test mode:', error)
    // Fallback to test mode
    const testCustomer = await createTestCustomer({
      externalId: params.companyId || params.userId,
      email: params.userEmail,
      name: params.companyName || params.userName
    })
    return { lagoId: testCustomer.lagoId, testMode: true }
  }
}

/**
 * Creates an invoice via Lago (real or test mode)
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

  // Production mode
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
 * Process checkout for "appointment" type products
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

  // Convert string dates to Date objects if needed (handles both Date and string inputs)
  const startTime = appointmentData.startTime instanceof Date
    ? appointmentData.startTime
    : new Date(appointmentData.startTime as unknown as string)
  const endTime = appointmentData.endTime instanceof Date
    ? appointmentData.endTime
    : new Date(appointmentData.endTime as unknown as string)

  console.log('[Checkout] Processing appointment checkout:', {
    productId: product.id,
    productTitle: product.title,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString()
  })

  // 1. Determine if payment is required
  const isPaid = product.type === 'appointment' && (product.hourlyRate || 0) > 0
  const price = product.hourlyRate || 0

  // 2. Create the appointment
  const [appointment] = await db.insert(appointments).values({
    userId,
    productId: product.id,
    title: product.title,
    description: product.description || `Booking: ${product.title}`,
    startTime: startTime,
    endTime: endTime,
    timezone: appointmentData.timezone,
    attendeeEmail: appointmentData.attendeeEmail,
    attendeeName: appointmentData.attendeeName,
    attendeePhone: appointmentData.attendeePhone,
    notes: appointmentData.notes,
    status: 'pending',
    type: isPaid ? 'paid' : 'free',
    price: price,
    currency: product.currency || 'EUR',
    isPaid: !isPaid, // If free, already "paid"
    paymentStatus: isPaid ? 'pending' : 'paid',
  }).returning()

  console.log('[Checkout] Appointment created:', {
    appointmentId: appointment.id,
    isPaid,
    price
  })

  // 3. Sync with Neosaas calendar
  try {
    const syncResult = await syncAppointmentToCalendars(appointment.id)
    console.log('[Checkout] Calendar sync result:', syncResult)
  } catch (syncError) {
    console.error('[Checkout] Calendar sync failed (non-blocking):', syncError)
  }

  // 4. If paid, create Lago invoice
  let invoiceResult
  let testMode = false

  if (isPaid) {
    // Get or create Lago customer
    const lagoCustomer = await getOrCreateLagoCustomer({
      userId,
      userEmail,
      userName,
      companyId
    })
    testMode = lagoCustomer.testMode

    // Create invoice
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

    // Update appointment with invoice ID
    await db.update(appointments)
      .set({
        lagoInvoiceId: invoiceResult.invoiceId,
        paymentStatus: invoiceResult.status === 'paid' ? 'paid' : 'pending',
        isPaid: invoiceResult.status === 'paid',
        paidAt: invoiceResult.status === 'paid' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointment.id))

    // If in test mode with auto-pay, confirm the appointment
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

  // 5. Notify the team
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
      startTime: startTime, // Use converted Date object
      endTime: endTime, // Use converted Date object
      timezone: appointmentData.timezone,
      notes: appointmentData.notes
    }
  }

  await notifyTeamAppointmentBooking(teamNotification)

  // 5b. Notify admin via chat system
  try {
    await notifyAdminNewAppointment({
      appointmentId: appointment.id,
      userId,
      userEmail,
      userName,
      productTitle: product.title,
      startTime: startTime, // Use converted Date object
      endTime: endTime, // Use converted Date object
      attendeeName: appointmentData.attendeeName,
      attendeeEmail: appointmentData.attendeeEmail
    })
    console.log('[Checkout] Admin notification sent for appointment')
  } catch (notifError) {
    console.error('[Checkout] Failed to send admin notification:', notifError)
    // Non-blocking
  }

  // 6. Send confirmation email to client
  // Use different templates based on whether payment is involved
  try {
    const emailContent = isPaid
      ? generateAppointmentWithPaymentEmail({
          customerName: appointmentData.attendeeName,
          productTitle: product.title,
          startTime: startTime,
          endTime: endTime,
          timezone: appointmentData.timezone,
          location: product.location || undefined,
          meetingUrl: product.meetingUrl || undefined,
          isPaid: true,
          price,
          currency: product.currency || 'EUR',
          orderNumber,
          testMode
        })
      : generateAppointmentBookingEmail({
          customerName: appointmentData.attendeeName,
          productTitle: product.title,
          startTime: startTime,
          endTime: endTime,
          timezone: appointmentData.timezone,
          location: product.location || undefined,
          meetingUrl: product.meetingUrl || undefined,
          notes: appointmentData.notes,
          orderNumber,
          testMode
        })

    await emailRouter.sendWithFallback({
      to: [appointmentData.attendeeEmail],
      subject: `Confirmation de rendez-vous - ${product.title}`,
      htmlContent: emailContent,
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
 * Process checkout for digital products
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

  // 1. Create the order
  const [order] = await db.insert(orders).values({
    userId,
    companyId: companyId || null,
    orderNumber,
    totalAmount,
    currency,
    status: 'processing',
    paymentStatus: totalAmount > 0 ? 'pending' : 'paid'
  }).returning()

  // 2. Create order items
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

  // 3. Process payment if required
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

    // Update order with payment info
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

    // If paid, mark items as delivered
    if (invoiceResult.status === 'paid') {
      await db.update(orderItems)
        .set({
          deliveryStatus: 'delivered',
          deliveredAt: new Date()
        })
        .where(eq(orderItems.orderId, order.id))
    }
  } else {
    // Free products
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

  // 4. Convert the cart
  await db.update(carts)
    .set({ status: 'converted', updatedAt: new Date() })
    .where(eq(carts.id, cartId))

  // 5. Notify the team
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

  // 5b. Notify admin via chat system
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

  // 6. Send confirmation email to client
  try {
    await emailRouter.sendWithFallback({
      to: [userEmail],
      subject: `Order Confirmation #${orderNumber}`,
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
 * Main checkout entry point
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
    // If this is a direct appointment booking (without cart)
    if (appointmentData && !cartId) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, appointmentData.productId)
      })

      if (!product) {
        return { success: false, error: 'Product not found' }
      }

      if (product.type !== 'appointment') {
        return { success: false, error: 'This product does not support appointment booking' }
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

    // Classic checkout with cart
    if (!cartId) {
      return { success: false, error: 'Cart not specified' }
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
      return { success: false, error: 'Cart empty or not found' }
    }

    // Separate products by type
    const appointmentItems = cart.items.filter(item => item.product.type === 'appointment')
    const digitalItems = cart.items.filter(item => item.product.type === 'digital')
    const standardItems = cart.items.filter(item => item.product.type === 'standard')
    const freeItems = cart.items.filter(item => item.product.type === 'free')

    const results: CheckoutResult[] = []

    // Process appointments
    for (const item of appointmentItems) {
      if (!appointmentData) {
        return { success: false, error: 'Appointment data required for appointment-type products' }
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

    // Process digital products
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

    // Process standard and free products together
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

    // Convert cart if everything is OK
    const allSuccessful = results.every(r => r.success)
    if (allSuccessful) {
      await db.update(carts)
        .set({ status: 'converted', updatedAt: new Date() })
        .where(eq(carts.id, cartId))
    }

    // Return combined result
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
 * Simulate payment in test mode
 */
export async function simulatePayment(appointmentId: string): Promise<CheckoutResult> {
  try {
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId)
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    if (appointment.isPaid) {
      return { success: false, error: 'Already paid' }
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

// Email templates are now in ./email-templates.ts
