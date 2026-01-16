'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

export interface TrackedShop {
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
    adsChange: number | null
    adsHistoryData: number[]
    adsHistoryDates: string[]
    monthlyVisits: number | null
    dailyRevenue: number | null
    monthlyRevenue: number | null
    estimatedOrders: number | null
    growthRate: number | null
    countries: Array<{ code: string; value: number }>
  } | null
}

export interface TrackingLimits {
  used: number
  max: number
  remaining: number
}

interface TrackedShopsResponse {
  success: boolean
  data: TrackedShop[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  limits: TrackingLimits
}

// Fetch tracked shops with pagination
async function fetchTrackedShops(
  page: number,
  perPage: number,
  signal?: AbortSignal
): Promise<TrackedShopsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    perPage: perPage.toString(),
  })

  const res = await fetch(`/api/track?${params}`, { signal })
  const data = await res.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch tracked shops')
  }

  return data
}

// Add shop to tracking
async function addShopToTracking(shopUrl?: string, shopId?: number) {
  const res = await fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shopUrl, shopId }),
  })

  const data = await res.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to add shop')
  }

  return data
}

// Remove shop from tracking
async function removeShopFromTracking(trackId?: number, shopId?: number) {
  const params = new URLSearchParams()
  if (trackId) params.set('id', trackId.toString())
  if (shopId) params.set('shopId', shopId.toString())

  const res = await fetch(`/api/track?${params}`, {
    method: 'DELETE',
  })

  const data = await res.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to remove shop')
  }

  return data
}

export function useTrackedShops(perPage: number = 20) {
  const queryClient = useQueryClient()

  // Infinite query for tracked shops
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['trackedShops', perPage],
    queryFn: ({ pageParam = 1, signal }) => fetchTrackedShops(pageParam, perPage, signal),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })

  // Flatten all pages into single array
  const trackedShops = data?.pages.flatMap(page => page.data) ?? []
  
  // Get limits from the first page (limits are the same across all pages)
  const limits = data?.pages[0]?.limits ?? null
  
  // Get total count
  const total = data?.pages[0]?.pagination.total ?? 0

  // Add shop mutation
  const addShopMutation = useMutation({
    mutationFn: ({ shopUrl, shopId }: { shopUrl?: string; shopId?: number }) => 
      addShopToTracking(shopUrl, shopId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['trackedShops'] })
    },
  })

  // Remove shop mutation
  const removeShopMutation = useMutation({
    mutationFn: ({ trackId, shopId }: { trackId?: number; shopId?: number }) => 
      removeShopFromTracking(trackId, shopId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['trackedShops'] })
    },
  })

  // Helper to add shop
  const addShop = useCallback(async (shopUrl?: string, shopId?: number) => {
    return addShopMutation.mutateAsync({ shopUrl, shopId })
  }, [addShopMutation])

  // Helper to remove shop
  const removeShop = useCallback(async (trackId?: number, shopId?: number) => {
    return removeShopMutation.mutateAsync({ trackId, shopId })
  }, [removeShopMutation])

  // Invalidate query
  const invalidateTrackedShops = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['trackedShops'] })
  }, [queryClient])

  return {
    trackedShops,
    limits,
    total,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error: error as Error | null,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    addShop,
    removeShop,
    isAddingShop: addShopMutation.isPending,
    isRemovingShop: removeShopMutation.isPending,
    refetch,
    invalidateTrackedShops,
  }
}
