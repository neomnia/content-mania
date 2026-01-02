import { getProducts } from "@/app/actions/ecommerce"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatProductPrice, hasValidPrice } from "@/lib/product-utils"

export const metadata = {
  title: "Store",
  description: "Browse our store for products and services. Find the perfect solution for your business needs.",
  keywords: ["store", "products", "services", "buy", "shop"],
}

export default async function StorePage() {
  const { data: products } = await getProducts({ isPublished: true })

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Store</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products?.map((product) => (
          <Card key={product.id} className="relative">
            {product.isFeatured && (
              <Badge className="absolute top-4 right-4 bg-[#CD7F32] hover:bg-[#B8691C]">
                ⭐ Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{product.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{product.description}</p>
              {hasValidPrice(product) ? (
                <p className="text-2xl font-bold">
                  {formatProductPrice(product)}
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">Prix sur demande</p>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                {product.type === 'appointment' ? 'Prendre RDV' : 
                 product.type === 'free' ? 'Télécharger' : 
                 'Add to Cart'}
              </Button>
            </CardFooter>
          </Card>
        ))}
        {products?.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No products available at the moment.
          </div>
        )}
      </div>
    </div>
  )
}
