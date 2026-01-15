'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

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
  sortOrder?: 'asc' | 'desc'
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
  origins?: string
  languages?: string
  domains?: string
  themes?: string
  applications?: string
  socialNetworks?: string
  shopCreationDate?: string
  minTrustpilotRating?: number
  maxTrustpilotRating?: number
  minTrustpilotReviews?: number
  maxTrustpilotReviews?: number
}

interface ShopsResponse {
  success: boolean
  data: Shop[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// API fetcher function
async function fetchShops(
  filters: ShopsFilters,
  page: number,
  perPage: number,
  signal?: AbortSignal
): Promise<ShopsResponse> {
  const params = new URLSearchParams()
  params.set('page', page.toString())
  params.set('perPage', perPage.toString())

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value.toString())
    }
  })

  const res = await fetch(`/api/shops?${params}`, { signal })
  
  if (!res.ok) {
    throw new Error('Failed to fetch shops')
  }
  
  const data = await res.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch shops')
  }
  
  return data
}

// Toggle track API
async function toggleTrackApi(shopId: number): Promise<{ success: boolean; data: { isTracked: boolean } }> {
  const res = await fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shopId }),
  })

  const data = await res.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to toggle tracking')
  }

  return data
}

// Generate query key for caching
function getShopsQueryKey(filters: ShopsFilters, page: number, perPage: number) {
  return ['shops', { filters, page, perPage }] as const
}

export function useShops(
  filters: ShopsFilters = {},
  page: number = 1,
  perPage: number = 25
) {
  const queryClient = useQueryClient()

  // Main shops query with TanStack Query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: getShopsQueryKey(filters, page, perPage),
    queryFn: ({ signal }) => fetchShops(filters, page, perPage, signal),
    placeholderData: (previousData) => previousData,
  })

  // Track mutation
  const trackMutation = useMutation({
    mutationFn: toggleTrackApi,
    onSuccess: (result, shopId) => {
      // Update the cache
      queryClient.setQueryData(
        getShopsQueryKey(filters, page, perPage),
        (old: ShopsResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map(shop =>
              shop.id === shopId
                ? { ...shop, isTracked: result.data.isTracked }
                : shop
            ),
          }
        }
      )
    },
  })

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    if (data && page < data.pagination.totalPages) {
      queryClient.prefetchQuery({
        queryKey: getShopsQueryKey(filters, page + 1, perPage),
        queryFn: ({ signal }) => fetchShops(filters, page + 1, perPage, signal),
      })
    }
  }, [queryClient, filters, page, perPage, data])

  // Prefetch previous page
  const prefetchPrevPage = useCallback(() => {
    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: getShopsQueryKey(filters, page - 1, perPage),
        queryFn: ({ signal }) => fetchShops(filters, page - 1, perPage, signal),
      })
    }
  }, [queryClient, filters, page, perPage])

  // Invalidate and refetch
  const invalidateShops = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['shops'] })
  }, [queryClient])

  return {
    // Data
    shops: data?.data ?? [],
    pagination: data?.pagination ?? { page: 1, perPage: 25, total: 0, totalPages: 0, hasMore: false },
    
    // Loading states
    isLoading,
    isFetching,
    
    // Error
    error: error instanceof Error ? error.message : null,
    
    // Actions
    refetch,
    toggleTrack: trackMutation.mutate,
    isTogglingTrack: trackMutation.isPending,
    
    // Prefetch
    prefetchNextPage,
    prefetchPrevPage,
    invalidateShops,
  }
}

export type { ShopsResponse }
