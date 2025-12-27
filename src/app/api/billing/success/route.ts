import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"

// Force recompile
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('========================================')
  console.log('[Billing Success] Route called at:', new Date().toISOString())
  console.log('[Billing Success] Full URL:', request.url)
  console.log('========================================')
  
  const session = await auth()
  
  if (!session?.user) {
    console.log('[Billing Success] ❌ No user session found')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  console.log('[Billing Success] ✓ User authenticated:', session.user.id, session.user.email)

  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')

  console.log('[Billing Success] Session ID from URL:', sessionId)

  if (!sessionId) {
    console.error('[Billing Success] ❌ Missing session_id in URL')
    return NextResponse.redirect(new URL('/dashboard/plans?error=missing_session', request.url))
  }

  if (!prisma) {
    console.error('[Billing Success] ❌ Database (Prisma) not configured')
    return NextResponse.redirect(new URL('/dashboard/plans?error=database_error', request.url))
  }

  let stripe
  try {
    stripe = getStripe()
    console.log('[Billing Success] ✓ Stripe client initialized')
  } catch (err) {
    console.error('[Billing Success] ❌ Stripe not configured:', err)
    return NextResponse.redirect(new URL('/dashboard/plans?error=stripe_not_configured', request.url))
  }

  try {
    // Retrieve the checkout session from Stripe
    console.log('[Billing Success] Retrieving Stripe checkout session...')
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    
    console.log('[Billing Success] Checkout session retrieved:')
    console.log('  - payment_status:', checkoutSession.payment_status)
    console.log('  - subscription:', checkoutSession.subscription)
    console.log('  - customer:', checkoutSession.customer)
    console.log('  - status:', checkoutSession.status)

    if (checkoutSession.payment_status === 'paid') {
      // Get subscription details
      const subscriptionId = checkoutSession.subscription as string
      
      if (!subscriptionId) {
        console.error('[Billing Success] ❌ No subscription ID in checkout session')
        return NextResponse.redirect(new URL('/dashboard/plans?error=no_subscription', request.url))
      }

      console.log('[Billing Success] Retrieving subscription:', subscriptionId)
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      console.log('[Billing Success] Subscription status:', stripeSubscription.status)

      // Get the price ID and find the plan
      const priceId = stripeSubscription.items.data[0].price.id
      const userId = BigInt(session.user.id)
      const customerId = checkoutSession.customer as string

      console.log('[Billing Success] Price ID from subscription:', priceId)
      console.log('[Billing Success] User ID:', userId.toString())
      console.log('[Billing Success] Customer ID:', customerId)

      // Find plan by stripe_id or stripe_id_en
      console.log('[Billing Success] Looking for plan with stripeId or stripeIdEn =', priceId)
      const plan = await prisma.plan.findFirst({
        where: {
          OR: [
            { stripeId: priceId },
            { stripeIdEn: priceId }
          ]
        }
      })

      if (!plan) {
        console.error('[Billing Success] ❌ Plan NOT FOUND for price ID:', priceId)
        // Log all plans for debugging
        const allPlans = await prisma.plan.findMany({
          select: { identifier: true, stripeId: true, stripeIdEn: true }
        })
        console.log('[Billing Success] Available plans in DB:')
        allPlans.forEach(p => {
          console.log(`  - ${p.identifier}: EUR=${p.stripeId}, USD=${p.stripeIdEn}`)
        })
        return NextResponse.redirect(new URL('/dashboard/plans?error=plan_not_found&priceId=' + priceId, request.url))
      }

      console.log('[Billing Success] ✓ Found plan:', plan.identifier, '-', plan.title)

      // Get payment method details if available
      let cardBrand = null
      let cardLastFour = null
      let cardHolder = null

      if (stripeSubscription.default_payment_method) {
        try {
          console.log('[Billing Success] Retrieving payment method...')
          const paymentMethod = await stripe.paymentMethods.retrieve(
            stripeSubscription.default_payment_method as string
          )
          if (paymentMethod.card) {
            cardBrand = paymentMethod.card.brand
            cardLastFour = paymentMethod.card.last4
          }
          if (paymentMethod.billing_details?.name) {
            cardHolder = paymentMethod.billing_details.name
          }
          console.log('[Billing Success] ✓ Payment method:', cardBrand, '****' + cardLastFour)
        } catch (pmError) {
          console.warn('[Billing Success] ⚠ Could not retrieve payment method:', pmError)
        }
      }

      // Check if subscription already exists by stripe_id (like Laravel does)
      console.log('[Billing Success] Checking for existing subscription with stripe_id:', subscriptionId)
      
      // Use raw SQL to query with correct snake_case field names
      const existingSubArray = await prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM subscriptions WHERE stripe_id = ${subscriptionId} LIMIT 1
      `
      const existingSub = existingSubArray[0] || null

      console.log('[Billing Success] Existing subscription found:', existingSub ? existingSub.id.toString() : 'none')

      if (!existingSub) {
        console.log('[Billing Success] Creating NEW subscription in database...')
        try {
          // Use raw SQL to avoid ID conflicts (like Laravel's Subscription::create)
          await prisma.$executeRaw`
            INSERT INTO subscriptions (user_id, name, stripe_id, stripe_status, stripe_plan, quantity, trial_ends_at, ends_at, discount, created_at, updated_at)
            VALUES (
              ${userId}::bigint,
              ${plan.identifier},
              ${subscriptionId},
              ${stripeSubscription.status},
              ${priceId},
              ${stripeSubscription.items.data[0].quantity ?? 1},
              ${stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null}::timestamp,
              NULL,
              NULL,
              NOW(),
              NOW()
            )
          `
          console.log('[Billing Success] ✓ Subscription created successfully')
        } catch (subErr: unknown) {
          console.error('[Billing Success] ❌ Error creating subscription:', subErr)
          // If it's a duplicate key error, try updating instead
          if (subErr instanceof Error && (subErr.message.includes('duplicate') || subErr.message.includes('Unique constraint'))) {
            console.log('[Billing Success] ⚠ Duplicate detected, updating instead...')
            await prisma.$executeRaw`
              UPDATE subscriptions 
              SET stripe_id = ${subscriptionId},
                  stripe_status = ${stripeSubscription.status},
                  stripe_plan = ${priceId},
                  name = ${plan.identifier},
                  updated_at = NOW()
              WHERE user_id = ${userId}::bigint
            `
            console.log('[Billing Success] ✓ Subscription updated via fallback')
          } else {
            throw subErr
          }
        }
      } else {
        console.log('[Billing Success] Updating EXISTING subscription:', existingSub.id.toString())
        try {
          await prisma.$executeRaw`
            UPDATE subscriptions 
            SET stripe_status = ${stripeSubscription.status},
                stripe_plan = ${priceId},
                name = ${plan.identifier},
                updated_at = NOW()
            WHERE id = ${existingSub.id}::bigint
          `
          console.log('[Billing Success] ✓ Subscription updated successfully')
        } catch (updateErr) {
          console.error('[Billing Success] ❌ Error updating subscription:', updateErr)
          throw updateErr
        }
      }

      // Update user with all info (like Laravel does)
      console.log('[Billing Success] Updating user record...')
      console.log('[Billing Success] Plan limits:', {
        limitGenerateProduct: plan.limitGenerateProduct,
        limitVideoGeneration: plan.limitVideoGeneration,
        limitImageGeneration: plan.limitImageGeneration,
        limitProductExporter: plan.limitProductExporter,
        limitShopExporter: plan.limitShopExporter
      })
      
      try {
        // Use raw SQL to update user with snake_case fields (like Laravel)
        await prisma.$executeRaw`
          UPDATE users 
          SET stripe_id = ${customerId},
              balance_generate_product = ${plan.limitGenerateProduct ?? 0},
              balance_video_generation = ${plan.limitVideoGeneration ?? 0},
              balance_image_generation = ${plan.limitImageGeneration ?? 0},
              balance_product_exporter = ${plan.limitProductExporter ?? 0},
              balance_shop_exporter = ${plan.limitShopExporter ?? 0},
              next_credit_renewal_at = ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}::timestamp,
              trial_ends_at = NULL,
              card_brand = ${cardBrand},
              card_last_four = ${cardLastFour},
              card_holder = ${cardHolder},
              updated_at = NOW()
          WHERE id = ${userId}::bigint
        `
        console.log('[Billing Success] ✓ User updated successfully')
      } catch (userErr) {
        console.error('[Billing Success] ❌ Error updating user:', userErr)
        throw userErr
      }

      console.log('========================================')
      console.log(`[Billing Success] ✓✓✓ SUCCESS! User ${userId} subscribed to ${plan.title} (${plan.identifier})`)
      console.log('========================================')

      // Redirect to plans page with success message (use plan title for display)
      return NextResponse.redirect(new URL(`/dashboard/plans?success=true&plan=${encodeURIComponent(plan.title)}`, request.url))

    } else if (checkoutSession.payment_status === 'unpaid') {
      console.log('[Billing Success] Payment status: unpaid')
      return NextResponse.redirect(new URL('/dashboard/plans?error=payment_pending', request.url))
    } else {
      console.log('[Billing Success] Payment status:', checkoutSession.payment_status)
      return NextResponse.redirect(new URL('/dashboard/plans?error=payment_failed', request.url))
    }

  } catch (error) {
    console.error('========================================')
    console.error('[Billing Success] ❌❌❌ CRITICAL ERROR:')
    console.error(error)
    console.error('========================================')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(new URL(`/dashboard/plans?error=processing_error&message=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
