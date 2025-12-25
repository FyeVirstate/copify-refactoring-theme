import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Get all available plans (public route)
export async function GET() {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const plans = await prisma.plan.findMany({
    where: {
      identifier: {
        notIn: ['trial', 'expired'] // Don't show trial and expired in pricing
      }
    },
    orderBy: { price: 'asc' }
  })

  return NextResponse.json({
    plans: plans.map(plan => ({
      id: plan.id.toString(),
      identifier: plan.identifier,
      title: plan.title,
      price: Number(plan.price),
      stripeId: plan.stripeId,
      stripeIdEn: plan.stripeIdEn,
      limits: {
        shopTracker: plan.limitShopTracker,
        shopExporter: plan.limitShopExporter,
        productExport: plan.limitProductExporter,
        generateProduct: plan.limitGenerateProduct,
        videoGeneration: plan.limitVideoGeneration,
        imageGeneration: plan.limitImageGeneration,
        importTheme: plan.limitImportTheme,
        topShops: plan.topShopsCount,
        topProducts: plan.topProductsCount,
        topAds: plan.topAdsCount,
        maxLicenses: plan.maxLicenses,
      }
    }))
  })
}
