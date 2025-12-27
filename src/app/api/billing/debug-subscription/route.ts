import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)

  // Raw SQL to get subscription with actual field names
  const subscriptions = await prisma.$queryRaw`
    SELECT * FROM subscriptions WHERE user_id = ${userId}::bigint ORDER BY id DESC LIMIT 5
  `

  // Also try with Prisma ORM to see if it works
  let prismaSubscription = null
  try {
    prismaSubscription = await prisma.subscription.findFirst({
      where: { userId }
    })
  } catch (e) {
    console.error('Prisma ORM error:', e)
  }

  // Get user info
  const userInfo = await prisma.$queryRaw`
    SELECT id, name, email, stripe_id, trial_ends_at, balance_generate_product, balance_shop_exporter
    FROM users WHERE id = ${userId}::bigint
  `

  return NextResponse.json({
    userId: userId.toString(),
    rawSubscriptions: subscriptions,
    prismaSubscription,
    userInfo
  })
}

