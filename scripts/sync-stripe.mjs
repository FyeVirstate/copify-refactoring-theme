import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// IDs from BillingController.php - LOCAL/DEV mode
const updates = {
  'starter': { stripeId: 'price_1S6ZutItGM2i0XG6gFqlEgX0', stripeIdEn: 'price_1S6ZusItGM2i0XG6J2VuytRD' },
  'basic': { stripeId: 'price_1S6ZuvItGM2i0XG6ws5H5Rac', stripeIdEn: 'price_1S6ZuuItGM2i0XG6Y8ELdSbr' },
  'pro': { stripeId: 'price_1S6ZuzItGM2i0XG6KoQOr2G7', stripeIdEn: 'price_1S6ZuyItGM2i0XG6nRG8ZO0o' },
  'starter-year': { stripeId: 'price_1S6ZutItGM2i0XG6Zf4XtK26', stripeIdEn: 'price_1S6ZutItGM2i0XG6Ha0TdVbU' },
  'basic-year': { stripeId: 'price_1S6ZuwItGM2i0XG6J5Sy8b4M', stripeIdEn: 'price_1S6ZuvItGM2i0XG6AVvyuiGg' },
  'pro-year': { stripeId: 'price_1S6Zv0ItGM2i0XG6Cjkyg7hJ', stripeIdEn: 'price_1S6ZuzItGM2i0XG6LiqdKzr8' },
}

async function main() {
  console.log('🔄 Syncing Stripe IDs from Laravel BillingController.php...\n')
  
  for (const [identifier, data] of Object.entries(updates)) {
    try {
      const result = await prisma.plan.updateMany({
        where: { identifier },
        data: {
          stripeId: data.stripeId,
          stripeIdEn: data.stripeIdEn,
        }
      })
      console.log(`✅ ${identifier}: ${result.count} updated`)
      console.log(`   EUR: ${data.stripeId}`)
      console.log(`   USD: ${data.stripeIdEn}\n`)
    } catch (e) {
      console.error(`❌ ${identifier}: ${e.message}`)
    }
  }
  
  // Verify
  console.log('\n📋 Verification:')
  const plans = await prisma.plan.findMany({
    where: { identifier: { in: Object.keys(updates) } },
    select: { identifier: true, stripeId: true, stripeIdEn: true }
  })
  console.table(plans)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

