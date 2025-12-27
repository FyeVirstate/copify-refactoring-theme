import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Simple in-memory cache for count queries
const countCache = new Map<string, { count: number; timestamp: number }>()
const COUNT_CACHE_TTL = 60000 // 1 minute

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const searchParams = request.nextUrl.searchParams
  
  // Parse query params
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '20')
  const searchText = searchParams.get('search') || ''
  const sortBy = searchParams.get('sortBy') || 'recommended'
  
  // Filters
  const minRevenue = searchParams.get('minRevenue') ? parseInt(searchParams.get('minRevenue')!) : null
  const maxRevenue = searchParams.get('maxRevenue') ? parseInt(searchParams.get('maxRevenue')!) : null
  const minTraffic = searchParams.get('minTraffic') ? parseInt(searchParams.get('minTraffic')!) : null
  const maxTraffic = searchParams.get('maxTraffic') ? parseInt(searchParams.get('maxTraffic')!) : null
  const minProducts = searchParams.get('minProducts') ? parseInt(searchParams.get('minProducts')!) : null
  const maxProducts = searchParams.get('maxProducts') ? parseInt(searchParams.get('maxProducts')!) : null
  const minActiveAds = searchParams.get('minActiveAds') ? parseInt(searchParams.get('minActiveAds')!) : null
  const maxActiveAds = searchParams.get('maxActiveAds') ? parseInt(searchParams.get('maxActiveAds')!) : null
  const minTrafficGrowth = searchParams.get('minTrafficGrowth') ? parseInt(searchParams.get('minTrafficGrowth')!) : null
  const maxTrafficGrowth = searchParams.get('maxTrafficGrowth') ? parseInt(searchParams.get('maxTrafficGrowth')!) : null
  
  // Array filters
  const currencies = searchParams.get('currency')?.split(',').filter(Boolean) || []
  const countries = searchParams.get('country')?.split(',').filter(Boolean) || []
  const categories = searchParams.get('category')?.split(',').filter(Boolean) || []
  const pixels = searchParams.get('pixels')?.split(',').filter(Boolean) || []
  // Note: 'origins' uses 'country' column (shop location, separate from market countries from traffic)
  const origins = searchParams.get('origins')?.split(',').filter(Boolean) || []
  // Note: 'languages' maps to 'locale' column in database
  const languages = searchParams.get('languages')?.split(',').filter(Boolean) || []
  const domains = searchParams.get('domains')?.split(',').filter(Boolean) || []
  const themes = searchParams.get('themes')?.split(',').filter(Boolean) || []
  // Note: 'applications' searches in 'apps' text column
  const applications = searchParams.get('applications')?.split(',').filter(Boolean) || []
  const shopCreationDate = searchParams.get('shopCreationDate') || ''
  // Monthly orders filter
  const minOrders = searchParams.get('minOrders') ? parseInt(searchParams.get('minOrders')!) : null
  const maxOrders = searchParams.get('maxOrders') ? parseInt(searchParams.get('maxOrders')!) : null
  
  // Price and catalog filters
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null
  const minCatalogSize = searchParams.get('minCatalogSize') ? parseInt(searchParams.get('minCatalogSize')!) : null
  const maxCatalogSize = searchParams.get('maxCatalogSize') ? parseInt(searchParams.get('maxCatalogSize')!) : null

  try {
    // Build the WHERE conditions for shops table only (fast filtering)
    const shopConditions: string[] = []
    const trafficConditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Base filters - exclude deleted/disabled shops
    shopConditions.push(`s.deleted_at IS NULL`)
    shopConditions.push(`s.disabled = 0`)
    
    // Minimum quality filters like Laravel
    shopConditions.push(`s.products_count > 0`)

    // Search text - use index if available
    if (searchText) {
      shopConditions.push(`(s.url ILIKE $${paramIndex} OR s.merchant_name ILIKE $${paramIndex})`)
      params.push(`%${searchText}%`)
      paramIndex++
    }

    // Products filter (on shops table - indexed)
    if (minProducts !== null) {
      shopConditions.push(`s.products_count >= $${paramIndex}`)
      params.push(minProducts)
      paramIndex++
    }
    if (maxProducts !== null) {
      shopConditions.push(`s.products_count <= $${paramIndex}`)
      params.push(maxProducts)
      paramIndex++
    }

    // Catalog size filter (products_count)
    if (minCatalogSize !== null) {
      shopConditions.push(`s.products_count >= $${paramIndex}`)
      params.push(minCatalogSize)
      paramIndex++
    }
    if (maxCatalogSize !== null) {
      shopConditions.push(`s.products_count <= $${paramIndex}`)
      params.push(maxCatalogSize)
      paramIndex++
    }

    // Active ads filter (on shops table - indexed)
    if (minActiveAds !== null) {
      shopConditions.push(`s.active_ads >= $${paramIndex}`)
      params.push(minActiveAds)
      paramIndex++
    }
    if (maxActiveAds !== null) {
      shopConditions.push(`s.active_ads <= $${paramIndex}`)
      params.push(maxActiveAds)
      paramIndex++
    }

    // Currency filter (on shops table - indexed)
    if (currencies.length > 0) {
      const currencyPlaceholders = currencies.map((_, i) => `$${paramIndex + i}`).join(', ')
      shopConditions.push(`s.currency IN (${currencyPlaceholders})`)
      params.push(...currencies)
      paramIndex += currencies.length
    }

    // Country filter (on shops table - indexed) - This is for traffic market countries
    if (countries.length > 0) {
      const countryPlaceholders = countries.map((_, i) => `$${paramIndex + i}`).join(', ')
      shopConditions.push(`s.country IN (${countryPlaceholders})`)
      params.push(...countries)
      paramIndex += countries.length
    }

    // Origins filter - shop location country (uses same 'country' column)
    // This is separate from market countries - it filters by where the shop is located
    if (origins.length > 0) {
      const originPlaceholders = origins.map((_, i) => `$${paramIndex + i}`).join(', ')
      shopConditions.push(`s.country IN (${originPlaceholders})`)
      params.push(...origins)
      paramIndex += origins.length
    }

    // Pixels filter
    if (pixels.length > 0) {
      const pixelConditions = pixels.map((_, i) => `s.pixels ILIKE $${paramIndex + i}`).join(' OR ')
      shopConditions.push(`(${pixelConditions})`)
      params.push(...pixels.map(p => `%${p}%`))
      paramIndex += pixels.length
    }

    // Languages filter - uses 'locale' column in database
    // Locale contains language codes like 'en', 'fr', 'es', etc.
    if (languages.length > 0) {
      // Map language names to locale codes
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
        const langConditions = localeCodes.map((_, i) => `s.locale ILIKE $${paramIndex + i}`).join(' OR ')
        shopConditions.push(`(${langConditions})`)
        params.push(...localeCodes.map(l => `${l}%`))
        paramIndex += localeCodes.length
      }
    }

    // Domains filter - search in 'url' column
    // Looking for URLs ending with specific extensions like .com, .fr, .co.uk
    if (domains.length > 0) {
      const domainConditions = domains.map((_, i) => `s.url ILIKE $${paramIndex + i}`).join(' OR ')
      shopConditions.push(`(${domainConditions})`)
      // Match URLs ending with the domain extension
      params.push(...domains.map(d => `%${d}`))
      paramIndex += domains.length
    }

    // Themes filter - search in 'theme' column
    if (themes.length > 0) {
      const themeConditions = themes.map((_, i) => `s.theme ILIKE $${paramIndex + i}`).join(' OR ')
      shopConditions.push(`(${themeConditions})`)
      params.push(...themes.map(t => `%${t}%`))
      paramIndex += themes.length
    }

    // Applications filter - search in 'apps' text column
    // The apps column contains comma-separated or JSON list of app names
    if (applications.length > 0) {
      const appConditions = applications.map((_, i) => `s.apps ILIKE $${paramIndex + i}`).join(' OR ')
      shopConditions.push(`(${appConditions})`)
      params.push(...applications.map(a => `%${a}%`))
      paramIndex += applications.length
    }

    // Shop creation date filter
    if (shopCreationDate) {
      // Parse date range (format: MM/DD/YYYY - MM/DD/YYYY)
      const dates = shopCreationDate.split(' - ')
      if (dates.length === 2) {
        const startDate = new Date(dates[0])
        const endDate = new Date(dates[1])
        if (!isNaN(startDate.getTime())) {
          shopConditions.push(`s.created_at >= $${paramIndex}`)
          params.push(startDate.toISOString())
          paramIndex++
        }
        if (!isNaN(endDate.getTime())) {
          shopConditions.push(`s.created_at <= $${paramIndex}`)
          params.push(endDate.toISOString())
          paramIndex++
        }
      }
    }

    // Traffic-based filters (will be applied after join)
    const hasTrafficFilters = minRevenue !== null || maxRevenue !== null || 
                              minTraffic !== null || maxTraffic !== null ||
                              minTrafficGrowth !== null || maxTrafficGrowth !== null ||
                              minOrders !== null || maxOrders !== null ||
                              minPrice !== null || maxPrice !== null

    // Revenue filter (from traffic table)
    if (minRevenue !== null) {
      trafficConditions.push(`COALESCE(t.estimated_monthly, 0) >= $${paramIndex}`)
      params.push(minRevenue)
      paramIndex++
    }
    if (maxRevenue !== null) {
      trafficConditions.push(`COALESCE(t.estimated_monthly, 0) <= $${paramIndex}`)
      params.push(maxRevenue)
      paramIndex++
    }

    // Traffic filter
    if (minTraffic !== null) {
      trafficConditions.push(`COALESCE(t.last_month_visits, 0) >= $${paramIndex}`)
      params.push(minTraffic)
      paramIndex++
    }
    if (maxTraffic !== null) {
      trafficConditions.push(`COALESCE(t.last_month_visits, 0) <= $${paramIndex}`)
      params.push(maxTraffic)
      paramIndex++
    }

    // Traffic growth filter
    if (minTrafficGrowth !== null) {
      trafficConditions.push(`COALESCE(t.growth_rate, 0) >= $${paramIndex}`)
      params.push(minTrafficGrowth)
      paramIndex++
    }
    if (maxTrafficGrowth !== null) {
      trafficConditions.push(`COALESCE(t.growth_rate, 0) <= $${paramIndex}`)
      params.push(maxTrafficGrowth)
      paramIndex++
    }

    // Monthly orders filter (from traffic table)
    if (minOrders !== null) {
      trafficConditions.push(`COALESCE(t.estimated_order, 0) >= $${paramIndex}`)
      params.push(minOrders)
      paramIndex++
    }
    if (maxOrders !== null) {
      trafficConditions.push(`COALESCE(t.estimated_order, 0) <= $${paramIndex}`)
      params.push(maxOrders)
      paramIndex++
    }

    // Price filter (avg_price in traffic table)
    if (minPrice !== null) {
      trafficConditions.push(`COALESCE(t.avg_price, 0) >= $${paramIndex}`)
      params.push(minPrice)
      paramIndex++
    }
    if (maxPrice !== null) {
      trafficConditions.push(`COALESCE(t.avg_price, 0) <= $${paramIndex}`)
      params.push(maxPrice)
      paramIndex++
    }

    const shopWhereClause = shopConditions.length > 0 ? `WHERE ${shopConditions.join(' AND ')}` : ''
    const trafficWhereClause = trafficConditions.length > 0 ? `AND ${trafficConditions.join(' AND ')}` : ''

    // Build ORDER BY clause based on sortBy
    let orderByClause = ''
    let needsTrafficForSort = false
    switch (sortBy) {
      case 'traffic':
      case 'most_traffic':
        orderByClause = 'ORDER BY COALESCE(t.last_month_visits, 0) DESC NULLS LAST'
        needsTrafficForSort = true
        break
      case 'revenue':
      case 'highest_revenue':
        orderByClause = 'ORDER BY COALESCE(t.estimated_monthly, 0) DESC NULLS LAST'
        needsTrafficForSort = true
        break
      case 'activeAds':
      case 'most_active_ads':
        orderByClause = 'ORDER BY s.active_ads DESC NULLS LAST'
        break
      case 'newest':
      case 'most_recent':
        orderByClause = 'ORDER BY s.created_at DESC NULLS LAST'
        break
      case 'trafficGrowth':
      case 'traffic_growth':
        orderByClause = 'ORDER BY COALESCE(t.growth_rate, 0) DESC NULLS LAST'
        needsTrafficForSort = true
        break
      case 'productsCount':
        orderByClause = 'ORDER BY s.products_count DESC NULLS LAST'
        break
      case 'recommended':
      default:
        // Recommended: Deterministic scoring without RANDOM for cacheability
        // Use shop id modulo for pseudo-randomness that's stable per page load
        orderByClause = `ORDER BY (
          COALESCE(t.growth_rate, 0) * 0.3 + 
          COALESCE(s.active_ads, 0) * 10000 + 
          COALESCE(t.estimated_order, 0) * 0.1 +
          (s.id % 1000) * 5
        ) DESC NULLS LAST`
        needsTrafficForSort = true
        break
    }

    // Generate cache key for count
    const cacheKey = JSON.stringify({ shopConditions, trafficConditions, currencies, countries, pixels })
    const cached = countCache.get(cacheKey)
    let total: number
    
    const offset = (page - 1) * perPage

    // Use optimized query with subquery for latest traffic
    // This avoids LATERAL JOIN which is slow
    const mainQuery = `
      WITH latest_traffic AS (
        SELECT DISTINCT ON (shop_id) 
          shop_id,
          last_month_visits,
          last_last_month_visits,
          estimated_monthly,
          estimated_order,
          growth_rate,
          visits,
          dates,
          countries,
          avg_price
        FROM traffic
        ORDER BY shop_id, created_at DESC
      ),
      filtered_shops AS (
        SELECT s.id
        FROM shops s
        LEFT JOIN latest_traffic t ON t.shop_id = s.id
        ${shopWhereClause}
        ${trafficWhereClause}
        ${orderByClause}
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      )
      SELECT 
        s.id,
        s.url,
        s.merchant_name,
        s.screenshot,
        s.country,
        s.currency,
        s.products_count,
        s.active_ads,
        s.created_at as whois_at,
        s.pixels,
        t.last_month_visits,
        t.last_last_month_visits,
        t.estimated_monthly,
        t.estimated_order,
        t.growth_rate,
        t.visits,
        t.dates,
        t.countries as traffic_countries,
        bp.best_product,
        ba.best_ads,
        ah.ads_history,
        CASE WHEN us.shop_id IS NOT NULL THEN true ELSE false END as is_tracked
      FROM filtered_shops fs
      JOIN shops s ON s.id = fs.id
      LEFT JOIN latest_traffic t ON t.shop_id = s.id
      LEFT JOIN LATERAL (
        SELECT jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'handle', p.handle,
          'price', pv.min_price,
          'image', pi.src
        ) as best_product
        FROM products p
        LEFT JOIN LATERAL (
          SELECT MIN(price) as min_price FROM product_variants WHERE product_id = p.id
        ) pv ON true
        LEFT JOIN LATERAL (
          SELECT src FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1
        ) pi ON true
        WHERE p.shop_id = s.id
          AND p.handle IS NOT NULL
          AND p.title NOT ILIKE '%Protection%'
          AND p.title NOT ILIKE '%Shipping%'
        ORDER BY p.sort, p.id
        LIMIT 1
      ) bp ON true
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'type', a.type,
            'video_link', a.video_link,
            'video_preview_link', a.video_preview_link,
            'image_link', a.image_link
          )
        ) as best_ads
        FROM (
          SELECT id, type, video_link, video_preview_link, image_link
          FROM ads 
          WHERE shop_id = s.id 
            AND is_active = 1 
            AND video_link IS NOT NULL
          ORDER BY start_date DESC 
          LIMIT 2
        ) a
      ) ba ON true
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'active_ads_count', h.active_ads_count,
            'date', h.created_at
          )
        ) as ads_history
        FROM (
          SELECT active_ads_count, created_at
          FROM shops_ads_active_history 
          WHERE shop_id = s.id 
            AND created_at >= NOW() - INTERVAL '90 days'
          ORDER BY created_at ASC
        ) h
      ) ah ON true
      LEFT JOIN user_shops us ON us.shop_id = s.id AND us.user_id = $${paramIndex + 2}
      ${orderByClause.replace('ORDER BY', 'ORDER BY ')}
    `

    params.push(perPage)
    params.push(offset)
    params.push(parseInt(session.user.id))

    // Execute main query
    const shopsResult = await prisma.$queryRawUnsafe<any[]>(mainQuery, ...params)

    // Get count - use cache if available, otherwise run optimized count
    if (cached && Date.now() - cached.timestamp < COUNT_CACHE_TTL) {
      total = cached.count
    } else {
      // Optimized count query without LATERAL
      const countQuery = `
        WITH latest_traffic AS (
          SELECT DISTINCT ON (shop_id) shop_id, estimated_monthly, last_month_visits, growth_rate, estimated_order, avg_price
          FROM traffic
          ORDER BY shop_id, created_at DESC
        )
        SELECT COUNT(*) as total
        FROM shops s
        LEFT JOIN latest_traffic t ON t.shop_id = s.id
        ${shopWhereClause}
        ${trafficWhereClause}
      `
      const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery, ...params.slice(0, -3))
      total = Number(countResult[0]?.total || 0)
      countCache.set(cacheKey, { count: total, timestamp: Date.now() })
    }

    // Transform results
    const shops = shopsResult.map((shop: any, index: number) => {
      // Parse traffic history
      let trafficData: number[] = []
      let trafficDates: string[] = []
      if (shop.visits) {
        trafficData = shop.visits.split(',').map((v: string) => parseInt(v) || 0)
        trafficDates = shop.dates ? shop.dates.split(',') : []
      }

      // Calculate traffic change
      const trafficCurrent = shop.last_month_visits || 0
      const trafficPrevious = shop.last_last_month_visits || 0
      const trafficChange = trafficCurrent - trafficPrevious

      // Parse ads history
      let adsHistoryData: number[] = []
      let adsChange = 0
      const currentAds = shop.active_ads || 0
      if (shop.ads_history && Array.isArray(shop.ads_history)) {
        adsHistoryData = shop.ads_history.map((h: any) => h.active_ads_count || 0)
        if (adsHistoryData.length > 0) {
          adsChange = currentAds - adsHistoryData[0]
        }
      }

      // Parse market share countries
      let marketCountries: { code: string; share: number }[] = []
      if (shop.traffic_countries) {
        try {
          const countriesData = typeof shop.traffic_countries === 'string' 
            ? JSON.parse(shop.traffic_countries) 
            : shop.traffic_countries
          if (Array.isArray(countriesData)) {
            marketCountries = countriesData.slice(0, 3).map((c: any) => ({
              code: c.CountryCode || c.country || '',
              share: Math.round((c.Value || c.share || 0) * 100)
            })).filter((c: any) => c.code)
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      // Best product
      const bestProduct = shop.best_product ? {
        id: shop.best_product.id,
        name: shop.best_product.title,
        handle: shop.best_product.handle,
        price: Number(shop.best_product.price) || 0,
        image: shop.best_product.image || null,
        currency: shop.currency || '$'
      } : null

      // Best ads
      const bestAds = shop.best_ads || []

      return {
        id: Number(shop.id),
        position: (page - 1) * perPage + index + 1,
        url: shop.url,
        name: shop.merchant_name || shop.url?.replace('www.', ''),
        screenshot: shop.screenshot,
        country: shop.country,
        currency: shop.currency || 'USD',
        productsCount: shop.products_count || 0,
        activeAds: currentAds,
        adsChange,
        adsHistoryData,
        monthlyVisits: trafficCurrent,
        trafficChange,
        trafficGrowth: shop.growth_rate || 0,
        trafficData: trafficData.slice(-13), // Last ~90 days
        trafficDates: trafficDates.slice(-13),
        estimatedMonthly: shop.estimated_monthly || 0,
        dailyRevenue: Math.round((shop.estimated_monthly || 0) / 30),
        marketCountries,
        bestProduct,
        bestAds,
        isTracked: shop.is_tracked || false,
        createdAt: shop.whois_at
      }
    })

    return NextResponse.json({
      success: true,
      data: shops,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasMore: page * perPage < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch shops:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch shops',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
