import { getProducts } from "@/app/actions/ecommerce"
import { db } from "@/db"
import { vatRates, orderItems, products as productsTable } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { ProductsPageClient } from "./products-page-client"

export default async function AdminProductsPage() {
  const { data: products } = await getProducts()
  
  // Récupérer le nombre de ventes par produit
  const salesCountResult = await db
    .select({
      productId: sql<string>`COALESCE(${orderItems.itemId}, '')::text`,
      salesCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    })
    .from(orderItems)
    .where(eq(orderItems.itemType, 'product'))
    .groupBy(orderItems.itemId)

  const salesByProduct = new Map(salesCountResult.map(r => [r.productId, r.salesCount]))
  
  // Enrichir les produits avec le nombre de ventes
  const productsWithSales = (products || []).map(product => ({
    ...product,
    salesCount: salesByProduct.get(product.id) || 0
  }))
  
  const rates = await db.select().from(vatRates).where(eq(vatRates.isActive, true))

  return <ProductsPageClient products={productsWithSales} vatRates={rates} />
}
