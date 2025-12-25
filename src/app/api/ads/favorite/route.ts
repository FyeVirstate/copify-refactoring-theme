import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  adId: z.number(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
  }

  const { adId } = parsed.data
  const userId = BigInt(session.user.id)

  try {
    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: {
        userId,
        adId: BigInt(adId),
      }
    })

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existing.id }
      })
      return NextResponse.json({ 
        success: true, 
        data: { adId, isFavorited: false },
        message: 'Removed from favorites' 
      })
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId,
          adId: BigInt(adId),
        }
      })
      return NextResponse.json({ 
        success: true, 
        data: { adId, isFavorited: true },
        message: 'Added to favorites' 
      })
    }
  } catch (error) {
    console.error('Failed to toggle ad favorite:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to toggle favorite' 
    }, { status: 500 })
  }
}

// Get user's favorite ads
export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '20')

  try {
    const total = await prisma.favorite.count({
      where: { userId }
    })

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        ad: {
          include: {
            shop: {
              select: {
                id: true,
                url: true,
                merchantName: true,
                screenshot: true,
              }
            }
          }
        }
      }
    })

    const ads = favorites.map(f => {
      if (!f.ad) return null
      
      // Calculate if active (has been seen in last 7 days based on startDate)
      const isActive = f.ad.isActive === 1
      
      return {
        id: f.ad.id.toString(),
        adArchiveId: f.ad.adArchiveId.toString(),
        pageId: f.ad.pageId.toString(),
        pageName: f.ad.pageName,
        shopId: f.ad.shopId?.toString() || null,
        shopUrl: f.ad.shop?.url || f.ad.targetUrl,
        shopName: f.ad.shop?.merchantName || f.ad.pageName,
        status: isActive ? 'active' : 'inactive',
        type: f.ad.type,
        videoUrl: f.ad.videoLink,
        videoPreview: f.ad.videoPreviewLink,
        imageLink: f.ad.imageLink,
        ctaText: f.ad.ctaText,
        body: f.ad.description,
        title: f.ad.title,
        startDate: f.ad.startDate?.toISOString() || null,
        endDate: f.ad.endDate?.toISOString() || null,
        isFavorited: true,
        favoritedAt: f.createdAt,
      }
    }).filter(Boolean)

    return NextResponse.json({
      success: true,
      data: ads,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      }
    })
  } catch (error) {
    console.error('Failed to fetch favorite ads:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch favorite ads' 
    }, { status: 500 })
  }
}
