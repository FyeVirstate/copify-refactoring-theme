import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)

  // Get user - stripeId is the Stripe customer ID in Laravel schema
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeId: true }
  })

  if (!user?.stripeId) {
    return NextResponse.json({ 
      error: 'No billing account',
      message: 'You need to subscribe to a plan first'
    }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Create billing portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeId,
    return_url: `${baseUrl}/dashboard/billing`,
  })

  return NextResponse.json({
    url: portalSession.url,
  })
}
