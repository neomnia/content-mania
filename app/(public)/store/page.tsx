"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { getProducts, addToCart } from "@/app/actions/ecommerce"
import { formatProductPrice, hasValidPrice } from "@/lib/product-utils"
import { toast } from "sonner"
import Link from "next/link"

export default function StorePage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await getProducts({ isPublished: true })
        setProducts(data || [])
      } catch (error) {
        console.error("Failed to load products:", error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const handleProductAction = async (product: any) => {
    setActionLoading(product.id)
    try {
      if (product.type === 'appointment') {
        // Redirect to booking page for appointments
        router.push(`/book/${product.id}`)
      } else if (product.type === 'free') {
        // Redirect to documentation/download for free products
        router.push('/docs')
      } else {
        // Add to cart for purchasable products
        const result = await addToCart(product.id)
        if (result.success) {
          toast.success("Produit ajouté au panier")
          router.push("/dashboard/checkout")
        } else {
          toast.error(result.error || "Erreur lors de l'ajout au panier")
        }
      }
    } catch (error) {
      console.error("Action error:", error)
      toast.error("Une erreur est survenue")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <h1 className="text-4xl font-bold mb-8">Store</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#CD7F32]" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Store</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez nos produits et services pour accompagner votre projet.
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="relative flex flex-col">
              {product.isFeatured && (
                <Badge className="absolute top-4 right-4 bg-[#CD7F32] hover:bg-[#B8691C]">
                  ⭐ Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{product.title}</CardTitle>
                {product.type && (
                  <Badge variant="outline" className="w-fit mt-2">
                    {product.type === 'appointment' ? 'Rendez-vous' :
                     product.type === 'free' ? 'Gratuit' :
                     product.type === 'digital' ? 'Digital' : 'Produit'}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground mb-4">{product.description}</p>
                {hasValidPrice(product) ? (
                  <p className="text-2xl font-bold">
                    {formatProductPrice(product)}
                  </p>
                ) : product.type === 'free' ? (
                  <p className="text-2xl font-bold text-[#22C55E]">Gratuit</p>
                ) : (
                  <p className="text-lg text-muted-foreground">Prix sur demande</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleProductAction(product)}
                  disabled={actionLoading === product.id}
                >
                  {actionLoading === product.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : product.type === 'appointment' ? (
                    'Prendre RDV'
                  ) : product.type === 'free' ? (
                    'Télécharger'
                  ) : (
                    'Ajouter au panier'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">
            Aucun produit disponible pour le moment.
          </p>
          <Link href="/pricing">
            <Button>Voir nos offres</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
