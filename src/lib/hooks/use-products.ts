'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

interface Product {
  id: number
  handle: string
  title: string
  price: number
  compareAtPrice: number | null
  discount: number | null
  imageUrl: string | null
  imagesCount: number | null
  // Stats from traffic
  estimatedMonthly: number
  estimatedOrder: number
  growthRate: number
  lastMonthVisits: number
  activeAdsCount: number
  allAdsCount: number
  shop: {
    id: number
    url: string
    name: string | null
    country: string | null
    currency: string | null
    category: string | null
  } | null
  isFavorited: boolean
  createdAt: string
}

export interface ProductsFilters {
  search?: string
  category?: string
  currency?: string
  country?: string
  pixels?: string
  minPrice?: number
  maxPrice?: number
  minRevenue?: number
  maxRevenue?: number
  minOrders?: number
  maxOrders?: number
  minTraffic?: number
  maxTraffic?: number
  minTrafficGrowth?: number
  maxTrafficGrowth?: number
  minActiveAds?: number
  maxActiveAds?: number
  dateFilter?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  // New filters from shops page
  minCatalogSize?: number
  maxCatalogSize?: number
  minTrustpilotRating?: number
  maxTrustpilotRating?: number
  minTrustpilotReviews?: number
  maxTrustpilotReviews?: number
  origins?: string
  languages?: string
  domains?: string
  themes?: string
  applications?: string
  socialNetworks?: string
  shopCreationDate?: string
}

interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
  _timings?: {
    totalMs: number
    totalSec: string
  }
}

// API fetcher function
async function fetchProducts(
  filters: ProductsFilters,
  page: number,
  perPage: number,
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const params = new URLSearchParams()
  params.set('page', page.toString())
  params.set('perPage', perPage.toString())

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value.toString())
    }
  })

  const res = await fetch(`/api/products?${params}`, { signal })
  
  if (!res.ok) {
    throw new Error('Failed to fetch products')
  }
  
  const data = await res.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch products')
  }
  
  return data
}

// Toggle favorite API
async function toggleFavoriteApi(productId: number): Promise<{ success: boolean; data: { isFavorited: boolean } }> {
  const res = await fetch('/api/products/favorite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  })

  const data = await res.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to toggle favorite')
  }

  return data
}

// Generate query key for caching
function getProductsQueryKey(filters: ProductsFilters, page: number, perPage: number) {
  return ['products', { filters, page, perPage }] as const
}

export function useProducts(
  filters: ProductsFilters = {},
  page: number = 1,
  perPage: number = 25
) {
  const queryClient = useQueryClient()

  // Main products query with TanStack Query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: getProductsQueryKey(filters, page, perPage),
    queryFn: ({ signal }) => fetchProducts(filters, page, perPage, signal),
    // Keep previous data while fetching new page
    placeholderData: (previousData) => previousData,
  })

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: toggleFavoriteApi,
    onSuccess: (result, productId) => {
      // Update the cache optimistically
      queryClient.setQueryData(
        getProductsQueryKey(filters, page, perPage),
        (old: ProductsResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map(product =>
              product.id === productId
                ? { ...product, isFavorited: result.data.isFavorited }
                : product
            ),
          }
        }
      )
    },
  })

  // Prefetch next page for smoother pagination
  const prefetchNextPage = useCallback(() => {
    if (data && page < data.pagination.totalPages) {
      queryClient.prefetchQuery({
        queryKey: getProductsQueryKey(filters, page + 1, perPage),
        queryFn: ({ signal }) => fetchProducts(filters, page + 1, perPage, signal),
      })
    }
  }, [queryClient, filters, page, perPage, data])

  // Prefetch previous page
  const prefetchPrevPage = useCallback(() => {
    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: getProductsQueryKey(filters, page - 1, perPage),
        queryFn: ({ signal }) => fetchProducts(filters, page - 1, perPage, signal),
      })
    }
  }, [queryClient, filters, page, perPage])

  // Invalidate and refetch
  const invalidateProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }, [queryClient])

  return {
    // Data
    products: data?.data ?? [],
    pagination: data?.pagination ?? { page: 1, perPage: 25, total: 0, totalPages: 0 },
    timings: data?._timings,
    
    // Loading states
    isLoading, // First load
    isFetching, // Any fetch (including background)
    
    // Error
    error: error instanceof Error ? error.message : null,
    
    // Actions
    refetch,
    toggleFavorite: favoriteMutation.mutate,
    isTogglingFavorite: favoriteMutation.isPending,
    
    // Prefetch for smooth pagination
    prefetchNextPage,
    prefetchPrevPage,
    invalidateProducts,
  }
}

// Export types
export type { Product, ProductsResponse }
