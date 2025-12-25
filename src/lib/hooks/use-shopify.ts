'use client'

import { useState, useEffect, useCallback } from 'react'

interface ShopInfo {
  domain: string
  name: string
  email: string
  currency: string
  country: string
  timezone: string
  plan: string
  productCount: number
  orderCount: number
  setupCompleted: boolean
}

interface ShopifyProduct {
  id: number
  title: string
  handle: string
  body_html: string | null
  vendor: string
  product_type: string
  status: string
  variants: Array<{
    id: number
    price: string
    sku: string
    inventory_quantity: number
  }>
  images: Array<{
    id: number
    src: string
  }>
}

export function useShopify() {
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [connected, setConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch shop info
  const fetchShopInfo = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/shopify/shop')
      const data = await res.json()

      if (data.success) {
        setConnected(data.connected)
        setShop(data.shop)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shop info')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch products
  const fetchProducts = async (limit = 50): Promise<ShopifyProduct[]> => {
    const res = await fetch(`/api/shopify/products?limit=${limit}`)
    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    return data.data
  }

  // Fetch orders
  const fetchOrders = async (limit = 50): Promise<any[]> => {
    const res = await fetch(`/api/shopify/orders?limit=${limit}`)
    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    return data.data
  }

  // Create a product
  const createProduct = async (productData: Partial<ShopifyProduct>): Promise<ShopifyProduct> => {
    const res = await fetch('/api/shopify/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    return data.data
  }

  // Disconnect Shopify
  const disconnect = async (): Promise<void> => {
    const res = await fetch('/api/shopify/shop', {
      method: 'DELETE',
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    setConnected(false)
    setShop(null)
  }

  // Start OAuth flow
  const connect = (shopDomain: string) => {
    window.location.href = `/api/shopify/install?shop=${shopDomain}`
  }

  // Initial fetch
  useEffect(() => {
    fetchShopInfo()
  }, [fetchShopInfo])

  return {
    shop,
    connected,
    isLoading,
    error,
    fetchShopInfo,
    fetchProducts,
    fetchOrders,
    createProduct,
    disconnect,
    connect,
  }
}

// Type for exported product (for use in exporting to Shopify)
export interface ExportProductData {
  title: string
  body_html?: string
  vendor?: string
  product_type?: string
  tags?: string
  variants?: Array<{
    price: string
    sku?: string
    inventory_quantity?: number
    option1?: string
  }>
  images?: Array<{
    src: string
    alt?: string
  }>
}
