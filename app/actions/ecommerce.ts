'use server'

import { db } from "@/db"
import { products, carts, cartItems, orders, orderItems, outlookIntegrations } from "@/db/schema"
import { eq, and, desc, asc, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { getLagoClient, getLagoConfig, type LagoMode } from "@/lib/lago"
import { emailRouter } from "@/lib/email"
import { cookies } from "next/headers"

// --- Cart Migration ---

/**
 * Migrate a guest cart to a logged-in user
 * This should be called after login to transfer cart ownership
 */
export async function migrateGuestCart(): Promise<{ success: boolean; migrated: boolean; cartId?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: true, migrated: false }
    }

    const cookieStore = await cookies()
    const guestCartId = cookieStore.get("cart_id")?.value

    if (!guestCartId) {
      console.log('[migrateGuestCart] No guest cart cookie found')
      return { success: true, migrated: false }
    }

    // Find the guest cart (cart with this ID that has no userId)
    const guestCart = await db.query.carts.findFirst({
      where: and(
        eq(carts.id, guestCartId),
        isNull(carts.userId),
        eq(carts.status, "active")
      )
    })

    if (!guestCart) {
      console.log('[migrateGuestCart] Guest cart not found or already has userId', { guestCartId })
      return { success: true, migrated: false }
    }

    // Check if user already has an active cart
    const userCart = await db.query.carts.findFirst({
      where: and(
        eq(carts.userId, user.userId),
        eq(carts.status, "active")
      ),
      with: { items: true }
    })

    if (userCart && userCart.items.length > 0) {
      // User already has items in their cart - merge guest cart items
      console.log('[migrateGuestCart] Merging guest cart into existing user cart', {
        guestCartId,
        userCartId: userCart.id
      })

      const guestItems = await db.query.cartItems.findMany({
        where: eq(cartItems.cartId, guestCartId)
      })

      for (const item of guestItems) {
        // Check if item already in user cart
        const existingItem = userCart.items.find(i => i.productId === item.productId)
        if (existingItem) {
          // Update quantity
          await db.update(cartItems)
            .set({ quantity: existingItem.quantity + item.quantity })
            .where(eq(cartItems.id, existingItem.id))
        } else {
          // Move item to user cart
          await db.update(cartItems)
            .set({ cartId: userCart.id })
            .where(eq(cartItems.id, item.id))
        }
      }

      // Delete the empty guest cart
      await db.delete(carts).where(eq(carts.id, guestCartId))

      // Clear the cookie
      cookieStore.delete("cart_id")

      console.log('[migrateGuestCart] ✅ Guest cart merged into user cart')
      return { success: true, migrated: true, cartId: userCart.id }
    } else {
      // User has no active cart or empty cart - just assign the guest cart to user
      console.log('[migrateGuestCart] Assigning guest cart to user', {
        guestCartId,
        userId: user.userId
      })

      await db.update(carts)
        .set({ userId: user.userId })
        .where(eq(carts.id, guestCartId))

      // Clear the cookie (cart is now linked by userId)
      cookieStore.delete("cart_id")

      console.log('[migrateGuestCart] ✅ Guest cart assigned to user')
      return { success: true, migrated: true, cartId: guestCartId }
    }
  } catch (error) {
    console.error('[migrateGuestCart] Error:', error)
    return { success: false, migrated: false }
  }
}

// --- Products ---

export async function getProducts(filter: { isPublished?: boolean } = {}) {
  try {
    const conditions = []
    if (filter.isPublished !== undefined) {
      conditions.push(eq(products.isPublished, filter.isPublished))
    }

    const allProducts = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(products.isFeatured), asc(products.price)],
    })
    return { success: true, data: allProducts }
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return { success: false, error: "Failed to fetch products" }
  }
}

export async function getProductById(id: string) {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id)
    })
    
    if (!product) {
      return { success: false, error: "Product not found" }
    }

    return { success: true, data: product }
  } catch (error) {
    console.error("Failed to fetch product:", error)
    return { success: false, error: "Failed to fetch product" }
  }
}

export async function upsertProduct(data: any) {
  try {
    const user = await getCurrentUser()
    // TODO: Check for admin role properly
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Basic validation (can be improved with Zod)
    if (data.id) {
      // Update - seulement les champs fournis
      const updateData: any = {
        updatedAt: new Date(),
      }
      
      // Ajouter uniquement les champs qui sont définis dans data
      if (data.title !== undefined) updateData.title = data.title
      if (data.subtitle !== undefined) updateData.subtitle = data.subtitle
      if (data.description !== undefined) updateData.description = data.description
      if (data.features !== undefined) updateData.features = data.features
      if (data.price !== undefined) updateData.price = data.price
      if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate
      if (data.type !== undefined) updateData.type = data.type
      if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl
      if (data.icon !== undefined) updateData.icon = data.icon
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.outlookEventTypeId !== undefined) updateData.outlookEventTypeId = data.outlookEventTypeId
      if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
      if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured
      if (data.upsellProductId !== undefined) updateData.upsellProductId = data.upsellProductId
      if (data.vatRateId !== undefined) updateData.vatRateId = data.vatRateId
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
      
      await db.update(products)
        .set(updateData)
        .where(eq(products.id, data.id))
      
      revalidatePath("/store")
      revalidatePath("/admin/products")
      return { success: true, data: { id: data.id } }
    } else {
      // Create - validation des champs requis
      if (!data.title || data.price === undefined || data.price === null) {
        return { success: false, error: "Missing required fields (title and price)" }
      }
      
      const result = await db.insert(products).values({
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        features: data.features,
        price: data.price,
        hourlyRate: data.hourlyRate,
        type: data.type || 'standard',
        fileUrl: data.fileUrl,
        icon: data.icon,
        currency: data.currency || 'EUR',
        outlookEventTypeId: data.outlookEventTypeId,
        isPublished: data.isPublished || false,
        isFeatured: data.isFeatured || false,
        upsellProductId: data.upsellProductId,
        vatRateId: data.vatRateId,
      }).returning({ id: products.id })
      
      const productId = result[0].id
      
      revalidatePath("/store")
      revalidatePath("/admin/products")
      return { success: true, data: { id: productId } }
    }
  } catch (error) {
    console.error("Failed to upsert product:", error)
    return { success: false, error: "Failed to save product" }
  }
}

export async function deleteProduct(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    await db.delete(products).where(eq(products.id, id))
    
    revalidatePath("/store")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete product:", error)
    return { success: false, error: "Failed to delete product" }
  }
}

// --- Cart ---

export async function getCart() {
  console.log('[getCart] 🛒 Fetching cart...')

  try {
    const user = await getCurrentUser()
    console.log('[getCart] 👤 User check', {
      hasUser: !!user,
      userId: user?.userId,
      email: user?.email
    })

    let cart

    if (user) {
      // First, try to migrate any guest cart to this user
      console.log('[getCart] 🔄 Checking for guest cart migration...')
      const migrationResult = await migrateGuestCart()
      if (migrationResult.migrated) {
        console.log('[getCart] ✅ Guest cart migrated', { cartId: migrationResult.cartId })
      }

      console.log('[getCart] 🔍 Looking for user cart...', { userId: user.userId })
      cart = await db.query.carts.findFirst({
        where: and(
          eq(carts.userId, user.userId),
          eq(carts.status, "active")
        ),
        with: {
          items: {
            with: {
              product: {
                with: {
                  upsellProduct: true
                }
              }
            }
          }
        }
      })
      console.log('[getCart] 📦 User cart result', {
        found: !!cart,
        cartId: cart?.id,
        itemCount: cart?.items?.length || 0
      })
    } else {
      console.log('[getCart] 👻 Guest user - checking cookie')
      const cookieStore = await cookies()
      const cartId = cookieStore.get("cart_id")?.value
      console.log('[getCart] 🍪 Cookie cart_id', { cartId })

      if (cartId) {
        cart = await db.query.carts.findFirst({
          where: and(
            eq(carts.id, cartId),
            eq(carts.status, "active")
          ),
          with: {
            items: {
              with: {
                product: {
                  with: {
                    upsellProduct: true
                  }
                }
              }
            }
          }
        })
        console.log('[getCart] 📦 Cookie cart result', {
          found: !!cart,
          itemCount: cart?.items?.length || 0
        })
      }
    }

    return { success: true, data: cart }
  } catch (error) {
    console.error('[getCart] ❌ Failed to get cart:', error)
    return { success: false, error: "Failed to get cart" }
  }
}

export async function addToCart(productId: string, quantity: number = 1) {
  console.log('[addToCart] 🛒 Starting...', { productId, quantity })

  try {
    // 1. Verify product exists first
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId)
    })

    if (!product) {
      console.error('[addToCart] ❌ Product not found', { productId })
      return { success: false, error: "Product not found" }
    }
    console.log('[addToCart] ✅ Product found', { id: product.id, title: product.title })

    // 2. Get current user
    const user = await getCurrentUser()
    console.log('[addToCart] 👤 User check', {
      hasUser: !!user,
      userId: user?.userId,
      email: user?.email
    })

    let cart

    if (user) {
      // Get or create active cart for authenticated user
      console.log('[addToCart] 🔍 Looking for existing cart...', { userId: user.userId })
      cart = await db.query.carts.findFirst({
        where: and(
          eq(carts.userId, user.userId),
          eq(carts.status, "active")
        )
      })
      console.log('[addToCart] 📦 Existing cart search result', { found: !!cart, cartId: cart?.id })

      if (!cart) {
        console.log('[addToCart] 🆕 Creating new cart for user', { userId: user.userId })
        const [newCart] = await db.insert(carts).values({
          userId: user.userId,
          status: "active"
        }).returning()
        cart = newCart
        console.log('[addToCart] ✅ New cart created', { cartId: cart.id })
      }
    } else {
      // Guest user - use cookie-based cart
      console.log('[addToCart] 👻 Guest user - using cookie cart')
      const cookieStore = await cookies()
      const cartId = cookieStore.get("cart_id")?.value
      console.log('[addToCart] 🍪 Cookie cart_id', { cartId })

      if (cartId) {
        cart = await db.query.carts.findFirst({
          where: and(
            eq(carts.id, cartId),
            eq(carts.status, "active")
          )
        })
        console.log('[addToCart] 📦 Cookie cart found', { found: !!cart })
      }

      if (!cart) {
        console.log('[addToCart] 🆕 Creating new guest cart')
        const [newCart] = await db.insert(carts).values({
          status: "active"
        }).returning()
        cart = newCart

        cookieStore.set("cart_id", cart.id, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: true,
        })
        console.log('[addToCart] ✅ Guest cart created and cookie set', { cartId: cart.id })
      }
    }

    // 3. Check if item already exists in cart
    console.log('[addToCart] 🔍 Checking for existing item in cart', { cartId: cart.id, productId })
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId)
      )
    })

    if (existingItem) {
      console.log('[addToCart] 📝 Updating existing item quantity', {
        existingQty: existingItem.quantity,
        newQty: existingItem.quantity + quantity
      })
      await db.update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id))
    } else {
      console.log('[addToCart] ➕ Adding new item to cart')
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId,
        quantity
      })
    }

    console.log('[addToCart] ✅ Item added to cart successfully', { cartId: cart.id, productId })

    revalidatePath("/cart")
    revalidatePath("/dashboard/cart")
    revalidatePath("/dashboard/checkout")

    return { success: true, cartId: cart.id }
  } catch (error) {
    console.error('[addToCart] ❌ Failed to add to cart:', error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add to cart" }
  }
}

export async function removeFromCart(productId: string) {
  try {
    const user = await getCurrentUser()
    let cartId: string | null = null

    if (user) {
      const cart = await db.query.carts.findFirst({
        where: and(
          eq(carts.userId, user.userId),
          eq(carts.status, "active")
        )
      })
      cartId = cart?.id || null
    } else {
      const cookieStore = await cookies()
      cartId = cookieStore.get("cart_id")?.value || null
    }

    if (!cartId) {
      return { success: false, error: "Cart not found" }
    }

    // Supprimer l'item du panier
    await db.delete(cartItems)
      .where(and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId)
      ))

    revalidatePath("/cart")
    revalidatePath("/dashboard/cart")
    return { success: true }
  } catch (error) {
    console.error("Failed to remove from cart:", error)
    return { success: false, error: "Failed to remove from cart" }
  }
}

export async function updateCartItemQuantity(productId: string, quantity: number) {
  try {
    if (quantity < 1) {
      return await removeFromCart(productId)
    }

    const user = await getCurrentUser()
    let cartId: string | null = null

    if (user) {
      const cart = await db.query.carts.findFirst({
        where: and(
          eq(carts.userId, user.userId),
          eq(carts.status, "active")
        )
      })
      cartId = cart?.id || null
    } else {
      const cookieStore = await cookies()
      cartId = cookieStore.get("cart_id")?.value || null
    }

    if (!cartId) {
      return { success: false, error: "Cart not found" }
    }

    // Mettre à jour la quantité
    const item = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId)
      )
    })

    if (item) {
      await db.update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, item.id))
    }

    revalidatePath("/cart")
    revalidatePath("/dashboard/cart")
    return { success: true }
  } catch (error) {
    console.error("Failed to update cart item:", error)
    return { success: false, error: "Failed to update cart item" }
  }
}

// --- Checkout ---

export async function processCheckout(cartId: string) {
  console.log('[processCheckout] 🛒 Starting checkout process', { cartId })

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.error('[processCheckout] ❌ User not authenticated')
      return { success: false, error: "Not authenticated" }
    }

    console.log('[processCheckout] ✅ User authenticated', {
      userId: user.userId,
      email: user.email
    })

    // 0. Try to migrate guest cart if needed
    console.log('[processCheckout] 🔄 Checking for guest cart migration')
    const migrationResult = await migrateGuestCart()
    if (migrationResult.migrated) {
      console.log('[processCheckout] ✅ Guest cart migrated', { newCartId: migrationResult.cartId })
      // Use the migrated cart ID if different
      if (migrationResult.cartId && migrationResult.cartId !== cartId) {
        console.log('[processCheckout] 📦 Using migrated cart ID', {
          originalCartId: cartId,
          migratedCartId: migrationResult.cartId
        })
        cartId = migrationResult.cartId
      }
    }

    // 1. Get Cart - first try by userId
    console.log('[processCheckout] 📦 Fetching cart data')
    let cart = await db.query.carts.findFirst({
      where: and(
        eq(carts.id, cartId),
        eq(carts.userId, user.userId),
        eq(carts.status, "active")
      ),
      with: {
        items: {
          with: {
            product: true
          }
        }
      }
    })

    // If not found, try to find by cartId only and assign userId
    if (!cart) {
      console.log('[processCheckout] ⚠️ Cart not found with userId, trying without userId filter', { cartId })
      const guestCart = await db.query.carts.findFirst({
        where: and(
          eq(carts.id, cartId),
          eq(carts.status, "active")
        ),
        with: {
          items: {
            with: {
              product: true
            }
          }
        }
      })

      if (guestCart) {
        // Assign cart to user
        console.log('[processCheckout] 🔄 Assigning orphan cart to user', {
          cartId: guestCart.id,
          currentUserId: guestCart.userId,
          newUserId: user.userId
        })
        await db.update(carts)
          .set({ userId: user.userId })
          .where(eq(carts.id, cartId))

        cart = { ...guestCart, userId: user.userId }
      }
    }

    if (!cart) {
      console.error('[processCheckout] ❌ Cart not found', { cartId })
      return { success: false, error: "Cart not found" }
    }

    if (cart.items.length === 0) {
      console.error('[processCheckout] ❌ Cart is empty', { cartId })
      return { success: false, error: "Cart is empty" }
    }

    console.log('[processCheckout] ✅ Cart loaded', { 
      cartId: cart.id,
      itemCount: cart.items.length,
      items: cart.items.map(i => ({ id: i.product.id, title: i.product.title, price: i.product.price, qty: i.quantity }))
    })

    // 2. Initialize Lago based on mode (production/test/dev)
    console.log('[processCheckout] 💳 Checking Lago configuration')
    const lagoConfig = await getLagoConfig()
    console.log('[processCheckout] 📋 Lago mode:', lagoConfig.mode.toUpperCase())

    let lago
    let lagoEnabled = false

    if (lagoConfig.mode === 'dev') {
      console.log('[processCheckout] 🔧 DEV MODE - Lago completely bypassed')
      console.log('[processCheckout] ℹ️  Order will be created without Lago invoice')
    } else {
      try {
        lago = await getLagoClient()
        lagoEnabled = true
        console.log(`[processCheckout] ✅ Lago client initialized in ${lagoConfig.mode.toUpperCase()} mode`)
      } catch (e) {
        console.log('[processCheckout] ⚠️  Lago not configured - proceeding without Lago integration')
        console.log('[processCheckout] ℹ️  Order will be created without invoice generation')
      }
    }

    let invoiceResult

    if (lago && lagoEnabled) {
      // 3. Create/Update Customer in Lago
      console.log('[processCheckout] 👤 Creating/Updating Lago customer')
      const customerInput = {
        external_id: user.userId,
        name: user.email, // JWT doesn't have 'name', use email
        email: user.email,
        currency: "USD",
      }

      try {
        await lago.customers.create({ customer: customerInput })
        console.log('[processCheckout] ✅ Lago customer created', { external_id: user.userId })
      } catch (e) {
        // Ignore if customer exists
        console.log('[processCheckout] ℹ️  Lago customer already exists (expected)', { external_id: user.userId })
      }

      // 4. Prepare Invoice Fees & Ensure Add-ons exist
      console.log('[processCheckout] 📦 Creating Lago add-ons for products')
      const fees = []
      for (const item of cart.items) {
        // Ensure Add-on exists
        try {
          await lago.addOns.create({
            add_on: {
              name: item.product.title,
              code: item.product.id,
              amount_cents: item.product.price,
              amount_currency: "USD",
              description: item.product.description || undefined,
            }
          })
          console.log('[processCheckout] ✅ Add-on created', { code: item.product.id, name: item.product.title })
        } catch (e) {
          // Ignore if add-on already exists
          console.log('[processCheckout] ℹ️  Add-on already exists', { code: item.product.id })
        }

        fees.push({
          add_on_code: item.product.id,
          units: item.quantity.toString(),
        })
      }
      console.log('[processCheckout] ✅ Invoice fees prepared', { feeCount: fees.length })

      // 5. Create Invoice
      console.log('[processCheckout] 🧾 Creating Lago invoice')
      try {
        invoiceResult = await lago.invoices.create({
          invoice: {
            customer: { external_id: user.userId },
            currency: "USD",
            fees: fees,
          }
        })
        console.log('[processCheckout] ✅ Lago invoice created successfully', {
          lago_id: invoiceResult.data.lago_invoice.lago_id,
          number: invoiceResult.data.lago_invoice.number,
          total_amount_cents: invoiceResult.data.lago_invoice.total_amount_cents,
          status: invoiceResult.data.lago_invoice.status
        })
      } catch (e: any) {
        console.error('[processCheckout] ⚠️  Lago invoice creation failed, but continuing checkout', {
          error: e.message,
          status: e.response?.status,
          data: e.response?.data
        })
        // Ne pas bloquer le checkout si Lago échoue
        // L'administrateur peut gérer la facturation manuellement
        console.log('[processCheckout] ℹ️  Proceeding without Lago invoice - order will be created anyway')
        invoiceResult = null
      }
    }

    // 6. Create Order in DB
    console.log('[processCheckout] 📝 Creating order in database')
    const totalAmount = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    console.log('[processCheckout] 💰 Order details', {
      orderNumber,
      totalAmount,
      totalFormatted: (totalAmount / 100).toFixed(2) + ' EUR',
      itemCount: cart.items.length,
      hasLagoInvoice: !!invoiceResult
    })
    
    const [order] = await db.insert(orders).values({
      userId: user.userId,
      companyId: user.companyId,
      orderNumber,
      totalAmount,
      status: "completed",
      paymentStatus: "pending",
      metadata: invoiceResult ? {
        lago_mode: lagoConfig.mode,
        lago_invoice_id: invoiceResult.data.lago_invoice.lago_id,
        lago_invoice_number: invoiceResult.data.lago_invoice.number
      } : {
        lago_mode: lagoConfig.mode,
        note: lagoConfig.mode === 'dev' ? "DEV mode - Lago bypassed" : "Processed without Lago"
      }
    }).returning()

    console.log('[processCheckout] ✅ Order created in database', { orderId: order.id, orderNumber: order.orderNumber })

    // 7. Create Order Items
    console.log('[processCheckout] 📦 Creating order items')
    for (const item of cart.items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        itemType: "product",
        itemId: item.product.id,
        itemName: item.product.title,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity,
      })
      console.log('[processCheckout] ✅ Order item created', {
        itemName: item.product.title,
        quantity: item.quantity,
        unitPrice: (item.product.price / 100).toFixed(2),
        totalPrice: ((item.product.price * item.quantity) / 100).toFixed(2)
      })
    }

    // 7b. Create Appointments for appointment-type products
    if (appointmentsData && Object.keys(appointmentsData).length > 0) {
      console.log('[processCheckout] 📅 Creating appointments for appointment products')
      for (const item of cart.items) {
        if (item.product.type === 'appointment' && appointmentsData[item.product.id]) {
          const appointmentData = appointmentsData[item.product.id]
          const isPaid = (item.product.hourlyRate || 0) > 0
          const price = item.product.hourlyRate || item.product.price || 0

          console.log('[processCheckout] 📅 Creating appointment for:', {
            productId: item.product.id,
            productTitle: item.product.title,
            startTime: appointmentData.startTime,
            endTime: appointmentData.endTime,
            isPaid,
            price: (price / 100).toFixed(2)
          })

          const [appointment] = await db.insert(appointments).values({
            userId: user.userId,
            productId: item.product.id,
            title: item.product.title,
            description: item.product.description || `Réservation: ${item.product.title}`,
            startTime: appointmentData.startTime,
            endTime: appointmentData.endTime,
            timezone: appointmentData.timezone,
            attendeeEmail: appointmentData.attendeeEmail,
            attendeeName: appointmentData.attendeeName,
            attendeePhone: appointmentData.attendeePhone || null,
            notes: appointmentData.notes || null,
            status: 'pending',
            type: isPaid ? 'paid' : 'free',
            price: price,
            currency: item.product.currency || 'EUR',
            isPaid: !isPaid, // Si gratuit, considéré comme "payé"
            paymentStatus: isPaid ? 'pending' : 'paid',
            metadata: {
              orderId: order.id,
              orderNumber,
              devMode: lagoConfig.mode === 'dev'
            }
          }).returning()

          console.log('[processCheckout] ✅ Appointment created:', {
            appointmentId: appointment.id,
            status: appointment.status,
            paymentStatus: appointment.paymentStatus
          })
        }
      }
    }

    // 8. Send Confirmation Email
    console.log('[processCheckout] 📧 Sending confirmation email', { to: user.email })
    try {
      await emailRouter.sendEmail({
        to: [user.email],
        template: "order_confirmation",
        subject: `Order Confirmation #${orderNumber}`,
        data: {
          firstName: user.name?.split(' ')[0] || "Customer",
          orderNumber,
          orderDate: new Date().toLocaleDateString(),
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://neosaas.com'}/orders/${order.id}`,
          // Extra data in case template is updated later
          items: cart.items.map(i => ({
            name: i.product.title,
            quantity: i.quantity,
            price: (i.product.price / 100).toFixed(2)
          })),
          total: (totalAmount / 100).toFixed(2)
        }
      })
      console.log('[processCheckout] ✅ Confirmation email sent successfully')
    } catch (emailError) {
      console.error('[processCheckout] ❌ Failed to send order confirmation email:', emailError)
    }

    // 9. Mark Cart as Converted
    console.log('[processCheckout] 🔄 Converting cart')
    await db.update(carts)
      .set({ status: "converted" })
      .where(eq(carts.id, cart.id))

    console.log('[processCheckout] ✅ Cart converted successfully', { cartId: cart.id })

    revalidatePath("/cart")
    revalidatePath("/orders")
    
    console.log('[processCheckout] 🎉 Checkout completed successfully', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: (totalAmount / 100).toFixed(2) + ' EUR'
    })
    
    return { success: true, orderId: order.id }

  } catch (error) {
    console.error('[processCheckout] 💥 Checkout failed with exception:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return { success: false, error: error instanceof Error ? error.message : "Checkout failed" }
  }
}

// --- Outlook ---

export async function syncOutlookCalendar(authCode: string) {
  // TODO: Exchange code for tokens
  return { success: false, error: "Not implemented yet" }
}

// --- Product Leads (Appointments) ---

/**
 * Create a lead for appointment/consultation products
 * No payment is processed - this is for tracking interest only
 */
export async function createProductLead(data: {
  productId: string
  userEmail: string
  userName?: string
  userPhone?: string
  metadata?: any
}) {
  try {
    const user = await getCurrentUser()
    
    // Verify product exists and is of type 'appointment'
    const product = await db.query.products.findFirst({
      where: eq(products.id, data.productId)
    })
    
    if (!product) {
      return { success: false, error: "Product not found" }
    }
    
    if (product.type !== 'appointment') {
      return { success: false, error: "This product does not support lead creation" }
    }

    // Create the lead
    const { productLeads } = await import("@/db/schema")
    const result = await db.insert(productLeads).values({
      productId: data.productId,
      userId: user?.id || null,
      userEmail: data.userEmail,
      userName: data.userName,
      userPhone: data.userPhone,
      status: 'new',
      source: 'website',
      metadata: data.metadata,
    }).returning({ id: productLeads.id })

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to user
    
    return { success: true, leadId: result[0].id }
  } catch (error) {
    console.error("Failed to create product lead:", error)
    return { success: false, error: "Failed to create lead" }
  }
}
