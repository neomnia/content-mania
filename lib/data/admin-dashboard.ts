import { db } from "@/db"
import { companies, subscriptions, orders, users, userRoles, roles, orderItems, products } from "@/db/schema"
import { count, eq, sum, desc, sql, and } from "drizzle-orm"

export async function getDashboardStats() {
  // 1. Total Revenue (from Orders)
  // Assuming totalAmount is in cents
  const [revenueResult] = await db
    .select({ 
      total: sum(orders.totalAmount) 
    })
    .from(orders)
    .where(eq(orders.paymentStatus, 'paid'))

  const totalRevenue = (Number(revenueResult?.total) || 0) / 100

  // 2. Total Subscriptions
  const [subsResult] = await db
    .select({ count: count() })
    .from(subscriptions)

  const totalSubscriptions = subsResult?.count || 0

  // 3. Active Plans
  const [activeSubsResult] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'))

  const activePlans = activeSubsResult?.count || 0

  // 4. Total Users (Companies)
  const [companiesResult] = await db
    .select({ count: count() })
    .from(companies)

  const totalCompanies = companiesResult?.count || 0

  // 5. Recent Subscriptions
  const recentSubscriptions = await db
    .select({
      id: subscriptions.id,
      planCode: subscriptions.planCode,
      status: subscriptions.status,
      createdAt: subscriptions.createdAt,
      companyName: companies.name,
      companyEmail: companies.email,
    })
    .from(subscriptions)
    .leftJoin(companies, eq(subscriptions.customerId, companies.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(5)

  // 6. Recent Companies with Subscription Status
  const recentCompanies = await db
    .select({
      id: companies.id,
      name: companies.name,
      email: companies.email,
      createdAt: companies.createdAt,
      subscriptionStatus: subscriptions.status,
      plan: subscriptions.planCode,
    })
    .from(companies)
    .leftJoin(subscriptions, eq(companies.id, subscriptions.customerId))
    .orderBy(desc(companies.createdAt))
    .limit(10)

  // 7. Recent Invoices (from Orders)
  const recentInvoices = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      companyName: companies.name,
      amount: orders.totalAmount,
      status: orders.paymentStatus,
      date: orders.paidAt,
    })
    .from(orders)
    .leftJoin(companies, eq(orders.companyId, companies.id))
    .orderBy(desc(orders.paidAt))
    .limit(5)

  // 8. Chart Data: Registrations vs First Purchases (Last 6 months)
  // Note: This is a simplified implementation. For production, use a proper date truncation function in SQL.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const registrations = await db
    .select({
      date: companies.createdAt,
    })
    .from(companies)
    .where(sql`${companies.createdAt} >= ${sixMonthsAgo.toISOString()}`);

  const firstPurchases = await db
    .select({
      date: orders.paidAt,
    })
    .from(orders)
    .where(sql`${orders.paidAt} >= ${sixMonthsAgo.toISOString()} AND ${orders.paymentStatus} = 'paid'`);

  // 9. Writers Growth (Last 6 months)
  // Find role ID for 'writer'
  const [writerRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, 'writer'))
    .limit(1);

  let writers: { date: Date }[] = [];
  if (writerRole) {
    writers = await db
      .select({
        date: userRoles.assignedAt,
      })
      .from(userRoles)
      .where(and(
        eq(userRoles.roleId, writerRole.id),
        sql`${userRoles.assignedAt} >= ${sixMonthsAgo.toISOString()}`
      ));
  }

  // 10. Revenue Data (Last 6 months)
  const revenueData = await db
    .select({
      amount: orders.totalAmount,
      date: orders.paidAt,
    })
    .from(orders)
    .where(sql`${orders.paidAt} >= ${sixMonthsAgo.toISOString()} AND ${orders.paymentStatus} = 'paid'`);


  // Group by Month
  const chartDataMap = new Map<string, { name: string, registrations: number, activations: number, writers: number, revenue: number }>();
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const name = d.toLocaleString('default', { month: 'short' });
    chartDataMap.set(key, { name, registrations: 0, activations: 0, writers: 0, revenue: 0 });
  }

  registrations.forEach(r => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (chartDataMap.has(key)) {
      chartDataMap.get(key)!.registrations++;
    }
  });

  firstPurchases.forEach(p => {
    if (p.date) {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (chartDataMap.has(key)) {
        chartDataMap.get(key)!.activations++;
      }
    }
  });

  writers.forEach(w => {
    const d = new Date(w.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (chartDataMap.has(key)) {
      chartDataMap.get(key)!.writers++;
    }
  });

  revenueData.forEach(r => {
    if (r.date) {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (chartDataMap.has(key)) {
        chartDataMap.get(key)!.revenue += (r.amount / 100);
      }
    }
  });

  const chartData = Array.from(chartDataMap.values());

  // 11. Sales by Product Type
  // Get all order items with their product types
  const salesByType = await db
    .select({
      productType: products.type,
      totalQuantity: sum(orderItems.quantity),
      totalRevenue: sum(orderItems.totalPrice),
      orderCount: count(),
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.itemId, products.id))
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.paymentStatus, 'paid'))
    .groupBy(products.type)

  // Format sales by type data
  const formattedSalesByType = salesByType.map(item => ({
    type: item.productType || 'unknown',
    quantity: Number(item.totalQuantity) || 0,
    revenue: (Number(item.totalRevenue) || 0) / 100,
    orders: Number(item.orderCount) || 0
  }))

  // 12. Top Selling Products (All Time)
  const topProducts = await db
    .select({
      productId: orderItems.itemId,
      productName: orderItems.itemName,
      productType: products.type,
      totalQuantity: sum(orderItems.quantity),
      totalRevenue: sum(orderItems.totalPrice),
      orderCount: count(),
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.itemId, products.id))
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.paymentStatus, 'paid'))
    .groupBy(orderItems.itemId, orderItems.itemName, products.type)
    .orderBy(desc(sum(orderItems.totalPrice)))
    .limit(10)

  const formattedTopProducts = topProducts.map(item => ({
    id: item.productId,
    name: item.productName,
    type: item.productType || 'unknown',
    quantity: Number(item.totalQuantity) || 0,
    revenue: (Number(item.totalRevenue) || 0) / 100,
    orders: Number(item.orderCount) || 0
  }))

  return {
    metrics: {
      revenue: totalRevenue,
      subscriptions: totalSubscriptions,
      activePlans: activePlans,
      companies: totalCompanies
    },
    recentSubscriptions,
    recentCompanies,
    recentInvoices,
    chartData,
    salesByType: formattedSalesByType,
    topProducts: formattedTopProducts
  }
}

