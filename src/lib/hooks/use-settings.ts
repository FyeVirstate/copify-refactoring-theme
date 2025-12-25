'use client'

import { useState, useCallback } from 'react'

interface UserSettings {
  profile: {
    id: number
    name: string
    email: string
    lang: string
    createdAt: string
  }
  shopify: {
    connected: boolean
    domain: string | null
    setupCompleted: boolean
  }
  subscription: {
    planName: string
    planIdentifier: string
    status: string
    currentPeriodEnd: string | null
  } | null
  credits: {
    generateProduct: number
    videoGeneration: number
    imageGeneration: number
    productExporter: number
    shopExporter: number
    importTheme: number
  }
  limits: {
    shopTracker: number
    productTracker: number
    productExport: number
    generateProduct: number
    videoGeneration: number
    imageGeneration: number
  } | null
  isOnTrial: boolean
  trialEndsAt: string | null
  nextCreditRenewalAt: string | null
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/settings')
      const data = await res.json()

      if (data.success) {
        setSettings(data.data)
        return data.data
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update settings
  const updateSettings = async (updates: {
    name?: string
    lang?: string
    currentPassword?: string
    newPassword?: string
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Refresh settings
      await fetchSettings()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    updateSettings,
  }
}
