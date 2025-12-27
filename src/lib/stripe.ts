import Stripe from 'stripe'

// Create stripe instance lazily to avoid build-time errors
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    // Support both STRIPE_SECRET and STRIPE_SECRET_KEY for compatibility
    const stripeKey = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET is not set')
    }
    stripeInstance = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}

// Legacy export for compatibility (will throw if used during build)
const stripeKey = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY
export const stripe = stripeKey 
  ? new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : (null as unknown as Stripe)

// Helper to get or create a Stripe customer
export async function getOrCreateStripeCustomer(
  userId: number,
  email: string,
  name: string,
  existingCustomerId?: string | null
): Promise<string> {
  if (existingCustomerId) {
    return existingCustomerId
  }

  const stripeClient = getStripe()
  const customer = await stripeClient.customers.create({
    email,
    name,
    metadata: {
      userId: userId.toString(),
    },
  })

  return customer.id
}

// Format amount for display
export function formatAmount(amount: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}
