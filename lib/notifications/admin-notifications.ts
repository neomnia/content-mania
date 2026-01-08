'use server'

import { db } from "@/db"
import { chatConversations, chatMessages } from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * Send a notification to admin via the chat system
 * Used for: new orders, new appointments, support, etc.
 */
export async function sendAdminNotification(params: {
  subject: string
  message: string
  type: 'order' | 'appointment' | 'support' | 'system'
  userId?: string
  userEmail?: string
  userName?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  metadata?: Record<string, any>
}) {
  const {
    subject,
    message,
    type,
    userId,
    userEmail,
    userName,
    priority = 'normal',
    metadata
  } = params

  try {
    // 1. Create or retrieve a conversation for this notification type
    const conversationSubject = `[${type.toUpperCase()}] ${subject}`

    // Look for an existing open conversation for this user and type
    let conversation = await db.query.chatConversations.findFirst({
      where: (conversations, { and, or, eq }) => {
        const conditions: any[] = [
          or(
            eq(conversations.status, 'open'),
            eq(conversations.status, 'pending')
          )
        ]
        
        if (userId) {
          conditions.push(eq(conversations.userId, userId))
        } else if (userEmail) {
          conditions.push(eq(conversations.guestEmail, userEmail))
        }
        
        return and(...conditions)
      }
    })

    // If no existing conversation, create a new one
    if (!conversation) {
      const [newConversation] = await db.insert(chatConversations).values({
        userId: userId || null,
        guestEmail: userEmail || null,
        guestName: userName || null,
        subject: conversationSubject,
        status: 'open',
        priority,
        lastMessageAt: new Date()
      }).returning()
      
      conversation = newConversation
    }

    // 2. Add the notification message to the conversation
    await db.insert(chatMessages).values({
      conversationId: conversation.id,
      senderType: 'system',
      content: message,
      messageType: type,
      isRead: false, // Admins will need to read it
      metadata: metadata || {}
    })

    // 3. Update the last activity timestamp
    await db.update(chatConversations)
      .set({
        lastMessageAt: new Date(),
        priority // Update priority if necessary
      })
      .where(eq(chatConversations.id, conversation.id))

    console.log('[AdminNotification] ✅ Notification sent', {
      conversationId: conversation.id,
      type,
      subject
    })

    return {
      success: true,
      conversationId: conversation.id
    }
  } catch (error) {
    console.error('[AdminNotification] ❌ Failed to send notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send a new order notification to admins
 */
export async function notifyAdminNewOrder(params: {
  orderId: string
  orderNumber: string
  userId: string
  userEmail: string
  userName: string
  totalAmount: number
  currency: string
  hasAppointment: boolean
  appointmentDetails?: {
    startTime: Date
    endTime: Date
    attendeeName: string
  }
}) {
  const {
    orderId,
    orderNumber,
    userId,
    userEmail,
    userName,
    totalAmount,
    currency,
    hasAppointment,
    appointmentDetails
  } = params

  const amount = (totalAmount / 100).toFixed(2)

  let message = `📦 New order received!\n\n`
  message += `**Order:** ${orderNumber}\n`
  message += `**Customer:** ${userName} (${userEmail})\n`
  message += `**Amount:** ${amount} ${currency}\n\n`

  if (hasAppointment && appointmentDetails) {
    message += `📅 **Appointment required**\n`
    message += `• Attendee: ${appointmentDetails.attendeeName}\n`
    message += `• Start: ${appointmentDetails.startTime.toLocaleString('en-US')}\n`
    message += `• End: ${appointmentDetails.endTime.toLocaleString('en-US')}\n\n`
  }

  message += `To manage this order, go to [admin dashboard](/admin/orders/${orderId})`

  return sendAdminNotification({
    subject: `New order ${orderNumber}`,
    message,
    type: 'order',
    userId,
    userEmail,
    userName,
    priority: hasAppointment ? 'high' : 'normal',
    metadata: {
      orderId,
      orderNumber,
      totalAmount,
      currency,
      hasAppointment,
      appointmentDetails
    }
  })
}

/**
 * Send a new appointment notification to admins
 */
export async function notifyAdminNewAppointment(params: {
  appointmentId: string
  userId: string
  userEmail: string
  userName: string
  productTitle: string
  startTime: Date
  endTime: Date
  attendeeName: string
  attendeeEmail: string
}) {
  const {
    appointmentId,
    userId,
    userEmail,
    userName,
    productTitle,
    startTime,
    endTime,
    attendeeName,
    attendeeEmail
  } = params

  const message = `📅 New appointment booked!\n\n` +
    `**Service:** ${productTitle}\n` +
    `**Customer:** ${userName} (${userEmail})\n` +
    `**Attendee:** ${attendeeName} (${attendeeEmail})\n` +
    `**Start:** ${startTime.toLocaleString('en-US')}\n` +
    `**End:** ${endTime.toLocaleString('en-US')}\n\n` +
    `To manage this appointment, go to [admin appointments](/admin/appointments)`

  return sendAdminNotification({
    subject: `New appointment - ${productTitle}`,
    message,
    type: 'appointment',
    userId,
    userEmail,
    userName,
    priority: 'high',
    metadata: {
      appointmentId,
      productTitle,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      attendeeName,
      attendeeEmail
    }
  })
}

/**
 * Send notification for orders with physical products to ship
 * Lists all physical items that need shipping
 */
export async function notifyAdminPhysicalProductsToShip(params: {
  orderId: string
  orderNumber: string
  userId: string
  userEmail: string
  userName: string
  physicalProducts: Array<{
    title: string
    quantity: number
    requiresShipping: boolean
    shippingNotes?: string
  }>
  shippingAddress?: {
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }
}) {
  const {
    orderId,
    orderNumber,
    userId,
    userEmail,
    userName,
    physicalProducts,
    shippingAddress
  } = params

  let message = `📦 New order with physical products to ship!\n\n`
  message += `**Order:** ${orderNumber}\n`
  message += `**Customer:** ${userName} (${userEmail})\n\n`
  
  message += `**Products to ship:**\n`
  physicalProducts.forEach(product => {
    message += `• ${product.title} (x${product.quantity})`
    if (product.shippingNotes) {
      message += ` - ${product.shippingNotes}`
    }
    message += `\n`
  })
  message += `\n`

  if (shippingAddress) {
    message += `**Shipping Address:**\n`
    if (shippingAddress.address) message += `${shippingAddress.address}\n`
    if (shippingAddress.postalCode || shippingAddress.city) {
      message += `${shippingAddress.postalCode || ''} ${shippingAddress.city || ''}\n`
    }
    if (shippingAddress.country) message += `${shippingAddress.country}\n`
    message += `\n`
  }

  message += `**Action required:** Prepare shipment and mark as shipped once sent.\n\n`
  message += `Manage order: [admin dashboard](/admin/orders/${orderId})`

  return sendAdminNotification({
    subject: `Shipment required - Order ${orderNumber}`,
    message,
    type: 'order',
    userId,
    userEmail,
    userName,
    priority: 'high',
    metadata: {
      orderId,
      orderNumber,
      physicalProducts,
      shippingAddress,
      actionRequired: 'ship_products'
    }
  })
}

/**
 * Send notification to client when physical product is shipped
 * Returns formatted message for chat
 */
export async function notifyClientProductShipped(params: {
  orderId: string
  orderNumber: string
  userId: string
  userEmail: string
  userName: string
  shippedProducts: Array<{
    title: string
    quantity: number
  }>
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: string
}) {
  const {
    orderId,
    orderNumber,
    userId,
    userEmail,
    userName,
    shippedProducts,
    trackingNumber,
    carrier,
    estimatedDelivery
  } = params

  let message = `✅ Your order has been shipped!\n\n`
  message += `**Order:** ${orderNumber}\n\n`
  
  message += `**Shipped items:**\n`
  shippedProducts.forEach(product => {
    message += `• ${product.title} (x${product.quantity})\n`
  })
  message += `\n`

  if (trackingNumber) {
    message += `**Tracking Number:** ${trackingNumber}\n`
  }
  if (carrier) {
    message += `**Carrier:** ${carrier}\n`
  }
  if (estimatedDelivery) {
    message += `**Estimated Delivery:** ${estimatedDelivery}\n`
  }
  message += `\n`
  message += `You will receive your package soon. Thank you for your order!`

  return sendAdminNotification({
    subject: `Order ${orderNumber} - Shipped`,
    message,
    type: 'system',
    userId,
    userEmail,
    userName,
    priority: 'normal',
    metadata: {
      orderId,
      orderNumber,
      shippedProducts,
      trackingNumber,
      carrier,
      estimatedDelivery,
      notificationType: 'shipment_confirmation'
    }
  })
}

/**
 * Send notification to client with digital product access
 * Provides download URL and license key
 */
export async function notifyClientDigitalProductAccess(params: {
  orderId: string
  orderNumber: string
  userId: string
  userEmail: string
  userName: string
  digitalProducts: Array<{
    title: string
    downloadUrl?: string | null
    licenseKey?: string | null
    licenseInstructions?: string | null
  }>
}) {
  const {
    orderId,
    orderNumber,
    userId,
    userEmail,
    userName,
    digitalProducts
  } = params

  let message = `🎉 Your digital products are ready!\n\n`
  message += `**Order:** ${orderNumber}\n\n`
  
  digitalProducts.forEach(product => {
    message += `📦 **${product.title}**\n\n`
    
    if (product.downloadUrl) {
      message += `**Download Link:** ${product.downloadUrl}\n`
    }
    
    if (product.licenseKey) {
      message += `**License Key:** \`${product.licenseKey}\`\n\n`
      
      if (product.licenseInstructions) {
        message += `**Activation Instructions:**\n${product.licenseInstructions}\n`
      }
    }
    
    message += `\n---\n\n`
  })
  
  message += `Thank you for your purchase! Your digital products are now available for instant access.\n\n`
  message += `View your order details: [dashboard](/dashboard/checkout/confirmation?orderId=${orderId})`

  return sendAdminNotification({
    subject: `Your digital products - Order ${orderNumber}`,
    message,
    type: 'system',
    userId,
    userEmail,
    userName,
    priority: 'normal',
    metadata: {
      orderId,
      orderNumber,
      digitalProducts: digitalProducts.map(p => ({
        title: p.title,
        hasDownloadUrl: !!p.downloadUrl,
        hasLicenseKey: !!p.licenseKey
      })),
      notificationType: 'digital_product_delivery'
    }
  })
}

/**
 * Send notification to admin about digital products order
 * Notifies admin about digital sale for tracking purposes
 */
export async function notifyAdminDigitalProductSale(params: {
  orderId: string
  orderNumber: string
  userId: string
  userEmail: string
  userName: string
  digitalProducts: Array<{
    title: string
    quantity: number
  }>
  totalAmount: number
  currency: string
}) {
  const {
    orderId,
    orderNumber,
    userId,
    userEmail,
    userName,
    digitalProducts,
    totalAmount,
    currency
  } = params

  let message = `💻 New digital product sale!\n\n`
  message += `**Order:** ${orderNumber}\n`
  message += `**Customer:** ${userName} (${userEmail})\n`
  message += `**Total:** ${(totalAmount / 100).toFixed(2)} ${currency}\n\n`
  
  message += `**Digital products:**\n`
  digitalProducts.forEach(product => {
    message += `• ${product.title} (x${product.quantity})\n`
  })
  message += `\n`
  message += `✅ License keys generated and sent to customer automatically.\n\n`
  message += `Manage order: [admin dashboard](/admin/orders/${orderId})`

  return sendAdminNotification({
    subject: `Digital sale - Order ${orderNumber}`,
    message,
    type: 'order',
    userId,
    userEmail,
    userName,
    priority: 'normal',
    metadata: {
      orderId,
      orderNumber,
      digitalProducts,
      totalAmount,
      currency,
      notificationType: 'digital_product_sale'
    }
  })
}
