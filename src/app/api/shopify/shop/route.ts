/**
 * Shopify Shop Info API Route
 * Get shop information and connection status
 * 
 * GET /api/shopify/shop
 * DELETE /api/shopify/shop (disconnect)
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { ShopifyService } from "@/lib/services/shopify"

// GET - Get shop info
export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)

  try {
    // Get user's Shopify connection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        shopifyDomain: true,
        shopifyAccessToken: true,
        shopifySetupCompleted: true,
      }
    })

    if (!user?.shopifyDomain || !user?.shopifyAccessToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        shop: null,
      })
    }

    // Initialize Shopify service
    const shopify = new ShopifyService(user.shopifyDomain, user.shopifyAccessToken)
    
    // Fetch shop info
    const { shop } = await shopify.getShopInfo()

    // Get additional stats
    const [productCount, orderCount] = await Promise.all([
      shopify.getProductCount(),
      shopify.getOrderCount(),
    ])

    return NextResponse.json({
      success: true,
      connected: true,
      shop: {
        domain: user.shopifyDomain,
        name: shop.name,
        email: shop.email,
        currency: shop.currency,
        country: shop.country_name,
        timezone: shop.timezone,
        plan: shop.plan_name,
        productCount: productCount.count,
        orderCount: orderCount.count,
        setupCompleted: user.shopifySetupCompleted,
      },
    })

  } catch (error) {
    console.error('Failed to fetch Shopify shop info:', error)
    return NextResponse.json({
      success: false,
      connected: false,
      error: 'Failed to fetch shop info - token may be invalid',
    }, { status: 500 })
  }
}

// DELETE - Disconnect Shopify store
export async function DELETE(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)

  try {
    // Get user's current Shopify domain
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { shopifyDomain: true }
    })

    // Remove from user
    await prisma.user.update({
      where: { id: userId },
      data: {
        shopifyDomain: null,
        shopifyAccessToken: null,
        shopifySetupCompleted: false,
      }
    })

    // Deactivate app integration
    if (user?.shopifyDomain) {
      await prisma.shopifyAppIntegration.updateMany({
        where: { 
          shopDomain: user.shopifyDomain,
          userId
        },
        data: { active: false }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Shopify store disconnected',
    })

  } catch (error) {
    console.error('Failed to disconnect Shopify store:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to disconnect store',
    }, { status: 500 })
  }
}
