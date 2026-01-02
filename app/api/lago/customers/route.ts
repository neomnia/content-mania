import { getLagoClient } from '@/lib/lago';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    const lagoClient = await getLagoClient();
    const customer = await lagoClient.customers.create({ customer: { email, name } });
    return NextResponse.json(customer.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
