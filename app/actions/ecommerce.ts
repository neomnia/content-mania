'use server'

import { db } from "@/db"
import { products, carts, cartItems, orders, orderItems, appointments, outlookIntegrations, users } from "@/db/schema"
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

      // Basic fields
      if (data.title !== undefined) updateData.title = data.title
      if (data.subtitle !== undefined) updateData.subtitle = data.subtitle
      if (data.description !== undefined) updateData.description = data.description
      if (data.features !== undefined) updateData.features = data.features
      if (data.price !== undefined) updateData.price = data.price
      if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate
      if (data.type !== undefined) updateData.type = data.type
      if (data.icon !== undefined) updateData.icon = data.icon
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
      if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured
      if (data.upsellProductId !== undefined) updateData.upsellProductId = data.upsellProductId
      if (data.vatRateId !== undefined) updateData.vatRateId = data.vatRateId
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl

      // v3.0 - Free option
      if (data.isFree !== undefined) updateData.isFree = data.isFree

      // v3.0 - Digital product fields
      if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl
      if (data.licenseKey !== undefined) updateData.licenseKey = data.licenseKey
      if (data.licenseInstructions !== undefined) updateData.licenseInstructions = data.licenseInstructions

      // v3.0 - Physical product fields
      if (data.requiresShipping !== undefined) updateData.requiresShipping = data.requiresShipping
      if (data.weight !== undefined) updateData.weight = data.weight
      if (data.dimensions !== undefined) updateData.dimensions = data.dimensions
      if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity
      if (data.shippingNotes !== undefined) updateData.shippingNotes = data.shippingNotes

      // v3.0 - Consulting product fields
      if (data.consultingMode !== undefined) updateData.consultingMode = data.consultingMode
      if (data.appointmentDuration !== undefined) updateData.appointmentDuration = data.appointmentDuration
      if (data.outlookEventTypeId !== undefined) updateData.outlookEventTypeId = data.outlookEventTypeId

      await db.update(products)
        .set(updateData)
        .where(eq(products.id, data.id))

      revalidatePath("/store")
      revalidatePath("/admin/products")
      revalidatePath("/dashboard")
      return { success: true, data: { id: data.id } }
    } else {
      // Create - validation des champs requis
      if (!data.title) {
        return { success: false, error: "Missing required field: title" }
      }

      const result = await db.insert(products).values({
        // Basic fields
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        features: data.features,
        price: data.price || 0,
        hourlyRate: data.hourlyRate,
        type: data.type || 'standard',
        icon: data.icon,
        currency: data.currency || 'EUR',
        isPublished: data.isPublished || false,
        isFeatured: data.isFeatured || false,
        upsellProductId: data.upsellProductId,
        vatRateId: data.vatRateId,
        // v3.0 - Free option
        isFree: data.isFree || false,
        // v3.0 - Digital product fields
        fileUrl: data.fileUrl,
        licenseKey: data.licenseKey,
        licenseInstructions: data.licenseInstructions,
        // v3.0 - Physical product fields
        requiresShipping: data.requiresShipping || false,
        weight: data.weight,
        dimensions: data.dimensions,
        stockQuantity: data.stockQuantity,
        shippingNotes: data.shippingNotes,
        // v3.0 - Consulting product fields
        consultingMode: data.consultingMode,
        appointmentDuration: data.appointmentDuration,
        outlookEventTypeId: data.outlookEventTypeId,
      }).returning({ id: products.id })

      const productId = result[0].id

      revalidatePath("/store")
      revalidatePath("/admin/products")
      revalidatePath("/dashboard")
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
/**
 * Process checkout for a cart
 * @param cartId - ID of the cart to process
 * @param appointmentsData - Optional map of productId -> appointment data for appointment products
 */
export async function processCheckout(
  cartId: string,
  appointmentsData?: Record<string, {
    startTime: string
    endTime: string
    timezone: string
    attendeeEmail: string
    attendeeName: string
    attendeePhone?: string
    notes?: string
  }>
) {
  console.log('[processCheckout] 🛒 Starting checkout process', { 
    cartId, 
    hasAppointments: !!appointmentsData,
    appointmentCount: appointmentsData ? Object.keys(appointmentsData).length : 0
  })

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

    // 7. Create Order Items with License Keys for Digital Products
    console.log('[processCheckout] 📦 Creating order items')
    const { generateProductLicenseKey } = await import('@/lib/license-key-generator')
    
    for (const item of cart.items) {
      // Generate license key for digital products
      let itemMetadata: any = {}
      
      if (item.product.type === 'digital') {
        // Generate unique license key
        const generatedLicenseKey = generateProductLicenseKey(
          item.product.title,
          item.product.licenseKey
        )
        
        itemMetadata = {
          productType: 'digital',
          downloadUrl: item.product.fileUrl || item.product.downloadUrl,
          generatedLicenseKey,
          licenseInstructions: item.product.licenseInstructions
        }
        
        console.log('[processCheckout] 🔑 Generated license key for digital product', {
          productTitle: item.product.title,
          licenseKey: generatedLicenseKey
        })
      } else if (item.product.type === 'physical') {
        itemMetadata = {
          productType: 'physical',
          requiresShipping: true
        }
      } else if (item.product.type === 'appointment') {
        itemMetadata = {
          productType: 'appointment'
        }
      }
      
      await db.insert(orderItems).values({
        orderId: order.id,
        itemType: "product",
        itemId: item.product.id,
        itemName: item.product.title,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity,
        metadata: itemMetadata
      })
      console.log('[processCheckout] ✅ Order item created', {
        itemName: item.product.title,
        quantity: item.quantity,
        type: item.product.type,
        unitPrice: (item.product.price / 100).toFixed(2),
        totalPrice: ((item.product.price * item.quantity) / 100).toFixed(2)
      })
    }

    // 7a. Send Admin Notification for New Order
    console.log('[processCheckout] 📢 Sending admin notification for new order')
    try {
      const { 
        notifyAdminNewOrder, 
        notifyAdminPhysicalProductsToShip,
        notifyClientDigitalProductAccess,
        notifyAdminDigitalProductSale
      } = await import('@/lib/notifications')
      
      // Check if order has physical products requiring shipment
      const physicalProducts = cart.items
        .filter(item => item.product.type === 'physical' || item.product.requiresShipping)
        .map(item => ({
          title: item.product.title,
          quantity: item.quantity,
          requiresShipping: item.product.requiresShipping || false,
          shippingNotes: item.product.shippingNotes || undefined
        }))

      const hasPhysicalProducts = physicalProducts.length > 0
      
      // Check if order has digital products
      const digitalProducts = cart.items
        .filter(item => item.product.type === 'digital')
        .map(item => ({
          title: item.product.title,
          quantity: item.quantity
        }))
      
      const hasDigitalProducts = digitalProducts.length > 0

      // Get user details for shipping
      const userDetails = await db.query.users.findFirst({
        where: eq(users.id, user.userId)
      })

      // Send general order notification
      await notifyAdminNewOrder({
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.userId,
        userEmail: user.email,
        userName: userDetails?.firstName && userDetails?.lastName 
          ? `${userDetails.firstName} ${userDetails.lastName}` 
          : user.email,
        totalAmount,
        currency: 'EUR',
        hasAppointment: appointmentsData ? Object.keys(appointmentsData).length > 0 : false,
        appointmentDetails: appointmentsData ? Object.values(appointmentsData)[0] : undefined
      })

      // If there are physical products, send additional shipment notification
      if (hasPhysicalProducts) {
        console.log('[processCheckout] 📦 Sending shipment notification for physical products')
        await notifyAdminPhysicalProductsToShip({
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: user.userId,
          userEmail: user.email,
          userName: userDetails?.firstName && userDetails?.lastName 
            ? `${userDetails.firstName} ${userDetails.lastName}` 
            : user.email,
          physicalProducts,
          shippingAddress: userDetails ? {
            address: userDetails.address || undefined,
            city: userDetails.city || undefined,
            postalCode: userDetails.postalCode || undefined,
            country: userDetails.country || undefined
          } : undefined
        })
      }
      
      // If there are digital products, send access notifications
      if (hasDigitalProducts) {
        console.log('[processCheckout] 💻 Processing digital products')
        
        // Get order items with metadata to retrieve license keys
        const createdOrderItems = await db.query.orderItems.findMany({
          where: eq(orderItems.orderId, order.id)
        })
        
        // Build digital products list with access credentials
        const digitalProductsWithAccess = createdOrderItems
          .filter(item => item.metadata && (item.metadata as any).productType === 'digital')
          .map(item => ({
            title: item.itemName,
            downloadUrl: (item.metadata as any).downloadUrl || null,
            licenseKey: (item.metadata as any).generatedLicenseKey || null,
            licenseInstructions: (item.metadata as any).licenseInstructions || null
          }))
        
        if (digitalProductsWithAccess.length > 0) {
          // Send client notification with download URLs and license keys
          console.log('[processCheckout] 📧 Sending digital product access to client')
          await notifyClientDigitalProductAccess({
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: user.userId,
            userEmail: user.email,
            userName: userDetails?.firstName && userDetails?.lastName 
              ? `${userDetails.firstName} ${userDetails.lastName}` 
              : user.email,
            digitalProducts: digitalProductsWithAccess
          })
          
          // Send admin notification about digital product sale
          console.log('[processCheckout] 📧 Notifying admin about digital product sale')
          await notifyAdminDigitalProductSale({
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: user.userId,
            userEmail: user.email,
            userName: userDetails?.firstName && userDetails?.lastName 
              ? `${userDetails.firstName} ${userDetails.lastName}` 
              : user.email,
            digitalProducts,
            totalAmount,
            currency: 'EUR'
          })
        }
      }

      console.log('[processCheckout] ✅ Admin notifications sent successfully')
    } catch (notifError) {
      console.warn('[processCheckout] ⚠️ Failed to send admin notification (non-critical):', notifError instanceof Error ? notifError.message : notifError)
      // Non-blocking - continuer le checkout même si la notification échoue
    }

    // 7b. Create Appointments for appointment-type products
    if (appointmentsData && Object.keys(appointmentsData).length > 0) {
      console.log('[processCheckout] 📅 Creating appointments for appointment products')
      
      // 🔒 VALIDATION SERVEUR : Valider les données des appointments AVANT création
      console.log('[processCheckout] 🔍 Validating appointment data server-side')
      for (const item of cart.items) {
        if (item.product.type === 'appointment') {
          const appointmentData = appointmentsData[item.product.id]
          
          // Vérifier que les données existent
          if (!appointmentData) {
            throw new Error(`Missing appointment data for product: ${item.product.title}`)
          }
          
          // Vérifier que les créneaux horaires sont présents
          if (!appointmentData.startTime || !appointmentData.endTime) {
            throw new Error(`Missing time slots for appointment: ${item.product.title}`)
          }
          
          // Convertir et valider les dates
          const start = new Date(appointmentData.startTime)
          const end = new Date(appointmentData.endTime)
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error(`Invalid appointment dates for: ${item.product.title}`)
          }
          
          if (start >= end) {
            throw new Error(`Start time must be before end time for: ${item.product.title}`)
          }
          
          if (start < new Date()) {
            throw new Error(`Appointment cannot be in the past for: ${item.product.title}`)
          }
          
          // Vérifier les données attendee
          if (!appointmentData.attendeeEmail || !appointmentData.attendeeName) {
            throw new Error(`Missing attendee information for: ${item.product.title}`)
          }
        }
      }
      console.log('[processCheckout] ✅ All appointment data validated')
      
      // Créer les appointments après validation
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
            description: item.product.description || `Booking: ${item.product.title}`,
            startTime: new Date(appointmentData.startTime),
            endTime: new Date(appointmentData.endTime),
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

          // 📅 SYNCHRONISATION CALENDRIER : Sync avec Google Calendar / Outlook (non-bloquant)
          console.log('[processCheckout] 📅 Syncing appointment to external calendars')
          try {
            const { syncAppointmentToCalendars } = await import('@/lib/calendar/sync')
            const syncResults = await syncAppointmentToCalendars(appointment.id)
            
            console.log('[processCheckout] ✅ Calendar sync completed:', {
              google: syncResults.google?.success ? '✅ Synced' : syncResults.google?.error || 'Not configured',
              microsoft: syncResults.microsoft?.success ? '✅ Synced' : syncResults.microsoft?.error || 'Not configured'
            })
          } catch (syncError) {
            console.warn('[processCheckout] ⚠️ Calendar sync failed (non-critical):', syncError instanceof Error ? syncError.message : syncError)
            // Non-bloquant - le checkout continue même si la sync échoue
          }

          // Envoyer les notifications email pour le rendez-vous (non-bloquant)
          console.log('[processCheckout] 📧 Attempting to send appointment notifications (DEV mode - non-blocking)')
          try {
            const { sendAllAppointmentNotifications } = await import('@/lib/notifications/appointment-notifications')
            console.log('[processCheckout] 📧 Module loaded, sending appointment notifications')
            
            // Ensure dates are valid Date objects
            const startDate = appointmentData.startTime instanceof Date 
              ? appointmentData.startTime 
              : new Date(appointmentData.startTime)
            
            const endDate = appointmentData.endTime instanceof Date 
              ? appointmentData.endTime 
              : new Date(appointmentData.endTime)
            
            console.log('[processCheckout] 📅 Date objects created:', {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              isStartDateValid: !isNaN(startDate.getTime()),
              isEndDateValid: !isNaN(endDate.getTime())
            })
            
            const notifResults = await sendAllAppointmentNotifications({
              appointmentId: appointment.id,
              productTitle: item.product.title,
              startTime: startDate,
              endTime: endDate,
              timezone: appointmentData.timezone,
              attendeeName: appointmentData.attendeeName,
              attendeeEmail: appointmentData.attendeeEmail,
              attendeePhone: appointmentData.attendeePhone,
              price: price,
              currency: item.product.currency || 'EUR',
              notes: appointmentData.notes,
              userId: user.userId
            })

            console.log('[processCheckout] ✅ Appointment notifications sent:', {
              clientEmail: notifResults.clientEmail.success,
              adminEmail: notifResults.adminEmail.success,
              adminChat: notifResults.adminChat.success
            })
          } catch (emailError) {
            console.warn('[processCheckout] ⚠️ Failed to send appointment notifications (non-critical):', emailError instanceof Error ? emailError.message : emailError)
            // Non-blocking - continuer le checkout même si l'email échoue (OK en mode DEV)
          }
        }
      }
    }

    // 8. Send Confirmation Email (non-blocking in DEV mode)
    console.log('[processCheckout] 📧 Attempting to send order confirmation email (DEV mode - non-blocking)', { to: user.email })
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
      console.warn('[processCheckout] ⚠️ Failed to send order confirmation email (non-critical):', emailError instanceof Error ? emailError.message : emailError)
      // Non-blocking - continuer le checkout même si l'email échoue (OK en mode DEV)
    }

    // 9. Mark Cart as Converted
    console.log('[processCheckout] 🔄 Converting cart')
    await db.update(carts)
      .set({ status: "converted" })
      .where(eq(carts.id, cart.id))

    console.log('[processCheckout] ✅ Cart converted successfully', { cartId: cart.id })

    revalidatePath("/cart")
    revalidatePath("/orders")
    
    console.log('[processCheckout] ✅ Cache revalidated')
    console.log('[processCheckout] 🎉🎉🎉 CHECKOUT COMPLETED SUCCESSFULLY 🎉🎉🎉', {
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

// --- Clear Cart ---

/**
 * Clear the active cart for the current user
 * Used after successful checkout to ensure clean state
 */
export async function clearActiveCart() {
  console.log('[clearActiveCart] 🧹 Clearing active cart')
  
  try {
    const user = await getCurrentUser()
    
    if (user) {
      // For logged-in users, mark their active cart as converted
      console.log('[clearActiveCart] 👤 Clearing cart for logged-in user', { userId: user.userId })
      const cart = await db.query.carts.findFirst({
        where: and(
          eq(carts.userId, user.userId),
          eq(carts.status, "active")
        )
      })

      if (cart) {
        await db.update(carts)
          .set({ status: "converted" })
          .where(eq(carts.id, cart.id))
        console.log('[clearActiveCart] ✅ User cart marked as converted', { cartId: cart.id })
      }
    } else {
      // For guest users, clear the cookie cart
      console.log('[clearActiveCart] 👻 Clearing cart for guest user')
      const cookieStore = await cookies()
      const cartId = cookieStore.get("cart_id")?.value

      if (cartId) {
        const cart = await db.query.carts.findFirst({
          where: and(
            eq(carts.id, cartId),
            eq(carts.status, "active")
          )
        })

        if (cart) {
          await db.update(carts)
            .set({ status: "converted" })
            .where(eq(carts.id, cart.id))
          console.log('[clearActiveCart] ✅ Guest cart marked as converted', { cartId: cart.id })
        }

        // Clear the cookie
        cookieStore.delete("cart_id")
      }
    }

    revalidatePath("/cart")
    revalidatePath("/dashboard/cart")
    
    console.log('[clearActiveCart] ✅ Cart cleared successfully')
    return { success: true }
  } catch (error) {
    console.error('[clearActiveCart] ❌ Failed to clear cart:', error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to clear cart" }
  }
}

// --- Order Management ---

/**
 * Mark an order as shipped and notify the customer
 * Used by admins when they ship physical products
 */
export async function markOrderAsShipped(params: {
  orderId: string
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: string
  shippedProducts?: Array<{
    title: string
    quantity: number
  }>
}) {
  console.log('[markOrderAsShipped] 📦 Marking order as shipped', { orderId: params.orderId })
  
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // TODO: Check if user is admin
    
    // Get the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, params.orderId),
      with: {
        user: true,
        items: {
          with: {
            product: true
          }
        }
      }
    })

    if (!order) {
      return { success: false, error: "Order not found" }
    }

    // Update order status to shipped
    await db.update(orders)
      .set({ 
        status: "shipped",
        metadata: {
          ...order.metadata as any,
          shippedAt: new Date().toISOString(),
          trackingNumber: params.trackingNumber,
          carrier: params.carrier,
          estimatedDelivery: params.estimatedDelivery
        }
      })
      .where(eq(orders.id, params.orderId))

    console.log('[markOrderAsShipped] ✅ Order marked as shipped in database')

    // Send notification to customer
    try {
      const { notifyClientProductShipped } = await import('@/lib/notifications')
      
      // Get shipped products from order items if not provided
      const shippedProducts = params.shippedProducts || order.items
        .filter(item => item.product?.type === 'physical' || item.product?.requiresShipping)
        .map(item => ({
          title: item.itemName,
          quantity: item.quantity
        }))

      if (order.user) {
        await notifyClientProductShipped({
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: order.user.id,
          userEmail: order.user.email,
          userName: `${order.user.firstName} ${order.user.lastName}`,
          shippedProducts,
          trackingNumber: params.trackingNumber,
          carrier: params.carrier,
          estimatedDelivery: params.estimatedDelivery
        })

        console.log('[markOrderAsShipped] ✅ Customer notification sent')
      }
    } catch (notifError) {
      console.warn('[markOrderAsShipped] ⚠️ Failed to send customer notification:', notifError)
      // Non-blocking
    }

    revalidatePath("/admin/orders")
    revalidatePath(`/orders/${params.orderId}`)
    
    return { success: true }
  } catch (error) {
    console.error('[markOrderAsShipped] ❌ Error:', error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to mark order as shipped" }
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
