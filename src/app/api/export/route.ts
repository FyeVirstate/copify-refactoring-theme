/**
 * Product Export API Route
 * Export shop products to CSV file
 * 
 * GET /api/export - Get export history
 * POST /api/export - Create a product export
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireActiveSubscription } from "@/lib/subscription-guard"

// Helper to get screenshot URL
function getScreenshotUrl(shopUrl: string, screenshot: string | null): string {
  // If we have a stored screenshot, use it
  if (screenshot && screenshot !== 'no_image') {
    // Check if it's already a full URL
    if (screenshot.startsWith('http')) {
      return screenshot
    }
    // Return Laravel's screenshot path
    return `https://app.copyfy.io/download/products/screenshots/${screenshot}`
  }
  // Fallback to Google favicon
  return `https://www.google.com/s2/favicons?sz=64&domain=${shopUrl}`
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffYear > 0) return `Il y a ${diffYear} an${diffYear > 1 ? 's' : ''}`
  if (diffMonth > 0) return `Il y a ${diffMonth} mois`
  if (diffWeek > 0) return `Il y a ${diffWeek} semaine${diffWeek > 1 ? 's' : ''}`
  if (diffDay > 0) return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`
  if (diffHour > 0) return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`
  if (diffMin > 0) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`
  return 'À l\'instant'
}

// GET - Get export history
export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '50')

  try {
    // Get user for credits info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        balanceProductExporter: true,
        trialEndsAt: true,
      }
    })

    // Get user's active plan for limits
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        stripeStatus: 'active'
      },
      orderBy: { createdAt: 'desc' }
    })

    // Check if user is on trial
    const isOnTrial = user?.trialEndsAt && new Date(user.trialEndsAt) > new Date()
    
    // Get plan limit
    const DEFAULT_FREE_LIMIT = 3 // Default for trial/free users (consistent with stats API)
    let planLimit = DEFAULT_FREE_LIMIT
    if (subscription?.name) {
      const plan = await prisma.plan.findFirst({
        where: { identifier: subscription.name },
        select: { limitProductExporter: true, identifier: true }
      })
      planLimit = plan?.limitProductExporter || DEFAULT_FREE_LIMIT
    }
    
    const isUnlimited = planLimit === -1 || (subscription?.name && ['pro', 'pro-year', 'pro-quarterly', 'basic', 'basic-year', 'basic-quarterly'].includes(subscription.name))
    
    // For free/trial users, give them credits if they haven't used any
    let balance = user?.balanceProductExporter || 0
    const isFreeUser = !subscription // No active subscription = free user
    
    // Count actual exports to calculate used credits
    const totalExports = await prisma.productExport.count({ where: { userId } })
    
    // If free/trial user has 0 balance and hasn't made any exports, give them the default free credits
    if ((isOnTrial || isFreeUser) && balance === 0 && totalExports === 0) {
      balance = DEFAULT_FREE_LIMIT
    }

    const [exports, total] = await Promise.all([
      prisma.productExport.findMany({
        where: { userId },
        orderBy: { id: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.productExport.count({ where: { userId } })
    ])

    // Used = actual number of exports, not calculated from balance
    // But if balance is 0 and user has no exports, it means they're on free plan with 0 remaining
    const used = total
    const remaining = balance

    return NextResponse.json({
      success: true,
      data: exports.map(exp => ({
        id: Number(exp.id),
        shopUrl: exp.shopUrl,
        merchantName: exp.merchantName,
        screenshot: getScreenshotUrl(exp.shopUrl, exp.screenshot),
        nbProduct: exp.nbProduct,
        translation: exp.translation || 'no',
        file: exp.file,
        zipFile: exp.zipFile,
        productUrl: exp.productUrl,
        createdAt: exp.createdAt,
        relativeTime: exp.createdAt ? formatRelativeTime(new Date(exp.createdAt)) : '',
        // Generate download URLs
        csvDownloadUrl: exp.file ? `https://app.copyfy.io/download/products/csv/${exp.file}` : null,
        zipDownloadUrl: exp.zipFile ? `https://app.copyfy.io/download/products/images-zip/${exp.zipFile}` : null,
      })),
      credits: {
        used,
        remaining,
        limit: planLimit,
        isUnlimited,
        isOnTrial,
      },
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      }
    })

  } catch (error) {
    console.error('Failed to fetch exports:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch exports'
    }, { status: 500 })
  }
}

// POST - Create a product export
const exportSchema = z.object({
  productUrl: z.string().min(1),
  language: z.string().default('no'),
  multiple: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  // Check subscription status - block expired users
  const subscriptionBlock = await requireActiveSubscription()
  if (subscriptionBlock) {
    return subscriptionBlock
  }

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
    const validated = exportSchema.parse(body)

    // Clean URL
    let cleanUrl = validated.productUrl.trim()
    if (cleanUrl.startsWith('http://')) cleanUrl = cleanUrl.slice(7)
    if (cleanUrl.startsWith('https://')) cleanUrl = cleanUrl.slice(8)
    if (cleanUrl.startsWith('www.')) cleanUrl = cleanUrl.slice(4)
    cleanUrl = cleanUrl.split('?')[0] // Remove query params

    // Get user with credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        balanceProductExporter: true,
        trialEndsAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check credits (skip for unlimited plans)
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        stripeStatus: 'active'
      },
      orderBy: { createdAt: 'desc' }
    })

    const isUnlimited = subscription?.name && ['pro', 'pro-year', 'pro-quarterly', 'basic', 'basic-year', 'basic-quarterly'].includes(subscription.name)
    const isOnTrial = user.trialEndsAt && new Date(user.trialEndsAt) > new Date()
    const isFreeUser = !subscription // No active subscription = free user

    // Count existing exports for this user
    const existingExportsCount = await prisma.productExport.count({ where: { userId } })
    
    // Free/Trial users get 1 free export if they haven't made any
    const hasFreeCredit = (isOnTrial || isFreeUser) && existingExportsCount === 0
    
    if (!isUnlimited && !hasFreeCredit && user.balanceProductExporter <= 0) {
      return NextResponse.json({
        success: false,
        error: (isOnTrial || isFreeUser)
          ? 'Passez à un abonnement pour exporter plus de produits'
          : 'Limite d\'export de produits atteinte',
        limitReached: true,
      }, { status: 403 })
    }

    // Extract shop URL and merchant name
    const urlParts = cleanUrl.split('/')
    const shopUrl = urlParts[0]
    const merchantName = shopUrl.replace('www.', '').split('.')[0]
    const isProductUrl = cleanUrl.includes('/products/')

    // Create export record
    const exportRecord = await prisma.productExport.create({
      data: {
        userId,
        shopUrl,
        merchantName,
        nbProduct: validated.multiple ? 0 : 1,
        translation: validated.language,
        file: '', // Will be filled by background job or external service
        productUrl: isProductUrl ? cleanUrl : null,
      }
    })

    // Deduct credit if not unlimited and not using free credit
    if (!isUnlimited && !hasFreeCredit && user.balanceProductExporter > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          balanceProductExporter: { decrement: 1 }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Export démarré avec succès',
      data: {
        exportId: Number(exportRecord.id),
        shopUrl,
        remainingCredits: isUnlimited ? -1 : user.balanceProductExporter - 1,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur de validation',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Failed to create export:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'export'
    }, { status: 500 })
  }
}

// DELETE - Delete a product export
export async function DELETE(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)

  try {
    const { searchParams } = new URL(request.url)
    const exportId = searchParams.get('id')

    if (!exportId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Export ID required' 
      }, { status: 400 })
    }

    // Verify the export belongs to this user
    const exportRecord = await prisma.productExport.findFirst({
      where: {
        id: BigInt(exportId),
        userId,
      }
    })

    if (!exportRecord) {
      return NextResponse.json({ 
        success: false, 
        error: 'Export not found' 
      }, { status: 404 })
    }

    // Delete the export
    await prisma.productExport.delete({
      where: { id: BigInt(exportId) }
    })

    return NextResponse.json({
      success: true,
      message: 'Export supprimé avec succès'
    })

  } catch (error) {
    console.error('Failed to delete export:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la suppression'
    }, { status: 500 })
  }
}
