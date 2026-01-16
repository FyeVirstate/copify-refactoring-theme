/**
 * Churnkey Auth Hash API Route
 * Generates HMAC-SHA256 hash for Churnkey authentication
 * Migrated from Laravel: hash_hmac('sha256', auth()->user()->stripe_id, config('app.CHURNKEY_KEY'))
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const churnkeyKey = process.env.CHURNKEY_KEY
  if (!churnkeyKey) {
    return NextResponse.json({ error: 'Churnkey not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)

  try {
    // Get user's Stripe customer ID and subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        stripeId: true, 
        lang: true,
        trialEndsAt: true,
      }
    })

    if (!user?.stripeId) {
      return NextResponse.json({ 
        error: 'No Stripe customer ID',
        hasStripeId: false 
      }, { status: 400 })
    }

    // Check for active subscription
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId,
        stripeStatus: { in: ['active', 'trialing', 'past_due'] } 
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get plan details if subscribed
    let plan = null
    if (subscription) {
      plan = await prisma.plan.findFirst({
        where: { identifier: subscription.name }
      })
    }

    // Generate HMAC hash
    const authHash = crypto
      .createHmac('sha256', churnkeyKey)
      .update(user.stripeId)
      .digest('hex')

    // Determine if user is on trial
    const isOnTrial = user.trialEndsAt && new Date(user.trialEndsAt) > new Date()

    return NextResponse.json({
      success: true,
      customerId: user.stripeId,
      authHash,
      appId: process.env.CHURNKEY_APP_ID || '3t28ew8c6',
      mode: process.env.CHURNKEY_STATUS || 'live',
      lang: user.lang || 'fr',
      hasActiveSubscription: !!subscription && subscription.stripeStatus === 'active',
      isOnTrial,
      subscription: subscription ? {
        status: subscription.stripeStatus,
        planIdentifier: subscription.name,
        endsAt: subscription.endsAt,
      } : null,
      plan: plan ? {
        title: plan.title,
        price: Number(plan.price),
        identifier: plan.identifier,
        limitGenerateProduct: plan.limitGenerateProduct,
        limitShopTracker: plan.limitShopTracker,
        limitProductExporter: plan.limitProductExporter,
        limitShopExporter: plan.limitShopExporter,
        topShopsCount: plan.topShopsCount,
        topProductsCount: plan.topProductsCount,
      } : null,
    })

  } catch (error) {
    console.error('Failed to generate Churnkey hash:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate auth hash'
    }, { status: 500 })
  }
}
