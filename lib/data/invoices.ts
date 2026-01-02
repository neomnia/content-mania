import { db } from "@/db"
import { companies, orders } from "@/db/schema"
import { desc, eq } from "drizzle-orm"

export async function getAllInvoices() {
  const invoices = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      companyName: companies.name,
      companyEmail: companies.email,
      amount: orders.totalAmount,
      status: orders.paymentStatus,
      date: orders.paidAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(companies, eq(orders.companyId, companies.id))
    .orderBy(desc(orders.createdAt))

  return invoices
}
