'use client'

import { loadStripe } from '@stripe/stripe-js'
import type { Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Redirect to Stripe Checkout using session ID
export async function redirectToCheckout(sessionId: string) {
  const stripe = await getStripe()
  if (!stripe) {
    throw new Error('Stripe failed to load')
  }
  
  // Use type assertion to access redirectToCheckout (still available but not in latest types)
  const stripeWithCheckout = stripe as Stripe & {
    redirectToCheckout: (options: { sessionId: string }) => Promise<{ error?: { message: string } }>
  }
  
  const result = await stripeWithCheckout.redirectToCheckout({ sessionId })
  if (result.error) {
    throw new Error(result.error.message)
  }
}

// Alternative: Redirect using checkout URL directly (preferred for server-side sessions)
export function redirectToCheckoutUrl(url: string) {
  window.location.href = url
}
