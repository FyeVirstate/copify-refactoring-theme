import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

// Get current subscription status
export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)

  const subscription = await prisma.subscription.findFirst({
    where: { 
      userId,
      stripeStatus: { in: ['active', 'trialing', 'past_due'] }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!subscription) {
    return NextResponse.json({
      hasSubscription: false,
      subscription: null,
      plan: session.user.activePlan,
      isOnTrial: session.user.isOnTrial,
      trialDaysRemaining: session.user.trialDaysRemaining,
    })
  }

  // Get plan details separately
  const plan = await prisma.plan.findFirst({
    where: { identifier: subscription.name }
  })

  // Get more details from Stripe if needed
  let stripeSubscription = null
  try {
    stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeId)
  } catch (e) {
    console.error('Failed to fetch Stripe subscription:', e)
  }

  return NextResponse.json({
    hasSubscription: true,
    subscription: {
      id: subscription.id.toString(),
      status: subscription.stripeStatus,
      planIdentifier: subscription.name,
      currentPeriodEnd: stripeSubscription && 'current_period_end' in stripeSubscription
        ? new Date((stripeSubscription as any).current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: stripeSubscription && 'cancel_at_period_end' in stripeSubscription 
        ? (stripeSubscription as any).cancel_at_period_end 
        : false,
      trialEndsAt: subscription.trialEndsAt,
    },
    plan: plan ? {
      identifier: plan.identifier,
      title: plan.title,
      price: Number(plan.price),
      limits: {
        shopTracker: plan.limitShopTracker,
        shopExporter: plan.limitShopExporter,
        productExport: plan.limitProductExporter,
        generateProduct: plan.limitGenerateProduct,
        videoGeneration: plan.limitVideoGeneration,
        imageGeneration: plan.limitImageGeneration,
        importTheme: plan.limitImportTheme,
        topShops: plan.topShopsCount,
        topProducts: plan.topProductsCount,
        topAds: plan.topAdsCount,
      }
    } : null,
    isOnTrial: session.user.isOnTrial,
  })
}

// Cancel subscription
export async function DELETE() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)

  const subscription = await prisma.subscription.findFirst({
    where: { 
      userId,
      stripeStatus: 'active'
    }
  })

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  // Cancel at period end (not immediately)
  await stripe.subscriptions.update(subscription.stripeId, {
    cancel_at_period_end: true,
  })

  return NextResponse.json({
    success: true,
    message: 'Subscription will be canceled at the end of the billing period',
  })
}

// Resume canceled subscription
export async function PATCH() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)

  const subscription = await prisma.subscription.findFirst({
    where: { 
      userId,
      stripeStatus: 'active'
    }
  })

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  // Resume subscription (remove cancel_at_period_end)
  await stripe.subscriptions.update(subscription.stripeId, {
    cancel_at_period_end: false,
  })

  return NextResponse.json({
    success: true,
    message: 'Subscription resumed',
  })
}
