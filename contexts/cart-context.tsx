"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { getCart, addToCart as addToCartAction } from "@/app/actions/ecommerce"
import { toast } from "sonner"
import { usePathname } from "next/navigation"

interface CartContextType {
  itemCount: number
  isLoading: boolean
  addToCart: (productId: string) => Promise<void>
  clearCart: () => void
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  const refreshCart = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCart()
      if (result.success && result.data) {
        const count = result.data.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0
        setItemCount(count)
      } else {
        // Pas de panier actif = 0 items
        setItemCount(0)
      }
    } catch (error) {
      console.error("[CartContext] Failed to refresh cart", error)
      setItemCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh on mount
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  // Refresh on route change (navigation)
  useEffect(() => {
    refreshCart()
  }, [pathname, refreshCart])

  // Periodic refresh every 30 seconds to catch server-side changes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshCart()
    }, 30000)
    return () => clearInterval(interval)
  }, [refreshCart])

  const addToCart = async (productId: string) => {
    try {
      const result = await addToCartAction(productId)
      if (result.success) {
        await refreshCart()
        toast.success("Ajouté au panier")
      } else {
        toast.error(result.error || "Erreur lors de l'ajout au panier")
      }
    } catch (error) {
      console.error("[CartContext] Add to cart error", error)
      toast.error("Erreur lors de l'ajout au panier")
    }
  }

  const clearCart = useCallback(() => {
    console.log("[CartContext] Clearing cart")
    setItemCount(0)
    // Force refresh after a short delay to sync with server
    setTimeout(() => {
      refreshCart()
    }, 500)
  }, [refreshCart])

  return (
    <CartContext.Provider value={{ itemCount, isLoading, addToCart, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
