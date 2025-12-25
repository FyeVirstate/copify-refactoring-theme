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
    return NextResponse.json({ error: 'Plan not found or not available' }, { status: 404 })
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get or create Stripe customer - stripeId is the Stripe customer ID in Laravel
  const customerId = await getOrCreateStripeCustomer(
    Number(user.id),
    user.email,
    user.name,
    user.stripeId
  )

  // Update user with Stripe customer ID if new
  if (!user.stripeId) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeId: customerId }
    })
  }

  // Determine the correct Stripe price ID based on language
  const stripePriceId = user.lang === 'en' && plan.stripeIdEn 
    ? plan.stripeIdEn 
    : plan.stripeId

  // Create checkout session
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      }
    ],
    success_url: successUrl || `${baseUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${baseUrl}/dashboard/billing?canceled=true`,
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
    billing_address_collection: 'required',
  })

  return NextResponse.json({
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
  })
}
