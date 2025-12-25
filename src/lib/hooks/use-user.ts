'use client'

import { useSession } from "next-auth/react"

export function useUser() {
  const { data: session, status, update } = useSession()
  
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isOnTrial: session?.user?.isOnTrial ?? false,
    trialDaysRemaining: session?.user?.trialDaysRemaining,
    activePlan: session?.user?.activePlan,
    balances: session?.user?.balances,
    refreshSession: update,
  }
}

export function useCredits() {
  const { balances, activePlan } = useUser()
  
  return {
    // Current balances
    generateProduct: balances?.generateProduct ?? 0,
    videoGeneration: balances?.videoGeneration ?? 0,
    imageGeneration: balances?.imageGeneration ?? 0,
    productExporter: balances?.productExporter ?? 0,
    shopExporter: balances?.shopExporter ?? 0,
    importTheme: balances?.importTheme ?? 0,
    
    // Plan limits
    limits: {
      generateProduct: activePlan?.limitGenerateProduct ?? 0,
      videoGeneration: activePlan?.limitVideoGeneration ?? 0,
      imageGeneration: activePlan?.limitImageGeneration ?? 0,
      productExport: activePlan?.limitProductExport ?? 0,
      topShops: activePlan?.topShopsCount ?? 0,
      topProducts: activePlan?.topProductsCount ?? 0,
      topAds: activePlan?.topAdsCount ?? 0,
    },
    
    // Helper functions
    hasCredits: (type: 'generateProduct' | 'videoGeneration' | 'imageGeneration' | 'productExporter') => {
      return (balances?.[type] ?? 0) > 0
    },
    
    canAccess: (feature: 'topShops' | 'topProducts' | 'topAds') => {
      const featureMap = {
        topShops: activePlan?.topShopsCount,
        topProducts: activePlan?.topProductsCount,
        topAds: activePlan?.topAdsCount,
      }
      return (featureMap[feature] ?? 0) > 0
    }
  }
}
