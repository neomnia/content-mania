"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Check, Info, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getProducts, addToCart } from "@/app/actions/ecommerce"
import { toast } from "sonner"

// Define static plans that can be shown even without database products
const staticPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 199,
    description: "Ideal for solo devs or small teams",
    features: [
      "2-hours live walkthrough",
      "Docker setup",
      "CLI usage & deployment",
      "Environment configuration",
    ],
    deliverables: ["Setup notes and checklist"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 699,
    description: "Perfect for teams building core modules",
    features: [
      "In-depth onboarding",
      "AWS & CDK walkthrough",
      "Branching strategies",
      "Stripe/ CMS setup",
    ],
    deliverables: ["Recorded sessions", "Setup documentation"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 2999,
    description: "Designed for full production SaaS",
    features: [
      "Architecture review",
      "Advanced customization",
      "CI/CD fine-tuning",
      "Performance review",
    ],
    deliverables: ["Recorded sessions", "Custom documentation", "Technical recommendations"],
    popular: false,
  },
  {
    id: "custom",
    name: "Custom",
    price: 120,
    description: "Best for customized implementations",
    isHourly: true,
    features: [
      "Debugging complex issues",
      "Third-party integrations",
      "Multitenancy",
      "Stripe customization",
    ],
    deliverables: ["Quick kickoff", "Flexible work", "Weekly updates", "Pause anytime"],
    popular: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState<string | null>(null)

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

  const handlePurchase = async (planId: string) => {
    setIsLoading(planId)
    try {
      // Find corresponding product from database if it exists
      const product = products.find(p =>
        p.title?.toLowerCase().includes(planId) ||
        p.slug === planId ||
        p.id === planId
      )

      if (product) {
        // Add to cart and redirect to checkout
        const result = await addToCart(product.id)
        if (result.success) {
          toast.success("Produit ajouté au panier")
          router.push("/dashboard/checkout")
        } else {
          toast.error(result.error || "Erreur lors de l'ajout au panier")
        }
      } else {
        // Redirect to contact/booking page for static plans
        toast.info("Redirection vers la page de contact...")
        router.push(`/contact?plan=${planId}`)
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast.error("Une erreur est survenue")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="container py-12 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Let our experts help you</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the plan that fits your needs or download NeoSaaS for free to get started on your own.
        </p>
      </div>

      <div className="mx-auto max-w-4xl mt-12">
        <Card className="bg-gradient-to-br from-[#CD7F32]/10 to-background border-[#CD7F32]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#CD7F32]/20 flex items-center justify-center">
                  <Download className="h-6 w-6 text-[#CD7F32]" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Download NeoSaaS for Free</CardTitle>
                  <CardDescription className="mt-1">
                    Get the complete source code and deploy it yourself
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-[#CD7F32] text-white">FREE</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              NeoSaaS is open-source and available for free download. Deploy on your own infrastructure using Docker,
              Node.js, or your preferred hosting provider.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/docs" className="w-full">
              <Button size="lg" className="w-full bg-[#CD7F32] hover:bg-[#B26B27]">
                <Download className="mr-2 h-5 w-5" />
                Download & Documentation
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Dynamic Products from Database */}
      {!loading && products.length > 0 && (
        <div className="mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Nos offres</h2>
          <div className="grid max-w-6xl mx-auto gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col border-2 relative">
                {product.isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#22C55E] text-white">Populaire</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{product.title}</CardTitle>
                  <CardDescription className="mt-2">{product.description}</CardDescription>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {product.price ? `${(product.price / 100).toFixed(0)}€` : 'Sur demande'}
                    </span>
                    {product.type === 'appointment' && (
                      <span className="text-muted-foreground text-sm ml-2">/ session</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <Button
                    className="w-full bg-[#CD7F32] hover:bg-[#B26B27]"
                    onClick={() => handlePurchase(product.id)}
                    disabled={isLoading === product.id}
                  >
                    {isLoading === product.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Chargement...
                      </>
                    ) : product.type === 'appointment' ? (
                      "Prendre rendez-vous"
                    ) : (
                      "Acheter maintenant"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Static Plans */}
      <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-4">
        {staticPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col border-2 ${plan.popular ? 'border-[#22C55E] relative' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#22C55E] text-white">Most popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">${plan.price}</span>
                {plan.isHourly && (
                  <span className="text-muted-foreground">/hour</span>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Info className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <Button
                className={`w-full ${plan.popular ? 'bg-[#22C55E] hover:bg-[#22C55E]/90' : 'bg-transparent'}`}
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handlePurchase(plan.id)}
                disabled={isLoading === plan.id}
              >
                {isLoading === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : plan.id === 'custom' ? (
                  "Contact us"
                ) : (
                  "Get started"
                )}
              </Button>

              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  {plan.id === 'starter' ? 'Possible focus areas:' :
                   plan.id === 'pro' ? 'Potential session topics:' :
                   plan.id === 'enterprise' ? 'Areas we could address:' :
                   'We typically assist with:'}
                </p>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-semibold">You'll receive:</p>
                <ul className="space-y-2 text-sm">
                  {plan.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
