import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Bypass auth for this endpoint (admin sync)
export const dynamic = 'force-dynamic'

// These are the LOCAL/DEV Stripe price IDs from Laravel
// From: copyfy-theme/app/Console/Commands/UpdatePlansWithNewStripeIds.php
const STRIPE_PRICE_IDS = {
  'starter': {
    stripeId: 'price_1S6ZutItGM2i0XG6gFqlEgX0',      // EUR monthly: €39
    stripeIdEn: 'price_1S6ZusItGM2i0XG6J2VuytRD',   // USD monthly: $39
    price: 39.00,
  },
  'basic': {
    stripeId: 'price_1S6ZuvItGM2i0XG6ws5H5Rac',      // EUR monthly: €59
    stripeIdEn: 'price_1S6ZuuItGM2i0XG6Y8ELdSbr',   // USD monthly: $59
    price: 59.00,
  },
  'pro': {
    stripeId: 'price_1S6ZuzItGM2i0XG6KoQOr2G7',      // EUR monthly: €89
    stripeIdEn: 'price_1S6ZuyItGM2i0XG6nRG8ZO0o',   // USD monthly: $89
    price: 89.00,
  },
  'starter-year': {
    stripeId: 'price_1S6ZutItGM2i0XG6Zf4XtK26',      // EUR yearly: €280 (40% off)
    stripeIdEn: 'price_1S6ZutItGM2i0XG6Ha0TdVbU',   // USD yearly: $280 (40% off)
    price: 280.00,
  },
  'basic-year': {
    stripeId: 'price_1S6ZuwItGM2i0XG6J5Sy8b4M',      // EUR yearly: €425 (40% off)
    stripeIdEn: 'price_1S6ZuvItGM2i0XG6AVvyuiGg',   // USD yearly: $425 (40% off)
    price: 425.00,
  },
  'pro-year': {
    stripeId: 'price_1S6Zv0ItGM2i0XG6Cjkyg7hJ',      // EUR yearly: €640 (40% off)
    stripeIdEn: 'price_1S6ZuzItGM2i0XG6LiqdKzr8',   // USD yearly: $640 (40% off)
    price: 640.00,
  },
}

// POST - Sync Stripe IDs from Laravel to database
export async function POST() {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const results: Record<string, string> = {}

  for (const [identifier, data] of Object.entries(STRIPE_PRICE_IDS)) {
    try {
      const updated = await prisma.plan.updateMany({
        where: { identifier },
        data: {
          stripeId: data.stripeId,
          stripeIdEn: data.stripeIdEn,
          price: data.price,
        }
      })

      if (updated.count > 0) {
        results[identifier] = `✅ Updated: stripeId=${data.stripeId}, stripeIdEn=${data.stripeIdEn}`
      } else {
        results[identifier] = `⚠️ Not found in database`
      }
    } catch (error) {
      results[identifier] = `❌ Error: ${error}`
    }
  }

  return NextResponse.json({
    message: 'Stripe IDs synced from Laravel local/dev configuration',
    results
  })
}

// GET - Show current status
export async function GET() {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const plans = await prisma.plan.findMany({
    where: {
      identifier: {
        in: Object.keys(STRIPE_PRICE_IDS)
      }
    },
    orderBy: { price: 'asc' }
  })

  const comparison = plans.map(plan => {
    const expected = STRIPE_PRICE_IDS[plan.identifier as keyof typeof STRIPE_PRICE_IDS]
    return {
      identifier: plan.identifier,
      title: plan.title,
      currentStripeId: plan.stripeId,
      expectedStripeId: expected?.stripeId,
      match: plan.stripeId === expected?.stripeId,
      currentStripeIdEn: plan.stripeIdEn,
      expectedStripeIdEn: expected?.stripeIdEn,
      matchEn: plan.stripeIdEn === expected?.stripeIdEn,
    }
  })

  return NextResponse.json({
    message: 'Comparison of current vs expected Stripe IDs',
    plans: comparison,
    allMatch: comparison.every(p => p.match && p.matchEn)
  })
}

