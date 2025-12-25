import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Handle null prisma
  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(session.user.id) },
    include: {
      subscriptions: {
        where: { stripeStatus: 'active' },
      },
      shopifyShops: {
        select: {
          id: true,
          url: true,
          merchantName: true,
        }
      },
      userShops: {
        include: {
          shop: {
            select: {
              id: true,
              url: true,
              merchantName: true,
              screenshot: true,
            }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    type: user.type,
    lang: user.lang,
    shopifyDomain: user.shopifyDomain,
    balances: {
      generateProduct: user.balanceGenerateProduct,
      videoGeneration: user.balanceVideoGeneration,
      imageGeneration: user.balanceImageGeneration,
      productExporter: user.balanceProductExporter,
      shopExporter: user.balanceShopExporter,
      importTheme: user.balanceImportTheme,
    },
    activePlan: session.user.activePlan,
    isOnTrial: session.user.isOnTrial,
    trialDaysRemaining: session.user.trialDaysRemaining,
    shopifyShops: user.shopifyShops.map(shop => ({
      id: shop.id.toString(),
      domain: shop.url,
      name: shop.merchantName,
    })),
    trackedShops: user.userShops.map(us => ({
      ...us.shop,
      id: us.shop.id.toString(),
    })),
    createdAt: user.createdAt,
  })
}

export async function PATCH(request: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const body = await request.json()
  const { name, lang } = body

  const user = await prisma.user.update({
    where: { id: BigInt(session.user.id) },
    data: {
      ...(name && { name }),
      ...(lang && { lang }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      lang: true,
    }
  })

  return NextResponse.json({
    ...user,
    id: user.id.toString(),
  })
}
