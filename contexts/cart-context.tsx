"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getCart, addToCart as addToCartAction } from "@/app/actions/ecommerce"
import { toast } from "sonner"

interface CartContextType {
  itemCount: number
  addToCart: (productId: string) => Promise<void>
  clearCart: () => void
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0)

  const refreshCart = async () => {
    try {
      const result = await getCart()
      if (result.success && result.data) {
        const count = result.data.items.reduce((acc: number, item: any) => acc + item.quantity, 0)
        setItemCount(count)
      }
    } catch (error) {
      console.error("Failed to refresh cart", error)
    }
  }

  useEffect(() => {
    refreshCart()
  }, [])

  const addToCart = async (productId: string) => {
    try {
      const result = await addToCartAction(productId)
      if (result.success) {
        await refreshCart()
        toast.success("Added to cart")
      } else {
        toast.error(result.error || "Failed to add to cart")
      }
    } catch (error) {
      console.error("Add to cart error", error)
      toast.error("Failed to add to cart")
    }
  }

  const clearCart = () => {
    setItemCount(0)
    // Ideally call server to clear cart too
  }

  return (
    <CartContext.Provider value={{ itemCount, addToCart, clearCart, refreshCart }}>
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
