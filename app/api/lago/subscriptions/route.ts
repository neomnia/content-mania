import { getLagoClient } from '@/lib/lago';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { customerId, planCode } = await request.json();
    const lagoClient = await getLagoClient();
    const subscription = await lagoClient.subscriptions.create({
      subscription: { external_customer_id: customerId, plan_code: planCode, external_id: `sub_${Date.now()}` },
    });
    return NextResponse.json(subscription.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
