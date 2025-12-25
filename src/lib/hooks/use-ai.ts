'use client'

import { useState } from 'react'

interface AICredits {
  generateProduct: number
  videoGeneration: number
  imageGeneration: number
  productExporter: number
  shopExporter: number
  importTheme: number
}

interface AnalysisResult {
  storeName: string
  verdict: {
    type: 'excellent' | 'medium' | 'avoid'
    text: string
    color: 'green' | 'orange' | 'red'
  }
  signals: Array<{
    type: 'positive' | 'negative'
    title: string
    description: string
  }>
  recommendations: {
    timing: { urgency: string; description: string }
    platform: { recommended: string; description: string }
    market: { suggested: string; description: string }
  }
  whyItWorks: string
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get AI credits
  const getCredits = async (): Promise<AICredits> => {
    const res = await fetch('/api/ai/credits')
    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    return data.data.credits
  }

  // Analyze a store
  const analyzeStore = async (storeData: {
    storeName: string
    monthlyTraffic?: number
    monthlyRevenue?: number
    revenueEvolution3Months?: number
    revenueEvolution1Month?: number
    geographicDistribution?: string
    trafficSources?: string
    activeAds?: number
    adsEvolution?: string
    launchDate?: string
    productCount?: number
  }): Promise<AnalysisResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/analyze-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Chat with AI about a store
  const chatAboutStore = async (chatData: {
    userQuestion: string
    storeName: string
    monthlyTraffic?: number
    monthlyRevenue?: number
    dailyRevenue?: number
    growthRate?: number
    revenueEvolution1Month?: number
    productCount?: number
    shopAgeMonths?: number
    currency?: string
  }): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatData),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      return data.data.response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chat failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Generate content
  const generateContent = async (params: {
    type: 'description' | 'ad_copy' | 'custom'
    prompt?: string
    productInfo?: {
      title: string
      price?: number
      currency?: string
      category?: string
      features?: string[]
      targetAudience?: string
      benefits?: string[]
    }
    platform?: 'facebook' | 'tiktok' | 'google'
  }): Promise<any> => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Content generation failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Generate image
  const generateImage = async (params: {
    imageUrl: string
    promptType?: 'lifestyle' | 'packshot' | 'image-text' | 'custom'
    customPrompt?: string
    aspectRatio?: string
    outputFormat?: string
  }): Promise<{
    id: number
    generatedImageUrl: string
    remainingCredits: number
  }> => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image generation failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    getCredits,
    analyzeStore,
    chatAboutStore,
    generateContent,
    generateImage,
  }
}
