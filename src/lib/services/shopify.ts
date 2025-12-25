/**
 * Shopify Service - Migrated from Laravel ShopifyAppService
 * 
 * Features:
 * - OAuth flow for app installation
 * - API calls to Shopify
 * - Product/Order management
 */

const SHOPIFY_API_VERSION = '2024-01'

interface ShopifyConfig {
  clientId: string
  clientSecret: string
  scopes: string
  hostName: string
}

interface ShopifyProduct {
  id: number
  title: string
  handle: string
  body_html: string | null
  vendor: string
  product_type: string
  created_at: string
  updated_at: string
  status: string
  tags: string
  variants: Array<{
    id: number
    product_id: number
    title: string
    price: string
    sku: string
    inventory_quantity: number
  }>
  images: Array<{
    id: number
    position: number
    product_id: number
    src: string
    width: number
    height: number
  }>
}

export class ShopifyService {
  private shopDomain: string
  private accessToken: string
  private config: ShopifyConfig

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain.replace('.myshopify.com', '')
    this.accessToken = accessToken
    this.config = {
      clientId: process.env.SHOPIFY_CLIENT_ID!,
      clientSecret: process.env.SHOPIFY_CLIENT_SECRET!,
      scopes: process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_orders',
      hostName: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    }
  }

  /**
   * Get the full shop domain with .myshopify.com
   */
  getFullDomain(): string {
    return `${this.shopDomain}.myshopify.com`
  }

  /**
   * Make an API request to Shopify
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      body?: Record<string, any>
    } = {}
  ): Promise<T> {
    const { method = 'GET', body } = options
    
    const url = `https://${this.getFullDomain()}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
      },
      ...(body && { body: JSON.stringify(body) }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.errors || `Shopify API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get products from the shop
   */
  async getProducts(limit: number = 50): Promise<{ products: ShopifyProduct[] }> {
    return this.request(`/products.json?limit=${limit}`)
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: number): Promise<{ product: ShopifyProduct }> {
    return this.request(`/products/${productId}.json`)
  }

  /**
   * Create a new product
   */
  async createProduct(productData: Partial<ShopifyProduct>): Promise<{ product: ShopifyProduct }> {
    return this.request('/products.json', {
      method: 'POST',
      body: { product: productData },
    })
  }

  /**
   * Update a product
   */
  async updateProduct(productId: number, productData: Partial<ShopifyProduct>): Promise<{ product: ShopifyProduct }> {
    return this.request(`/products/${productId}.json`, {
      method: 'PUT',
      body: { product: productData },
    })
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: number): Promise<void> {
    await this.request(`/products/${productId}.json`, {
      method: 'DELETE',
    })
  }

  /**
   * Get orders from the shop
   */
  async getOrders(limit: number = 50): Promise<{ orders: any[] }> {
    return this.request(`/orders.json?limit=${limit}&status=any`)
  }

  /**
   * Get shop information
   */
  async getShopInfo(): Promise<{ shop: any }> {
    return this.request('/shop.json')
  }

  /**
   * Get available themes
   */
  async getThemes(): Promise<{ themes: any[] }> {
    return this.request('/themes.json')
  }

  /**
   * Create a new theme
   */
  async createTheme(themeName: string, themeZipUrl: string): Promise<{ theme: any }> {
    return this.request('/themes.json', {
      method: 'POST',
      body: {
        theme: {
          name: themeName,
          src: themeZipUrl,
          role: 'unpublished',
        },
      },
    })
  }

  /**
   * Get product count
   */
  async getProductCount(): Promise<{ count: number }> {
    return this.request('/products/count.json')
  }

  /**
   * Get order count
   */
  async getOrderCount(): Promise<{ count: number }> {
    return this.request('/orders/count.json')
  }
}

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(shopDomain: string, state: string): string {
  const shop = shopDomain.replace('.myshopify.com', '') + '.myshopify.com'
  const clientId = process.env.SHOPIFY_CLIENT_ID!
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_orders'
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/shopify/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  })

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  shopDomain: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const shop = shopDomain.replace('.myshopify.com', '') + '.myshopify.com'
  
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for token')
  }

  return response.json()
}

/**
 * Verify Shopify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET!)
  hmac.update(body)
  const calculatedSignature = hmac.digest('base64')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  )
}
