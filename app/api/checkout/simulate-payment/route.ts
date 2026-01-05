/**
 * API Route: Simulate Payment (Test Mode Only)
 * POST /api/checkout/simulate-payment
 *
 * Simulates a payment for testing purposes when Lago is in test mode
 * or not connected to a payment provider.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/auth/server'
import { simulatePayment, shouldUseTestMode } from '@/lib/checkout'
import { db } from '@/db'
import { appointments, orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { simulateTestPayment } from '@/lib/checkout/lago-test-mode'

const requestSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional()
}).refine(
  data => data.appointmentId || data.orderId,
  { message: 'Either appointmentId or orderId must be provided' }
)

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth()
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Check if test mode is enabled
    const testModeEnabled = await shouldUseTestMode()
    if (!testModeEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Simulation de paiement disponible uniquement en mode test'
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = requestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      )
    }

    const { appointmentId, orderId } = validationResult.data

    // Simulate payment for appointment
    if (appointmentId) {
      const result = await simulatePayment(appointmentId)
      return NextResponse.json({
        success: result.success,
        data: result.success ? {
          appointmentId: result.appointmentId,
          status: 'paid',
          testMode: true
        } : undefined,
        error: result.error
      })
    }

    // Simulate payment for order
    if (orderId) {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId)
      })

      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Commande non trouvée' },
          { status: 404 }
        )
      }

      if (order.paymentStatus === 'paid') {
        return NextResponse.json(
          { success: false, error: 'Commande déjà payée' },
          { status: 400 }
        )
      }

      // Simulate the payment
      const invoiceId = (order.metadata as any)?.lagoInvoiceId || `test_inv_${Date.now()}`
      const payment = await simulateTestPayment(invoiceId)

      // Update order status
      await db.update(orders)
        .set({
          paymentStatus: 'paid',
          status: 'completed',
          paidAt: payment.paidAt,
          paymentIntentId: payment.transactionId,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          transactionId: payment.transactionId,
          paidAt: payment.paidAt,
          status: 'paid',
          testMode: true
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Aucune action effectuée' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[API Simulate Payment] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la simulation de paiement' },
      { status: 500 }
    )
  }
}
