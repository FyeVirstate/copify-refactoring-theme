/**
 * Shopify Products API Route
 * Get products from connected Shopify store
 * 
 * GET /api/shopify/products
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
    
    // Fetch products
    const { products } = await shopify.getProducts(limit)

    return NextResponse.json({
      success: true,
      data: products,
    })

  } catch (error) {
    console.error('Failed to fetch Shopify products:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)

  try {
    const body = await request.json()
    const { title, body_html, vendor, product_type, tags, variants, images } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({ 
        error: 'Product title is required' 
      }, { status: 400 })
    }

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
      }, { status: 400 })
    }

    // Initialize Shopify service
    const shopify = new ShopifyService(user.shopifyDomain, user.shopifyAccessToken)
    
    // Create product
    const { product } = await shopify.createProduct({
      title,
      body_html,
      vendor,
      product_type,
      tags,
      variants,
      images,
    })

    return NextResponse.json({
      success: true,
      data: product,
    })

  } catch (error) {
    console.error('Failed to create Shopify product:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create product',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
