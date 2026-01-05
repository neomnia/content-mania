'use server'

import { db } from "@/db"
import { chatConversations, chatMessages } from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * Envoie une notification à l'admin via le système de chat
 * Utilisé pour : nouvelles commandes, nouveaux rendez-vous, support, etc.
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
    // 1. Créer ou récupérer une conversation pour ce type de notification
    const conversationSubject = `[${type.toUpperCase()}] ${subject}`
    
    // Chercher une conversation existante ouverte pour cet utilisateur et ce type
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

    // Si pas de conversation existante, en créer une nouvelle
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

    // 2. Ajouter le message de notification dans la conversation
    await db.insert(chatMessages).values({
      conversationId: conversation.id,
      senderType: 'system',
      content: message,
      messageType: type,
      isRead: false, // Les admins devront le lire
      metadata: metadata || {}
    })

    // 3. Mettre à jour le timestamp de la dernière activité
    await db.update(chatConversations)
      .set({ 
        lastMessageAt: new Date(),
        priority // Mettre à jour la priorité si nécessaire
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
 * Envoie une notification de nouvelle commande aux admins
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
  
  let message = `📦 Nouvelle commande reçue !\n\n`
  message += `**Commande:** ${orderNumber}\n`
  message += `**Client:** ${userName} (${userEmail})\n`
  message += `**Montant:** ${amount} ${currency}\n\n`
  
  if (hasAppointment && appointmentDetails) {
    message += `📅 **Rendez-vous requis**\n`
    message += `• Participant: ${appointmentDetails.attendeeName}\n`
    message += `• Début: ${appointmentDetails.startTime.toLocaleString('fr-FR')}\n`
    message += `• Fin: ${appointmentDetails.endTime.toLocaleString('fr-FR')}\n\n`
  }
  
  message += `Pour gérer cette commande, rendez-vous dans le [tableau de bord admin](/admin/orders/${orderId})`

  return sendAdminNotification({
    subject: `Nouvelle commande ${orderNumber}`,
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
 * Envoie une notification de nouveau rendez-vous aux admins
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

  const message = `📅 Nouveau rendez-vous réservé !\n\n` +
    `**Service:** ${productTitle}\n` +
    `**Client:** ${userName} (${userEmail})\n` +
    `**Participant:** ${attendeeName} (${attendeeEmail})\n` +
    `**Début:** ${startTime.toLocaleString('fr-FR')}\n` +
    `**Fin:** ${endTime.toLocaleString('fr-FR')}\n\n` +
    `Pour gérer ce rendez-vous, rendez-vous dans [votre calendrier](/dashboard/calendar)`

  return sendAdminNotification({
    subject: `Nouveau rendez-vous - ${productTitle}`,
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
