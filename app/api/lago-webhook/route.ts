import { db } from '@/db';
import { subscriptions, orders, companies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const event = await request.json();
    
    // Verify webhook signature here in production!

    // Handle subscription creation
    if (event.webhook_type === 'subscription.created' || event.event_type === 'subscription.created') {
      // Note: event.payload.id is the Lago ID of the subscription
      // Support both structures just in case
      const payload = event.payload || event.subscription;
      const lagoId = payload?.lago_id || payload?.id;
      
      if (lagoId) {
        await db.update(subscriptions)
          .set({ status: payload.status })
          .where(eq(subscriptions.lagoId, lagoId));
      }
    }

    // Handle invoice payment success (Revenue)
    if (event.webhook_type === 'invoice.payment_succeeded' || event.event_type === 'invoice.payment_succeeded') {
      const invoice = event.invoice || event.payload?.invoice;
      
      if (invoice) {
        const customerLagoId = invoice.customer?.lago_id;
        
        // Find company by Lago ID
        const company = await db.query.companies.findFirst({
          where: eq(companies.lagoId, customerLagoId)
        });

        if (company) {
          // Check if order already exists to avoid duplicates
          const existingOrder = await db.query.orders.findFirst({
            where: eq(orders.orderNumber, invoice.lago_id)
          });

          if (!existingOrder) {
            await db.insert(orders).values({
              companyId: company.id,
              orderNumber: invoice.lago_id, // Use Lago Invoice ID as order number
              totalAmount: invoice.amount_cents,
              currency: invoice.amount_currency,
              status: 'completed',
              paymentStatus: 'paid',
              paidAt: new Date(), // or invoice.payment_status_at if available
              metadata: invoice.metadata,
            });
          }
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
