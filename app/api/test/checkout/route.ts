/**
 * API de test pour le tunnel d'achat
 * Utilisée par la page /admin/test-checkout
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { carts, cartItems, products } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { processCheckout } from '@/app/actions/ecommerce'
import { getLagoClient } from '@/lib/lago'

export async function POST(request: NextRequest) {
  console.log('[API Test Checkout] Request received')
  
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.error('[API Test Checkout] ❌ Unauthorized')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, cartId } = body

    console.log('[API Test Checkout] Action:', action, { userId: user.id, cartId })

    switch (action) {
      case 'create_cart':
        return await createTestCart(user.id)
      
      case 'add_products':
        return await addTestProducts(cartId)
      
      case 'test_lago':
        return await testLagoConnection()
      
      case 'process_checkout':
        return await processTestCheckout(cartId)
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('[API Test Checkout] 💥 Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

async function createTestCart(userId: string) {
  console.log('[createTestCart] Creating test cart', { userId })
  
  try {
    // Nettoyer les anciens paniers de test actifs
    await db.update(carts)
      .set({ status: 'abandoned' })
      .where(and(
        eq(carts.userId, userId),
        eq(carts.status, 'active')
      ))

    // Créer un nouveau panier
    const [cart] = await db.insert(carts).values({
      userId,
      status: 'active'
    }).returning()

    console.log('[createTestCart] ✅ Cart created', { cartId: cart.id })

    return NextResponse.json({
      success: true,
      cartId: cart.id
    })
  } catch (error) {
    console.error('[createTestCart] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create cart'
    }, { status: 500 })
  }
}

async function addTestProducts(cartId: string) {
  console.log('[addTestProducts] Adding products to cart', { cartId })
  
  try {
    // Récupérer les premiers produits publiés
    const testProducts = await db.query.products.findMany({
      where: eq(products.isPublished, true),
      limit: 2
    })

    if (testProducts.length === 0) {
      console.warn('[addTestProducts] ⚠️  No published products found, creating test products')
      
      // Créer des produits de test
      const [product1, product2] = await db.insert(products).values([
        {
          title: 'Test Product 1 - Digital Module',
          description: 'Produit de test pour validation checkout',
          price: 9900, // 99.00 EUR
          type: 'digital',
          currency: 'EUR',
          isPublished: true
        },
        {
          title: 'Test Product 2 - Service',
          description: 'Service de test pour validation checkout',
          price: 19900, // 199.00 EUR
          type: 'service',
          currency: 'EUR',
          isPublished: true
        }
      ]).returning()

      testProducts.push(product1, product2)
    }

    // Ajouter les produits au panier
    for (const product of testProducts) {
      await db.insert(cartItems).values({
        cartId,
        productId: product.id,
        quantity: 1
      })
      console.log('[addTestProducts] ✅ Product added', { 
        productId: product.id, 
        title: product.title 
      })
    }

    return NextResponse.json({
      success: true,
      itemCount: testProducts.length,
      products: testProducts.map(p => ({ id: p.id, title: p.title, price: p.price }))
    })
  } catch (error) {
    console.error('[addTestProducts] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add products'
    }, { status: 500 })
  }
}

async function testLagoConnection() {
  console.log('[testLagoConnection] Testing Lago connection')
  
  try {
    const lago = await getLagoClient()
    
    // Test simple: récupérer la liste des plans
    // Si ça fonctionne, Lago est configuré
    try {
      await lago.plans.findAll({ per_page: 1, page: 1 })
      
      console.log('[testLagoConnection] ✅ Lago connected successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Lago is configured and operational'
      })
    } catch (lagoError: any) {
      console.warn('[testLagoConnection] ⚠️  Lago API error', { 
        error: lagoError.message,
        status: lagoError.response?.status 
      })
      
      return NextResponse.json({
        success: false,
        warning: true,
        message: 'Lago configured but API error (check credentials)',
        error: lagoError.message
      })
    }
  } catch (error) {
    console.warn('[testLagoConnection] ⚠️  Lago not configured', { error })
    
    return NextResponse.json({
      success: false,
      warning: true,
      message: 'Lago not configured (degraded mode - orders will be created without Lago integration)'
    })
  }
}

async function processTestCheckout(cartId: string) {
  console.log('[processTestCheckout] Processing test checkout', { cartId })
  
  try {
    // Utiliser la fonction processCheckout standard
    const result = await processCheckout(cartId)
    
    if (result.success) {
      // Récupérer le numéro de commande pour l'affichage
      const order = await db.query.orders.findFirst({
        where: eq(db.query.orders.id, result.orderId!)
      })
      
      console.log('[processTestCheckout] ✅ Checkout successful', { 
        orderId: result.orderId,
        orderNumber: order?.orderNumber 
      })
      
      return NextResponse.json({
        success: true,
        orderId: result.orderId,
        orderNumber: order?.orderNumber
      })
    } else {
      console.error('[processTestCheckout] ❌ Checkout failed', { error: result.error })
      
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('[processTestCheckout] ❌ Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Checkout failed'
    }, { status: 500 })
  }
}
