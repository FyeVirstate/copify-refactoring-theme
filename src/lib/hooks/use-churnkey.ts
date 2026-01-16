'use client'

import { useState, useCallback, useEffect } from 'react'

interface ChurnkeyConfig {
  customerId: string
  authHash: string
  appId: string
  mode: string
  lang: string
  hasActiveSubscription: boolean
  isOnTrial: boolean
  subscription: {
    status: string
    planIdentifier: string
    endsAt: string | null
  } | null
  plan: {
    title: string
    price: number
    identifier: string
    limitGenerateProduct: number
    limitShopTracker: number
    limitProductExporter: number
    limitShopExporter: number
    topShopsCount: number
    topProductsCount: number
  } | null
}

interface UseChurnkeyReturn {
  config: ChurnkeyConfig | null
  isLoading: boolean
  error: string | null
  isReady: boolean
  showCancelFlow: () => void
  checkPause: () => void
  checkFailedPayment: () => void
  fetchConfig: () => Promise<ChurnkeyConfig | null>
}

// Extend Window interface for Churnkey
declare global {
  interface Window {
    churnkey?: {
      created?: boolean
      init: (action: string, options: ChurnkeyInitOptions) => void
      check: (type: string, options: ChurnkeyCheckOptions) => void
    }
  }
}

interface ChurnkeyInitOptions {
  customerId: string
  authHash: string
  appId: string
  mode: string
  provider: string
  record?: boolean
  customerAttributes?: Record<string, string>
  i18n?: { lang: string }
  handleCancel?: (customer: unknown, surveyAnswer: unknown) => Promise<void>
}

interface ChurnkeyCheckOptions {
  customerId: string
  authHash: string
  appId: string
  mode: string
  provider: string
  softWall?: boolean
  forceCheck?: boolean
  gracePeriodDays?: number
  customerAttributes?: Record<string, string>
  i18n?: { lang: string }
  onError?: (error: unknown, type: string) => void
  onUpdatePaymentInformation?: (customer: unknown) => void
}

export function useChurnkey(): UseChurnkeyReturn {
  const [config, setConfig] = useState<ChurnkeyConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Check if Churnkey script is loaded
  useEffect(() => {
    const checkReady = () => {
      if (window.churnkey?.created) {
        setIsReady(true)
        return true
      }
      return false
    }

    if (checkReady()) return

    // Poll for Churnkey to be ready
    const interval = setInterval(() => {
      if (checkReady()) {
        clearInterval(interval)
      }
    }, 100)

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  // Fetch Churnkey config from API
  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/churnkey/hash')
      const data = await res.json()

      if (data.success) {
        setConfig(data)
        return data
      } else {
        if (data.hasStripeId === false) {
          // User doesn't have a Stripe ID yet, not an error
          return null
        }
        throw new Error(data.error || 'Failed to fetch Churnkey config')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Churnkey config'
      setError(message)
      console.error('[Churnkey] Error fetching config:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Show cancellation flow
  const showCancelFlow = useCallback(() => {
    if (!isReady || !config || !window.churnkey) {
      console.warn('[Churnkey] Not ready or no config')
      return
    }

    window.churnkey.init('show', {
      customerId: config.customerId,
      authHash: config.authHash,
      appId: config.appId,
      mode: config.mode,
      provider: 'stripe',
      record: true,
      customerAttributes: {
        language: config.lang,
      },
      i18n: {
        lang: config.lang,
      },
      handleCancel: async (customer, surveyAnswer) => {
        try {
          // Call our API to cancel the subscription
          const res = await fetch('/api/billing/subscription', {
            method: 'DELETE',
          })

          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Failed to cancel subscription')
          }

          // Reload to reflect changes
          window.location.reload()
        } catch (err) {
          console.error('[Churnkey] Cancel error:', err)
          throw { message: 'Failed to cancel subscription. Please contact support.' }
        }
      },
    })
  }, [isReady, config])

  // Check for paused subscription
  const checkPause = useCallback(() => {
    if (!isReady || !config || !window.churnkey) {
      return
    }

    window.churnkey.check('pause', {
      customerId: config.customerId,
      authHash: config.authHash,
      appId: config.appId,
      mode: config.mode,
      provider: 'stripe',
      softWall: false,
      forceCheck: false,
      customerAttributes: {
        language: config.lang,
      },
      i18n: {
        lang: config.lang,
      },
      onError: (error, type) => {
        console.log(`[Churnkey] Pause check error - ${type}:`, error)
      },
    })
  }, [isReady, config])

  // Check for failed payment
  const checkFailedPayment = useCallback(() => {
    if (!isReady || !config || !window.churnkey) {
      return
    }

    // Only check if user has no active subscription and is not on trial
    if (config.hasActiveSubscription || config.isOnTrial) {
      return
    }

    window.churnkey.check('failed-payment', {
      customerId: config.customerId,
      authHash: config.authHash,
      appId: config.appId,
      mode: config.mode,
      provider: 'stripe',
      softWall: true,
      gracePeriodDays: 0,
      forceCheck: true,
      customerAttributes: {
        language: config.lang,
      },
      i18n: {
        lang: config.lang,
      },
      onError: (error, type) => {
        console.log(`[Churnkey] Failed payment check error - ${type}:`, error)
      },
      onUpdatePaymentInformation: async (customer) => {
        console.log('[Churnkey] Payment information updated:', customer)
        // Optionally refresh subscription status
        try {
          await fetch('/api/billing/subscription', {
            method: 'PATCH',
          })
        } catch (err) {
          console.error('[Churnkey] Error updating subscription:', err)
        }
      },
    })
  }, [isReady, config])

  return {
    config,
    isLoading,
    error,
    isReady,
    showCancelFlow,
    checkPause,
    checkFailedPayment,
    fetchConfig,
  }
}
