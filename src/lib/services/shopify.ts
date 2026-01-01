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

/**
 * Extended Shopify Service for AI Store Creation
 * Handles theme uploads, asset management, and product template creation
 */
export class ShopifyThemeService extends ShopifyService {
  
  /**
   * Get the active (main) theme
   */
  async getActiveTheme(): Promise<{ theme: any } | null> {
    const { themes } = await this.getThemes()
    const activeTheme = themes.find((t: any) => t.role === 'main')
    return activeTheme ? { theme: activeTheme } : null
  }

  /**
   * Upload a theme from ZIP URL
   */
  async uploadThemeFromZip(
    themeName: string,
    zipUrl: string,
    role: 'main' | 'unpublished' = 'unpublished'
  ): Promise<{ theme: any }> {
    return this.createTheme(themeName, zipUrl)
  }

  /**
   * Update theme asset (file)
   */
  async updateThemeAsset(
    themeId: number,
    assetKey: string,
    content: string
  ): Promise<{ asset: any }> {
    return this.request(`/themes/${themeId}/assets.json`, {
      method: 'PUT',
      body: {
        asset: {
          key: assetKey,
          value: content,
        },
      },
    })
  }

  /**
   * Upload theme asset with base64 attachment (for binary files)
   */
  async uploadThemeAssetBase64(
    themeId: number,
    assetKey: string,
    base64Content: string
  ): Promise<{ asset: any }> {
    return this.request(`/themes/${themeId}/assets.json`, {
      method: 'PUT',
      body: {
        asset: {
          key: assetKey,
          attachment: base64Content,
        },
      },
    })
  }

  /**
   * Get theme asset
   */
  async getThemeAsset(themeId: number, assetKey: string): Promise<{ asset: any }> {
    return this.request(`/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(assetKey)}`)
  }

  /**
   * List all theme assets
   */
  async listThemeAssets(themeId: number): Promise<{ assets: any[] }> {
    return this.request(`/themes/${themeId}/assets.json`)
  }

  /**
   * Delete theme asset
   */
  async deleteThemeAsset(themeId: number, assetKey: string): Promise<void> {
    await this.request(`/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(assetKey)}`, {
      method: 'DELETE',
    })
  }

  /**
   * Publish a theme (set as main)
   */
  async publishTheme(themeId: number): Promise<{ theme: any }> {
    return this.request(`/themes/${themeId}.json`, {
      method: 'PUT',
      body: {
        theme: {
          id: themeId,
          role: 'main',
        },
      },
    })
  }

  /**
   * Add a product template to a theme
   */
  async addProductTemplate(
    themeId: number,
    templateName: string,
    templateContent: object
  ): Promise<{ asset: any }> {
    const assetKey = `templates/product.${templateName}.json`
    return this.updateThemeAsset(themeId, assetKey, JSON.stringify(templateContent, null, 2))
  }

  /**
   * Add a section to a theme
   */
  async addSection(
    themeId: number,
    sectionName: string,
    sectionContent: string
  ): Promise<{ asset: any }> {
    const assetKey = `sections/${sectionName}.liquid`
    return this.updateThemeAsset(themeId, assetKey, sectionContent)
  }

  /**
   * Update config/settings_data.json
   */
  async updateSettingsData(
    themeId: number,
    settingsData: object
  ): Promise<{ asset: any }> {
    return this.updateThemeAsset(themeId, 'config/settings_data.json', JSON.stringify(settingsData, null, 2))
  }

  /**
   * Get current settings_data.json
   */
  async getSettingsData(themeId: number): Promise<object> {
    const { asset } = await this.getThemeAsset(themeId, 'config/settings_data.json')
    return JSON.parse(asset.value)
  }

  /**
   * Batch upload multiple theme files
   * Groups files by type and uploads in proper order (sections, templates, config)
   */
  async batchUploadThemeFiles(
    themeId: number,
    files: Array<{ key: string; content: string; isBinary?: boolean }>
  ): Promise<{ uploaded: number; errors: string[] }> {
    const errors: string[] = []
    let uploaded = 0

    // Sort files by upload order: sections first, then templates, then config
    const sortOrder = ['sections/', 'snippets/', 'layout/', 'assets/', 'locales/', 'templates/', 'config/']
    
    const sortedFiles = [...files].sort((a, b) => {
      const orderA = sortOrder.findIndex(prefix => a.key.startsWith(prefix))
      const orderB = sortOrder.findIndex(prefix => b.key.startsWith(prefix))
      return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB)
    })

    for (const file of sortedFiles) {
      try {
        if (file.isBinary) {
          await this.uploadThemeAssetBase64(themeId, file.key, file.content)
        } else {
          await this.updateThemeAsset(themeId, file.key, file.content)
        }
        uploaded++
      } catch (error) {
        errors.push(`Failed to upload ${file.key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { uploaded, errors }
  }

  /**
   * Create product with custom template
   */
  async createProductWithTemplate(
    productData: any,
    templateSuffix?: string
  ): Promise<{ product: ShopifyProduct }> {
    const data = {
      ...productData,
      ...(templateSuffix && { template_suffix: templateSuffix }),
    }
    return this.createProduct(data)
  }
}
