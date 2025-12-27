'use client'

import { useState, useCallback, useRef } from 'react'

export interface Shop {
  id: number
  position: number
  url: string
  name: string | null
  screenshot: string | null
  country: string | null
  currency: string | null
  productsCount: number
  activeAds: number
  adsChange: number
  adsHistoryData: number[]
  monthlyVisits: number
  trafficChange: number
  trafficGrowth: number
  trafficData: number[]
  trafficDates: string[]
  estimatedMonthly: number
  dailyRevenue: number
  marketCountries: { code: string; share: number }[]
  bestProduct: {
    id: number
    name: string
    handle: string
    price: number
    image: string | null
    currency: string
  } | null
  bestAds: {
    id: number
    type: string
    video_link: string | null
    video_preview_link: string | null
    image_link: string | null
  }[]
  isTracked: boolean
  createdAt: string | null
}

export interface ShopsFilters {
  search?: string
  sortBy?: string
  minRevenue?: number
  maxRevenue?: number
  minTraffic?: number
  maxTraffic?: number
  minProducts?: number
  maxProducts?: number
  minActiveAds?: number
  maxActiveAds?: number
  minTrafficGrowth?: number
  maxTrafficGrowth?: number
  minPrice?: number
  maxPrice?: number
  minCatalogSize?: number
  maxCatalogSize?: number
  minOrders?: number
  maxOrders?: number
  currency?: string
  country?: string
  category?: string
  pixels?: string
  // Note: origins uses 'country' column (shop country, not traffic market)
  origins?: string
  // Note: languages maps to 'locale' column in database
  languages?: string
  // Note: domains searches in 'url' column
  domains?: string
  // Note: themes searches in 'theme' column
  themes?: string
  // Note: applications searches in 'apps' column
  applications?: string
  shopCreationDate?: string
}

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  })
  
  // AbortController ref to cancel previous requests
  const abortControllerRef = useRef<AbortController | null>(null)
  // Request counter to track the latest request
  const requestIdRef = useRef(0)

  // Fetch shops with filters
  const fetchShops = useCallback(async (
    filters: ShopsFilters = {},
    page = 1,
    perPage = 20
  ) => {
    // Only cancel previous request if this is a fresh search (page 1)
    if (page === 1) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    
    // Create new AbortController for this request
    const controller = new AbortController()
    if (page === 1) {
      abortControllerRef.current = controller
    }
    
    // Increment request ID to track this request
    const currentRequestId = ++requestIdRef.current
    
    if (page === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('perPage', perPage.toString())

      // Add all filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value.toString())
        }
      })

      const res = await fetch(`/api/shops?${params}`, {
        signal: controller.signal
      })
      
      // If this is not the latest request (page 1 only), ignore the response
      if (page === 1 && currentRequestId !== requestIdRef.current) {
        return null
      }
      
      const data = await res.json()

      if (data.success) {
        if (page === 1) {
          setShops(data.data)
        } else {
          setShops(prev => [...prev, ...data.data])
        }
        setPagination(data.pagination)
        setHasMore(data.pagination.hasMore)
        return data
      } else {
        throw new Error(data.error || 'Failed to fetch shops')
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return null
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch shops')
      throw err
    } finally {
      // Only set loading to false if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }, [])

  // Fetch more shops (for infinite scroll)
  const fetchMoreShops = useCallback(async (filters: ShopsFilters = {}) => {
    if (isLoadingMore || !hasMore) return
    
    const nextPage = pagination.page + 1
    return fetchShops(filters, nextPage, pagination.perPage)
  }, [fetchShops, pagination, isLoadingMore, hasMore])

  // Toggle shop tracking
  const toggleTrack = async (shopId: number) => {
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId }),
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    // Update local state
    setShops(prev => prev.map(shop => 
      shop.id === shopId 
        ? { ...shop, isTracked: !shop.isTracked }
        : shop
    ))

    return data
  }

  return {
    shops,
    pagination,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchShops,
    fetchMoreShops,
    toggleTrack,
  }
}
