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
