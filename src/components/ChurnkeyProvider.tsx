'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import Script from 'next/script'
import { useChurnkey } from '@/lib/hooks/use-churnkey'

interface ChurnkeyContextType {
  isReady: boolean
  isLoading: boolean
  hasStripeId: boolean
  showCancelFlow: () => void
  checkPause: () => void
  checkFailedPayment: () => void
}

const ChurnkeyContext = createContext<ChurnkeyContextType>({
  isReady: false,
  isLoading: false,
  hasStripeId: false,
  showCancelFlow: () => {},
  checkPause: () => {},
  checkFailedPayment: () => {},
})

export function useChurnkeyContext() {
  return useContext(ChurnkeyContext)
}

interface ChurnkeyProviderProps {
  children: ReactNode
}

export function ChurnkeyProvider({ children }: ChurnkeyProviderProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const { 
    config, 
    isReady, 
    isLoading, 
    fetchConfig, 
    showCancelFlow, 
    checkPause, 
    checkFailedPayment 
  } = useChurnkey()

  // Fetch config when component mounts
  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // Run checks once Churnkey is ready and we have config
  useEffect(() => {
    if (isReady && config && !initialized) {
      setInitialized(true)
      
      // Check for pause wall
      checkPause()
      
      // Check for failed payment wall (only if no active subscription and not on trial)
      if (!config.hasActiveSubscription && !config.isOnTrial) {
        // Small delay to not overwhelm with multiple modals
        setTimeout(() => {
          checkFailedPayment()
        }, 500)
      }
    }
  }, [isReady, config, initialized, checkPause, checkFailedPayment])

  const handleScriptLoad = useCallback(() => {
    setScriptLoaded(true)
  }, [])

  const appId = process.env.NEXT_PUBLIC_CHURNKEY_APP_ID || '3t28ew8c6'

  return (
    <ChurnkeyContext.Provider
      value={{
        isReady: isReady && scriptLoaded,
        isLoading,
        hasStripeId: !!config?.customerId,
        showCancelFlow,
        checkPause,
        checkFailedPayment,
      }}
    >
      {/* Churnkey Script Loader - matches Laravel implementation */}
      <Script
        id="churnkey-script"
        strategy="lazyOnload"
        src={`https://assets.churnkey.co/js/app.js?appId=${appId}`}
        onLoad={handleScriptLoad}
        onError={(e) => {
          console.error('[Churnkey] Script failed to load:', e)
        }}
      />
      
      {/* Inline script to initialize churnkey object early */}
      <Script
        id="churnkey-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function() {
              if (!window.churnkey || !window.churnkey.created) {
                window.churnkey = { created: true };
              }
            }();
          `,
        }}
      />
      
      {children}
    </ChurnkeyContext.Provider>
  )
}

/**
 * Cancel Button Component
 * Use this in settings or subscription management pages
 */
interface ChurnkeyCancelButtonProps {
  className?: string
  children?: ReactNode
}

export function ChurnkeyCancelButton({ className = '', children }: ChurnkeyCancelButtonProps) {
  const { isReady, hasStripeId, showCancelFlow, isLoading } = useChurnkeyContext()

  if (!hasStripeId) {
    return null
  }

  return (
    <button
      type="button"
      className={className}
      onClick={showCancelFlow}
      disabled={!isReady || isLoading}
    >
      {isLoading ? (
        <span className="spinner-border spinner-border-sm me-2" role="status" />
      ) : null}
      {children || 'Annuler l\'abonnement'}
    </button>
  )
}

export default ChurnkeyProvider
