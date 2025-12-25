/**
 * Shopify OAuth Callback Route
 * Handles OAuth callback and stores access token
 * 
 * GET /api/shopify/callback
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForToken } from "@/lib/services/shopify"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.redirect(
      new URL('/dashboard/settings/shopify?error=database_unavailable', request.url)
    )
  }

  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const shop = searchParams.get('shop')

  // Get stored values from cookies
  const cookieStore = await cookies()
  const storedState = cookieStore.get('shopify_oauth_state')?.value
  const storedShop = cookieStore.get('shopify_shop')?.value

  // Validate state
  if (state !== storedState) {
    console.error('Invalid OAuth state')
    return NextResponse.redirect(
      new URL('/dashboard/settings/shopify?error=invalid_state', request.url)
    )
  }

  // Validate shop
  if (shop !== storedShop) {
    console.error('Shop mismatch')
    return NextResponse.redirect(
      new URL('/dashboard/settings/shopify?error=shop_mismatch', request.url)
    )
  }

  if (!code) {
    console.error('No authorization code provided')
    return NextResponse.redirect(
      new URL('/dashboard/settings/shopify?error=no_code', request.url)
    )
  }

  try {
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(shop!, code)

    if (!tokenData.access_token) {
      throw new Error('No access token received')
    }

    // Normalize shop domain (without .myshopify.com)
    const shopDomain = shop!.replace('.myshopify.com', '')

    // Get authenticated user
    const session = await auth()
    const userId = session?.user?.id ? BigInt(session.user.id) : null

    // Get IP from headers (Next.js standard way)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

    // Store/update the Shopify app integration
    await prisma.shopifyAppIntegration.upsert({
      where: { shopDomain },
      update: {
        userId,
        accessToken: tokenData.access_token,
        scopes: tokenData.scope,
        lastAccessedAt: new Date(),
        active: true,
        appMetadata: {
          installationIp: clientIp,
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      },
      create: {
        userId,
        shopDomain,
        accessToken: tokenData.access_token,
        scopes: tokenData.scope,
        installedAt: new Date(),
        lastAccessedAt: new Date(),
        active: true,
        appMetadata: {
          installationIp: clientIp,
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      },
    })

    // If user is authenticated, update their Shopify connection
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      // Get active subscription
      const subscription = await prisma.subscription.findFirst({
        where: { 
          userId,
          stripeStatus: { in: ['active', 'trialing'] } 
        }
      })

      // Get plan if subscription exists
      const plan = subscription ? await prisma.plan.findUnique({
        where: { identifier: subscription.name }
      }) : null

      if (user) {
        const hasPrimaryConnection = user.shopifyDomain && user.shopifyAccessToken

        if (hasPrimaryConnection) {
          // Check if user has Pro plan and can add additional stores
          const isPro = plan && ['pro', 'pro-year', 'pro-quarterly'].includes(plan.identifier)

          if (isPro) {
            // Count existing additional stores
            const additionalStoresCount = await prisma.shopifyAdditionalStore.count({
              where: { userId }
            })

            if (additionalStoresCount < 3) {
              // Add as additional store
              await prisma.shopifyAdditionalStore.create({
                data: {
                  userId,
                  shopifyDomain: shopDomain,
                  shopifyAccessToken: tokenData.access_token,
                  isPrimary: false,
                }
              })
              console.log(`User ${userId} added additional Shopify store: ${shopDomain}`)
            }
          }
        } else {
          // Set as primary connection
          await prisma.user.update({
            where: { id: userId },
            data: {
              shopifyDomain: shopDomain,
              shopifyAccessToken: tokenData.access_token,
            }
          })
          console.log(`User ${userId} set primary Shopify connection: ${shopDomain}`)
        }
      }
    }

    // Clear OAuth cookies
    cookieStore.delete('shopify_oauth_state')
    cookieStore.delete('shopify_shop')
    cookieStore.delete('shopify_nonce')

    console.log(`Shopify app installed successfully for: ${shop}`)

    // Redirect to dashboard with success
    return NextResponse.redirect(
      new URL(`/dashboard/settings/shopify?success=true&shop=${shopDomain}`, request.url)
    )

  } catch (error) {
    console.error('Shopify OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings/shopify?error=installation_failed', request.url)
    )
  }
}
