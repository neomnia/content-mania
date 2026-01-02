
import { db } from '@/db';
import { companies, subscriptions } from '@/db/schema';
import { getLagoClient } from '@/lib/lago';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name, planCode } = await request.json();
    const lagoClient = await getLagoClient();

    // 1. Créer le client dans Neosaas (PostgreSQL)
    const [neosaasCustomer] = await db.insert(companies).values({ email, name }).returning();

    // 2. Créer le client dans Lago
    const lagoCustomer = await lagoClient.customers.create({ 
        customer: { 
            email, 
            name,
            external_id: neosaasCustomer.id 
        } 
    });

    // 3. Mettre à jour Neosaas avec l'ID Lago
    // Cast to any to access lago_id if types are not perfectly aligned or to be safe
    const lagoId = (lagoCustomer.data.customer as any).lago_id; 

    await db.update(companies)
        .set({ lagoId: lagoId })
        .where(eq(companies.id, neosaasCustomer.id));

    // 4. Créer l'abonnement dans Lago
    const subscription = await lagoClient.subscriptions.create({ 
        subscription: { 
            external_customer_id: neosaasCustomer.id, 
            plan_code: planCode 
        } 
    });

    // 5. Enregistrer l'abonnement dans Neosaas
    const subLagoId = (subscription.data.subscription as any).lago_id;
    const [neosaasSubscription] = await db.insert(subscriptions).values({ 
        customerId: neosaasCustomer.id, 
        lagoId: subLagoId, 
        planCode, 
        status: subscription.data.subscription.status 
    }).returning();

    return NextResponse.json(neosaasSubscription);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
