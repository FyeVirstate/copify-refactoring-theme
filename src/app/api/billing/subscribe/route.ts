import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  planIdentifier: z.string(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Vous devez être connecté.' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured', message: 'Erreur de configuration.' }, { status: 503 })
    }

    // Check if Stripe is configured (support both STRIPE_SECRET and STRIPE_SECRET_KEY)
    if (!process.env.STRIPE_SECRET && !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured', message: 'Stripe n\'est pas configuré.' }, { status: 503 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON', message: 'Requête invalide.' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', message: 'Données invalides.', details: parsed.error.issues }, { status: 400 })
    }

    const { planIdentifier, successUrl, cancelUrl } = parsed.data
    const userId = BigInt(session.user.id)

    // Get plan
    const plan = await prisma.plan.findUnique({
      where: { identifier: planIdentifier }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found', message: `Le plan "${planIdentifier}" n'existe pas.` }, { status: 404 })
    }

    if (!plan.stripeId) {
      return NextResponse.json({ error: 'Plan not available', message: `Le plan "${plan.title}" n'a pas de prix Stripe configuré.` }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found', message: 'Utilisateur non trouvé.' }, { status: 404 })
    }

    // Get Stripe instance
    const stripe = getStripe()

    // Get or create Stripe customer - stripeId is the Stripe customer ID in Laravel
    const customerId = await getOrCreateStripeCustomer(
      Number(user.id),
      user.email,
      user.name || 'Client',
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

    // Verify the Stripe price exists before creating checkout
    try {
      await stripe.prices.retrieve(stripePriceId)
    } catch (priceError) {
      console.error('Stripe price not found:', stripePriceId, priceError)
      return NextResponse.json({ 
        error: 'Invalid Stripe price', 
        message: `Le prix Stripe "${stripePriceId}" n'existe pas dans votre compte Stripe. Vérifiez que vous utilisez les bonnes clés Stripe (test vs production).`
      }, { status: 400 })
    }

    // Create checkout session
    // Use the request origin to get the correct port (localhost:3004, etc.)
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin || 'http://localhost:3004'
    
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
      success_url: successUrl || `${baseUrl}/api/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/dashboard/plans?canceled=true`,
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
      locale: user.lang === 'en' ? 'en' : 'fr',
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('Stripe subscribe error:', error)
    
    // Handle Stripe errors specifically
    if (error instanceof Error) {
      if (error.message.includes('No such price')) {
        return NextResponse.json({ 
          error: 'Invalid price', 
          message: 'Le prix Stripe configuré n\'existe pas. Contactez le support.' 
        }, { status: 400 })
      }
      if (error.message.includes('Invalid API Key')) {
        return NextResponse.json({ 
          error: 'Stripe configuration error', 
          message: 'Erreur de configuration Stripe.' 
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: 'Stripe error', 
        message: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: 'Unknown error', 
      message: 'Une erreur est survenue.' 
    }, { status: 500 })
  }
}
