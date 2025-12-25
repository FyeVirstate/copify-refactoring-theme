/**
 * Top Products API Route - OPTIMIZED
 * 
 * Queries ALL products from the database (159k+) with proper JOINs for sorting
 * Using CTEs and pre-computed data for maximum performance
 * 
 * GET /api/products - Get products with filters
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Simple in-memory cache for count queries
const countCache = new Map<string, { count: number; timestamp: number }>()
const COUNT_CACHE_TTL = 60000 // 1 minute

interface ProductRow {
  id: bigint
  title: string
  handle: string
  shop_id: bigint
  price: number | null
  img_src: string | null
  shop_url: string
  merchant_name: string | null
  currency: string | null
  country: string | null
  active_ads: number | null
  estimated_order: number | null
  last_month_visits: number | null
  estimated_monthly: number | null
  growth_rate: number | null
  created_at: Date | null
}

export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  
  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '20')
  const offset = (page - 1) * perPage
  
  // Filters
  const search = searchParams.get('search')
  const category = searchParams.get('category')
  const currency = searchParams.get('currency')
  const country = searchParams.get('country')
  const pixels = searchParams.get('pixels')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const minRevenue = searchParams.get('minRevenue')
  const maxRevenue = searchParams.get('maxRevenue')
  const minOrders = searchParams.get('minOrders')
  const maxOrders = searchParams.get('maxOrders')
  const minTraffic = searchParams.get('minTraffic')
  const maxTraffic = searchParams.get('maxTraffic')
  const minTrafficGrowth = searchParams.get('minTrafficGrowth')
  const maxTrafficGrowth = searchParams.get('maxTrafficGrowth')
  const minActiveAds = searchParams.get('minActiveAds')
  const maxActiveAds = searchParams.get('maxActiveAds')
  const dateFilter = searchParams.get('dateFilter')
  const sortBy = searchParams.get('sortBy') || 'recommended'

  try {
    // Split conditions into: base (products/shops only) and traffic-based
    const baseConditions: string[] = []
    const trafficConditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // ============================================
    // BASE FILTERS ON PRODUCTS/SHOPS TABLES (FAST)
    // ============================================
    
    // 1. Exclude shipping protection products
    baseConditions.push(`p.title != 'Shipping Protection'`)

    // Active ads filter (on shops table - indexed)
    if (minActiveAds) {
      baseConditions.push(`s.active_ads >= $${paramIndex}`)
      params.push(parseInt(minActiveAds))
      paramIndex++
    }
    if (maxActiveAds) {
      baseConditions.push(`s.active_ads <= $${paramIndex}`)
      params.push(parseInt(maxActiveAds))
      paramIndex++
    }

    // Currency filter (on shops table - indexed)
    if (currency) {
      const currencies = currency.split(',').map(c => c.trim()).filter(c => c)
      if (currencies.length > 0) {
        baseConditions.push(`s.currency IN (${currencies.map((_, i) => `$${paramIndex + i}`).join(', ')})`)
        params.push(...currencies)
        paramIndex += currencies.length
      }
    }

    // Country filter (on shops table - indexed)
    if (country) {
      const countries = country.split(',').map(c => c.trim()).filter(c => c)
      if (countries.length > 0) {
        baseConditions.push(`s.country IN (${countries.map((_, i) => `$${paramIndex + i}`).join(', ')})`)
        params.push(...countries)
        paramIndex += countries.length
      }
    }

    // Search filter
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`
      baseConditions.push(`(
        LOWER(p.title) LIKE $${paramIndex} OR 
        LOWER(p.handle) LIKE $${paramIndex} OR 
        LOWER(s.url) LIKE $${paramIndex} OR
        LOWER(s.merchant_name) LIKE $${paramIndex}
      )`)
      params.push(searchLower)
      paramIndex++
    }

    // Date filter
    if (dateFilter && dateFilter.includes(' - ')) {
      const [startDate, endDate] = dateFilter.split(' - ')
      baseConditions.push(`s.created_at >= $${paramIndex}`)
      params.push(new Date(startDate))
      paramIndex++
      baseConditions.push(`s.created_at <= $${paramIndex}`)
      params.push(new Date(endDate))
      paramIndex++
    }

    // Pixels filter
    if (pixels) {
      const pixelList = pixels.split(',').map(p => p.trim()).filter(p => p)
      if (pixelList.length > 0) {
        const pixelConditions = pixelList.map((_, i) => `s.pixels ILIKE $${paramIndex + i}`).join(' OR ')
        baseConditions.push(`(${pixelConditions})`)
        params.push(...pixelList.map(p => `%${p}%`))
        paramIndex += pixelList.length
      }
    }

    // Sort-specific filters on shops table
    if (sortBy === 'best_value') {
      baseConditions.push(`s.active_ads > 0`)
    }

    // ============================================
    // TRAFFIC-BASED FILTERS (applied after CTE join)
    // ============================================
    
    // Base traffic filters - revenue bounds
    trafficConditions.push(`COALESCE(t.estimated_monthly, 0) > 0`)
    trafficConditions.push(`COALESCE(t.estimated_monthly, 0) < 100000000`)

    // Price filters - use EXISTS subquery (no join needed)
    // Base price filter: minimum price >= 0.5
    baseConditions.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.price >= 0.5)`)
    
    if (minPrice) {
      baseConditions.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.price >= $${paramIndex})`)
      params.push(parseFloat(minPrice))
      paramIndex++
    }
    if (maxPrice) {
      baseConditions.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.price <= $${paramIndex})`)
      params.push(parseFloat(maxPrice))
      paramIndex++
    }

    // Revenue filter
    if (minRevenue) {
      trafficConditions.push(`COALESCE(t.estimated_monthly, 0) >= $${paramIndex}`)
      params.push(parseFloat(minRevenue))
      paramIndex++
    }
    if (maxRevenue) {
      trafficConditions.push(`COALESCE(t.estimated_monthly, 0) <= $${paramIndex}`)
      params.push(parseFloat(maxRevenue))
      paramIndex++
    }

    // Orders filter
    if (minOrders) {
      trafficConditions.push(`COALESCE(t.estimated_order, 0) >= $${paramIndex}`)
      params.push(parseFloat(minOrders))
      paramIndex++
    }
    if (maxOrders) {
      trafficConditions.push(`COALESCE(t.estimated_order, 0) <= $${paramIndex}`)
      params.push(parseFloat(maxOrders))
      paramIndex++
    }

    // Traffic filter
    if (minTraffic) {
      trafficConditions.push(`COALESCE(t.last_month_visits, 0) >= $${paramIndex}`)
      params.push(parseFloat(minTraffic))
      paramIndex++
    }
    if (maxTraffic) {
      trafficConditions.push(`COALESCE(t.last_month_visits, 0) <= $${paramIndex}`)
      params.push(parseFloat(maxTraffic))
      paramIndex++
    }

    // Traffic growth filter
    if (minTrafficGrowth) {
      trafficConditions.push(`COALESCE(t.growth_rate, 0) >= $${paramIndex}`)
      params.push(parseFloat(minTrafficGrowth))
      paramIndex++
    }
    if (maxTrafficGrowth) {
      trafficConditions.push(`COALESCE(t.growth_rate, 0) <= $${paramIndex}`)
      params.push(parseFloat(maxTrafficGrowth))
      paramIndex++
    }

    // Sort-specific traffic filters
    if (sortBy === 'trending_up') {
      trafficConditions.push(`COALESCE(t.growth_rate, 0) > 0`)
    }
    if (sortBy === 'most_profitable') {
      trafficConditions.push(`COALESCE(t.last_month_visits, 0) > 0`)
    }

    // Category filter - needs async lookup
    let categoryCondition = ''
    if (category) {
      const categoryNames = category.split(',').map(c => c.trim()).filter(c => c)
      if (categoryNames.length > 0) {
        const categories = await prisma.category.findMany({
          select: { id: true, name: true }
        })
        
        const matchingCategoryIds = categories
          .filter(cat => {
            const nameObj = cat.name as { en?: string; fr?: string } | null
            return categoryNames.some(name => 
              nameObj?.en?.toLowerCase().includes(name.toLowerCase()) ||
              nameObj?.fr?.toLowerCase().includes(name.toLowerCase())
            )
          })
          .map(c => Number(c.id))
        
        if (matchingCategoryIds.length > 0) {
          categoryCondition = `AND EXISTS (
            SELECT 1 FROM shop_categories sc 
            WHERE sc.shop_id = s.id 
            AND sc.category_id IN (${matchingCategoryIds.join(', ')})
          )`
        }
      }
    }

    const baseWhereClause = baseConditions.length > 0 ? `WHERE ${baseConditions.join(' AND ')} ${categoryCondition}` : (categoryCondition ? `WHERE 1=1 ${categoryCondition}` : '')
    const trafficWhereClause = trafficConditions.length > 0 ? `AND ${trafficConditions.join(' AND ')}` : ''

    // Build ORDER BY clause - using column names from ranked_products CTE (no table aliases)
    const dailySeed = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const seedHash = parseInt(dailySeed) % 1000
    
    let orderByClause = ''
    switch (sortBy) {
      case 'recommended':
        orderByClause = `ORDER BY (
          COALESCE(growth_rate, 0) * 0.3 + 
          COALESCE(active_ads, 0) * 10000 + 
          COALESCE(estimated_order, 0) * 0.1 + 
          (MOD(ABS(HASHTEXT(handle || '${seedHash}')), 50000))
        ) DESC`
        break
      case 'most_active_ads':
      case 'live_ads':
      case 'active_ads_count':
        orderByClause = 'ORDER BY COALESCE(active_ads, 0) DESC'
        break
      case 'highest_revenue':
      case 'estimated_monthly':
        orderByClause = 'ORDER BY COALESCE(estimated_monthly, 0) DESC'
        break
      case 'most_traffic':
      case 'last_month_visits':
        orderByClause = 'ORDER BY COALESCE(last_month_visits, 0) DESC'
        break
      case 'estimated_order':
        orderByClause = 'ORDER BY COALESCE(estimated_order, 0) DESC'
        break
      case 'newest_products':
      case 'most_recent':
        orderByClause = 'ORDER BY created_at DESC'
        break
      case 'best_value':
        orderByClause = `ORDER BY COALESCE(estimated_monthly, 0)::float / NULLIF(active_ads, 0) DESC NULLS LAST`
        break
      case 'trending_up':
        orderByClause = `ORDER BY (COALESCE(growth_rate, 0) * 100 + COALESCE(estimated_order, 0) * 0.5) DESC`
        break
      case 'most_profitable':
        orderByClause = `ORDER BY COALESCE(estimated_monthly, 0)::float / NULLIF(last_month_visits, 0) DESC NULLS LAST`
        break
      case 'traffic_growth':
      case 'growth_rate':
        orderByClause = 'ORDER BY COALESCE(growth_rate, 0) DESC'
        break
      case 'lowest_price':
        orderByClause = 'ORDER BY COALESCE(price, 0) ASC'
        break
      case 'highest_price':
        orderByClause = 'ORDER BY COALESCE(price, 0) DESC'
        break
      default:
        orderByClause = 'ORDER BY created_at DESC'
    }

    // OPTIMIZED: Main query - use subqueries only for filtered/limited results
    const dataQuery = `
      WITH 
      -- Only compute latest traffic (single DISTINCT ON is efficient with index)
      latest_traffic AS (
        SELECT DISTINCT ON (shop_id) 
          shop_id,
          estimated_monthly,
          estimated_order,
          last_month_visits,
          growth_rate
        FROM traffic
        ORDER BY shop_id, created_at DESC
      ),
      -- Filter products first, then rank by shop
      filtered_products AS (
        SELECT 
          p.id,
          p.title,
          p.handle,
          p.shop_id,
          p.created_at,
          s.url as shop_url,
          s.merchant_name,
          s.currency,
          s.country,
          s.active_ads,
          t.estimated_monthly,
          t.estimated_order,
          t.last_month_visits,
          t.growth_rate,
          ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY p.created_at DESC) as rn
        FROM products p
        INNER JOIN shops s ON p.shop_id = s.id
        LEFT JOIN latest_traffic t ON t.shop_id = s.id
        ${baseWhereClause}
        ${trafficWhereClause}
      ),
      -- Only get unique products per shop
      unique_products AS (
        SELECT * FROM filtered_products WHERE rn = 1
        ${orderByClause}
        LIMIT ${perPage} OFFSET ${offset}
      )
      -- Now fetch price and image only for the limited results
      SELECT 
        up.id, up.title, up.handle, up.shop_id, 
        (SELECT MIN(price) FROM product_variants WHERE product_id = up.id) as price,
        (SELECT src FROM product_images WHERE product_id = up.id ORDER BY position ASC LIMIT 1) as img_src,
        up.shop_url, up.merchant_name, up.currency, up.country, up.active_ads, 
        up.estimated_order, up.last_month_visits, up.estimated_monthly, up.growth_rate, up.created_at
      FROM unique_products up
      ${orderByClause}
    `

    // Execute main query first
    const productsResult = await prisma.$queryRawUnsafe<ProductRow[]>(dataQuery, ...params)

    // If no results on first page, don't bother counting - it's 0
    let total: number
    if (page === 1 && productsResult.length === 0) {
      total = 0
    } else if (page === 1 && productsResult.length < perPage) {
      // If first page has fewer results than perPage, total is just the count
      total = productsResult.length
    } else {
      // Generate cache key for count
      const cacheKey = JSON.stringify({ baseConditions, trafficConditions, categoryCondition, sortBy })
      const cached = countCache.get(cacheKey)
      
      // Get count - use cache if available
      if (cached && Date.now() - cached.timestamp < COUNT_CACHE_TTL) {
        total = cached.count
      } else {
        // Count query uses the same structure as data query
        const countQuery = `
          WITH 
          latest_traffic AS (
            SELECT DISTINCT ON (shop_id) shop_id, estimated_monthly, estimated_order, last_month_visits, growth_rate
            FROM traffic
            ORDER BY shop_id, created_at DESC
          ),
          filtered_products AS (
            SELECT p.id, s.id as sid,
              ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY p.created_at DESC) as rn
            FROM products p
            INNER JOIN shops s ON p.shop_id = s.id
            LEFT JOIN latest_traffic t ON t.shop_id = s.id
            ${baseWhereClause}
            ${trafficWhereClause}
          )
          SELECT COUNT(*)::int as count
          FROM filtered_products
          WHERE rn = 1
        `
        const countResult = await prisma.$queryRawUnsafe<{count: number}[]>(countQuery, ...params)
        total = countResult[0]?.count || 0
        countCache.set(cacheKey, { count: total, timestamp: Date.now() })
      }
    }

    // Transform data to match expected format
    const data = productsResult.map(product => ({
      id: Number(product.id),
      productId: Number(product.id),
      handle: product.handle,
      title: product.title,
      vendor: null,
      productType: null,
      bestProduct: true,
      price: product.price || 0,
      imageUrl: product.img_src || null,
      imagesCount: 1,
      estimatedMonthly: product.estimated_monthly || 0,
      estimatedOrder: product.estimated_order || 0,
      growthRate: product.growth_rate || 0,
      lastMonthVisits: product.last_month_visits || 0,
      activeAdsCount: product.active_ads || 0,
      allAdsCount: product.active_ads || 0,
      shop: {
        id: Number(product.shop_id),
        url: product.shop_url,
        name: product.merchant_name,
        country: product.country,
        currency: product.currency,
        category: null,
      },
      isFavorited: false,
      createdAt: product.created_at,
    }))

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      }
    })

  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

