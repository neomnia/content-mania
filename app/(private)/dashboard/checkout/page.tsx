"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, CreditCard, Lock, Mail, ArrowLeft, Calendar, ShoppingBag, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getProductById, getCart, processCheckout, addToCart } from "@/app/actions/ecommerce"
import { getPaymentMethods, getCustomerPortalUrl } from "@/app/actions/payments"

const plans = [
  {
    id: "starter",
    name: "Starter Plan",
    price: 199,
    deliveryTime: "2-hour session",
    description: "Live walkthrough and setup assistance",
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: 699,
    deliveryTime: "Multiple sessions",
    description: "In-depth onboarding and advanced configuration",
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    price: 2999,
    deliveryTime: "Comprehensive support",
    description: "Full architecture review and optimization",
  },
  {
    id: "custom",
    name: "Custom Hourly",
    price: 120,
    deliveryTime: "Flexible scheduling",
    description: "Hourly consulting for specific needs",
    isHourly: true,
  },
]

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [upsellProduct, setUpsellProduct] = useState<any | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cartId, setCartId] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<"card" | "paypal">("card")
  const [userInfo, setUserInfo] = useState<{
    name: string
    email: string
    company?: string
  } | null>(null)

  useEffect(() => {
    const moduleId = searchParams.get("module")
    const planId = searchParams.get("plan")

    const loadData = async () => {
      try {
        // If module ID is present, add it to cart first
        if (moduleId) {
          const addResult = await addToCart(moduleId)
          if (!addResult.success) {
            toast.error("Failed to add item to cart")
          }
          // Continue to load cart...
        }

        if (planId) {
          const plan = plans.find((p) => p.id === planId)
          if (plan) {
            setCartItems([{
              ...plan,
              icon: Calendar,
              quantity: 1,
              currency: "EUR"
            }])
          }
        } else {
          // Load from server cart (for both normal cart access AND after adding module)
          const result = await getCart()
          if (result.success && result.data && result.data.items.length > 0) {
            setCartId(result.data.id)
            const items = result.data.items.map((item: any) => ({
              id: item.product.id,
              name: item.product.title,
              price: item.product.price / 100,
              icon: ShoppingBag,
              deliveryTime: "Instant Access",
              description: item.product.description,
              quantity: item.quantity,
              currency: item.product.currency
            }))
            setCartItems(items)

            // Check for upsell
            const itemWithUpsell = result.data.items.find((item: any) => item.product.upsellProduct)
            if (itemWithUpsell) {
              const upsell = itemWithUpsell.product.upsellProduct
              // Only show if not already in cart
              if (!items.find((i: any) => i.id === upsell.id)) {
                setUpsellProduct({
                  id: upsell.id,
                  name: upsell.title,
                  price: upsell.price / 100,
                  description: upsell.description,
                  currency: upsell.currency
                })
              }
            }
          } else {
            // Empty cart - don't redirect immediately, let user see the checkout page
            console.log('[Checkout] Cart is empty, but staying on page')
            // User can navigate back or add items
          }
        }
      } catch (error) {
        console.error("Failed to load checkout data", error)
        toast.error("Failed to load checkout details")
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Charger les informations utilisateur depuis localStorage
    const profileData = localStorage.getItem("userProfile")
    if (profileData) {
      try {
        const profile = JSON.parse(profileData)
        setUserInfo({
          name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
          email: profile.email || "",
          company: profile.company || undefined,
        })
      } catch (error) {
        console.error("Failed to parse profile data:", error)
      }
    }
  }, [searchParams, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Plus nécessaire - les infos user sont chargées automatiquement
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      if (!cartId) {
        toast.warning("Pas de panier actif. Redirection vers le panier...")
        router.push("/dashboard/cart")
        setIsProcessing(false)
        return
      }

      console.log('[Checkout] Processing order...', { cartId })
      const result = await processCheckout(cartId)
      
      if (result.success) {
        toast.success("Commande traitée avec succès !")
        console.log('[Checkout] ✅ Order completed successfully')
        // Rediriger vers le panier pour voir la confirmation
        router.push("/dashboard/cart")
      } else {
        console.error('[Checkout] ❌ Checkout failed:', result.error)
        toast.error(result.error || "Erreur lors du checkout")
        // Ne pas bloquer l'utilisateur, le laisser sur la page
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Une erreur est survenue. Veuillez réessayer.")
      // Ne pas bloquer l'utilisateur
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddUpsell = async () => {
    if (!upsellProduct) return
    
    try {
      const result = await addToCart(upsellProduct.id)
      if (result.success) {
        toast.success("Upsell added to cart")
        // Reload page to refresh cart
        window.location.reload()
      } else {
        toast.error("Failed to add upsell")
      }
    } catch (error) {
      toast.error("Failed to add upsell")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#CD7F32]" />
      </div>
    )
  }

  // Afficher un message si le panier est vide au lieu de bloquer
  if (cartItems.length === 0) {
    return (
      <div className="container max-w-6xl py-10">
        <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au Dashboard
        </Link>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Panier vide
            </CardTitle>
            <CardDescription>
              Votre panier est actuellement vide. Ajoutez des produits pour continuer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Link href="/store" className="flex-1">
                <Button className="w-full">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Parcourir la boutique
                </Button>
              </Link>
              <Link href="/dashboard/cart" className="flex-1">
                <Button variant="outline" className="w-full">
                  Voir le panier
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const tax = subtotal * 0.2
  const total = subtotal + tax
  const currencySymbol = cartItems.length > 0 && cartItems[0].currency === 'USD' ? '$' : '€'

  return (
    <div className="container max-w-6xl py-10">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au Dashboard
        </Link>
        <Link href="/dashboard/cart">
          <Button variant="outline" size="sm">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Voir le panier
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Order Summary */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-start space-x-4 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.deliveryTime}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                      <span className="font-medium">{currencySymbol}{item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}

              {upsellProduct && (
                <div className="mt-4 p-4 border border-dashed border-primary/50 rounded-lg bg-primary/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-primary">Special Offer!</h4>
                      <p className="text-sm font-medium mt-1">{upsellProduct.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{upsellProduct.description}</p>
                      <p className="text-sm font-bold mt-2">{currencySymbol}{upsellProduct.price}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleAddUpsell} className="ml-2">
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (20%)</span>
                  <span>{currencySymbol}{tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          {/* Billing Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Informations de facturation
              </CardTitle>
              <CardDescription>
                Ces informations seront utilisées pour votre facture
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userInfo ? (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Nom</span>
                    <span className="font-medium">{userInfo.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium">{userInfo.email}</span>
                  </div>
                  {userInfo.company && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Entreprise</span>
                      <span className="font-medium">{userInfo.company}</span>
                    </div>
                  )}
                  <div className="mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/settings">
                        Modifier mes informations
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">Chargement des informations...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Méthode de paiement</CardTitle>
              <CardDescription>Sélectionnez votre mode de paiement sécurisé</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <Lock className="mr-2 h-4 w-4" />
                    Mode de paiement
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div 
                      className={`cursor-pointer border rounded-lg p-4 flex items-center space-x-4 transition-all ${selectedMethod === 'card' ? 'border-[#CD7F32] bg-[#CD7F32]/5 ring-1 ring-[#CD7F32]' : 'border-border hover:border-[#CD7F32]/50'}`}
                      onClick={() => setSelectedMethod('card')}
                    >
                      <CreditCard className={`h-6 w-6 ${selectedMethod === 'card' ? 'text-[#CD7F32]' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">Carte Bancaire</p>
                        <p className="text-xs text-muted-foreground">Paiement sécurisé via Lago</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`cursor-pointer border rounded-lg p-4 flex items-center space-x-4 transition-all ${selectedMethod === 'paypal' ? 'border-[#CD7F32] bg-[#CD7F32]/5 ring-1 ring-[#CD7F32]' : 'border-border hover:border-[#CD7F32]/50'}`}
                      onClick={() => setSelectedMethod('paypal')}
                    >
                      <svg className={`h-6 w-6 ${selectedMethod === 'paypal' ? 'text-[#003087]' : 'text-muted-foreground'}`} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.946 5.438-3.158 7.12-6.594 7.12H10.5l-.962 6.032a.64.64 0 0 1-.632.537l-1.83.002v.002z" />
                      </svg>
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-xs text-muted-foreground">Compte PayPal</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Paiement 100% sécurisé</p>
                      <p className="text-muted-foreground text-xs">
                        Vos données de paiement sont cryptées et sécurisées via Lago. 
                        Nous ne stockons aucune information bancaire.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      Payer {currencySymbol}{total.toFixed(2)}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  En cliquant sur "Payer", vous acceptez nos conditions générales de vente
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
