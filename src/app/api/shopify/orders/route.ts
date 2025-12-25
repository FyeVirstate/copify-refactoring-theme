/**
 * Shopify Orders API Route
 * Get orders from connected Shopify store
 * 
 * GET /api/shopify/orders
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { ShopifyService } from "@/lib/services/shopify"

export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    // Get user's Shopify connection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        shopifyDomain: true,
        shopifyAccessToken: true,
      }
    })

    if (!user?.shopifyDomain || !user?.shopifyAccessToken) {
      return NextResponse.json({
        success: false,
        error: 'No Shopify store connected',
        needsConnection: true,
      }, { status: 400 })
    }

    // Initialize Shopify service
    const shopify = new ShopifyService(user.shopifyDomain, user.shopifyAccessToken)
    
    // Fetch orders
    const { orders } = await shopify.getOrders(limit)

    return NextResponse.json({
      success: true,
      data: orders,
    })

  } catch (error) {
    console.error('Failed to fetch Shopify orders:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
