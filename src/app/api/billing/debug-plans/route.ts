import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Debug endpoint to see all plans and their Stripe IDs
export async function GET() {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const plans = await prisma.plan.findMany({
    orderBy: { price: 'asc' }
  })

  return NextResponse.json({
    plans: plans.map(plan => ({
      id: plan.id.toString(),
      identifier: plan.identifier,
      title: plan.title,
      price: Number(plan.price),
      stripeId: plan.stripeId || 'NOT SET',
      stripeIdEn: plan.stripeIdEn || 'NOT SET',
    }))
  })
}

