/**
 * AI Credits API Route
 * Get remaining credits for AI features
 * 
 * GET /api/ai/credits
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)

  // Get user with subscription info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { stripeStatus: { in: ['active', 'trialing'] } },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get plan details separately if there's an active subscription
  const activeSub = user.subscriptions[0]
  let plan = null
  if (activeSub) {
    plan = await prisma.plan.findFirst({
      where: { identifier: activeSub.name }
    })
  }

  const isOnTrial = user.trialEndsAt && new Date(user.trialEndsAt) > new Date()

  return NextResponse.json({
    success: true,
    data: {
      credits: {
        generateProduct: user.balanceGenerateProduct,
        videoGeneration: user.balanceVideoGeneration,
        imageGeneration: user.balanceImageGeneration,
        productExporter: user.balanceProductExporter,
        shopExporter: user.balanceShopExporter,
        importTheme: user.balanceImportTheme,
      },
      limits: plan ? {
        generateProduct: plan.limitGenerateProduct,
        videoGeneration: plan.limitVideoGeneration,
        imageGeneration: plan.limitImageGeneration,
        productExporter: plan.limitProductExporter,
        importTheme: plan.limitImportTheme,
      } : null,
      isOnTrial,
      trialEndsAt: user.trialEndsAt,
      nextCreditRenewalAt: user.nextCreditRenewalAt,
      planIdentifier: plan?.identifier || (isOnTrial ? 'trial' : 'expired'),
    }
  })
}
