'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

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
function getAdsQueryKey(filters: AdsFilters, perPage: number) {
  return ['ads-infinite', { filters, perPage }] as const
}

export function useAds(
  filters: AdsFilters = {},
  _page: number = 1, // Ignored for infinite scroll, kept for backwards compatibility
  perPage: number = 25
) {
  const queryClient = useQueryClient()

  // Infinite query for ads
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: getAdsQueryKey(filters, perPage),
    queryFn: ({ pageParam = 1, signal }) => fetchAds(filters, pageParam, perPage, signal),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })

  // Flatten all pages into a single array + deduplicate by shop + filter invalid media
  const { ads, seenShopIds } = useMemo(() => {
    if (!data?.pages) return { ads: [], seenShopIds: new Set<number>() }
    
    const allAds: Ad[] = []
    const seen = new Set<number>()
    
    for (const page of data.pages) {
      for (const ad of page.data) {
        // Skip ads without valid media (no image and no video)
        const hasValidImage = ad.imageLink && ad.imageLink !== '' && !ad.imageLink.includes('img_not_found')
        const hasValidVideo = ad.videoUrl && ad.videoUrl !== ''
        if (!hasValidImage && !hasValidVideo) continue
        
        // Deduplicate by shop - 1 ad per shop
        const shopId = ad.shopId ?? 0
        if (!seen.has(shopId)) {
          allAds.push(ad)
          seen.add(shopId)
        }
      }
    }
    
    return { ads: allAds, seenShopIds: seen }
  }, [data?.pages])

  // Get pagination info from last page
  const pagination = useMemo(() => {
    if (!data?.pages?.length) {
      return { page: 1, perPage: 25, total: 0, totalPages: 0, hasMore: false }
    }
    const lastPage = data.pages[data.pages.length - 1]
    return {
      ...lastPage.pagination,
      hasMore: hasNextPage ?? false,
    }
  }, [data?.pages, hasNextPage])

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: toggleFavoriteApi,
    onSuccess: (result, adId) => {
      // Update the cache for all pages
      queryClient.setQueryData(
        getAdsQueryKey(filters, perPage),
        (old: typeof data) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(ad =>
                ad.id === adId
                  ? { ...ad, isFavorited: result.data.isFavorited }
                  : ad
              ),
            })),
          }
        }
      )
    },
  })

  // Invalidate and refetch - reset to first page
  const invalidateAds = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ads-infinite'] })
  }, [queryClient])

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return {
    // Data
    ads,
    pagination,
    
    // Loading states
    isLoading,
    isFetching,
    isFetchingNextPage,
    
    // Infinite scroll
    hasNextPage: hasNextPage ?? false,
    loadMore,
    
    // Error
    error: error instanceof Error ? error.message : null,
    
    // Actions
    refetch,
    toggleFavorite: favoriteMutation.mutate,
    isTogglingFavorite: favoriteMutation.isPending,
    
    // Legacy - kept for backwards compatibility
    prefetchNextPage: loadMore,
    prefetchPrevPage: () => {},
    invalidateAds,
  }
}

export type { AdsResponse }
