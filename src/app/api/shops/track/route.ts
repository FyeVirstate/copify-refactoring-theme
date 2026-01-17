import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireActiveSubscription } from "@/lib/subscription-guard"

const schema = z.object({
  shopId: z.number(),
})

export async function POST(request: NextRequest) {
  // Check subscription status - block expired users
  const subscriptionBlock = await requireActiveSubscription()
  if (subscriptionBlock) {
    return subscriptionBlock
  }

  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
  }

  const { shopId } = parsed.data
  const userId = BigInt(session.user.id)
  const shopIdBigInt = BigInt(shopId)

  try {
    // Check shop tracker limit
    const trackedCount = await prisma.userShop.count({
      where: { userId }
    })

    // Fetch the user's current plan limit directly from DB using same logic as stats API
    let shopTrackerLimit = 3 // default
    
    // Use raw SQL query exactly like stats API does (ORDER BY id DESC)
    const subscriptions = await prisma.$queryRaw<Array<{
      id: bigint;
      name: string;
    }>>`
      SELECT id, name
      FROM subscriptions 
      WHERE user_id = ${userId}::bigint 
        AND stripe_status = 'active'
      ORDER BY id DESC
      LIMIT 1
    `;
    
    if (subscriptions[0]) {
      const plan = await prisma.plan.findFirst({
        where: { identifier: subscriptions[0].name }
      })
      if (plan) {
        shopTrackerLimit = plan.limitShopTracker
        console.log(`[Track] User ${userId} plan: ${subscriptions[0].name}, limit: ${shopTrackerLimit}`)
      }
    } else {
      // No active subscription - use session fallback or default
      shopTrackerLimit = session.user.activePlan?.topShopsCount ?? 3
      console.log(`[Track] User ${userId} no active sub, using session limit: ${shopTrackerLimit}`)
    }
    
    // Check if already tracking
    const existing = await prisma.userShop.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId: shopIdBigInt,
        }
      }
    })

    if (existing) {
      // Remove tracking
      await prisma.userShop.delete({
        where: { id: existing.id }
      })
      return NextResponse.json({ 
        success: true,
        data: { shopId, isTracked: false },
        message: 'Shop removed from tracking',
        trackedCount: trackedCount - 1,
      })
    } else {
      // Check limit before adding
      if (trackedCount >= shopTrackerLimit) {
        return NextResponse.json({ 
          success: false,
          error: 'Limit reached', 
          message: `You can only track ${shopTrackerLimit} shops with your current plan`,
          trackedCount,
          limit: shopTrackerLimit,
        }, { status: 403 })
      }

      // Add tracking
      await prisma.userShop.create({
        data: {
          userId,
          shopId: shopIdBigInt,
        }
      })
      return NextResponse.json({ 
        success: true,
        data: { shopId, isTracked: true },
        message: 'Shop added to tracking',
        trackedCount: trackedCount + 1,
      })
    }
  } catch (error) {
    console.error('Failed to toggle shop tracking:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to toggle tracking' 
    }, { status: 500 })
  }
}

// Get user's tracked shops
export async function GET(_request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)

  try {
    const trackedShops = await prisma.userShop.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        shop: {
          select: {
            id: true,
            url: true,
            merchantName: true,
            screenshot: true,
            country: true,
            activeAds: true,
            productsCount: true,
          }
        }
      }
    })

    const shops = trackedShops.map(ts => ({
      id: Number(ts.shop.id),
      url: ts.shop.url,
      name: ts.shop.merchantName || ts.shop.url.replace('https://', ''),
      screenshot: ts.shop.screenshot,
      country: ts.shop.country,
      activeAds: ts.shop.activeAds,
      productsCount: ts.shop.productsCount,
      trackedAt: ts.createdAt,
    }))

    // Fetch the user's current plan limit directly from DB using same logic as stats API
    let shopTrackerLimit = 3 // default
    
    const subscriptions = await prisma.$queryRaw<Array<{
      id: bigint;
      name: string;
    }>>`
      SELECT id, name
      FROM subscriptions 
      WHERE user_id = ${userId}::bigint 
        AND stripe_status = 'active'
      ORDER BY id DESC
      LIMIT 1
    `;
    
    if (subscriptions[0]) {
      const plan = await prisma.plan.findFirst({
        where: { identifier: subscriptions[0].name }
      })
      if (plan) {
        shopTrackerLimit = plan.limitShopTracker
      }
    } else {
      shopTrackerLimit = session.user.activePlan?.topShopsCount ?? 3
    }

    return NextResponse.json({
      success: true,
      data: shops,
      total: shops.length,
      limit: shopTrackerLimit,
    })
  } catch (error) {
    console.error('Failed to fetch tracked shops:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch tracked shops' 
    }, { status: 500 })
  }
}
