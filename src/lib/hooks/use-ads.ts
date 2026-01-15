'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

export interface Ad {
  id: number
  adArchiveId: string | null
  adCreativeId: string | null
  pageId: string | null
  pageName: string | null
  shopId: number | null
  shopUrl: string | null
  shopName: string | null
  shopCountry: string | null
  shopActiveAds: number
  shopScreenshot: string | null
  title: string | null
  body: string | null
  description: string | null
  mediaType: string | null
  imageLink: string | null
  videoUrl: string | null
  videoPreview: string | null
  targetUrl: string | null
  ctaText: string | null
  startDate: string | null
  firstSeenDate: string | null
  endDate: string | null
  lastSeenDate: string | null
  status: string | null
  isActive: boolean
  platform: string | null
  activeDays: number
  adLibraryUrl: string | null
  isFavorited: boolean
  lastMonthVisits: number
  estimatedMonthly: number
  growthRate: number
}

export interface AdsFilters {
  search?: string
  status?: string
  mediaType?: string
  cta?: string
  ctas?: string
  country?: string
  market?: string
  category?: string
  niche?: string
  minScore?: number
  maxScore?: number
  minActiveAds?: number
  maxActiveAds?: number
  minVisits?: number
  maxVisits?: number
  minRevenue?: number
  maxRevenue?: number
  minGrowth?: number
  maxGrowth?: number
  dateFilter?: string
  euTransparency?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  minOrders?: number
  maxOrders?: number
  shopCreationDate?: string
  currencies?: string
  pixels?: string
  origins?: string
  languages?: string
  domains?: string
  minTrustpilotRating?: number
  maxTrustpilotRating?: number
  minTrustpilotReviews?: number
  maxTrustpilotReviews?: number
  themes?: string
  apps?: string
  socialNetworks?: string
  minPrice?: number
  maxPrice?: number
  minCatalogSize?: number
  maxCatalogSize?: number
}

interface AdsResponse {
  success: boolean
  data: Ad[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// API fetcher function
async function fetchAds(
  filters: AdsFilters,
  page: number,
  perPage: number,
  signal?: AbortSignal
): Promise<AdsResponse> {
  const params = new URLSearchParams()
  params.set('page', page.toString())
  params.set('perPage', perPage.toString())

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value.toString())
    }
  })

  const res = await fetch(`/api/ads?${params}`, { signal })
  
  if (!res.ok) {
    throw new Error('Failed to fetch ads')
  }
  
  const data = await res.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch ads')
  }
  
  return data
}

// Toggle favorite API
async function toggleFavoriteApi(adId: number): Promise<{ success: boolean; data: { isFavorited: boolean } }> {
  const res = await fetch('/api/ads/favorite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adId }),
  })

  const data = await res.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to toggle favorite')
  }

  return data
}

// Generate query key for caching
function getAdsQueryKey(filters: AdsFilters, page: number, perPage: number) {
  return ['ads', { filters, page, perPage }] as const
}

export function useAds(
  filters: AdsFilters = {},
  page: number = 1,
  perPage: number = 25
) {
  const queryClient = useQueryClient()

  // Main ads query with TanStack Query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: getAdsQueryKey(filters, page, perPage),
    queryFn: ({ signal }) => fetchAds(filters, page, perPage, signal),
    placeholderData: (previousData) => previousData,
  })

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: toggleFavoriteApi,
    onSuccess: (result, adId) => {
      // Update the cache
      queryClient.setQueryData(
        getAdsQueryKey(filters, page, perPage),
        (old: AdsResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map(ad =>
              ad.id === adId
                ? { ...ad, isFavorited: result.data.isFavorited }
                : ad
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
        queryKey: getAdsQueryKey(filters, page + 1, perPage),
        queryFn: ({ signal }) => fetchAds(filters, page + 1, perPage, signal),
      })
    }
  }, [queryClient, filters, page, perPage, data])

  // Prefetch previous page
  const prefetchPrevPage = useCallback(() => {
    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: getAdsQueryKey(filters, page - 1, perPage),
        queryFn: ({ signal }) => fetchAds(filters, page - 1, perPage, signal),
      })
    }
  }, [queryClient, filters, page, perPage])

  // Invalidate and refetch
  const invalidateAds = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ads'] })
  }, [queryClient])

  return {
    // Data
    ads: data?.data ?? [],
    pagination: data?.pagination ?? { page: 1, perPage: 25, total: 0, totalPages: 0, hasMore: false },
    
    // Loading states
    isLoading,
    isFetching,
    
    // Error
    error: error instanceof Error ? error.message : null,
    
    // Actions
    refetch,
    toggleFavorite: favoriteMutation.mutate,
    isTogglingFavorite: favoriteMutation.isPending,
    
    // Prefetch
    prefetchNextPage,
    prefetchPrevPage,
    invalidateAds,
  }
}

export type { AdsResponse }
