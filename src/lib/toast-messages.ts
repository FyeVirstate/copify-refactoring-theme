import { toast } from '@/components/ui/toast'

/**
 * Uniform toast messages for subscription and feature blocking
 */
export const showSubscriptionToast = {
  /**
   * Show toast when trial has ended
   */
  trialEnded: () => {
    toast.error('Essai gratuit terminé. Abonnez-vous pour continuer à utiliser Copyfy.')
  },

  /**
   * Show toast when subscription has ended
   */
  subscriptionEnded: () => {
    toast.error('Votre abonnement a expiré. Renouvelez pour continuer.')
  },

  /**
   * Show toast when payment has failed
   */
  paymentFailed: () => {
    toast.error('Votre paiement a échoué. Veuillez mettre à jour vos informations.')
  },

  /**
   * Show toast when a specific feature is blocked
   */
  featureBlocked: (featureName: string) => {
    toast.error(`Abonnez-vous pour accéder à "${featureName}".`)
  },

  /**
   * Show generic access blocked toast
   */
  accessBlocked: () => {
    toast.error('Veuillez vous abonner pour accéder à cette fonctionnalité.')
  },

  /**
   * Show toast when credits are exhausted
   */
  noCredits: (creditType: string) => {
    toast.error(`Vous n'avez plus de crédits pour ${creditType}. Mettez à niveau votre plan.`)
  },

  /**
   * Show toast when plan limit is reached
   */
  limitReached: (limitType: string) => {
    toast.warning(`Vous avez atteint la limite de ${limitType} de votre plan.`)
  },
}

/**
 * Handle API error responses and show appropriate toast
 */
export function handleApiError(error: unknown, fallbackMessage?: string) {
  // Check if it's a subscription error from our API
  if (error && typeof error === 'object') {
    const err = error as { error?: string; message?: string }
    
    if (err.error === 'subscription_expired') {
      showSubscriptionToast.trialEnded()
      return
    }
    
    if (err.error === 'feature_blocked') {
      showSubscriptionToast.accessBlocked()
      return
    }
    
    if (err.error === 'no_credits') {
      showSubscriptionToast.noCredits(err.message || 'cette action')
      return
    }
  }
  
  // Generic error toast
  toast.error(fallbackMessage || 'Une erreur est survenue. Veuillez réessayer.')
}

/**
 * Parse fetch response and handle subscription errors
 * Returns the data if successful, throws if error
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  
  if (!response.ok) {
    // Check for subscription errors
    if (response.status === 403 && data.error === 'subscription_expired') {
      showSubscriptionToast.trialEnded()
      throw new Error('subscription_expired')
    }
    
    if (response.status === 403 && data.error === 'feature_blocked') {
      showSubscriptionToast.featureBlocked(data.feature || 'cette fonctionnalité')
      throw new Error('feature_blocked')
    }
    
    throw new Error(data.message || data.error || 'API Error')
  }
  
  return data as T
}
