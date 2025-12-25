'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Plan {
  id: number
  identifier: string
  title: string
  titleFr: string | null
  price: number
  currency?: string
  interval?: string
  stripeId: string | null
  features?: string[]
  popular?: boolean
  limits: {
    shopTracker: number
    productTracker: number
    productExport: number
    generateProduct: number
    videoGeneration: number
    imageGeneration: number
    topShops: number
    topProducts: number
    topAds: number
    maxLicenses: number
  }
}

interface Subscription {
  id: number
  status: string
  planIdentifier: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  trialEndsAt: string | null
}

interface SubscriptionData {
  hasSubscription: boolean
  subscription: Subscription | null
  plan: Plan | null
  isOnTrial: boolean
  trialDaysRemaining?: number
}

interface Invoice {
  id: number
  amount: number
  currency: string
  status: string
  paidAt: string
  invoiceUrl: string | null
  pdfUrl: string | null
}

export function useBilling() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)

  // Fetch available plans
  const fetchPlans = useCallback(async (): Promise<Plan[]> => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/billing/plans')
      const data = await res.json()
      const fetchedPlans = data.plans || []
      setPlans(fetchedPlans)
      return fetchedPlans
    } catch (err) {
      console.error('Failed to fetch plans:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch current subscription
  const fetchSubscription = async (): Promise<SubscriptionData> => {
    const res = await fetch('/api/billing/subscription')
    return res.json()
  }

  // Fetch invoices
  const fetchInvoices = async (page = 1): Promise<{ data: Invoice[], pagination: any }> => {
    const res = await fetch(`/api/billing/invoices?page=${page}`)
    return res.json()
  }

  // Subscribe to a plan
  const subscribe = async (planIdentifier: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planIdentifier }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Open billing portal
  const openBillingPortal = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel subscription
  const cancelSubscription = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      router.refresh()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Resume subscription
  const resumeSubscription = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'PATCH',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resume subscription')
      }

      router.refresh()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    plans,
    currentPlan,
    fetchPlans,
    fetchSubscription,
    fetchInvoices,
    subscribe,
    openBillingPortal,
    cancelSubscription,
    resumeSubscription,
  }
}
