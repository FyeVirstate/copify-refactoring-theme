/**
 * Shop Tracking API Route
 * Migrated from Laravel DashboardController track methods
 * 
 * GET /api/track - Get tracked shops
 * POST /api/track - Add shop to tracking
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// GET - Get user's tracked shops
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
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '10')

  try {
    // Get user's tracked shops with traffic data
    const [trackedShops, total] = await Promise.all([
      prisma.userShop.findMany({
        where: { userId },
        include: {
          shop: {
            select: {
              id: true,
              url: true,
              merchantName: true,
              screenshot: true,
              country: true,
              currency: true,
              productsCount: true,
              theme: true,
              activeAds: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.userShop.count({ where: { userId } })
    ])

    // Fetch traffic data for each shop
    const shopIds = trackedShops.map(us => us.shopId)
    const trafficData = await prisma.traffic.findMany({
      where: { shopId: { in: shopIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['shopId'],
    })
    
    // Create a map of shopId -> traffic
    const trafficMap = new Map(trafficData.map(t => [t.shopId.toString(), t]))

    // Fetch ads history for each shop (last 90 days)
    const adsHistoryRaw = await prisma.$queryRawUnsafe<Array<{
      shop_id: bigint
      active_ads_count: number
      created_at: Date
    }>>(`
      SELECT shop_id, active_ads_count, created_at
      FROM shops_ads_active_history
      WHERE shop_id = ANY($1::bigint[])
        AND created_at >= NOW() - INTERVAL '90 days'
      ORDER BY shop_id, created_at ASC
    `, shopIds.map(id => BigInt(id)))

    // Group ads history by shop_id
    const adsHistoryMap = new Map<string, Array<{ count: number; date: string }>>()
    for (const row of adsHistoryRaw) {
      const key = row.shop_id.toString()
      if (!adsHistoryMap.has(key)) {
        adsHistoryMap.set(key, [])
      }
      adsHistoryMap.get(key)!.push({
        count: row.active_ads_count || 0,
        date: row.created_at.toISOString()
      })
    }

    // Transform data with traffic info
    const data = trackedShops.map(us => {
      const shop = us.shop
      const traffic = trafficMap.get(us.shopId.toString())
      const adsHistory = adsHistoryMap.get(us.shopId.toString()) || []
      
      // Parse countries from traffic for market share
      let countries: Array<{ code: string; value: number }> = []
      if (traffic?.countries) {
        try {
          const countriesData = typeof traffic.countries === 'string' 
            ? JSON.parse(traffic.countries) 
            : traffic.countries
          if (Array.isArray(countriesData)) {
            countries = countriesData.slice(0, 5).map((c: { CountryCode?: string; Name?: string; Value?: number }) => ({
              code: c.CountryCode || c.Name || '',
              value: Math.round((c.Value || 0) * 100),
            }))
          }
        } catch { /* ignore */ }
      }

      // Calculate ads change from history
      let adsChange = 0
      const currentAds = shop?.activeAds || 0
      if (adsHistory.length > 0) {
        const firstAds = adsHistory[0].count
        adsChange = currentAds - firstAds
      }
      
      return {
        id: Number(us.id),
        shopId: Number(us.shopId),
        addedAt: us.createdAt,
        shop: shop ? {
          id: Number(shop.id),
          url: shop.url,
          name: shop.merchantName || shop.url,
          screenshot: shop.screenshot,
          country: shop.country,
          currency: shop.currency,
          productsCount: shop.productsCount,
          theme: shop.theme,
          activeAds: shop.activeAds,
          adsChange,
          adsHistoryData: adsHistory.map(h => h.count),
          adsHistoryDates: adsHistory.map(h => h.date),
          // Traffic data
          monthlyVisits: traffic?.lastMonthVisits ? Number(traffic.lastMonthVisits) : null,
          dailyRevenue: traffic?.estimatedMonthly ? Math.round(Number(traffic.estimatedMonthly) / 30) : null,
          monthlyRevenue: traffic?.estimatedMonthly ? Number(traffic.estimatedMonthly) : null,
          estimatedOrders: traffic?.estimatedOrder ? Number(traffic.estimatedOrder) : null,
          growthRate: traffic?.growthRate ? Number(traffic.growthRate) : null,
          countries,
        } : null
      }
    })

    // Get user's plan limits
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId,
        stripeStatus: { in: ['active', 'trialing'] } 
      }
    })

    const plan = subscription ? await prisma.plan.findUnique({
      where: { identifier: subscription.name }
    }) : null

    const limit = plan?.limitShopTracker || 3

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      limits: {
        used: total,
        max: limit,
        remaining: Math.max(0, limit - total),
      }
    })

  } catch (error) {
    console.error('Failed to fetch tracked shops:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tracked shops'
    }, { status: 500 })
  }
}

// POST - Add shop to tracking
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
    const { shopUrl, shopId } = body

    if (!shopUrl && !shopId) {
      return NextResponse.json({ 
        error: 'Shop URL or ID is required' 
      }, { status: 400 })
    }

    // Get user's subscription and plan
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId,
        stripeStatus: { in: ['active', 'trialing'] } 
      }
    })

    const plan = subscription ? await prisma.plan.findUnique({
      where: { identifier: subscription.name }
    }) : null

    const isTrialing = subscription?.stripeStatus === 'trialing'
    
    // Trial users have a limit of 5 shops (like Laravel)
    const trialLimit = 5
    const planLimit = plan?.limitShopTracker || 3
    const limit = isTrialing ? Math.min(trialLimit, planLimit) : planLimit

    // Check current count
    const currentCount = await prisma.userShop.count({
      where: { userId }
    })

    if (currentCount >= limit) {
      return NextResponse.json({
        success: false,
        error: 'Tracking limit reached',
        message: isTrialing 
          ? `Trial users can only track up to ${trialLimit} shops. Upgrade to track more!`
          : `You can only track up to ${limit} shops on your current plan`,
        limitReached: true,
        featureLimited: 'Track Shops',
        limitType: isTrialing ? 'Trial limit reached' : 'Plan limit reached',
      }, { status: 403 })
    }

    // Find or create shop
    let shop
    if (shopId) {
      shop = await prisma.shop.findUnique({ where: { id: BigInt(shopId) } })
    } else if (shopUrl) {
      // Normalize URL
      const normalizedUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
      shop = await prisma.shop.findFirst({
        where: {
          OR: [
            { url: normalizedUrl },
            { url: `https://${normalizedUrl}` },
            { url: { contains: normalizedUrl } }
          ]
        }
      })
    }

    if (!shop) {
      return NextResponse.json({
        success: false,
        error: 'Shop not found',
        message: 'The shop could not be found in our database'
      }, { status: 404 })
    }

    // Check if already tracking
    const existing = await prisma.userShop.findUnique({
      where: {
        userId_shopId: { userId, shopId: shop.id }
      }
    })

    if (existing) {
      // Like Laravel: return shop_route so user can navigate to the shop details
      return NextResponse.json({
        success: false,
        error: 'Already tracking',
        message: 'You are already tracking this shop',
        shop_url: shop.url,
        shop_route: `/dashboard/track/${shop.id}`,
      }, { status: 400 })
    }

    // Add to tracking
    const tracked = await prisma.userShop.create({
      data: {
        userId,
        shopId: shop.id,
      },
      include: {
        shop: true
      }
    })

    // Serialize shop data
    const serializedShop = {
      id: Number(tracked.shop.id),
      url: tracked.shop.url,
      merchantName: tracked.shop.merchantName,
      country: tracked.shop.country,
      currency: tracked.shop.currency,
      productsCount: tracked.shop.productsCount,
      theme: tracked.shop.theme,
    }

    // Like Laravel: return shop_route for redirect
    return NextResponse.json({
      success: true,
      message: 'Shop added to tracking',
      shop_url: tracked.shop.url,
      shop_route: `/dashboard/track/${tracked.shop.id}`,
      data: {
        id: Number(tracked.id),
        shopId: Number(tracked.shopId),
        shop: serializedShop,
      }
    })

  } catch (error) {
    console.error('Failed to add shop to tracking:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add shop to tracking'
    }, { status: 500 })
  }
}

// DELETE - Remove shop from tracking
export async function DELETE(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)
  const searchParams = request.nextUrl.searchParams
  const trackId = searchParams.get('id')
  const shopId = searchParams.get('shopId')

  if (!trackId && !shopId) {
    return NextResponse.json({ 
      error: 'Track ID or Shop ID is required' 
    }, { status: 400 })
  }

  try {
    if (trackId) {
      await prisma.userShop.deleteMany({
        where: {
          id: BigInt(trackId),
          userId, // Ensure user owns this
        }
      })
    } else if (shopId) {
      await prisma.userShop.deleteMany({
        where: {
          shopId: BigInt(shopId),
          userId,
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Shop removed from tracking'
    })

  } catch (error) {
    console.error('Failed to remove shop from tracking:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to remove shop from tracking'
    }, { status: 500 })
  }
}
