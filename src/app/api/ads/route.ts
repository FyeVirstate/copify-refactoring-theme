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
const COUNT_CACHE_TTL = 300000 // 5 minutes (exact count is expensive but stable)

export async function GET(request: NextRequest) {
  const timings: Record<string, number> = {}
  const requestStart = Date.now()
  
  console.log(`[Ads API] ========== REQUEST START ==========`)
  console.log(`[Ads API] Time: ${new Date().toISOString()}`)
  
  const authStart = Date.now()
  const session = await auth()
  timings.auth = Date.now() - authStart
  console.log(`[Ads API] Auth: ${timings.auth}ms`)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const parseStart = Date.now()
  const searchParams = request.nextUrl.searchParams
  
  // Parse query params
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100)
  const searchText = searchParams.get('search') || searchParams.get('query') || ''
  const sortBy = searchParams.get('sortBy') || 'recommended'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

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

  timings.parse = Date.now() - parseStart
  console.log(`[Ads API] Parse: ${timings.parse}ms`)
  console.log(`[Ads API] Filters: page=${page}, perPage=${perPage}, sortBy=${sortBy}, search=${searchText || 'none'}`)

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
    
    // Categories/Niche filter (via shop_categories join)
    if (categories.length > 0) {
      const categoryPlaceholders = categories.map((_, i) => `$${paramIndex + i}`).join(', ')
      shopsConditions.push(`EXISTS (
        SELECT 1 FROM category_shop cs 
        JOIN categories c ON cs.category_id = c.id 
        WHERE cs.shop_id = s.id 
        AND (c.id::text IN (${categoryPlaceholders}) OR c.parent_id::text IN (${categoryPlaceholders}))
      )`)
      params.push(...categories, ...categories)
      paramIndex += categories.length * 2
    }
    
    // Social Networks filter (social column in traffic table - JSONB)
    if (socialNetworks.length > 0) {
      const socialConditions = socialNetworks.map((_, i) => `t.social::text ILIKE $${paramIndex + i}`).join(' OR ')
      trafficConditions.push(`(${socialConditions})`)
      params.push(...socialNetworks.map(sn => `%${sn}%`))
      paramIndex += socialNetworks.length
    }
    
    // Trustpilot filters
    if (minTrustpilotRating !== null) {
      shopsConditions.push(`COALESCE(s.trustpilot_rating, 0) >= $${paramIndex}`)
      params.push(minTrustpilotRating)
      paramIndex++
    }
    if (maxTrustpilotRating !== null) {
      shopsConditions.push(`COALESCE(s.trustpilot_rating, 0) <= $${paramIndex}`)
      params.push(maxTrustpilotRating)
      paramIndex++
    }
    if (minTrustpilotReviews !== null) {
      shopsConditions.push(`COALESCE(s.trustpilot_reviews, 0) >= $${paramIndex}`)
      params.push(minTrustpilotReviews)
      paramIndex++
    }
    if (maxTrustpilotReviews !== null) {
      shopsConditions.push(`COALESCE(s.trustpilot_reviews, 0) <= $${paramIndex}`)
      params.push(maxTrustpilotReviews)
      paramIndex++
    }

    // Sort-specific filters for top_score
    if (sortBy === 'top_score') {
      // Top score requires shops with active advertising (minimum 5 ads)
      shopsConditions.push(`COALESCE(s.active_ads, 0) >= 5`)
      // ONLY active ads (is_active = 1)
      adsConditions.push(`a.is_active = 1`)
      // Minimum 10 days running - proven winners, not new untested ads
      adsConditions.push(`a.start_date <= NOW() - INTERVAL '10 days'`)
      // Not too old - still relevant (within 6 months)
      adsConditions.push(`a.start_date >= NOW() - INTERVAL '180 days'`)
    }

    // Build WHERE clauses
    const adsWhereClause = adsConditions.length > 0 ? `WHERE ${adsConditions.join(' AND ')}` : ''
    const shopsWhereClause = shopsConditions.length > 0 ? `AND ${shopsConditions.join(' AND ')}` : ''
    const trafficWhereClause = trafficConditions.length > 0 ? `AND ${trafficConditions.join(' AND ')}` : ''

    // Build ORDER BY clause
    const dailySeed = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const hourSeed = new Date().getHours()
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC'
    let orderByClause = ''
    // Only these sorts ACTUALLY need traffic data - recommended/trending use created_at, not traffic
    const needsTrafficJoin = ['highest_reach', 'most_engaging', 'highest_spend', 'last_month_visits', 'estimated_monthly', 'growth_rate', 'top_score'].includes(sortBy)
    
    switch (sortBy) {
      case 'most_recent':
      case 'lastSeenDate':
      case 'start_date':
        orderByClause = `ORDER BY fa.start_date ${order} NULLS LAST, fa.id ${order}`
        break
      case 'oldest_first':
      case 'firstSeenDate':
        orderByClause = 'ORDER BY fa.start_date ASC NULLS LAST, fa.id ASC'
        break
      case 'highest_reach':
      case 'last_month_visits':
        orderByClause = `ORDER BY fa.last_month_visits ${order} NULLS LAST`
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
        ) ${order} NULLS LAST`
        break
      case 'highest_spend':
      case 'estimated_monthly':
        orderByClause = `ORDER BY fa.estimated_monthly ${order} NULLS LAST`
        break
      case 'growth_rate':
        orderByClause = `ORDER BY fa.growth_rate ${order} NULLS LAST`
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
        ) ${order} NULLS LAST`
        break
      case 'top_score':
        // Custom AI Score algorithm for winning ads
        // 1. Winner signals: active_ads (log), estimated_order (log), growth_rate
        // 2. Freshness: how recently the ad was seen
        // 3. Stability: ads running for ~14 days = winner pattern
        // 4. Random factor for rotation
        orderByClause = `ORDER BY (
          -- 1) Winner signals (log scale to avoid outliers dominating)
          LN(1 + COALESCE(fa.shop_active_ads, 0)) * 0.28
          + LN(1 + COALESCE(fa.estimated_order, 0)) * 0.22
          + COALESCE(fa.growth_rate, 0) * 0.15
          
          -- 2) Freshness bonus (more recent = better)
          + LEAST(
              0.18,
              0.18 * EXP(- (EXTRACT(EPOCH FROM (NOW() - COALESCE(fa.end_date, fa.start_date, NOW()))) / 86400.0) / 4.0)
            )
          
          -- 3) Stability bonus: ads running ~14 days = winner-like pattern
          + (
              EXP(
                -POWER(
                  (
                    (EXTRACT(EPOCH FROM (NOW() - fa.start_date)) / 86400.0) - 14.0
                  ) / 10.0,
                  2
                )
              ) * 0.20
            )
          
          -- 4) Traffic growth bonus (if available)
          + GREATEST(COALESCE(fa.growth_rate, 0), 0) * 0.12
          
          -- 5) Random factor for rotation (low weight)
          + (MOD(ABS(HASHTEXT(COALESCE(fa.ad_archive_id::text, fa.id::text) || '${dailySeed}' || '${hourSeed}')), 1000) / 1000.0) * 0.05
        ) ${order} NULLS LAST`
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
        ) ${order} NULLS LAST`
        break
    }

    const offset = (page - 1) * perPage

    // Path selection logic:
    // 1. FAST PATH: No filters, recommended/trending sort - pure index scan
    // 2. MEDIUM PATH: Shop filters only (language, country, etc) - join shops but NOT traffic
    // 3. SLOW PATH: Traffic filters needed - full joins with traffic table
    
    const canUseFastPath = shopsConditions.length === 0 && 
                           trafficConditions.length === 0 &&
                           (sortBy === 'recommended' || sortBy === 'trending')
    
    const canUseMediumPath = !canUseFastPath && 
                              trafficConditions.length === 0 && 
                              !needsTrafficJoin
    
    const requiresTrafficData = !canUseFastPath && !canUseMediumPath
    
    console.log(`[Ads API] Path check: fastPath=${canUseFastPath}, mediumPath=${canUseMediumPath}, slowPath=${requiresTrafficData}, shopsConditions=${shopsConditions.length}, sortBy=${sortBy}`)

    // Build optimized main query
    // Key optimization: Use materialized view when possible
    let mainQuery: string
    
    if (canUseFastPath) {
      // FAST PATH: Pure index scan + JS filtering (like Laravel)
      console.log(`[Ads API] Using FAST PATH: Index scan + JS dedup/filter`)
      
      // Fetch MORE to ensure enough unique shops after deduplication
      // With ~12-16 ads per shop average, need perPage*15 to get perPage unique shops
      const extendedLimit = perPage * 15
      const extendedOffset = (page - 1) * extendedLimit  // CRITICAL: Use extended offset!
      
      // Ultra-simple query using created_at DESC index
      mainQuery = `
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
          0 as last_month_visits,
          0 as estimated_monthly,
          0 as growth_rate,
          CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
        FROM ads a
        LEFT JOIN shops s ON a.shop_id = s.id AND s.deleted_at IS NULL
        LEFT JOIN favorites f ON f.ad_id = a.id AND f.user_id = $2
        ORDER BY a.created_at DESC
        LIMIT ${extendedLimit}
        OFFSET $1
      `
      
      // Use EXTENDED offset for proper pagination!
      const fastParams = [extendedOffset, parseInt(session.user.id)]
      
      console.log(`\n========== [Ads API] FAST PATH - PAGE ${page} DEBUG ==========`)
      console.log(`[Ads API] perPage=${perPage}, extendedLimit=${extendedLimit}, extendedOffset=${extendedOffset}`)
      
      // Execute query
      const mainQueryStart = Date.now()
      const rawAdsResult = await prisma.$queryRawUnsafe<any[]>(mainQuery, ...fastParams)
      timings.mainQuery = Date.now() - mainQueryStart
      
      // DEBUG: Log raw results
      const rawAdIds = rawAdsResult.slice(0, 10).map(a => Number(a.id))
      const rawShopIds = rawAdsResult.slice(0, 10).map(a => Number(a.shop_id))
      console.log(`[Ads API] Main Query: ${timings.mainQuery}ms - ${rawAdsResult.length} raw results`)
      console.log(`[Ads API] First 10 raw ad IDs: ${JSON.stringify(rawAdIds)}`)
      console.log(`[Ads API] First 10 raw shop IDs: ${JSON.stringify(rawShopIds)}`)
      
      // Filter broken media + Deduplicate: 1 ad per shop (like Laravel)
      const dedupeStart = Date.now()
      const seenShops = new Set<number>()
      const adsResult: any[] = []
      const validAds: any[] = []
      
      // First pass: filter broken media
      for (const ad of rawAdsResult) {
        const imageLink = ad.image_link || ''
        const videoLink = ad.video_link || ''
        if (imageLink.includes('copyfycloudinary') || videoLink.includes('copyfycloudinary')) {
          continue
        }
        if (!imageLink && !videoLink) {
          continue
        }
        validAds.push(ad)
      }
      
      // Second pass: deduplicate (1 ad per shop)
      for (const ad of validAds) {
        const shopId = ad.shop_id ? Number(ad.shop_id) : 0
        if (!seenShops.has(shopId)) {
          adsResult.push(ad)
          seenShops.add(shopId)
          if (adsResult.length >= perPage) break
        }
      }
      
      // DEBUG: Log final results
      const finalAdIds = adsResult.map(a => Number(a.id))
      const finalShopIds = adsResult.map(a => Number(a.shop_id))
      console.log(`[Ads API] After filter+dedup: ${adsResult.length} unique shops from ${validAds.length} valid`)
      console.log(`[Ads API] Final ad IDs: ${JSON.stringify(finalAdIds)}`)
      console.log(`[Ads API] Final shop IDs: ${JSON.stringify(finalShopIds)}`)
      console.log(`========== [Ads API] END FAST PATH PAGE ${page} ==========\n`)
      
      // Skip the normal query execution since we already did it
      // Jump to count query
      const countStart = Date.now()
      const cacheKey = 'fast-path-no-filters' // Fast path has no filters
      const cached = countCache.get(cacheKey)
      let total: number
      
      if (cached && Date.now() - cached.timestamp < COUNT_CACHE_TTL) {
        total = cached.count
        timings.countQuery = 0
        console.log(`[Ads API] Count from cache: ${total}`)
      } else {
        // Use EXACT count (cached for 1 minute) - estimate can be off by thousands
        const countQuery = `SELECT COUNT(*) as total FROM ads`
        const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery)
        total = Number(countResult[0]?.total || 7000000)
        timings.countQuery = Date.now() - countStart
        console.log(`[Ads API] Count Query (exact): ${timings.countQuery}ms - Total: ${total}`)
        countCache.set(cacheKey, { count: total, timestamp: Date.now() })
      }
      
      // Transform results
      const ads = adsResult.map((ad: any, index: number) => {
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
          shopActiveAds: Number(ad.shop_active_ads) || 0,
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
          endDate: ad.end_date,
          isActive: ad.is_active === 1,
          platform: ad.platform || 'facebook',
          createdAt: ad.created_at,
          activeDays,
          adLibraryUrl: ad.ad_archive_id ? `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}` : null,
          isFavorited: ad.is_favorited || false,
          lastMonthVisits: Number(ad.last_month_visits) || 0,
          estimatedMonthly: Number(ad.estimated_monthly) || 0,
          growthRate: Number(ad.growth_rate) || 0,
        }
      })

      timings.total = Date.now() - requestStart
      console.log(`[Ads API] ========== TIMING SUMMARY ==========`)
      console.log(`[Ads API] Auth: ${timings.auth}ms`)
      console.log(`[Ads API] Parse: ${timings.parse}ms`)
      console.log(`[Ads API] Main Query: ${timings.mainQuery}ms`)
      console.log(`[Ads API] Count Query: ${timings.countQuery}ms`)
      console.log(`[Ads API] TOTAL: ${timings.total}ms (${(timings.total/1000).toFixed(2)}s)`)
      console.log(`[Ads API] ========== REQUEST END ==========`)

      const totalPages = Math.ceil(total / perPage)
      
      const response = NextResponse.json({
        success: true,
        data: ads,
        pagination: {
          page,
          perPage,
          total,
          totalPages,
          hasMore: page < totalPages
        },
        _timings: {
          totalMs: timings.total,
          totalSec: (timings.total/1000).toFixed(2)
        }
      })
      
      response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
      return response
    }
    
    if (canUseMediumPath) {
      // MEDIUM PATH: Shop filters - SIMPLE SQL + PHP DEDUP (like Laravel)
      console.log(`[Ads API] Using MEDIUM PATH: simple SQL + PHP dedup (Laravel style)`)
      
      const shopsWhereClause = shopsConditions.length > 0 ? 'AND ' + shopsConditions.join(' AND ') : ''
      const mediaFilter = `a.image_link NOT LIKE '%copyfycloudinary%' AND (a.image_link IS NOT NULL AND a.image_link != '' OR a.video_link IS NOT NULL AND a.video_link != '')`
      const mediumWhereClause = adsConditions.length > 0 
        ? `WHERE ${adsConditions.join(' AND ')} AND ${mediaFilter}`
        : `WHERE ${mediaFilter}`
      
      // Fetch MORE to ensure enough unique shops after deduplication
      // With filters, shops may have many ads, so fetch perPage*10
      const extendedPerPage = perPage * 10
      const extendedOffset = (page - 1) * extendedPerPage
      
      mainQuery = `
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
          0 as last_month_visits,
          0 as estimated_monthly,
          0 as growth_rate,
          CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
        FROM ads a
        INNER JOIN shops s ON a.shop_id = s.id AND s.deleted_at IS NULL ${shopsWhereClause}
        LEFT JOIN favorites f ON f.ad_id = a.id AND f.user_id = $${paramIndex}
        ${mediumWhereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramIndex + 1}
        OFFSET $${paramIndex + 2}
      `
      
      params.push(parseInt(session.user.id))
      params.push(extendedPerPage)
      params.push(extendedOffset)
      
      console.log(`\n========== [Ads API] MEDIUM PATH - PAGE ${page} DEBUG ==========`)
      console.log(`[Ads API] perPage=${perPage}, extendedPerPage=${extendedPerPage}, extendedOffset=${extendedOffset}`)
      
      // Execute query
      const mainQueryStart = Date.now()
      const rawAdsResult = await prisma.$queryRawUnsafe<any[]>(mainQuery, ...params)
      timings.mainQuery = Date.now() - mainQueryStart
      
      // DEBUG: Log raw results
      const rawAdIds = rawAdsResult.slice(0, 10).map(a => Number(a.id))
      const rawShopIds = rawAdsResult.slice(0, 10).map(a => Number(a.shop_id))
      console.log(`[Ads API] Main Query: ${timings.mainQuery}ms - ${rawAdsResult.length} raw results`)
      console.log(`[Ads API] First 10 raw ad IDs: ${JSON.stringify(rawAdIds)}`)
      console.log(`[Ads API] First 10 raw shop IDs: ${JSON.stringify(rawShopIds)}`)
      
      // PHP-style deduplication: 1 ad per shop
      const seenShops = new Set<number>()
      const adsResult: any[] = []
      for (const ad of rawAdsResult) {
        const shopId = ad.shop_id ? Number(ad.shop_id) : 0
        if (!seenShops.has(shopId)) {
          adsResult.push(ad)
          seenShops.add(shopId)
          if (adsResult.length >= perPage) break
        }
      }
      
      // DEBUG: Log final results
      const finalAdIds = adsResult.map(a => Number(a.id))
      const finalShopIds = adsResult.map(a => Number(a.shop_id))
      console.log(`[Ads API] After dedup: ${adsResult.length} unique shops`)
      console.log(`[Ads API] Final ad IDs: ${JSON.stringify(finalAdIds)}`)
      console.log(`[Ads API] Final shop IDs: ${JSON.stringify(finalShopIds)}`)
      console.log(`========== [Ads API] END MEDIUM PATH PAGE ${page} ==========\n`)
      
      // Use ESTIMATED count (like Laravel) - not exact
      const countStart = Date.now()
      let total: number
      const countCacheKey = `medium-estimate`
      const cached = countCache.get(countCacheKey)
      
      if (cached && Date.now() - cached.timestamp < COUNT_CACHE_TTL) {
        total = cached.count
        timings.countQuery = 0
        console.log(`[Ads API] Count from cache: ${total}`)
      } else {
        // Use pg_class estimate like Laravel
        const countQuery = `SELECT COALESCE((SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'ads'), 6800000) as total`
        const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery)
        total = Number(countResult[0]?.total || 6800000)
        timings.countQuery = Date.now() - countStart
        console.log(`[Ads API] Count Query (estimated): ${timings.countQuery}ms - Total: ${total}`)
        countCache.set(countCacheKey, { count: total, timestamp: Date.now() })
      }
      
      // Transform results
      const ads = adsResult.map((ad: any) => {
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
          shopActiveAds: Number(ad.shop_active_ads) || 0,
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
          endDate: ad.end_date,
          isActive: ad.is_active === 1,
          platform: ad.platform || 'facebook',
          createdAt: ad.created_at,
          activeDays,
          adLibraryUrl: ad.ad_archive_id ? `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}` : null,
          isFavorited: ad.is_favorited || false,
          lastMonthVisits: 0,
          estimatedMonthly: 0,
          growthRate: 0,
        }
      })

      timings.total = Date.now() - requestStart
      console.log(`[Ads API] ========== TIMING SUMMARY ==========`)
      console.log(`[Ads API] Auth: ${timings.auth}ms`)
      console.log(`[Ads API] Parse: ${timings.parse}ms`)
      console.log(`[Ads API] Main Query: ${timings.mainQuery}ms`)
      console.log(`[Ads API] Count Query: ${timings.countQuery}ms`)
      console.log(`[Ads API] TOTAL: ${timings.total}ms (${(timings.total/1000).toFixed(2)}s)`)
      console.log(`[Ads API] ========== REQUEST END ==========`)

      const totalPages = Math.ceil(total / perPage)
      
      const response = NextResponse.json({
        success: true,
        data: ads,
        pagination: {
          page,
          perPage,
          total,
          totalPages,
          hasMore: page < totalPages
        },
        _timings: {
          totalMs: timings.total,
          totalSec: (timings.total/1000).toFixed(2)
        }
      })
      
      response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
      return response
    }
    
    if (requiresTrafficData) {
      // SLOW PATH: Traffic join - SIMPLE SQL + PHP DEDUP (like Laravel)
      console.log(`[Ads API] Using SLOW PATH: simple SQL + PHP dedup (Laravel style)`)
      
      const mediaFilter = `a.image_link NOT LIKE '%copyfycloudinary%' AND (a.image_link IS NOT NULL AND a.image_link != '' OR a.video_link IS NOT NULL AND a.video_link != '')`
      const allSlowConditions = [...adsConditions, ...shopsConditions, ...trafficConditions, mediaFilter]
      const slowWhere = `WHERE ${allSlowConditions.join(' AND ')}`
      
      // Fetch MORE to ensure enough unique shops after deduplication
      const extendedPerPage = perPage * 10
      const extendedOffset = (page - 1) * extendedPerPage
      
      // Build custom ORDER BY for top_score, otherwise use created_at
      let slowOrderBy = 'ORDER BY a.created_at DESC'
      if (sortBy === 'top_score') {
        slowOrderBy = `ORDER BY (
          -- 1) Winner signals (log scale to avoid outliers dominating)
          LN(1 + COALESCE(s.active_ads, 0)) * 0.28
          + LN(1 + COALESCE(t.estimated_order, 0)) * 0.22
          + COALESCE(t.growth_rate, 0) * 0.15
          
          -- 2) Freshness bonus (more recent = better)
          + LEAST(
              0.18,
              0.18 * EXP(- (EXTRACT(EPOCH FROM (NOW() - COALESCE(a.end_date, a.start_date, NOW()))) / 86400.0) / 4.0)
            )
          
          -- 3) Stability bonus: ads running ~14 days = winner-like pattern
          + (
              EXP(
                -POWER(
                  (
                    (EXTRACT(EPOCH FROM (NOW() - a.start_date)) / 86400.0) - 14.0
                  ) / 10.0,
                  2
                )
              ) * 0.20
            )
          
          -- 4) Traffic growth bonus (if available)
          + GREATEST(COALESCE(t.growth_rate, 0), 0) * 0.12
          
          -- 5) Random factor for rotation (low weight)
          + (MOD(ABS(HASHTEXT(COALESCE(a.ad_archive_id::text, a.id::text) || '${dailySeed}' || '${hourSeed}')), 1000) / 1000.0) * 0.05
        ) DESC NULLS LAST`
      }
      
      mainQuery = `
        WITH latest_traffic AS (
          SELECT DISTINCT ON (shop_id) 
            shop_id,
            last_month_visits,
            estimated_monthly,
            estimated_order,
            growth_rate,
            social
          FROM traffic
          ORDER BY shop_id, created_at DESC
        )
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
          COALESCE(t.growth_rate, 0) as growth_rate,
          CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
        FROM ads a
        LEFT JOIN shops s ON a.shop_id = s.id AND s.deleted_at IS NULL
        LEFT JOIN latest_traffic t ON t.shop_id = a.shop_id
        LEFT JOIN favorites f ON f.ad_id = a.id AND f.user_id = $${paramIndex + 2}
        ${slowWhere}
        ${slowOrderBy}
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      `
      
      params.push(extendedPerPage)
      params.push(extendedOffset)
      params.push(parseInt(session.user.id))
    } else {
      // ELSE PATH: Simple filtered query + PHP DEDUP (like Laravel)
      console.log(`[Ads API] Using ELSE PATH: simple SQL + PHP dedup (Laravel style)`)
      
      const mediaFilter = `a.image_link NOT LIKE '%copyfycloudinary%' AND (a.image_link IS NOT NULL AND a.image_link != '' OR a.video_link IS NOT NULL AND a.video_link != '')`
      const allConditions = [...adsConditions, ...shopsConditions, mediaFilter]
      const combinedWhere = `WHERE ${allConditions.join(' AND ')}`
      
      // Fetch MORE to ensure enough unique shops after deduplication
      const extendedPerPage = perPage * 10
      const extendedOffset = (page - 1) * extendedPerPage
      
      mainQuery = `
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
          0 as last_month_visits,
          0 as estimated_monthly,
          0 as growth_rate,
          CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
        FROM ads a
        LEFT JOIN shops s ON a.shop_id = s.id AND s.deleted_at IS NULL
        LEFT JOIN favorites f ON f.ad_id = a.id AND f.user_id = $${paramIndex + 2}
        ${combinedWhere}
        ORDER BY a.created_at DESC
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      `
      
      params.push(extendedPerPage)
      params.push(extendedOffset)
      params.push(parseInt(session.user.id))
    }

    // Execute main query
    const mainQueryStart = Date.now()
    const extendedPerPageUsed = perPage * 10
    const extendedOffsetUsed = (page - 1) * extendedPerPageUsed
    
    console.log(`\n========== [Ads API] SLOW/ELSE PATH - PAGE ${page} DEBUG ==========`)
    console.log(`[Ads API] perPage=${perPage}, extendedPerPage=${extendedPerPageUsed}, extendedOffset=${extendedOffsetUsed}`)
    console.log(`[Ads API] params length: ${params.length}`)
    
    const rawAdsResult = await prisma.$queryRawUnsafe<any[]>(mainQuery, ...params)
    timings.mainQuery = Date.now() - mainQueryStart
    
    // DEBUG: Log raw ad IDs and shop IDs
    const rawAdIds = rawAdsResult.slice(0, 10).map(a => Number(a.id))
    const rawShopIds = rawAdsResult.slice(0, 10).map(a => Number(a.shop_id))
    console.log(`[Ads API] Main Query: ${timings.mainQuery}ms - ${rawAdsResult.length} raw results`)
    console.log(`[Ads API] First 10 raw ad IDs: ${JSON.stringify(rawAdIds)}`)
    console.log(`[Ads API] First 10 raw shop IDs: ${JSON.stringify(rawShopIds)}`)

    // PHP-style deduplication: 1 ad per shop (like Laravel)
    // + Additional filtering for top_score
    const seenShops = new Set<number>()
    const adsResult: any[] = []
    const now = new Date()
    
    for (const ad of rawAdsResult) {
      const shopId = ad.shop_id ? Number(ad.shop_id) : 0
      
      // For top_score, apply strict JavaScript filtering as safety net
      if (sortBy === 'top_score') {
        // Must be active
        if (ad.is_active !== 1) continue
        
        // Must have start_date
        if (!ad.start_date) continue
        
        // Calculate days active
        const startDate = new Date(ad.start_date)
        const daysActive = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Must be at least 10 days old
        if (daysActive < 10) continue
        
        // Shop must have at least 5 active ads
        if (!ad.shop_active_ads || ad.shop_active_ads < 5) continue
      }
      
      if (!seenShops.has(shopId)) {
        adsResult.push(ad)
        seenShops.add(shopId)
        if (adsResult.length >= perPage) break
      }
    }
    
    // DEBUG: Log final ad IDs and shop IDs after dedup
    const finalAdIds = adsResult.map(a => Number(a.id))
    const finalShopIds = adsResult.map(a => Number(a.shop_id))
    console.log(`[Ads API] After dedup: ${adsResult.length} unique shops`)
    console.log(`[Ads API] Final ad IDs: ${JSON.stringify(finalAdIds)}`)
    console.log(`[Ads API] Final shop IDs: ${JSON.stringify(finalShopIds)}`)
    console.log(`========== [Ads API] END PAGE ${page} ==========\n`)

    // Use ESTIMATED count (like Laravel) - ALWAYS use pg_class estimate
    const countStart = Date.now()
    const cacheKey = `estimate-all`
    const cached = countCache.get(cacheKey)
    let total: number
    
    if (cached && Date.now() - cached.timestamp < COUNT_CACHE_TTL) {
      total = cached.count
      timings.countQuery = 0
      console.log(`[Ads API] Count from cache: ${total}`)
    } else {
      // Use pg_class estimate like Laravel - FAST!
      const countQuery = `SELECT COALESCE((SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'ads'), 6800000) as total`
      
      try {
        const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery)
        total = Number(countResult[0]?.total || 6800000)
        timings.countQuery = Date.now() - countStart
        console.log(`[Ads API] Count (estimated): ${timings.countQuery}ms - Total: ${total}`)
        countCache.set(cacheKey, { count: total, timestamp: Date.now() })
      } catch (countError) {
        console.error('[Ads API] Count query error:', countError)
        timings.countQuery = Date.now() - countStart
        total = 6800000 // Fallback estimate
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

    timings.total = Date.now() - requestStart
    console.log(`[Ads API] ========== TIMING SUMMARY ==========`)
    console.log(`[Ads API] Auth: ${timings.auth}ms`)
    console.log(`[Ads API] Parse: ${timings.parse}ms`)
    console.log(`[Ads API] Main Query: ${timings.mainQuery}ms`)
    console.log(`[Ads API] Count Query: ${timings.countQuery}ms`)
    console.log(`[Ads API] TOTAL: ${timings.total}ms (${(timings.total/1000).toFixed(2)}s)`)
    console.log(`[Ads API] ========== REQUEST END ==========`)

    const response = NextResponse.json({
      success: true,
      data: ads,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasMore: page * perPage < total
      },
      _timings: {
        totalMs: timings.total,
        totalSec: (timings.total/1000).toFixed(2)
      }
    })
    
    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    
    return response
  } catch (error) {
    console.error('[Ads API] ========== REQUEST FAILED ==========')
    console.error('[Ads API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
