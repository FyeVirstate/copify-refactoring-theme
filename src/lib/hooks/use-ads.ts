'use client'

import { useState, useCallback } from 'react'

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
  status?: string // all, active, inactive
  mediaType?: string // video, image
  cta?: string
  ctas?: string[]
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
}

export interface AdsPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasMore: boolean
}

export function useAds() {
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [pagination, setPagination] = useState<AdsPagination>({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })

  // Build query params from filters
  const buildQueryParams = (filters: AdsFilters, page: number, perPage: number) => {
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('perPage', perPage.toString())

    if (filters.search) params.set('search', filters.search)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    if (filters.mediaType) params.set('mediaType', filters.mediaType)
    if (filters.cta) params.set('cta', filters.cta)
    if (filters.ctas?.length) params.set('ctas', filters.ctas.join(','))
    if (filters.country) params.set('country', filters.country)
    if (filters.market) params.set('market', filters.market)
    if (filters.category) params.set('category', filters.category)
    if (filters.niche) params.set('niche', filters.niche)
    if (filters.minScore !== undefined) params.set('minScore', filters.minScore.toString())
    if (filters.maxScore !== undefined) params.set('maxScore', filters.maxScore.toString())
    if (filters.minActiveAds !== undefined) params.set('minActiveAds', filters.minActiveAds.toString())
    if (filters.maxActiveAds !== undefined) params.set('maxActiveAds', filters.maxActiveAds.toString())
    if (filters.minVisits !== undefined) params.set('minVisits', filters.minVisits.toString())
    if (filters.maxVisits !== undefined) params.set('maxVisits', filters.maxVisits.toString())
    if (filters.minRevenue !== undefined) params.set('minRevenue', filters.minRevenue.toString())
    if (filters.maxRevenue !== undefined) params.set('maxRevenue', filters.maxRevenue.toString())
    if (filters.minGrowth !== undefined) params.set('minGrowth', filters.minGrowth.toString())
    if (filters.maxGrowth !== undefined) params.set('maxGrowth', filters.maxGrowth.toString())
    if (filters.dateFilter) params.set('dateFilter', filters.dateFilter)
    if (filters.euTransparency) params.set('euTransparency', 'true')
    if (filters.sortBy) params.set('sortBy', filters.sortBy)

    return params
  }

  // Fetch ads with filters (replaces current list)
  const fetchAds = useCallback(async (
    filters: AdsFilters = {},
    page = 1,
    perPage = 20
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = buildQueryParams(filters, page, perPage)
      const res = await fetch(`/api/ads?${params}`)
      const data = await res.json()

      if (data.success) {
        setAds(data.data)
        setPagination(data.pagination)
        setHasMore(data.pagination.hasMore)
        return data
      } else {
        throw new Error(data.error || 'Failed to fetch ads')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ads'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch more ads (append to current list for infinite scroll)
  const fetchMoreAds = useCallback(async (
    filters: AdsFilters = {},
    perPage = 20
  ) => {
    if (!hasMore || isLoadingMore || isLoading) return

    setIsLoadingMore(true)
    setError(null)

    try {
      const nextPage = pagination.page + 1
      const params = buildQueryParams(filters, nextPage, perPage)
      const res = await fetch(`/api/ads?${params}`)
      const data = await res.json()

      if (data.success) {
        setAds(prev => [...prev, ...data.data])
        setPagination(data.pagination)
        setHasMore(data.pagination.hasMore)
        return data
      } else {
        throw new Error(data.error || 'Failed to fetch more ads')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch more ads'
      setError(message)
      throw err
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, isLoading, pagination.page])

  // Toggle ad favorite
  const toggleFavorite = useCallback(async (adId: number) => {
    const res = await fetch('/api/ads/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId }),
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to toggle favorite')
    }

    // Update local state
    setAds(prev => prev.map(ad => 
      ad.id === adId 
        ? { ...ad, isFavorited: data.data.isFavorited }
        : ad
    ))

    return data
  }, [])

  // Get favorite ads
  const getFavorites = useCallback(async (page = 1, perPage = 20) => {
    const res = await fetch(`/api/ads/favorite?page=${page}&perPage=${perPage}`)
    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch favorites')
    }

    return data
  }, [])

  return {
    ads,
    pagination,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchAds,
    fetchMoreAds,
    toggleFavorite,
    getFavorites,
  }
}
