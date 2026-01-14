/**
 * AliExpress Service
 * Fetches product data from AliExpress using RapidAPI
 */

export interface AliExpressProductData {
  title: string;
  description?: {
    html?: string;
    images?: string[];
  };
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  categories?: { name: string }[];
  sku?: {
    def?: {
      price: string;
    };
    props?: Array<{
      name: string;
      values: Array<{
        vid: string;
        name: string;
        image?: string;
      }>;
    }>;
    base?: Array<{
      skuId: string;
      propMap: string;
    }>;
    skuImages?: Record<string, string>;
  };
  ratings?: {
    average: number;
    count: number;
  };
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '0195f6b9e2mshf728d226ba3a9b4p1cd80cjsne047e7e50f2c';
const RAPIDAPI_HOST = 'aliexpress-datahub.p.rapidapi.com';

/**
 * Extract product ID from AliExpress URL
 */
export function extractProductId(url: string): string | null {
  // Match patterns like:
  // https://www.aliexpress.com/item/1005006123456789.html
  // https://aliexpress.com/item/1005006123456789.html
  const match = url.match(/aliexpress\.com\/item\/(\d+)\.html/);
  return match ? match[1] : null;
}

/**
 * Normalize image URL (fix protocol-relative URLs)
 */
export function normalizeImageUrl(url: string): string {
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  return url;
}

/**
 * Safely extract price from various formats
 * Handles: "1.99-5.99", "1.99", 1.99, { min: 1.99, max: 5.99 }, etc.
 * For ranges, takes the MAX price (second value) which is typically the real price
 */
function extractPrice(value: unknown, takeMax: boolean = true): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  // If it's already a number
  if (typeof value === 'number') {
    return value;
  }
  
  // If it's a string, handle range format "1.99-5.99"
  if (typeof value === 'string') {
    const parts = value.split('-');
    // Take the MAX price (second value) for AliExpress ranges
    const priceStr = takeMax && parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }
  
  // If it's an object with min/max or amount
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Prefer max for range objects
    if (takeMax && 'max' in obj) return extractPrice(obj.max, false);
    if ('min' in obj) return extractPrice(obj.min, false);
    if ('amount' in obj) return extractPrice(obj.amount, false);
    if ('value' in obj) return extractPrice(obj.value, false);
  }
  
  return 0;
}

/**
 * Fetch product data from DataHub API (primary endpoint)
 */
async function fetchFromDataHubApi(productId: string): Promise<AliExpressProductData | null> {
  const url = `https://${RAPIDAPI_HOST}/item_detail_6?itemId=${productId}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      console.error('DataHub API item_detail_6 failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data?.result?.item) {
      console.error('DataHub API item_detail_6 - Invalid data structure');
      return null;
    }

    const item = data.result.item;
    
    // Log the raw price data for debugging
    console.log('DataHub v6 price data:', JSON.stringify({
      skuDefPrice: item.sku?.def?.price,
      price: item.price,
      promotionPrice: item.sku?.def?.promotionPrice,
    }));

    return {
      title: item.title || 'Product',
      description: {
        html: item.description?.html || item.descriptionHtml || '',
        images: item.description?.images || item.descriptionImages || [],
      },
      price: extractPrice(item.sku?.def?.price) || extractPrice(item.price) || 0,
      originalPrice: extractPrice(item.sku?.def?.promotionPrice) || extractPrice(item.originalPrice) || 0,
      currency: item.currency || 'USD',
      images: (item.images || []).map(normalizeImageUrl),
      categories: item.categories || [],
      sku: item.sku,
      ratings: {
        average: extractPrice(item.averageStarRate) || extractPrice(item.rating) || 4.5,
        count: parseInt(String(item.totalOrders || item.reviewCount || '0'), 10),
      },
    };
  } catch (error) {
    console.error('DataHub API item_detail_6 error:', error);
    return null;
  }
}

/**
 * Fetch product data from DataHub API V2 (fallback endpoint)
 */
async function fetchFromDataHubApiV2(productId: string): Promise<AliExpressProductData | null> {
  const url = `https://${RAPIDAPI_HOST}/item_detail_2?itemId=${productId}&locale=en_US`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      console.error('DataHub API item_detail_2 failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data?.result?.item) {
      console.error('DataHub API item_detail_2 - Invalid data structure');
      return null;
    }

    const item = data.result.item;
    
    // Log the raw price data for debugging
    console.log('DataHub v2 price data:', JSON.stringify({
      skuDefPrice: item.sku?.def?.price,
      price: item.price,
      promotionPrice: item.sku?.def?.promotionPrice,
    }));

    return {
      title: item.title || 'Product',
      description: {
        html: item.description?.html || '',
        images: item.description?.images || [],
      },
      price: extractPrice(item.sku?.def?.price) || extractPrice(item.price) || 0,
      originalPrice: extractPrice(item.sku?.def?.promotionPrice) || 0,
      currency: item.currency || 'USD',
      images: (item.images || []).map(normalizeImageUrl),
      categories: item.categories || [],
      sku: item.sku,
      ratings: {
        average: extractPrice(item.averageStarRate) || 4.5,
        count: parseInt(String(item.totalOrders || '0'), 10),
      },
    };
  } catch (error) {
    console.error('DataHub API item_detail_2 error:', error);
    return null;
  }
}

/**
 * Fetch product data from True API (final fallback)
 */
async function fetchFromTrueApi(productId: string): Promise<AliExpressProductData | null> {
  const url = `https://aliexpress-true-api.p.rapidapi.com/api/v3/product-info?target_currency=EUR&product_id=${productId}&ship_to_country=FR&target_language=FR`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'aliexpress-true-api.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      console.error('True API failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data?.data) {
      console.error('True API - Invalid data structure');
      return null;
    }

    const product = data.data;
    
    // Log the raw price data for debugging
    console.log('True API price data:', JSON.stringify({
      sale_price: product.sale_price,
      price: product.price,
      original_price: product.original_price,
    }));

    return {
      title: product.title || 'Product',
      description: {
        html: product.description || '',
        images: product.description_images || [],
      },
      price: extractPrice(product.sale_price) || extractPrice(product.price) || 0,
      originalPrice: extractPrice(product.original_price) || 0,
      currency: product.currency || 'EUR',
      images: (product.images || []).map(normalizeImageUrl),
      categories: product.categories?.map((c: string) => ({ name: c })) || [],
      ratings: {
        average: extractPrice(product.rating) || 4.5,
        count: parseInt(String(product.reviews_count || '0'), 10),
      },
    };
  } catch (error) {
    console.error('True API error:', error);
    return null;
  }
}

/**
 * Main function to fetch product data from AliExpress
 * Tries multiple API endpoints with fallbacks
 */
export async function fetchAliExpressProduct(productIdOrUrl: string): Promise<AliExpressProductData> {
  // Extract product ID if URL is provided
  let productId = productIdOrUrl;
  if (productIdOrUrl.includes('aliexpress.com')) {
    const extractedId = extractProductId(productIdOrUrl);
    if (!extractedId) {
      throw new Error('Invalid AliExpress URL');
    }
    productId = extractedId;
  }

  console.log('Fetching AliExpress product:', productId);

  // Try primary API
  let result = await fetchFromDataHubApi(productId);
  if (result) {
    console.log('Successfully fetched from DataHub API v6');
    return result;
  }

  // Try fallback API V2
  console.log('Trying DataHub API v2 fallback...');
  result = await fetchFromDataHubApiV2(productId);
  if (result) {
    console.log('Successfully fetched from DataHub API v2');
    return result;
  }

  // Try True API as final fallback
  console.log('Trying True API fallback...');
  result = await fetchFromTrueApi(productId);
  if (result) {
    console.log('Successfully fetched from True API');
    return result;
  }

  throw new Error('Failed to fetch product data from all APIs');
}

