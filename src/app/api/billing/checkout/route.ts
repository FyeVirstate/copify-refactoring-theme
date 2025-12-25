import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  planIdentifier: z.string(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
  }

  const { planIdentifier, successUrl, cancelUrl } = parsed.data
  const userId = BigInt(session.user.id)

  // Get plan
  const plan = await prisma.plan.findUnique({
    where: { identifier: planIdentifier }
  })

  if (!plan || !plan.stripeId) {
    return NextResponse.json({ error: 'Plan not found or has no Stripe price' }, { status: 404 })
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check for existing active subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      stripeStatus: 'active',
    }
  })

  if (existingSubscription) {
    // User already has active subscription - redirect to portal instead
    return NextResponse.json({ 
      error: 'ACTIVE_SUBSCRIPTION',
      message: 'You already have an active subscription. Use the customer portal to manage it.',
    }, { status: 400 })
  }

  // Get or create Stripe customer
  // In Laravel, stripeId on User is the Stripe customer ID
  const customerId = await getOrCreateStripeCustomer(
    Number(user.id),
    user.email,
    user.name,
    user.stripeId  // This is the Stripe customer ID in Laravel schema
  )

  // Save customer ID if new
  if (!user.stripeId) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeId: customerId }
    })
  }

  // Determine URLs
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const finalSuccessUrl = successUrl || `${baseUrl}/dashboard/billing?success=true`
  const finalCancelUrl = cancelUrl || `${baseUrl}/dashboard/billing?canceled=true`

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.stripeId,
        quantity: 1,
      }
    ],
    success_url: finalSuccessUrl,
    cancel_url: finalCancelUrl,
    metadata: {
      userId: userId.toString(),
      planIdentifier: plan.identifier,
    },
    subscription_data: {
      metadata: {
        userId: userId.toString(),
        planIdentifier: plan.identifier,
      }
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  })

  return NextResponse.json({
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
  })
}
