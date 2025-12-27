/**
 * Top Ads API Route - OPTIMIZED
 * 
 * Queries ads from the database with proper JOINs for sorting
 * Using CTEs and pre-computed data for maximum performance
 * 
 * GET /api/ads - Get ads with filters
 */

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
  const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100)
  const searchText = searchParams.get('search') || searchParams.get('query') || ''
  const sortBy = searchParams.get('sortBy') || 'recommended'
  
  // Status filter
  const status = searchParams.get('status') || 'all' // all, active, inactive
  
  // Media type filter
  const mediaType = searchParams.get('mediaType') || searchParams.get('type') || '' // video, image
  
  // CTA filter
  const cta = searchParams.get('cta') || ''
  const ctas = searchParams.get('ctas')?.split(',').filter(Boolean) || []
  
  // Date filters
  const dateFilter = searchParams.get('dateFilter') || '' // start_date range
  const dateFilter1 = searchParams.get('dateFilter1') || '' // end_date range
  
  // Country/Market filter (from shops table)
  const countries = searchParams.get('country')?.split(',').filter(Boolean) || []
  const markets = searchParams.get('market')?.split(',').filter(Boolean) || []
  const allCountries = [...countries, ...markets]
  
  // Niche/Category filter
  const categories = searchParams.get('category')?.split(',').filter(Boolean) || 
                     searchParams.get('niche')?.split(',').filter(Boolean) || []
  
  // Performance score filter
  const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : null
  const maxScore = searchParams.get('maxScore') ? parseInt(searchParams.get('maxScore')!) : null
  
  // Active ads count filter (on shops)
  const minActiveAds = searchParams.get('minActiveAds') ? parseInt(searchParams.get('minActiveAds')!) : null
  const maxActiveAds = searchParams.get('maxActiveAds') ? parseInt(searchParams.get('maxActiveAds')!) : null
  
  // Traffic filters
  const minVisits = searchParams.get('minVisits') ? parseInt(searchParams.get('minVisits')!) : null
  const maxVisits = searchParams.get('maxVisits') ? parseInt(searchParams.get('maxVisits')!) : null
  const minRevenue = searchParams.get('minRevenue') ? parseInt(searchParams.get('minRevenue')!) : null
  const maxRevenue = searchParams.get('maxRevenue') ? parseInt(searchParams.get('maxRevenue')!) : null
  const minGrowth = searchParams.get('minGrowth') ? parseInt(searchParams.get('minGrowth')!) : null
  const maxGrowth = searchParams.get('maxGrowth') ? parseInt(searchParams.get('maxGrowth')!) : null

  // EU Transparency filter
  const euTransparency = searchParams.get('euTransparency') === 'true'
  
  // New filters from Top Boutiques/Produits
  const minOrders = searchParams.get('minOrders') ? parseInt(searchParams.get('minOrders')!) : null
  const maxOrders = searchParams.get('maxOrders') ? parseInt(searchParams.get('maxOrders')!) : null
  const shopCreationDate = searchParams.get('shopCreationDate') || ''
  const currencies = searchParams.get('currencies')?.split(',').filter(Boolean) || []
  const pixels = searchParams.get('pixels')?.split(',').filter(Boolean) || []
  const origins = searchParams.get('origins')?.split(',').filter(Boolean) || []
  const languages = searchParams.get('languages')?.split(',').filter(Boolean) || []
  const domains = searchParams.get('domains')?.split(',').filter(Boolean) || []
  const minTrustpilotRating = searchParams.get('minTrustpilotRating') ? parseFloat(searchParams.get('minTrustpilotRating')!) : null
  const maxTrustpilotRating = searchParams.get('maxTrustpilotRating') ? parseFloat(searchParams.get('maxTrustpilotRating')!) : null
  const minTrustpilotReviews = searchParams.get('minTrustpilotReviews') ? parseInt(searchParams.get('minTrustpilotReviews')!) : null
  const maxTrustpilotReviews = searchParams.get('maxTrustpilotReviews') ? parseInt(searchParams.get('maxTrustpilotReviews')!) : null
  const themes = searchParams.get('themes')?.split(',').filter(Boolean) || []
  const apps = searchParams.get('apps')?.split(',').filter(Boolean) || []
  const socialNetworks = searchParams.get('socialNetworks')?.split(',').filter(Boolean) || []
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null
  const minCatalogSize = searchParams.get('minCatalogSize') ? parseInt(searchParams.get('minCatalogSize')!) : null
  const maxCatalogSize = searchParams.get('maxCatalogSize') ? parseInt(searchParams.get('maxCatalogSize')!) : null

  try {
    // Build WHERE conditions
    const adsConditions: string[] = []
    const shopsConditions: string[] = []
    const trafficConditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Base filters - exclude very old ads (2 years)
    adsConditions.push(`a.created_at >= NOW() - INTERVAL '2 years'`)

    // Search text
    if (searchText) {
      adsConditions.push(`(
        a.title ILIKE $${paramIndex} OR 
        a.description ILIKE $${paramIndex} OR 
        a.page_name ILIKE $${paramIndex} OR
        a.target_url ILIKE $${paramIndex}
      )`)
      params.push(`%${searchText}%`)
      paramIndex++
    }

    // Status filter
    if (status === 'active') {
      adsConditions.push(`a.is_active = 1`)
    } else if (status === 'inactive') {
      adsConditions.push(`a.is_active = 0`)
    }

    // Media type filter
    if (mediaType) {
      adsConditions.push(`a.type = $${paramIndex}`)
      params.push(mediaType)
      paramIndex++
    }

    // CTA filter
    if (cta) {
      adsConditions.push(`a.cta_text = $${paramIndex}`)
      params.push(cta)
      paramIndex++
    }
    if (ctas.length > 0) {
      const ctaPlaceholders = ctas.map((_, i) => `$${paramIndex + i}`).join(', ')
      adsConditions.push(`a.cta_text IN (${ctaPlaceholders})`)
      params.push(...ctas)
      paramIndex += ctas.length
    }

    // Date filter (start_date range)
    if (dateFilter && dateFilter.includes(' - ')) {
      const [startDate, endDate] = dateFilter.split(' - ')
      try {
        const parsedStart = new Date(startDate.trim())
        const parsedEnd = new Date(endDate.trim())
        if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
          adsConditions.push(`a.start_date >= $${paramIndex}`)
          params.push(parsedStart)
          paramIndex++
          adsConditions.push(`a.start_date <= $${paramIndex}`)
          params.push(parsedEnd)
          paramIndex++
        }
      } catch (e) {
        // Invalid date format - skip
      }
    }

    // Country filter (on shops)
    if (allCountries.length > 0) {
      const countryPlaceholders = allCountries.map((_, i) => `$${paramIndex + i}`).join(', ')
      shopsConditions.push(`s.country IN (${countryPlaceholders})`)
      params.push(...allCountries)
      paramIndex += allCountries.length
    }

    // Active ads filter (on shops)
    if (minActiveAds !== null) {
      shopsConditions.push(`s.active_ads >= $${paramIndex}`)
      params.push(minActiveAds)
      paramIndex++
    }
    if (maxActiveAds !== null) {
      shopsConditions.push(`s.active_ads <= $${paramIndex}`)
      params.push(maxActiveAds)
      paramIndex++
    }

    // Traffic filters
    if (minVisits !== null) {
      trafficConditions.push(`COALESCE(t.last_month_visits, 0) >= $${paramIndex}`)
      params.push(minVisits)
      paramIndex++
    }
    if (maxVisits !== null) {
      trafficConditions.push(`COALESCE(t.last_month_visits, 0) <= $${paramIndex}`)
      params.push(maxVisits)
      paramIndex++
    }
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
    if (minGrowth !== null) {
      trafficConditions.push(`COALESCE(t.growth_rate, 0) >= $${paramIndex}`)
      params.push(minGrowth)
      paramIndex++
    }
    if (maxGrowth !== null) {
      trafficConditions.push(`COALESCE(t.growth_rate, 0) <= $${paramIndex}`)
      params.push(maxGrowth)
      paramIndex++
    }
    
    // Orders filters (estimated_order from traffic)
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
    
    // Price filters - Note: avg_price may not exist in production, skip for now
    // Products filter price is not applicable to ads (ads don't have avg_price directly)
    
    // Shop creation date filter
    if (shopCreationDate) {
      // Parse date range format: "YYYY-MM-DD - YYYY-MM-DD"
      if (shopCreationDate.includes(' - ')) {
        const [startDate, endDate] = shopCreationDate.split(' - ')
        try {
          const parsedStart = new Date(startDate.trim())
          const parsedEnd = new Date(endDate.trim())
          if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
            shopsConditions.push(`s.created_at >= $${paramIndex}`)
            params.push(parsedStart)
            paramIndex++
            shopsConditions.push(`s.created_at <= $${paramIndex}`)
            params.push(parsedEnd)
            paramIndex++
          }
        } catch (e) {
          // Invalid date format - skip
        }
      }
    }
    
    // Currency filter
    if (currencies.length > 0) {
      const currencyPlaceholders = currencies.map((_, i) => `$${paramIndex + i}`).join(', ')
      shopsConditions.push(`s.currency IN (${currencyPlaceholders})`)
      params.push(...currencies)
      paramIndex += currencies.length
    }
    
    // Pixels filter (pixels column in shops)
    if (pixels.length > 0) {
      const pixelConditions = pixels.map((_, i) => `s.pixels ILIKE $${paramIndex + i}`).join(' OR ')
      shopsConditions.push(`(${pixelConditions})`)
      params.push(...pixels.map(p => `%${p}%`))
      paramIndex += pixels.length
    }
    
    // Origins filter (country column in shops)
    if (origins.length > 0) {
      const originPlaceholders = origins.map((_, i) => `$${paramIndex + i}`).join(', ')
      shopsConditions.push(`s.country IN (${originPlaceholders})`)
      params.push(...origins)
      paramIndex += origins.length
    }
    
    // Languages filter (locale column in shops)
    if (languages.length > 0) {
      // Map language names to locale codes
      const localeMap: { [key: string]: string } = {
        'Français': 'fr', 'English': 'en', 'Deutsch': 'de', 'Español': 'es',
        'Italiano': 'it', 'Português': 'pt', 'Nederlands': 'nl', 'Polski': 'pl',
        'Svenska': 'sv', 'Dansk': 'da', 'Norsk': 'no', 'Suomi': 'fi',
        'Čeština': 'cs', 'Magyar': 'hu', 'Română': 'ro', 'Ελληνικά': 'el',
        'Türkçe': 'tr', 'Русский': 'ru', '日本語': 'ja', '中文': 'zh',
        '한국어': 'ko', 'العربية': 'ar', 'עברית': 'he', 'ไทย': 'th',
        'Tiếng Việt': 'vi', 'Bahasa Indonesia': 'id', 'Bahasa Melayu': 'ms'
      }
      const localeCodes = languages.map(l => localeMap[l] || l.toLowerCase().substring(0, 2))
      const languagePlaceholders = localeCodes.map((_, i) => `$${paramIndex + i}`).join(', ')
      shopsConditions.push(`s.locale IN (${languagePlaceholders})`)
      params.push(...localeCodes)
      paramIndex += localeCodes.length
    }
    
    // Domains filter (url column in shops)
    if (domains.length > 0) {
      const domainConditions = domains.map((_, i) => `s.url ILIKE $${paramIndex + i}`).join(' OR ')
      shopsConditions.push(`(${domainConditions})`)
      params.push(...domains.map(d => `%${d}%`))
      paramIndex += domains.length
    }
    
    // Themes filter
    if (themes.length > 0) {
      const themeConditions = themes.map((_, i) => `s.theme ILIKE $${paramIndex + i}`).join(' OR ')
      shopsConditions.push(`(${themeConditions})`)
      params.push(...themes.map(t => `%${t}%`))
      paramIndex += themes.length
    }
    
    // Apps filter
    if (apps.length > 0) {
      const appConditions = apps.map((_, i) => `s.apps ILIKE $${paramIndex + i}`).join(' OR ')
      shopsConditions.push(`(${appConditions})`)
      params.push(...apps.map(a => `%${a}%`))
      paramIndex += apps.length
    }
    
    // Catalog size filter (products_count from shops)
    if (minCatalogSize !== null) {
      shopsConditions.push(`COALESCE(s.products_count, 0) >= $${paramIndex}`)
      params.push(minCatalogSize)
      paramIndex++
    }
    if (maxCatalogSize !== null) {
      shopsConditions.push(`COALESCE(s.products_count, 0) <= $${paramIndex}`)
      params.push(maxCatalogSize)
      paramIndex++
    }

    // Build WHERE clauses
    const adsWhereClause = adsConditions.length > 0 ? `WHERE ${adsConditions.join(' AND ')}` : ''
    const shopsWhereClause = shopsConditions.length > 0 ? `AND ${shopsConditions.join(' AND ')}` : ''
    const trafficWhereClause = trafficConditions.length > 0 ? `AND ${trafficConditions.join(' AND ')}` : ''

    // Build ORDER BY clause
    let orderByClause = ''
    const needsTrafficJoin = ['highest_reach', 'most_engaging', 'highest_spend', 'trending', 'recommended'].includes(sortBy)
    
    switch (sortBy) {
      case 'most_recent':
      case 'lastSeenDate':
        orderByClause = 'ORDER BY fa.start_date DESC NULLS LAST, fa.id DESC'
        break
      case 'oldest_first':
      case 'firstSeenDate':
        orderByClause = 'ORDER BY fa.start_date ASC NULLS LAST, fa.id ASC'
        break
      case 'highest_reach':
        orderByClause = 'ORDER BY fa.last_month_visits DESC NULLS LAST'
        break
      case 'most_engaging':
        orderByClause = `ORDER BY (
          fa.last_month_visits * 0.4 +
          fa.growth_rate * 10 * 0.3 +
          CASE
            WHEN fa.start_date >= NOW() - INTERVAL '30 days' THEN 1000
            WHEN fa.start_date >= NOW() - INTERVAL '90 days' THEN 500
            ELSE 100
          END * 0.3
        ) DESC NULLS LAST`
        break
      case 'highest_spend':
        orderByClause = 'ORDER BY fa.estimated_monthly DESC NULLS LAST'
        break
      case 'trending':
        orderByClause = `ORDER BY (
          fa.last_month_visits * 0.3 +
          fa.growth_rate * 15 * 0.3 +
          fa.estimated_monthly * 0.1 +
          CASE
            WHEN fa.start_date >= NOW() - INTERVAL '7 days' THEN 2000
            WHEN fa.start_date >= NOW() - INTERVAL '30 days' THEN 1000
            WHEN fa.start_date >= NOW() - INTERVAL '90 days' THEN 300
            ELSE 50
          END * 0.3
        ) DESC NULLS LAST`
        break
      case 'recommended':
      default:
        // Smart ranking based on multiple factors
        orderByClause = `ORDER BY (
          fa.last_month_visits * 0.25 +
          fa.estimated_monthly * 0.1 +
          fa.growth_rate * 10 * 0.15 +
          CASE
            WHEN fa.start_date >= NOW() - INTERVAL '7 days' THEN 1500
            WHEN fa.start_date >= NOW() - INTERVAL '30 days' THEN 1000
            WHEN fa.start_date >= NOW() - INTERVAL '90 days' THEN 500
            ELSE 100
          END * 0.25 +
          (fa.id % 1000) * 3
        ) DESC NULLS LAST`
        break
    }

    const offset = (page - 1) * perPage

    // Build main query with CTEs for performance
    const mainQuery = `
      WITH latest_traffic AS (
        SELECT DISTINCT ON (shop_id) 
          shop_id,
          last_month_visits,
          estimated_monthly,
          growth_rate,
          estimated_order
        FROM traffic
        ORDER BY shop_id, created_at DESC
      ),
      filtered_ads AS (
        SELECT 
          a.id,
          a.ad_archive_id,
          a.ad_creative_id,
          a.page_id,
          a.page_name,
          a.shop_id,
          a.title,
          a.description,
          a.type,
          a.image_link,
          a.video_link,
          a.video_preview_link,
          a.target_url,
          a.cta_text,
          a.start_date,
          a.end_date,
          a.is_active,
          a.platform,
          a.created_at,
          s.url as shop_url,
          s.merchant_name as shop_name,
          s.country as shop_country,
          s.active_ads as shop_active_ads,
          s.screenshot as shop_screenshot,
          COALESCE(t.last_month_visits, 0) as last_month_visits,
          COALESCE(t.estimated_monthly, 0) as estimated_monthly,
          COALESCE(t.growth_rate, 0) as growth_rate
        FROM ads a
        LEFT JOIN shops s ON a.shop_id = s.id AND s.deleted_at IS NULL
        LEFT JOIN latest_traffic t ON t.shop_id = s.id
        ${adsWhereClause}
        ${shopsWhereClause}
        ${trafficWhereClause}
      )
      SELECT 
        fa.*,
        CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
      FROM filtered_ads fa
      LEFT JOIN favorites f ON f.ad_id = fa.id AND f.user_id = $${paramIndex + 2}
      ${orderByClause}
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `

    params.push(perPage)
    params.push(offset)
    params.push(parseInt(session.user.id))

    // Execute main query
    const adsResult = await prisma.$queryRawUnsafe<any[]>(mainQuery, ...params)

    // Get count - use cache for performance
    const countParams = params.slice(0, -3)
    const cacheKey = JSON.stringify({ adsConditions, shopsConditions, trafficConditions, countParams })
    const cached = countCache.get(cacheKey)
    let total: number
    
    if (cached && Date.now() - cached.timestamp < COUNT_CACHE_TTL) {
      total = cached.count
    } else {
      // Use a simpler count for performance when no complex filters
      const hasComplexFilters = shopsConditions.length > 0 || trafficConditions.length > 0
      
      let countQuery: string
      if (hasComplexFilters) {
        countQuery = `
          WITH latest_traffic AS (
            SELECT DISTINCT ON (shop_id) shop_id, last_month_visits, estimated_monthly, growth_rate
            FROM traffic
            ORDER BY shop_id, created_at DESC
          )
          SELECT COUNT(*) as total
          FROM ads a
          LEFT JOIN shops s ON a.shop_id = s.id AND s.deleted_at IS NULL
          LEFT JOIN latest_traffic t ON t.shop_id = s.id
          ${adsWhereClause}
          ${shopsWhereClause}
          ${trafficWhereClause}
        `
      } else {
        // Simple count when only ads conditions
        countQuery = `
          SELECT COUNT(*) as total
          FROM ads a
          ${adsWhereClause}
        `
      }
      
      try {
        const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery, ...countParams)
        total = Number(countResult[0]?.total || 0)
        countCache.set(cacheKey, { count: total, timestamp: Date.now() })
      } catch (countError) {
        console.error('Count query error:', countError)
        // Fallback: estimate from results
        total = adsResult.length < perPage ? adsResult.length : adsResult.length * 10
      }
    }

    // Transform results
    const ads = adsResult.map((ad: any, index: number) => {
      // Calculate active days
      const startDate = ad.start_date ? new Date(ad.start_date) : null
      const now = new Date()
      const activeDays = startDate ? Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

      return {
        id: Number(ad.id),
        adArchiveId: ad.ad_archive_id?.toString() || null,
        adCreativeId: ad.ad_creative_id?.toString() || null,
        pageId: ad.page_id?.toString() || null,
        pageName: ad.page_name || 'Unknown',
        shopId: ad.shop_id ? Number(ad.shop_id) : null,
        shopUrl: ad.shop_url || ad.target_url,
        shopName: ad.shop_name || ad.page_name || 'Unknown',
        shopCountry: ad.shop_country || null,
        shopActiveAds: ad.shop_active_ads || 0,
        shopScreenshot: ad.shop_screenshot || null,
        title: ad.title || '',
        body: ad.description || '',
        description: ad.description || '',
        mediaType: ad.type || (ad.video_link ? 'video' : 'image'),
        imageLink: ad.image_link || null,
        videoUrl: ad.video_link || null,
        videoPreview: ad.video_preview_link || null,
        targetUrl: ad.target_url || null,
        ctaText: ad.cta_text || null,
        startDate: ad.start_date,
        firstSeenDate: ad.start_date,
        endDate: ad.end_date,
        lastSeenDate: ad.end_date || ad.start_date,
        status: ad.is_active === 1 ? 'active' : 'inactive',
        isActive: ad.is_active === 1,
        platform: ad.platform || 'facebook',
        activeDays,
        adLibraryUrl: ad.ad_archive_id ? `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}` : null,
        isFavorited: ad.is_favorited || false,
        // Traffic data
        lastMonthVisits: ad.last_month_visits || 0,
        estimatedMonthly: ad.estimated_monthly || 0,
        growthRate: ad.growth_rate || 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: ads,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasMore: page * perPage < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch ads:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch ads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
