'use client'

import { useUser } from "./use-user"
import { useStats } from "@/contexts/StatsContext"
import { useCallback } from "react"
import { toast } from "@/components/ui/toast"

export type SubscriptionStatus = 
  | 'active'        // Has active subscription
  | 'trial'         // On free trial
  | 'trial_ended'   // Trial ended, no subscription
  | 'subscription_ended'  // Had subscription, now ended
  | 'payment_failed'      // Payment failed
  | 'loading'

export interface SubscriptionState {
  status: SubscriptionStatus
  isExpired: boolean
  isBlocked: boolean
  isOnTrial: boolean
  isPro: boolean
  isBasic: boolean
  isUnlimited: boolean
  trialDaysRemaining?: number
  planIdentifier?: string
  planTitle?: string
}

export function useSubscription() {
  const { user, isLoading, activePlan, isOnTrial, trialDaysRemaining } = useUser()
  const { stats, loading: statsLoading } = useStats()

  // Determine subscription status
  const getSubscriptionState = useCallback((): SubscriptionState => {
    if (isLoading || statsLoading) {
      return {
        status: 'loading',
        isExpired: false,
        isBlocked: false,
        isOnTrial: false,
        isPro: false,
        isBasic: false,
        isUnlimited: false,
      }
    }

    const planId = activePlan?.identifier || stats?.plan?.identifier

    // Check if on active trial
    if (isOnTrial || stats?.plan?.isOnTrial) {
      return {
        status: 'trial',
        isExpired: false,
        isBlocked: false,
        isOnTrial: true,
        isPro: false,
        isBasic: false,
        isUnlimited: false,
        trialDaysRemaining: trialDaysRemaining || stats?.plan?.trialDaysRemaining,
        planIdentifier: 'trial',
        planTitle: activePlan?.title || 'Essai gratuit',
      }
    }

    // Check if expired
    if (planId === 'expired' || stats?.plan?.isExpired) {
      // Check if user ever had a subscription (to differentiate trial_ended vs subscription_ended)
      // For now, we'll default to trial_ended if no subscription history
      return {
        status: 'trial_ended',
        isExpired: true,
        isBlocked: true,
        isOnTrial: false,
        isPro: false,
        isBasic: false,
        isUnlimited: false,
        planIdentifier: 'expired',
        planTitle: 'Expiré',
      }
    }

    // Active subscription
    const isPro = planId === 'pro' || stats?.plan?.isPro
    const isBasic = planId === 'basic' || stats?.plan?.isBasic
    const isUnlimited = planId === 'unlimited' || stats?.plan?.isUnlimited

    return {
      status: 'active',
      isExpired: false,
      isBlocked: false,
      isOnTrial: false,
      isPro: !!isPro,
      isBasic: !!isBasic,
      isUnlimited: !!isUnlimited,
      planIdentifier: planId,
      planTitle: activePlan?.title || stats?.plan?.title,
    }
  }, [isLoading, statsLoading, activePlan, stats, isOnTrial, trialDaysRemaining])

  const state = getSubscriptionState()

  // Helper to check if a feature is accessible
  const canAccessFeature = useCallback((feature: string): boolean => {
    if (state.isBlocked) {
      return false
    }
    return true
  }, [state.isBlocked])

  // Helper to show blocked message and return false if blocked
  const requireActiveSubscription = useCallback((featureName?: string): boolean => {
    if (state.isBlocked) {
      const message = featureName 
        ? `Votre essai gratuit est terminé. Abonnez-vous pour accéder à "${featureName}".`
        : "Votre essai gratuit est terminé. Veuillez vous abonner pour continuer."
      
      toast.error(message)
      return false
    }
    return true
  }, [state.isBlocked])

  // Helper for API calls - returns error response if blocked
  const checkApiAccess = useCallback((): { allowed: boolean; response?: Response } => {
    if (state.isBlocked) {
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            success: false,
            error: 'subscription_expired',
            message: 'Votre abonnement a expiré. Veuillez vous abonner pour continuer.',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      }
    }
    return { allowed: true }
  }, [state.isBlocked])

  return {
    ...state,
    isLoading: isLoading || statsLoading,
    canAccessFeature,
    requireActiveSubscription,
    checkApiAccess,
  }
}

// Export error message constants for consistency
export const SUBSCRIPTION_ERROR_MESSAGES = {
  TRIAL_ENDED: {
    title: "Essai gratuit terminé",
    description: "Votre essai gratuit est terminé. Abonnez-vous pour continuer à utiliser toutes les fonctionnalités.",
  },
  SUBSCRIPTION_ENDED: {
    title: "Abonnement expiré",
    description: "Votre abonnement a expiré. Renouvelez votre abonnement pour continuer.",
  },
  PAYMENT_FAILED: {
    title: "Paiement échoué",
    description: "Votre paiement a échoué. Veuillez mettre à jour vos informations de paiement.",
  },
  FEATURE_BLOCKED: (feature: string) => ({
    title: "Fonctionnalité bloquée",
    description: `Abonnez-vous pour accéder à "${feature}".`,
  }),
  GENERIC_BLOCKED: {
    title: "Accès bloqué",
    description: "Veuillez vous abonner pour accéder à cette fonctionnalité.",
  },
}
