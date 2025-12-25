/**
 * Shopify App Install Route
 * Initiates OAuth flow for Shopify app installation
 * 
 * GET /api/shopify/install?shop=mystore.myshopify.com
 */

import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { generateAuthUrl } from "@/lib/services/shopify"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get('shop')

  if (!shop) {
    // Return install page or redirect to install form
    return NextResponse.redirect(new URL('/dashboard/settings/shopify', request.url))
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID()
  const nonce = crypto.randomUUID()

  // Normalize shop domain
  const shopDomain = shop.replace('.myshopify.com', '') + '.myshopify.com'

  // Store state in cookie for verification in callback
  const cookieStore = await cookies()
  cookieStore.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  })
  cookieStore.set('shopify_shop', shopDomain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
  })
  cookieStore.set('shopify_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
  })

  // Generate OAuth URL and redirect
  const authUrl = generateAuthUrl(shopDomain, state)
  
  console.log(`Shopify app installation requested for: ${shopDomain}`)
  console.log(`Generated OAuth URL: ${authUrl}`)

  return NextResponse.redirect(authUrl)
}
