/**
 * Script to update Stripe price IDs in the database
 * 
 * Usage:
 * 1. Get your price IDs from Stripe Dashboard > Products > Click on price > Copy price ID
 * 2. Update the STRIPE_PRICES object below with your test mode price IDs
 * 3. Run: npx tsx scripts/update-stripe-prices.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// UPDATE THESE WITH YOUR STRIPE TEST MODE PRICE IDs
// Go to https://dashboard.stripe.com/test/products and copy the price IDs
const STRIPE_PRICES = {
  // Monthly plans - EUR price, USD price
  starter: {
    stripeId: 'price_XXXXX_EUR_MONTHLY', // Replace with your EUR price ID
    stripeIdEn: 'price_XXXXX_USD_MONTHLY', // Replace with your USD price ID
  },
  basic: {
    stripeId: 'price_XXXXX_EUR_MONTHLY',
    stripeIdEn: 'price_XXXXX_USD_MONTHLY',
  },
  pro: {
    stripeId: 'price_XXXXX_EUR_MONTHLY',
    stripeIdEn: 'price_XXXXX_USD_MONTHLY',
  },
  
  // Yearly plans
  'starter-year': {
    stripeId: 'price_XXXXX_EUR_YEARLY',
    stripeIdEn: 'price_XXXXX_USD_YEARLY',
  },
  'basic-year': {
    stripeId: 'price_XXXXX_EUR_YEARLY',
    stripeIdEn: 'price_XXXXX_USD_YEARLY',
  },
  'pro-year': {
    stripeId: 'price_XXXXX_EUR_YEARLY',
    stripeIdEn: 'price_XXXXX_USD_YEARLY',
  },
}

async function main() {
  console.log('🔄 Updating Stripe price IDs in database...\n')

  for (const [identifier, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.stripeId.includes('XXXXX')) {
      console.log(`⏭️  Skipping ${identifier} - price IDs not configured`)
      continue
    }

    const result = await prisma.plan.updateMany({
      where: { identifier },
      data: {
        stripeId: prices.stripeId,
        stripeIdEn: prices.stripeIdEn,
      }
    })

    if (result.count > 0) {
      console.log(`✅ Updated ${identifier}:`)
      console.log(`   stripeId: ${prices.stripeId}`)
      console.log(`   stripeIdEn: ${prices.stripeIdEn}\n`)
    } else {
      console.log(`⚠️  No plan found with identifier: ${identifier}\n`)
    }
  }

  console.log('✅ Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

