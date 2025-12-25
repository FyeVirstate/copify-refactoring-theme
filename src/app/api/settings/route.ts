/**
 * User Settings API Route
 * Migrated from Laravel DashboardController::settings
 * 
 * GET /api/settings - Get user settings
 * PUT /api/settings - Update user settings
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"

// GET - Get user settings
export async function GET() {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active subscription separately
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId,
        stripeStatus: { in: ['active', 'trialing'] } 
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get plan if subscription exists
    let plan = null
    if (subscription) {
      plan = await prisma.plan.findUnique({
        where: { identifier: subscription.name }
      })
    }

    const isOnTrial = user.trialEndsAt && new Date(user.trialEndsAt) > new Date()

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          lang: user.lang,
          createdAt: user.createdAt,
        },
        shopify: {
          connected: !!user.shopifyDomain,
          domain: user.shopifyDomain,
          setupCompleted: user.shopifySetupCompleted,
        },
        subscription: subscription && plan ? {
          planName: plan.title,
          planIdentifier: plan.identifier,
          status: subscription.stripeStatus,
          currentPeriodEnd: subscription.endsAt,
        } : null,
        billing: {
          stripeCustomerId: user.stripeId,
        },
        credits: {
          generateProduct: user.balanceGenerateProduct,
          videoGeneration: user.balanceVideoGeneration,
          imageGeneration: user.balanceImageGeneration,
          productExporter: user.balanceProductExporter,
          shopExporter: user.balanceShopExporter,
          importTheme: user.balanceImportTheme,
        },
        limits: plan ? {
          shopTracker: plan.limitShopTracker,
          productExport: plan.limitProductExporter,
          generateProduct: plan.limitGenerateProduct,
          videoGeneration: plan.limitVideoGeneration,
          imageGeneration: plan.limitImageGeneration,
        } : null,
        isOnTrial,
        trialEndsAt: user.trialEndsAt,
        nextCreditRenewalAt: user.nextCreditRenewalAt,
      }
    })

  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings'
    }, { status: 500 })
  }
}

// PUT - Update user settings
const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  lang: z.enum(['en', 'fr', 'es', 'de', 'it', 'nl']).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
})

export async function PUT(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)

  try {
    const body = await request.json()
    const validated = updateSchema.parse(body)

    const updateData: any = {}

    if (validated.name) {
      updateData.name = validated.name
    }

    if (validated.lang) {
      updateData.lang = validated.lang
    }

    // Handle password change
    if (validated.newPassword) {
      if (!validated.currentPassword) {
        return NextResponse.json({
          success: false,
          error: 'Current password is required to change password'
        }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      })

      if (!user?.password) {
        return NextResponse.json({
          success: false,
          error: 'Cannot change password for OAuth accounts'
        }, { status: 400 })
      }

      const isValid = await bcrypt.compare(validated.currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json({
          success: false,
          error: 'Current password is incorrect'
        }, { status: 400 })
      }

      updateData.password = await bcrypt.hash(validated.newPassword, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        lang: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        id: Number(updatedUser.id),
        name: updatedUser.name,
        email: updatedUser.email,
        lang: updatedUser.lang,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Failed to update settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update settings'
    }, { status: 500 })
  }
}
