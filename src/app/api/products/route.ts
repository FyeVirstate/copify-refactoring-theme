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
  // ============================================
  // TIMING LOGS
  // ============================================
  const timings = {
    start: Date.now(),
    auth: 0,
    parseParams: 0,
    categoryLookup: 0,
    mainQuery: 0,
    countQuery: 0,
    transform: 0,
    total: 0,
  }
  
  console.log('\n[Products API] ========== REQUEST START ==========')
  console.log(`[Products API] Time: ${new Date().toISOString()}`)

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const authStart = Date.now()
  const session = await auth()
  timings.auth = Date.now() - authStart
  console.log(`[Products API] ⏱️  Auth: ${timings.auth}ms (${(timings.auth/1000).toFixed(2)}s)`)
  
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
  const sortBy = searchParams.get('sortBy') || 'recommended'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  
  // New filters from shops page
  const minCatalogSize = searchParams.get('minCatalogSize')
  const maxCatalogSize = searchParams.get('maxCatalogSize')
  const origins = searchParams.get('origins')?.split(',').filter(Boolean) || []
  const languages = searchParams.get('languages')?.split(',').filter(Boolean) || []
  const domains = searchParams.get('domains')?.split(',').filter(Boolean) || []
  const themes = searchParams.get('themes')?.split(',').filter(Boolean) || []
  // Support both 'apps' and 'applications' parameter names
  const applications = (searchParams.get('applications') || searchParams.get('apps'))?.split(',').filter(Boolean) || []
  const socialNetworks = searchParams.get('socialNetworks')?.split(',').filter(Boolean) || []
  const shopCreationDate = searchParams.get('shopCreationDate') || ''
  const minTrustpilotRating = searchParams.get('minTrustpilotRating')
  const maxTrustpilotRating = searchParams.get('maxTrustpilotRating')
  const minTrustpilotReviews = searchParams.get('minTrustpilotReviews')
  const maxTrustpilotReviews = searchParams.get('maxTrustpilotReviews')

  timings.parseParams = Date.now() - timings.start - timings.auth
  console.log(`[Products API] ⏱️  Parse Params: ${timings.parseParams}ms`)
  console.log(`[Products API] 📋 Filters: page=${page}, perPage=${perPage}, sortBy=${sortBy}, search=${search || 'none'}, currency=${currency || 'all'}, country=${country || 'all'}`)

  try {
    // ============================================
    // USING top_products_materialized (FAST - 373k rows vs 44M)
    // Same filters, just different table source
    // ============================================
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    // Check if we need to JOIN with shops table (for pixels, themes, apps, merchant_name)
    const needsShopsJoin = pixels || themes.length > 0 || applications.length > 0 || search
    // Check if we need to JOIN with traffic table (for social networks filter)
    const needsTrafficJoin = socialNetworks.length > 0

    // ============================================
    // BASE FILTERS (like Laravel)
    // ============================================
    
    // Base filters from Laravel materialized view
    conditions.push(`m.price >= 0.5`)
    conditions.push(`m.estimated_monthly > 0`)
    conditions.push(`m.estimated_monthly < 100000000`)
    
    // Revenue/traffic ratio filter (from Laravel)
    conditions.push(`(
      m.last_month_visits <= 0
      OR (m.last_month_visits > 0 AND m.last_month_visits <= 21474836 AND m.estimated_monthly <= (m.last_month_visits * 100))
      OR (m.last_month_visits > 21474836 AND m.estimated_monthly <= 2147483600)
    )`)
    
    // 1. Exclude shipping protection products
    conditions.push(`m.title != 'Shipping Protection'`)

    // Active ads filter (now on materialized view)
    if (minActiveAds) {
      conditions.push(`m.active_ads_count >= $${paramIndex}`)
      params.push(parseInt(minActiveAds))
      paramIndex++
    }
    if (maxActiveAds) {
      conditions.push(`m.active_ads_count <= $${paramIndex}`)
      params.push(parseInt(maxActiveAds))
      paramIndex++
    }

    // Currency filter (now on materialized view)
    if (currency) {
      const currencies = currency.split(',').map(c => c.trim()).filter(c => c)
      if (currencies.length > 0) {
        conditions.push(`m.currency IN (${currencies.map((_, i) => `$${paramIndex + i}`).join(', ')})`)
        params.push(...currencies)
        paramIndex += currencies.length
      }
    }

    // Country filter (now on materialized view)
    if (country) {
      const countries = country.split(',').map(c => c.trim()).filter(c => c)
      if (countries.length > 0) {
        conditions.push(`m.country IN (${countries.map((_, i) => `$${paramIndex + i}`).join(', ')})`)
        params.push(...countries)
        paramIndex += countries.length
      }
    }

    // Origins filter - shop location country
    if (origins.length > 0) {
      const originPlaceholders = origins.map((_, i) => `$${paramIndex + i}`).join(', ')
      conditions.push(`m.country IN (${originPlaceholders})`)
      params.push(...origins)
      paramIndex += origins.length
    }

    // Search filter (needs shops join for merchant_name)
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`
      conditions.push(`(
        LOWER(m.title) ILIKE $${paramIndex} OR 
        LOWER(m.product_handle) ILIKE $${paramIndex} OR 
        LOWER(m.shop_url) ILIKE $${paramIndex} OR
        LOWER(s.merchant_name) ILIKE $${paramIndex}
      )`)
      params.push(searchLower)
      paramIndex++
    }

    // Shop creation date filter (uses whois_at from materialized view)
    if (shopCreationDate && shopCreationDate.includes(' - ')) {
      const [startDateStr, endDateStr] = shopCreationDate.split(' - ')
      const startDate = new Date(startDateStr)
      const endDate = new Date(endDateStr)
      // Add 1 day to end date to include the whole end day
      endDate.setDate(endDate.getDate() + 1)
      conditions.push(`m.whois_at >= $${paramIndex}::timestamp`)
      params.push(startDate.toISOString())
      paramIndex++
      conditions.push(`m.whois_at <= $${paramIndex}::timestamp`)
      params.push(endDate.toISOString())
      paramIndex++
    }

    // Pixels filter (needs shops join)
    if (pixels) {
      const pixelList = pixels.split(',').map(p => p.trim()).filter(p => p)
      if (pixelList.length > 0) {
        const pixelConditions = pixelList.map((_, i) => `s.pixels ILIKE $${paramIndex + i}`).join(' OR ')
        conditions.push(`(${pixelConditions})`)
        params.push(...pixelList.map(p => `%${p}%`))
        paramIndex += pixelList.length
      }
    }

    // Social Networks filter (needs traffic join) - filters by traffic source in traffic.social
    if (socialNetworks.length > 0) {
      // Map frontend network names to database keys (case-sensitive in JSON)
      const networkMap: Record<string, string[]> = {
        'Facebook': ['Facebook', 'Facebook Messenger'],
        'Instagram': ['Instagram'],
        'TikTok': ['Tiktok', 'TikTok'],
        'YouTube': ['Youtube', 'YouTube'],
        'Pinterest': ['Pinterest'],
        'Twitter': ['Twitter', 'X-twitter'],
        'Snapchat': ['Snapchat'],
        'Reddit': ['Reddit'],
      }
      
      const networkConditions: string[] = []
      socialNetworks.forEach(network => {
        const dbKeys = networkMap[network] || [network]
        // Check if any of the mapped keys exist in traffic.social->'data'
        const keyConditions = dbKeys.map(key => `t.social::jsonb->'data' ? '${key}'`).join(' OR ')
        networkConditions.push(`(${keyConditions})`)
      })
      
      if (networkConditions.length > 0) {
        conditions.push(`(${networkConditions.join(' OR ')})`)
      }
    }

    // Languages filter - uses 'locale' column (now on materialized view)
    if (languages.length > 0) {
      const languageMap: Record<string, string[]> = {
        'English': ['en', 'en-US', 'en-GB', 'en-AU', 'en-CA'],
        'French': ['fr', 'fr-FR', 'fr-CA'],
        'Spanish': ['es', 'es-ES', 'es-MX'],
        'German': ['de', 'de-DE', 'de-AT'],
        'Portuguese': ['pt', 'pt-BR', 'pt-PT'],
        'Italian': ['it', 'it-IT'],
        'Dutch': ['nl', 'nl-NL'],
        'Polish': ['pl', 'pl-PL'],
        'Norwegian': ['no', 'nb', 'nn'],
        'Swedish': ['sv', 'sv-SE'],
        'Danish': ['da', 'da-DK'],
        'Japanese': ['ja', 'ja-JP'],
        'Chinese': ['zh', 'zh-CN', 'zh-TW'],
        'Arabic': ['ar', 'ar-SA'],
        'Russian': ['ru', 'ru-RU'],
        'Korean': ['ko', 'ko-KR'],
      }
      
      const localeCodes: string[] = []
      for (const lang of languages) {
        const codes = languageMap[lang] || [lang.toLowerCase().substring(0, 2)]
        localeCodes.push(...codes)
      }
      
      if (localeCodes.length > 0) {
        const langConditions = localeCodes.map((_, i) => `m.locale ILIKE $${paramIndex + i}`).join(' OR ')
        conditions.push(`(${langConditions})`)
        params.push(...localeCodes.map(l => `${l}%`))
        paramIndex += localeCodes.length
      }
    }

    // Domains filter - search in 'shop_url' column
    if (domains.length > 0) {
      const domainConditions = domains.map((_, i) => `m.shop_url ILIKE $${paramIndex + i}`).join(' OR ')
      conditions.push(`(${domainConditions})`)
      params.push(...domains.map(d => `%${d}`))
      paramIndex += domains.length
    }

    // Themes filter (needs shops join)
    if (themes.length > 0) {
      const themeConditions = themes.map((_, i) => `s.theme ILIKE $${paramIndex + i}`).join(' OR ')
      conditions.push(`(${themeConditions})`)
      params.push(...themes.map(t => `%${t}%`))
      paramIndex += themes.length
    }

    // Applications filter (needs shops join)
    if (applications.length > 0) {
      const appConditions = applications.map((_, i) => `s.apps ILIKE $${paramIndex + i}`).join(' OR ')
      conditions.push(`(${appConditions})`)
      params.push(...applications.map(a => `%${a}%`))
      paramIndex += applications.length
    }

    // Catalog size filter (products_count is in materialized view)
    if (minCatalogSize) {
      conditions.push(`m.products_count >= $${paramIndex}`)
      params.push(parseInt(minCatalogSize))
      paramIndex++
    }
    if (maxCatalogSize) {
      conditions.push(`m.products_count <= $${paramIndex}`)
      params.push(parseInt(maxCatalogSize))
      paramIndex++
    }

    // Sort-specific filters
    if (sortBy === 'best_value') {
      conditions.push(`m.active_ads_count > 0`)
    }

    // Price filters (price is already in materialized view)
    if (minPrice) {
      conditions.push(`m.price >= $${paramIndex}`)
      params.push(parseFloat(minPrice))
      paramIndex++
    }
    if (maxPrice) {
      conditions.push(`m.price <= $${paramIndex}`)
      params.push(parseFloat(maxPrice))
      paramIndex++
    }

    // Revenue filter
    if (minRevenue) {
      conditions.push(`m.estimated_monthly >= $${paramIndex}`)
      params.push(parseFloat(minRevenue))
      paramIndex++
    }
    if (maxRevenue) {
      conditions.push(`m.estimated_monthly <= $${paramIndex}`)
      params.push(parseFloat(maxRevenue))
      paramIndex++
    }

    // Orders filter
    if (minOrders) {
      conditions.push(`m.estimated_order >= $${paramIndex}`)
      params.push(parseFloat(minOrders))
      paramIndex++
    }
    if (maxOrders) {
      conditions.push(`m.estimated_order <= $${paramIndex}`)
      params.push(parseFloat(maxOrders))
      paramIndex++
    }

    // Traffic filter
    if (minTraffic) {
      conditions.push(`m.last_month_visits >= $${paramIndex}`)
      params.push(parseFloat(minTraffic))
      paramIndex++
    }
    if (maxTraffic) {
      conditions.push(`m.last_month_visits <= $${paramIndex}`)
      params.push(parseFloat(maxTraffic))
      paramIndex++
    }

    // Traffic growth filter
    if (minTrafficGrowth) {
      conditions.push(`m.growth_rate >= $${paramIndex}`)
      params.push(parseFloat(minTrafficGrowth))
      paramIndex++
    }
    if (maxTrafficGrowth) {
      conditions.push(`m.growth_rate <= $${paramIndex}`)
      params.push(parseFloat(maxTrafficGrowth))
      paramIndex++
    }

    // Sort-specific traffic filters
    if (sortBy === 'trending_up') {
      conditions.push(`m.growth_rate > 0`)
    }
    if (sortBy === 'most_profitable') {
      conditions.push(`m.last_month_visits > 0`)
    }
    // NOTE: top_score is a SORT, not a FILTER
    // The scoring algorithm naturally ranks products with more active ads higher
    // but we don't filter them out - users can still browse ALL products

    // Category filter - needs async lookup
    let categoryCondition = ''
    if (category) {
      const categoryLookupStart = Date.now()
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
            WHERE sc.shop_id = m.shop_id 
            AND sc.category_id IN (${matchingCategoryIds.join(', ')})
          )`
        }
      }
      timings.categoryLookup = Date.now() - categoryLookupStart
      console.log(`[Products API] ⏱️  Category Lookup: ${timings.categoryLookup}ms (${(timings.categoryLookup/1000).toFixed(2)}s)`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')} ${categoryCondition}` : (categoryCondition ? `WHERE 1=1 ${categoryCondition}` : '')

    // Build ORDER BY clause - using column names from materialized view
    const dailySeed = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const seedHash = parseInt(dailySeed) % 1000
    const hourSeed = new Date().getHours()
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC'
    
    let orderByClause = ''
    switch (sortBy) {
      case 'recommended':
        // Same algorithm as Laravel - uses daily seed for variety
        orderByClause = `ORDER BY (
          COALESCE(growth_rate, 0) * 0.3 + 
          COALESCE(active_ads_count, 0) * 10000 + 
          COALESCE(estimated_order, 0) * 0.1 + 
          (MOD(ABS(HASHTEXT(product_handle || '${seedHash}')), 50000))
        ) ${order}`
        break
      case 'top_score':
        // Custom AI Score - DISCOVERY scoring favoring sweet spot shops
        orderByClause = `ORDER BY (
          -- Sweet spot shops (20-300 ads) get priority over giants
          CASE 
            WHEN COALESCE(active_ads_count, 0) BETWEEN 100 AND 300 THEN 500000000
            WHEN COALESCE(active_ads_count, 0) BETWEEN 50 AND 99 THEN 450000000
            WHEN COALESCE(active_ads_count, 0) BETWEEN 20 AND 49 THEN 400000000
            WHEN COALESCE(active_ads_count, 0) BETWEEN 301 AND 500 THEN 350000000
            WHEN COALESCE(active_ads_count, 0) > 500 THEN 300000000
            WHEN COALESCE(active_ads_count, 0) BETWEEN 5 AND 19 THEN 200000000
            ELSE 0
          END +
          
          -- Traffic (LOG scale)
          LN(1 + COALESCE(last_month_visits, 0)) * 1000000 +
          
          -- Active ads (CAPPED at 300)
          LN(1 + LEAST(COALESCE(active_ads_count, 0), 300)) * 500000 +
          
          -- Random rotation
          (MOD(ABS(HASHTEXT(product_handle || '${dailySeed}' || '${hourSeed}')), 1000))
        ) ${order}`
        break
      case 'most_active_ads':
      case 'live_ads':
      case 'active_ads_count':
        orderByClause = `ORDER BY COALESCE(active_ads_count, 0) ${order}`
        break
      case 'highest_revenue':
      case 'estimated_monthly':
        orderByClause = `ORDER BY COALESCE(estimated_monthly, 0) ${order}`
        break
      case 'most_traffic':
      case 'last_month_visits':
        orderByClause = `ORDER BY COALESCE(last_month_visits, 0) ${order}`
        break
      case 'estimated_order':
        orderByClause = `ORDER BY COALESCE(estimated_order, 0) ${order}`
        break
      case 'created_at':
      case 'newest_products':
      case 'most_recent':
        orderByClause = `ORDER BY created_at ${order}`
        break
      case 'best_value':
        orderByClause = `ORDER BY COALESCE(estimated_monthly, 0)::float / NULLIF(active_ads_count, 0) ${order} NULLS LAST`
        break
      case 'trending_up':
        orderByClause = `ORDER BY (COALESCE(growth_rate, 0) * 100 + COALESCE(estimated_order, 0) * 0.5) ${order}`
        break
      case 'most_profitable':
        orderByClause = `ORDER BY COALESCE(estimated_monthly, 0)::float / NULLIF(last_month_visits, 0) ${order} NULLS LAST`
        break
      case 'traffic_growth':
      case 'growth_rate':
        orderByClause = `ORDER BY COALESCE(growth_rate, 0) ${order}`
        break
      case 'price':
        orderByClause = `ORDER BY COALESCE(price, 0) ${order}`
        break
      case 'lowest_price':
        orderByClause = 'ORDER BY COALESCE(price, 0) ASC'
        break
      case 'highest_price':
        orderByClause = 'ORDER BY COALESCE(price, 0) DESC'
        break
      default:
        orderByClause = `ORDER BY created_at ${order}`
    }

    // Build JOIN clause (only if needed for certain filters)
    const shopsJoin = needsShopsJoin ? 'LEFT JOIN shops s ON m.shop_id = s.id' : ''
    const trafficJoin = needsTrafficJoin ? 'LEFT JOIN traffic t ON m.shop_id = t.shop_id' : ''

    // ============================================
    // OPTIMIZED: Using top_products_materialized (373k rows vs 44M)
    // Same as Laravel topproductsMaterialized()
    // ============================================
    const dataQuery = `
      SELECT 
        id,
        title,
        product_handle as handle,
        shop_id,
        price,
        img_src,
        shop_url,
        ${needsShopsJoin ? 'merchant_name' : 'NULL::text as merchant_name'},
        currency,
        country,
        active_ads_count as active_ads,
        estimated_order,
        last_month_visits,
        estimated_monthly,
        growth_rate,
        created_at
      FROM (
        SELECT DISTINCT ON (m.product_handle) 
          m.id, m.title, m.product_handle, m.shop_id, m.price, m.img_src, 
          m.shop_url, m.currency, m.country, m.active_ads_count, 
          m.estimated_order, m.last_month_visits, m.estimated_monthly, 
          m.growth_rate, m.created_at, m.updated_at
          ${needsShopsJoin ? ', s.merchant_name' : ''}
        FROM top_products_materialized m
        ${shopsJoin}
        ${trafficJoin}
        ${whereClause}
        ORDER BY m.product_handle, m.updated_at DESC
      ) as unique_products
      ${orderByClause}
      LIMIT ${perPage} OFFSET ${offset}
    `

    // Execute main query first
    const mainQueryStart = Date.now()
    console.log(`[Products API] 🔍 Executing main query (top_products_materialized)...`)
    const productsResult = await prisma.$queryRawUnsafe<ProductRow[]>(dataQuery, ...params)
    timings.mainQuery = Date.now() - mainQueryStart
    console.log(`[Products API] ⏱️  Main Query: ${timings.mainQuery}ms (${(timings.mainQuery/1000).toFixed(2)}s) - ${productsResult.length} results`)

    // If no results on first page, don't bother counting - it's 0
    let total: number
    if (page === 1 && productsResult.length === 0) {
      total = 0
    } else if (page === 1 && productsResult.length < perPage) {
      // If first page has fewer results than perPage, total is just the count
      total = productsResult.length
    } else {
      // Generate cache key for count - include params values for accurate caching
      const cacheKey = JSON.stringify({ conditions, categoryCondition, sortBy, params })
      const cached = countCache.get(cacheKey)
      
      // Get count - use cache if available
      if (cached && Date.now() - cached.timestamp < COUNT_CACHE_TTL) {
        total = cached.count
        console.log(`[Products API] 📦 Count from cache: ${total}`)
      } else {
        // Count query using same materialized view
        const countQueryStart = Date.now()
        console.log(`[Products API] 🔢 Executing count query...`)
        const countQuery = `
          SELECT COUNT(*) as count
          FROM (
            SELECT DISTINCT ON (m.product_handle) m.id
            FROM top_products_materialized m
            ${shopsJoin}
            ${trafficJoin}
            ${whereClause}
            ORDER BY m.product_handle, m.updated_at DESC
          ) as unique_products
        `
        const countResult = await prisma.$queryRawUnsafe<{count: bigint}[]>(countQuery, ...params)
        timings.countQuery = Date.now() - countQueryStart
        total = Number(countResult[0]?.count || 0)
        countCache.set(cacheKey, { count: total, timestamp: Date.now() })
        console.log(`[Products API] ⏱️  Count Query: ${timings.countQuery}ms (${(timings.countQuery/1000).toFixed(2)}s) - Total: ${total}`)
      }
    }

    // Transform data to match expected format
    const transformStart = Date.now()
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

    timings.transform = Date.now() - transformStart
    timings.total = Date.now() - timings.start
    
    // Final timing summary
    console.log(`[Products API] ⏱️  Transform: ${timings.transform}ms`)
    console.log(`[Products API] ========== TIMING SUMMARY ==========`)
    console.log(`[Products API] Auth:          ${timings.auth}ms (${(timings.auth/1000).toFixed(2)}s)`)
    console.log(`[Products API] Category:      ${timings.categoryLookup}ms (${(timings.categoryLookup/1000).toFixed(2)}s)`)
    console.log(`[Products API] Main Query:    ${timings.mainQuery}ms (${(timings.mainQuery/1000).toFixed(2)}s)`)
    console.log(`[Products API] Count Query:   ${timings.countQuery}ms (${(timings.countQuery/1000).toFixed(2)}s)`)
    console.log(`[Products API] Transform:     ${timings.transform}ms (${(timings.transform/1000).toFixed(2)}s)`)
    console.log(`[Products API] ──────────────────────────────────`)
    console.log(`[Products API] TOTAL:         ${timings.total}ms (${(timings.total/1000).toFixed(2)}s)`)
    console.log(`[Products API] ========== REQUEST END ==========\n`)

    // Create response with caching headers
    const response = NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      _timings: {
        authMs: timings.auth,
        categoryLookupMs: timings.categoryLookup,
        mainQueryMs: timings.mainQuery,
        countQueryMs: timings.countQuery,
        transformMs: timings.transform,
        totalMs: timings.total,
        totalSec: (timings.total/1000).toFixed(2),
      }
    })
    
    // Add caching headers for better performance
    // private: user-specific data (auth required)
    // max-age=30: cache for 30 seconds
    // stale-while-revalidate=60: serve stale while fetching fresh for 60s
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    
    return response

  } catch (error) {
    timings.total = Date.now() - timings.start
    console.error(`[Products API] ❌ ERROR after ${timings.total}ms (${(timings.total/1000).toFixed(2)}s):`, error)
    console.log(`[Products API] ========== REQUEST FAILED ==========\n`)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error',
      _timings: {
        totalMs: timings.total,
        totalSec: (timings.total/1000).toFixed(2),
      }
    }, { status: 500 })
  }
}

