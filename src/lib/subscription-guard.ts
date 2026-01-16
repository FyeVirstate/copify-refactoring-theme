import { auth } from "./auth"
import { prisma } from "./prisma"
import { NextResponse } from "next/server"

export interface SubscriptionCheckResult {
  isValid: boolean
  isExpired: boolean
  isOnTrial: boolean
  userId?: number
  planIdentifier?: string
  error?: string
  response?: NextResponse
}

/**
 * Check if user has valid subscription or is on trial
 * Use this in API routes to block expired users
 */
export async function checkSubscription(): Promise<SubscriptionCheckResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        isValid: false,
        isExpired: false,
        isOnTrial: false,
        error: 'not_authenticated',
        response: NextResponse.json(
          { success: false, error: 'Not authenticated' },
          { status: 401 }
        ),
      }
    }

    const userId = parseInt(session.user.id)
    if (isNaN(userId)) {
      // Dev mode user
      return {
        isValid: true,
        isExpired: false,
        isOnTrial: false,
        userId: 0,
        planIdentifier: 'dev',
      }
    }

    if (!prisma) {
      // No database, allow access (dev mode)
      return {
        isValid: true,
        isExpired: false,
        isOnTrial: false,
        userId,
        planIdentifier: 'dev',
      }
    }

    // Fetch user with subscriptions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { stripeStatus: 'active' },
          take: 1,
        },
      },
    })

    if (!user) {
      return {
        isValid: false,
        isExpired: false,
        isOnTrial: false,
        error: 'user_not_found',
        response: NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        ),
      }
    }

    // Check if user has active subscription
    if (user.subscriptions.length > 0) {
      return {
        isValid: true,
        isExpired: false,
        isOnTrial: false,
        userId,
        planIdentifier: user.subscriptions[0].name,
      }
    }

    // Check if within trial period
    const trialHours = 168 // 7 days
    const createdAtTime = user.createdAt ? new Date(user.createdAt).getTime() : Date.now()
    const hoursSinceCreation = Math.floor((Date.now() - createdAtTime) / (1000 * 60 * 60))

    if (hoursSinceCreation < trialHours) {
      return {
        isValid: true,
        isExpired: false,
        isOnTrial: true,
        userId,
        planIdentifier: 'trial',
      }
    }

    // Trial expired, no subscription
    return {
      isValid: false,
      isExpired: true,
      isOnTrial: false,
      userId,
      planIdentifier: 'expired',
      error: 'subscription_expired',
      response: NextResponse.json(
        {
          success: false,
          error: 'subscription_expired',
          message: 'Votre essai gratuit est terminé. Veuillez vous abonner pour continuer.',
          redirectTo: '/dashboard/plans',
        },
        { status: 403 }
      ),
    }
  } catch (error) {
    console.error('[checkSubscription] Error:', error)
    return {
      isValid: false,
      isExpired: false,
      isOnTrial: false,
      error: 'internal_error',
      response: NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Middleware-style guard for API routes
 * Returns a response if user is blocked, null if allowed
 */
export async function requireActiveSubscription(): Promise<NextResponse | null> {
  const check = await checkSubscription()
  
  if (!check.isValid && check.response) {
    return check.response
  }
  
  return null
}

/**
 * Helper to create consistent error responses
 */
export function subscriptionExpiredResponse(customMessage?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'subscription_expired',
      message: customMessage || 'Votre essai gratuit est terminé. Veuillez vous abonner pour continuer.',
      redirectTo: '/dashboard/plans',
    },
    { status: 403 }
  )
}

/**
 * Helper to create feature-blocked response
 */
export function featureBlockedResponse(featureName: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'feature_blocked',
      message: `Abonnez-vous pour accéder à "${featureName}".`,
      redirectTo: '/dashboard/plans',
    },
    { status: 403 }
  )
}
