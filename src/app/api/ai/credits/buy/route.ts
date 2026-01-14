/**
 * AI Credits Purchase API Route
 * Create a Stripe checkout session for one-time credit purchase
 * 
 * POST /api/ai/credits/buy
 * 
 * Price: $9 = 15 AI credits
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"

// Price in cents for 15 credits
const CREDITS_PRICE_CENTS = 900 // $9.00
const CREDITS_AMOUNT = 15

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  let stripe
  try {
    stripe = getStripe()
  } catch {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(
    Number(user.id),
    user.email,
    user.name,
    user.stripeId
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
  
  // Parse the request body to get the return URL
  let returnUrl = '/dashboard/ai-shop'
  try {
    const body = await request.json()
    if (body.returnUrl) {
      returnUrl = body.returnUrl
    }
  } catch {
    // No body provided, use default
  }

  const successUrl = `${baseUrl}/api/ai/credits/success?session_id={CHECKOUT_SESSION_ID}&return_url=${encodeURIComponent(returnUrl)}`
  const cancelUrl = `${baseUrl}${returnUrl}?credits_canceled=true`

  // Create one-time payment checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment', // One-time payment, not subscription
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Crédits IA - Pack 15',
            description: '15 crédits pour la modification d\'images avec IA',
            images: ['https://copyfy.io/img/ai-credits.png'], // Optional image
          },
          unit_amount: CREDITS_PRICE_CENTS,
        },
        quantity: 1,
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId.toString(),
      type: 'ai_credits',
      creditsAmount: CREDITS_AMOUNT.toString(),
    },
    allow_promotion_codes: true,
  })

  return NextResponse.json({
    success: true,
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
  })
}
