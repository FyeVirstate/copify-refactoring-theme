/**
 * Shop Tracking Detail API Route
 * Migrated from Laravel DashboardController::detailsShop
 * 
 * GET /api/track/[id] - Get tracked shop details with revenue
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

type CategoryName = {
  en?: string
  fr?: string
  [key: string]: string | undefined
}

interface TrafficSource {
  name?: string
  Name?: string  // Legacy format
  visitsShare?: number
  Value?: number  // Legacy format
  icon?: string | null
}

interface CountryData {
  CountryCode?: string
  Name?: string  // Legacy format
  Value?: number
  countryUrlCode?: string
  visitsShareChange?: number
}

// GET - Get tracked shop details
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)
  const { id } = await params
  const shopId = BigInt(id)

  try {
    // Verify user has access to this shop
    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
      }
    })

    if (!userShop) {
      return NextResponse.json({
        success: false,
        error: 'Shop not found in your tracking list'
      }, { status: 404 })
    }

    // Get shop with all details
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        products: {
          take: 50,
          orderBy: [
            { bestProduct: 'desc' },
            { createdAt: 'desc' }
          ],
          include: {
            variants: { take: 1 },
            images: { take: 1 },
          }
        },
        categories: {
          include: {
            category: true
          }
        },
      }
    })

    if (!shop) {
      return NextResponse.json({
        success: false,
        error: 'Shop not found'
      }, { status: 404 })
    }

    // Fetch ALL ads - by shopId OR by pageId (Facebook page)
    // This ensures we get all ads even if they're linked differently
    const allAdsConditions: any[] = [{ shopId }]
    
    // Also fetch by Facebook page ID if available
    if (shop.fbPageId) {
      allAdsConditions.push({ pageId: BigInt(shop.fbPageId) })
    }

    const ads = await prisma.ad.findMany({
      where: {
        OR: allAdsConditions
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch ads history for the evolution chart (last 12 months)
    // Using raw query since shopAdsHistory model may not be generated yet
    const adsHistory = await prisma.$queryRaw<Array<{
      id: bigint;
      shop_id: bigint;
      active_ads_count: number;
      all_ads_count: number;
      created_at: Date | null;
    }>>`
      SELECT id, shop_id, active_ads_count, all_ads_count, created_at 
      FROM shops_ads_active_history 
      WHERE shop_id = ${shopId}
      ORDER BY created_at ASC
      LIMIT 365
    `

    // Group ads history by day and get max values per day (like Laravel)
    const adsHistoryByDay = new Map<string, { allAds: number; activeAds: number }>()
    for (const record of adsHistory) {
      const dateKey = record.created_at 
        ? new Date(record.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
        : 'Unknown'
      const existing = adsHistoryByDay.get(dateKey)
      if (!existing || record.all_ads_count > existing.allAds) {
        adsHistoryByDay.set(dateKey, {
          allAds: record.all_ads_count,
          activeAds: record.active_ads_count,
        })
      }
    }

    // Convert to arrays for chart
    const adsChartLabels = Array.from(adsHistoryByDay.keys())
    const adsChartAllAds = Array.from(adsHistoryByDay.values()).map(v => v.allAds)
    const adsChartActiveAds = Array.from(adsHistoryByDay.values()).map(v => v.activeAds)

    // Calculate ads growth percentages
    const latestAdsCount = adsChartAllAds[adsChartAllAds.length - 1] || 0
    const oneMonthAgoIndex = Math.max(0, adsChartAllAds.length - 30)
    const threeMonthsAgoIndex = Math.max(0, adsChartAllAds.length - 90)
    const oneMonthAgoAds = adsChartAllAds[oneMonthAgoIndex] || latestAdsCount
    const threeMonthsAgoAds = adsChartAllAds[threeMonthsAgoIndex] || latestAdsCount

    const adsLastMonthGrowth = oneMonthAgoAds > 0 
      ? ((latestAdsCount - oneMonthAgoAds) / oneMonthAgoAds) * 100 
      : 0
    const adsThreeMonthGrowth = threeMonthsAgoAds > 0
      ? ((latestAdsCount - threeMonthsAgoAds) / threeMonthsAgoAds) * 100
      : 0

    // Get traffic data separately
    const traffic = await prisma.traffic.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'desc' }
    })

    // Parse traffic visits and dates (stored as comma-separated strings)
    let visitsList: number[] = []
    let datesList: string[] = []
    if (traffic?.visits) {
      visitsList = traffic.visits.split(',').map((v: string) => parseInt(v.trim()) || 0)
    }
    if (traffic?.dates) {
      datesList = traffic.dates.split(',').map((d: string) => d.trim())
    }

    // Build chart data from visits and dates
    const chartData = visitsList.slice(0, 12).map((visits, index) => ({
      date: datesList[index] || `Month ${index + 1}`,
      visits: visits,
    })).reverse() // Reverse to show oldest first in chart

    // Calculate metrics from traffic data
    const currentMonthVisits = visitsList[0] || 0
    const lastMonthVisits = visitsList[1] || 0
    const twoMonthsAgoVisits = visitsList[2] || 0
    
    // Growth calculations
    const lastMonthGrowth = lastMonthVisits > 0 
      ? ((currentMonthVisits - lastMonthVisits) / lastMonthVisits) * 100 
      : 0
    const threeMonthGrowth = twoMonthsAgoVisits > 0
      ? ((currentMonthVisits - twoMonthsAgoVisits) / twoMonthsAgoVisits) * 100
      : 0

    // Parse JSON fields from traffic
    let sources: TrafficSource[] = []
    let countries: CountryData[] = []
    let social: TrafficSource[] = []
    
    try {
      if (traffic?.sources) {
        const sourcesData = typeof traffic.sources === 'string' 
          ? JSON.parse(traffic.sources) 
          : traffic.sources
        sources = Array.isArray(sourcesData) ? sourcesData : []
      }
    } catch { sources = [] }
    
    try {
      if (traffic?.countries) {
        const countriesData = typeof traffic.countries === 'string' 
          ? JSON.parse(traffic.countries) 
          : traffic.countries
        countries = Array.isArray(countriesData) ? countriesData : []
      }
    } catch { countries = [] }
    
    try {
      if (traffic?.social) {
        const socialData = typeof traffic.social === 'string' 
          ? JSON.parse(traffic.social) 
          : traffic.social
        
        // Handle Laravel format: { data: { Facebook: { Share: 0.726 }, ... } }
        if (socialData && typeof socialData === 'object' && 'data' in socialData) {
          const platformData = socialData.data as Record<string, { Share?: number; Favicon?: string }>
          social = Object.entries(platformData)
            .filter(([, data]) => data?.Share !== undefined && data.Share > 0)
            .map(([platform, data]) => ({
              name: platform,
              Name: platform,
              visitsShare: data.Share || 0,
              Value: data.Share || 0,
              icon: data.Favicon || null,
            }))
            .sort((a, b) => (b.visitsShare || 0) - (a.visitsShare || 0))
        } else if (Array.isArray(socialData)) {
          social = socialData
        }
      }
    } catch { social = [] }

    // Parse shop theme data (fonts, colors, apps, pixels)
    let fonts: string[] = []
    let colors: string[] = []
    let apps: string[] = []
    let pixels: string[] = []
    
    try {
      if (shop.fonts) {
        const fontsData = JSON.parse(shop.fonts)
        fonts = Array.isArray(fontsData) ? fontsData : [fontsData]
      }
    } catch { 
      if (shop.fonts) fonts = [shop.fonts]
    }
    
    try {
      if (shop.colors) {
        const colorsData = JSON.parse(shop.colors)
        colors = Array.isArray(colorsData) ? colorsData : Object.values(colorsData)
      }
    } catch {
      if (shop.colors) colors = shop.colors.split(',').map(c => c.trim())
    }
    
    // Parse apps as full objects with name, icon, link
    let appsWithIcons: Array<{ name: string; icon: string | null; link: string | null }> = []
    try {
      if (shop.apps) {
        const appsData = JSON.parse(shop.apps)
        if (Array.isArray(appsData)) {
          appsWithIcons = appsData.map(app => {
            if (typeof app === 'object' && app !== null) {
              return {
                name: String(app.name || 'App'),
                icon: app.icon ? String(app.icon).replace(/\\\//g, '/') : null,
                link: app.link ? String(app.link) : null
              }
            }
            return { name: String(app), icon: null, link: null }
          })
          apps = appsWithIcons.map(a => a.name)
        } else if (typeof appsData === 'object' && appsData !== null) {
          apps = Object.values(appsData).map(v => String(v))
          appsWithIcons = apps.map(name => ({ name, icon: null, link: null }))
        } else {
          apps = [String(appsData)]
          appsWithIcons = apps.map(name => ({ name, icon: null, link: null }))
        }
      }
    } catch {
      if (shop.apps) {
        apps = shop.apps.split(',').map(a => a.trim())
        appsWithIcons = apps.map(name => ({ name, icon: null, link: null }))
      }
    }
    
    try {
      if (shop.pixels) {
        const pixelsData = JSON.parse(shop.pixels)
        pixels = Array.isArray(pixelsData) ? pixelsData : Object.keys(pixelsData)
      }
    } catch {
      if (shop.pixels) pixels = shop.pixels.split(',').map(p => p.trim())
    }

    // Get category name
    const shopCategory = shop.categories[0]?.category
    const categoryNameObj = shopCategory?.name as CategoryName | null
    const categoryName = categoryNameObj?.en || categoryNameObj?.fr || null

    // Calculate estimated revenue from traffic data
    const avgPrice = traffic?.avgPrice ? Number(traffic.avgPrice) : 30 // Default avg price
    const conversionRate = 0.02 // 2% typical conversion rate
    const estimatedDailyRevenue = (currentMonthVisits / 30) * conversionRate * avgPrice
    const estimatedMonthlyRevenue = traffic?.estimatedMonthly || (currentMonthVisits * conversionRate * avgPrice)
    const estimatedMonthlyOrders = traffic?.estimatedOrder || Math.round(currentMonthVisits * conversionRate)

    // Active vs inactive ads (isActive: 1 = active, 0 = inactive)
    // Now using ALL ads fetched (by shopId OR pageId)
    const activeAdsCount = ads.filter(ad => ad.isActive === 1).length
    const inactiveAdsCount = ads.length - activeAdsCount

    // Calculate ad type breakdown
    const videoAds = ads.filter(ad => ad.type === 'video').length
    const imageAds = ads.filter(ad => ad.type === 'image').length

    // Get suggested shops - shops in same category or with similar traffic
    const categoryId = shop.categories[0]?.categoryId
    let suggestedShops: Array<{
      id: number
      url: string
      name: string | null
      screenshot: string | null
      locale: string | null
      country: string | null
      currency: string | null
      activeAds: number | null
      monthlyRevenue: number
      trend: number
    }> = []

    if (categoryId) {
      const similarShops = await prisma.shop.findMany({
        where: {
          categories: {
            some: { categoryId }
          },
          id: { not: shopId },
          disabled: 0,
        },
        take: 5,
        orderBy: { productsCount: 'desc' },
        select: {
          id: true,
          url: true,
          merchantName: true,
          screenshot: true,
          locale: true,
          country: true,
          currency: true,
          activeAds: true,
          shopifyUrl: true,
        }
      })

      // Get traffic data for suggested shops
      for (const s of similarShops) {
        const sTraffic = await prisma.traffic.findFirst({
          where: { shopId: s.id },
          orderBy: { createdAt: 'desc' },
          select: { estimatedMonthly: true, trend: true }
        })
        
        suggestedShops.push({
          id: Number(s.id),
          url: s.url || '',
          name: s.merchantName || s.url?.replace('www.', '') || '',
          screenshot: s.screenshot,
          locale: s.locale,
          country: s.country,
          currency: s.currency,
          activeAds: s.activeAds,
          monthlyRevenue: sTraffic?.estimatedMonthly ? Number(sTraffic.estimatedMonthly) : 0,
          trend: sTraffic?.trend || 0,
        })
      }
    }

    // Extract domain for ad links (e.g., "cakesbody.com" from "www.cakesbody.com")
    const shopDomain = shop.url?.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').replace(/\/.*$/, '') || ''

    return NextResponse.json({
      success: true,
      data: {
        shop: {
          id: Number(shop.id),
          url: shop.url,
          shopifyUrl: shop.shopifyUrl,
          name: shop.merchantName || shop.url?.replace('www.', ''),
          country: shop.country,
          locale: shop.locale,
          currency: shop.currency,
          productsCount: shop.productsCount,
          theme: shop.theme,
          schemaName: shop.schemaName,
          schemaVersion: shop.schemaVersion,
          screenshot: shop.screenshot,
          category: categoryName,
          fonts,
          colors,
          apps: appsWithIcons,
          pixels,
          createdAt: shop.createdAt,
          whoisAt: shop.whoisAt, // Launch date from WHOIS
          fbPageId: shop.fbPageId,
        },
        metrics: {
          dailyRevenue: Math.round(estimatedDailyRevenue),
          monthlyRevenue: Math.round(estimatedMonthlyRevenue),
          monthlyOrders: estimatedMonthlyOrders,
          monthlyVisits: currentMonthVisits,
          lastMonthVisits: lastMonthVisits,
          visitsGrowth: lastMonthGrowth.toFixed(0),
          threeMonthGrowth: threeMonthGrowth.toFixed(0),
          activeAds: shop.activeAds || activeAdsCount,
          allAds: shop.allAds || ads.length,
          activeAdsCount,
          inactiveAdsCount,
          trend: traffic?.trend ?? 1, // 1 = up, 0 = down
          // Ads-specific growth (separate from traffic)
          adsLastMonthGrowth: adsLastMonthGrowth.toFixed(0),
          adsThreeMonthGrowth: adsThreeMonthGrowth.toFixed(0),
        },
        // Ads evolution chart data (from shops_ads_active_history)
        adsChart: {
          labels: adsChartLabels,
          allAds: adsChartAllAds,
          activeAds: adsChartActiveAds,
        },
        traffic: {
          chartData,
          sources: sources.map(s => {
            // Handle both new format (name, visitsShare) and legacy format (Name, Value)
            const sourceName = s.name || s.Name || 'Unknown'
            const sourceValue = s.visitsShare !== undefined ? s.visitsShare * 100 : (s.Value || 0)
            // Map source names to display names (French)
            const displayNames: Record<string, string> = {
              'direct_visits': 'Direct',
              'direct': 'Direct',
              'Direct': 'Direct',
              'referral_visits': 'Referral',
              'referral': 'Referral',
              'Referral': 'Referral',
              'search_visits': 'Recherche',
              'search': 'Recherche',
              'Search': 'Recherche',
              'organic': 'Recherche',
              'social_networks_visits': 'Réseaux Sociaux',
              'social': 'Réseaux Sociaux',
              'Social': 'Réseaux Sociaux',
              'mail_visits': 'Emails',
              'mail': 'Emails',
              'Mail': 'Emails',
              'ads_visits': 'Publicités Facebook Ads',
              'paid': 'Publicités Facebook Ads',
              'Paid Search': 'Publicités Facebook Ads',
              'Display': 'Display',
            }
            return {
              name: displayNames[sourceName] || sourceName,
              value: Math.round(sourceValue * 100) / 100, // Round to 2 decimals
              icon: s.icon || null,
            }
          }),
          countries: countries.map(c => ({
            name: c.CountryCode || c.Name || 'Unknown',
            code: c.CountryCode || '',
            value: Math.round((c.Value || 0) * 10000) / 100, // Convert to percentage
          })),
          social: social.map(s => ({
            name: s.name || s.Name || 'Unknown',
            value: Math.round((s.visitsShare || s.Value || 0) * 10000) / 100, // Convert to percentage
            icon: s.icon || null,
          })),
          mainSource: traffic?.mainSource || null,
          growthRate: traffic?.growthRate || 0,
        },
        adStats: {
          videoCount: videoAds,
          imageCount: imageAds,
          videoPercent: ads.length > 0 ? Math.round((videoAds / ads.length) * 100) : 0,
          imagePercent: ads.length > 0 ? Math.round((imageAds / ads.length) * 100) : 0,
        },
        products: shop.products.map(p => ({
          id: Number(p.id),
          handle: p.handle,
          title: p.title,
          vendor: p.vendor,
          productType: p.productType,
          price: p.variants[0]?.price ? Number(p.variants[0].price) : null,
          compareAtPrice: null, // Field doesn't exist in ProductVariant model
          imageUrl: p.images[0]?.src || null,
          createdAt: p.createdAt,
          bestProduct: p.bestProduct || false,
        })),
        ads: ads.map(ad => ({
          id: Number(ad.id),
          adArchiveId: String(ad.adArchiveId),
          pageName: ad.pageName,
          pageId: String(ad.pageId),
          type: ad.type,
          status: ad.isActive === 1 ? 'ACTIVE' : 'INACTIVE',
          imageLink: ad.imageLink,
          videoPreview: ad.videoPreviewLink,
          videoLink: ad.videoLink,
          caption: ad.description,
          ctaText: ad.ctaText,
          firstSeen: ad.startDate,
          lastSeen: ad.endDate,
          createdAt: ad.createdAt,
        })),
        suggestedShops,
        shopDomain,
        trackedSince: userShop.createdAt,
      }
    })

  } catch (error) {
    console.error('Failed to fetch shop details:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch shop details'
    }, { status: 500 })
  }
}
