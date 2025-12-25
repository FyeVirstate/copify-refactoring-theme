/**
 * Product Favorites API Route
 * 
 * Note: The Laravel database only supports ad favorites, not product favorites.
 * This endpoint returns an appropriate message.
 * 
 * POST /api/products/favorite - Not supported (use /api/ads/favorite instead)
 * GET /api/products/favorite - Returns empty list
 */

import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

// POST - Toggle favorite on a product (not supported)
export async function POST(_request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    success: false,
    error: 'Product favorites are not supported. Use ad favorites instead.',
    message: 'To favorite products, please use the ad favorites feature at /api/ads/favorite'
  }, { status: 400 })
}

// GET - Get user's favorite products (returns empty)
export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '20')

  // Return empty list since product favorites are not supported
  return NextResponse.json({
    success: true,
    data: [],
    message: 'Product favorites are not supported in the current database schema.',
    pagination: {
      page,
      perPage,
      total: 0,
      totalPages: 0,
    }
  })
}
