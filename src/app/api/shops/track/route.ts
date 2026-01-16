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

    const shopTrackerLimit = session.user.activePlan?.topShopsCount ?? 3
    
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

    return NextResponse.json({
      success: true,
      data: shops,
      total: shops.length,
      limit: session.user.activePlan?.topShopsCount ?? 3,
    })
  } catch (error) {
    console.error('Failed to fetch tracked shops:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch tracked shops' 
    }, { status: 500 })
  }
}
