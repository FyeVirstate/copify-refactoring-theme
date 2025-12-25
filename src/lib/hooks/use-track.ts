'use client'

import { useState, useCallback } from 'react'

interface TrackedShop {
  id: number
  shopId: number
  addedAt: string
  shop: {
    id: number
    url: string
    name: string | null
    screenshot: string | null
    country: string | null
    currency: string | null
    productsCount: number | null
    theme: string | null
    activeAds: number | null
    // Traffic data
    monthlyVisits: number | null
    dailyRevenue: number | null
    monthlyRevenue: number | null
    estimatedOrders: number | null
    growthRate: number | null
    countries: Array<{ code: string; value: number }>
  } | null
}

interface TrackingLimits {
  used: number
  max: number
  remaining: number
}

interface ShopDetails {
  shop: {
    id: number
    url: string
    name: string | null
    country: string | null
    currency: string | null
    productsCount: number | null
    theme: string | null
    screenshot: string | null
    trustpilotScore: number | null
    trustpilotReviews: number | null
    category: string | null
  }
  metrics: {
    monthlyRevenue: number
    revenueGrowth: string
    monthlyVisits: number
    visitsGrowth: string
    dailyRevenue: number | null
    activeAds: number | null
  }
  chartData: Array<{
    date: string
    visits: number
    uniqueVisitors: number
  }>
  topProducts: Array<{
    id: number
    handle: string
    title: string
    vendor: string | null
    price: number | null
    compareAtPrice: number | null
    imageUrl: string | null
  }>
  activeAds: Array<{
    id: number
    adId: string | null
    pageName: string | null
    mediaType: string | null
    imageLink: string | null
    videoPreview: string | null
    videoLink: string | null
    caption: string | null
    ctaText: string | null
    performanceScore: number | null
    firstSeenDate: string
    lastSeenDate: string
  }>
  trackedSince: string
}

export function useTrack() {
  const [trackedShops, setTrackedShops] = useState<TrackedShop[]>([])
  const [limits, setLimits] = useState<TrackingLimits | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch tracked shops
  const fetchTrackedShops = useCallback(async (page = 1, perPage = 10) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/track?page=${page}&perPage=${perPage}`)
      const data = await res.json()

      if (data.success) {
        setTrackedShops(data.data)
        setLimits(data.limits)
        return {
          data: data.data,
          pagination: data.pagination,
          limits: data.limits,
        }
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracked shops')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add shop to tracking
  const addShop = async (shopUrl?: string, shopId?: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopUrl, shopId }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Refresh the list
      await fetchTrackedShops()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add shop'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Remove shop from tracking
  const removeShop = async (trackId?: number, shopId?: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (trackId) params.set('id', trackId.toString())
      if (shopId) params.set('shopId', shopId.toString())

      const res = await fetch(`/api/track?${params}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Refresh the list
      await fetchTrackedShops()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove shop'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Get shop details
  const getShopDetails = useCallback(async (shopId: number): Promise<ShopDetails> => {
    const res = await fetch(`/api/track/${shopId}`)
    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    return data.data
  }, [])

  return {
    trackedShops,
    limits,
    isLoading,
    error,
    fetchTrackedShops,
    addShop,
    removeShop,
    getShopDetails,
  }
}
