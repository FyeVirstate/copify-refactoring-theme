'use client'

import { useState, useCallback } from 'react'

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

interface ProductsFilters {
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
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
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

  // Fetch products with filters (replace mode)
  const fetchProducts = useCallback(async (
    filters: ProductsFilters = {},
    page = 1,
    perPage = 20
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('perPage', perPage.toString())

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value.toString())
        }
      })

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()

      if (data.success) {
        setProducts(data.data)
        setPagination(data.pagination)
        setHasMore(data.pagination.page < data.pagination.totalPages)
        return data
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch more products (append mode for infinite scroll)
  const fetchMoreProducts = useCallback(async (
    filters: ProductsFilters = {},
    perPage = 20
  ) => {
    if (isLoadingMore || !hasMore) return null

    const nextPage = pagination.page + 1
    setIsLoadingMore(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', nextPage.toString())
      params.set('perPage', perPage.toString())

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value.toString())
        }
      })

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()

      if (data.success) {
        setProducts(prev => [...prev, ...data.data])
        setPagination(data.pagination)
        setHasMore(data.pagination.page < data.pagination.totalPages)
        return data
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch more products')
      throw err
    } finally {
      setIsLoadingMore(false)
    }
  }, [pagination.page, isLoadingMore, hasMore])

  // Toggle product favorite
  const toggleFavorite = async (productId: number) => {
    const res = await fetch('/api/products/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    // Update local state
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, isFavorited: data.data.isFavorited }
        : product
    ))

    return data
  }

  return {
    products,
    pagination,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchProducts,
    fetchMoreProducts,
    toggleFavorite,
  }
}
