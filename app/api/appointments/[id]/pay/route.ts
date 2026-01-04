import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { appointments, users, companies } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyAuth } from '@/lib/auth/server'
import { getLagoClient } from '@/lib/lago'

// POST /api/appointments/[id]/pay - Initiate payment for appointment via Lago
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the appointment
    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.userId, user.userId)
      ),
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.isPaid) {
      return NextResponse.json({ error: 'Appointment is already paid' }, { status: 400 })
    }

    if (appointment.type !== 'paid' || appointment.price <= 0) {
      return NextResponse.json({ error: 'This appointment does not require payment' }, { status: 400 })
    }

    // Get user and company info for Lago customer
    const userInfo = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
      with: {
        company: true,
      },
    })

    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    try {
      const lago = await getLagoClient()

      // Get or create Lago customer ID
      let lagoCustomerId = userInfo.company?.lagoId

      if (!lagoCustomerId) {
        // Create customer in Lago
        const customerResult = await lago.customers.createCustomer({
          customer: {
            external_id: userInfo.company?.id || userInfo.id,
            name: userInfo.company?.name || `${userInfo.firstName} ${userInfo.lastName}`,
            email: userInfo.company?.email || userInfo.email,
            billing_configuration: {
              invoice_grace_period: 3,
              payment_provider: 'stripe',
              document_locale: 'fr',
            },
          },
        })

        lagoCustomerId = customerResult.data.customer.lago_id

        // Update company with Lago ID if applicable
        if (userInfo.company) {
          await db.update(companies)
            .set({ lagoId: lagoCustomerId, updatedAt: new Date() })
            .where(eq(companies.id, userInfo.company.id))
        }
      }

      // Create a one-time invoice for the appointment
      const invoiceResult = await lago.invoices.createInvoice({
        invoice: {
          external_customer_id: userInfo.company?.id || userInfo.id,
          currency: appointment.currency.toUpperCase() as 'EUR' | 'USD' | 'GBP',
          fees: [
            {
              add_on_code: 'appointment_fee',
              description: `Appointment: ${appointment.title}`,
              units: 1,
              unit_amount_cents: appointment.price,
            },
          ],
        },
      })

      const invoice = invoiceResult.data.invoice

      // Update appointment with Lago invoice ID
      await db.update(appointments)
        .set({
          lagoInvoiceId: invoice.lago_id,
          paymentStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, id))

      return NextResponse.json({
        success: true,
        data: {
          invoiceId: invoice.lago_id,
          invoiceNumber: invoice.number,
          amount: invoice.total_amount_cents,
          currency: invoice.currency,
          status: invoice.status,
          paymentUrl: invoice.file_url, // URL to the invoice PDF
        },
      })
    } catch (lagoError) {
      console.error('Lago API error:', lagoError)

      // If Lago is not configured, return a simulated response for development
      if (process.env.NODE_ENV === 'development') {
        const mockInvoiceId = `inv_${Date.now()}`

        await db.update(appointments)
          .set({
            lagoInvoiceId: mockInvoiceId,
            paymentStatus: 'pending',
            updatedAt: new Date(),
          })
          .where(eq(appointments.id, id))

        return NextResponse.json({
          success: true,
          data: {
            invoiceId: mockInvoiceId,
            invoiceNumber: `INV-${Date.now()}`,
            amount: appointment.price,
            currency: appointment.currency,
            status: 'draft',
            message: 'Development mode: Lago not configured',
          },
        })
      }

      return NextResponse.json(
        { error: 'Payment service unavailable' },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Failed to initiate payment:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}

// PATCH /api/appointments/[id]/pay - Mark appointment as paid (webhook or manual confirmation)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.userId, user.userId)
      ),
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const [result] = await db.update(appointments)
      .set({
        isPaid: true,
        paymentStatus: 'paid',
        paidAt: new Date(),
        lagoTransactionId: body.transactionId || null,
        // Auto-confirm if pending
        status: appointment.status === 'pending' ? 'confirmed' : appointment.status,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning()

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Failed to mark appointment as paid:', error)
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    )
  }
}
