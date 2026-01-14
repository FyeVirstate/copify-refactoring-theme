/**
 * AI Credits Purchase Success Handler
 * Handle successful Stripe checkout for credit purchase
 * 
 * GET /api/ai/credits/success?session_id=xxx&return_url=xxx
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

const CREDITS_AMOUNT = 15 // Credits to add per purchase

export async function GET(request: NextRequest) {
  console.log('[AI Credits Success] Route called at:', new Date().toISOString())
  
  const session = await auth()
  
  if (!session?.user) {
    console.log('[AI Credits Success] No user session found')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')
  const returnUrl = searchParams.get('return_url') || '/dashboard/ai-shop'

  if (!sessionId) {
    console.error('[AI Credits Success] Missing session_id')
    return NextResponse.redirect(new URL(`${returnUrl}?credits_error=missing_session`, request.url))
  }

  if (!prisma) {
    console.error('[AI Credits Success] Database not configured')
    return NextResponse.redirect(new URL(`${returnUrl}?credits_error=database_error`, request.url))
  }

  let stripe
  try {
    stripe = getStripe()
  } catch (err) {
    console.error('[AI Credits Success] Stripe not configured:', err)
    return NextResponse.redirect(new URL(`${returnUrl}?credits_error=stripe_not_configured`, request.url))
  }

  try {
    // Retrieve the checkout session from Stripe
    console.log('[AI Credits Success] Retrieving Stripe checkout session...')
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    
    console.log('[AI Credits Success] Checkout session:', {
      payment_status: checkoutSession.payment_status,
      metadata: checkoutSession.metadata,
    })

    if (checkoutSession.payment_status === 'paid') {
      const userId = BigInt(session.user.id)
      
      // Verify this is an AI credits purchase
      if (checkoutSession.metadata?.type !== 'ai_credits') {
        console.error('[AI Credits Success] Invalid purchase type')
        return NextResponse.redirect(new URL(`${returnUrl}?credits_error=invalid_type`, request.url))
      }

      // Check if we already processed this session (prevent double credits)
      const existingPurchase = await prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM ai_credit_purchases 
        WHERE stripe_session_id = ${sessionId} 
        LIMIT 1
      `.catch(() => []) // Table might not exist yet

      if (existingPurchase.length > 0) {
        console.log('[AI Credits Success] Session already processed, skipping')
        return NextResponse.redirect(new URL(`${returnUrl}?credits_success=true&credits_added=${CREDITS_AMOUNT}`, request.url))
      }

      // Add credits to user
      console.log('[AI Credits Success] Adding', CREDITS_AMOUNT, 'credits to user', userId.toString())
      
      await prisma.$executeRaw`
        UPDATE users 
        SET balance_image_generation = balance_image_generation + ${CREDITS_AMOUNT},
            updated_at = NOW()
        WHERE id = ${userId}::bigint
      `

      // Try to log the purchase (table might not exist)
      try {
        await prisma.$executeRaw`
          INSERT INTO ai_credit_purchases (user_id, stripe_session_id, credits_amount, amount_paid, created_at)
          VALUES (${userId}::bigint, ${sessionId}, ${CREDITS_AMOUNT}, 900, NOW())
        `
      } catch {
        // Table doesn't exist, that's okay - credits were still added
        console.log('[AI Credits Success] Could not log purchase (table may not exist)')
      }

      console.log('[AI Credits Success] ✓ Successfully added', CREDITS_AMOUNT, 'credits to user', userId.toString())

      return NextResponse.redirect(new URL(`${returnUrl}?credits_success=true&credits_added=${CREDITS_AMOUNT}`, request.url))

    } else if (checkoutSession.payment_status === 'unpaid') {
      console.log('[AI Credits Success] Payment unpaid')
      return NextResponse.redirect(new URL(`${returnUrl}?credits_error=payment_pending`, request.url))
    } else {
      console.log('[AI Credits Success] Payment status:', checkoutSession.payment_status)
      return NextResponse.redirect(new URL(`${returnUrl}?credits_error=payment_failed`, request.url))
    }

  } catch (error) {
    console.error('[AI Credits Success] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(new URL(`${returnUrl}?credits_error=processing_error&message=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
