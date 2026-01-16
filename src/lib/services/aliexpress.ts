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
 * Supports both .com and regional domains (.us, .ru, etc.)
 */
export function extractProductId(url: string): string | null {
  // Match patterns like:
  // https://www.aliexpress.com/item/1005006123456789.html
  // https://aliexpress.com/item/1005006123456789.html
  // https://www.aliexpress.us/item/1005006123456789.html
  // https://aliexpress.ru/item/1005006123456789.html
  const match = url.match(/aliexpress\.[a-z]{2,3}\/item\/(\d+)\.html/i);
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
 * For ranges, takes the MIN price (first value) to avoid inflated prices when calculating retail (x3)
 */
function extractPrice(value: unknown, takeMin: boolean = true, label: string = 'unknown'): number {
  console.log(`[PRICE EXTRACT] ===== Extracting price for: ${label} =====`);
  console.log(`[PRICE EXTRACT] Raw input value:`, value);
  console.log(`[PRICE EXTRACT] Type of value:`, typeof value);
  console.log(`[PRICE EXTRACT] Take MIN:`, takeMin);
  
  if (value === null || value === undefined) {
    console.log(`[PRICE EXTRACT] Value is null/undefined, returning 0`);
    return 0;
  }
  
  // If it's already a number
  if (typeof value === 'number') {
    console.log(`[PRICE EXTRACT] Value is already a number: ${value}`);
    return value;
  }
  
  // If it's a string, handle range format "1.99-5.99"
  if (typeof value === 'string') {
    console.log(`[PRICE EXTRACT] Value is string: "${value}"`);
    const parts = value.split('-');
    console.log(`[PRICE EXTRACT] Split by '-':`, parts);
    console.log(`[PRICE EXTRACT] Number of parts: ${parts.length}`);
    
    // Take the MIN price (first value) for AliExpress ranges to avoid inflated retail prices
    const priceStr = takeMin ? parts[0] : (parts.length > 1 ? parts[parts.length - 1] : parts[0]);
    console.log(`[PRICE EXTRACT] Selected price string (takeMin=${takeMin}): "${priceStr}"`);
    
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    console.log(`[PRICE EXTRACT] Cleaned (numbers only): "${cleaned}"`);
    
    const result = parseFloat(cleaned) || 0;
    console.log(`[PRICE EXTRACT] Final parsed price: ${result}`);
    return result;
  }
  
  // If it's an object with min/max or amount
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    console.log(`[PRICE EXTRACT] Value is object:`, JSON.stringify(obj));
    
    // Prefer min for range objects to avoid inflated prices
    if (takeMin && 'min' in obj) {
      console.log(`[PRICE EXTRACT] Found 'min' property, extracting...`);
      return extractPrice(obj.min, false, `${label}.min`);
    }
    if ('max' in obj) {
      console.log(`[PRICE EXTRACT] Found 'max' property, extracting...`);
      return extractPrice(obj.max, false, `${label}.max`);
    }
    if ('amount' in obj) {
      console.log(`[PRICE EXTRACT] Found 'amount' property, extracting...`);
      return extractPrice(obj.amount, false, `${label}.amount`);
    }
    if ('value' in obj) {
      console.log(`[PRICE EXTRACT] Found 'value' property, extracting...`);
      return extractPrice(obj.value, false, `${label}.value`);
    }
  }
  
  console.log(`[PRICE EXTRACT] No valid price found, returning 0`);
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
    
    // ============ COMPREHENSIVE PRICE LOGGING - DataHub V6 ============
    console.log('\n[ALIEXPRESS API V6] ========================================');
    console.log('[ALIEXPRESS API V6] RAW API RESPONSE - All price fields:');
    console.log('[ALIEXPRESS API V6] item.sku?.def?.price:', item.sku?.def?.price);
    console.log('[ALIEXPRESS API V6] item.price:', item.price);
    console.log('[ALIEXPRESS API V6] item.sku?.def?.promotionPrice:', item.sku?.def?.promotionPrice);
    console.log('[ALIEXPRESS API V6] item.originalPrice:', item.originalPrice);
    console.log('[ALIEXPRESS API V6] item.currency:', item.currency);
    console.log('[ALIEXPRESS API V6] Full SKU object:', JSON.stringify(item.sku, null, 2));
    console.log('[ALIEXPRESS API V6] ========================================\n');

    // Extract prices with detailed logging
    console.log('[ALIEXPRESS API V6] Now extracting MAIN PRICE...');
    const mainPrice1 = extractPrice(item.sku?.def?.price, true, 'V6-sku.def.price');
    const mainPrice2 = extractPrice(item.price, true, 'V6-item.price');
    const finalMainPrice = mainPrice1 || mainPrice2 || 0;
    
    console.log('[ALIEXPRESS API V6] Now extracting ORIGINAL PRICE...');
    const origPrice1 = extractPrice(item.sku?.def?.promotionPrice, true, 'V6-sku.def.promotionPrice');
    const origPrice2 = extractPrice(item.originalPrice, true, 'V6-item.originalPrice');
    const finalOrigPrice = origPrice1 || origPrice2 || 0;
    
    console.log('\n[ALIEXPRESS API V6] ===== FINAL PRICES =====');
    console.log('[ALIEXPRESS API V6] Main Price (will be used for x3 calculation):', finalMainPrice);
    console.log('[ALIEXPRESS API V6] Original Price (compare at):', finalOrigPrice);
    console.log('[ALIEXPRESS API V6] Currency:', item.currency || 'USD');
    console.log('[ALIEXPRESS API V6] ===========================\n');

    return {
      title: item.title || 'Product',
      description: {
        html: item.description?.html || item.descriptionHtml || '',
        images: item.description?.images || item.descriptionImages || [],
      },
      price: finalMainPrice,
      originalPrice: finalOrigPrice,
      currency: item.currency || 'USD',
      images: (item.images || []).map(normalizeImageUrl),
      categories: item.categories || [],
      sku: item.sku,
      ratings: {
        average: extractPrice(item.averageStarRate, true, 'V6-rating') || extractPrice(item.rating, true, 'V6-rating2') || 4.5,
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
    
    // ============ COMPREHENSIVE PRICE LOGGING - DataHub V2 ============
    console.log('\n[ALIEXPRESS API V2] ========================================');
    console.log('[ALIEXPRESS API V2] RAW API RESPONSE - All price fields:');
    console.log('[ALIEXPRESS API V2] item.sku?.def?.price:', item.sku?.def?.price);
    console.log('[ALIEXPRESS API V2] item.price:', item.price);
    console.log('[ALIEXPRESS API V2] item.sku?.def?.promotionPrice:', item.sku?.def?.promotionPrice);
    console.log('[ALIEXPRESS API V2] item.currency:', item.currency);
    console.log('[ALIEXPRESS API V2] Full SKU object:', JSON.stringify(item.sku, null, 2));
    console.log('[ALIEXPRESS API V2] ========================================\n');

    // Extract prices with detailed logging
    console.log('[ALIEXPRESS API V2] Now extracting MAIN PRICE...');
    const mainPrice1 = extractPrice(item.sku?.def?.price, true, 'V2-sku.def.price');
    const mainPrice2 = extractPrice(item.price, true, 'V2-item.price');
    const finalMainPrice = mainPrice1 || mainPrice2 || 0;
    
    console.log('[ALIEXPRESS API V2] Now extracting ORIGINAL PRICE...');
    const origPrice1 = extractPrice(item.sku?.def?.promotionPrice, true, 'V2-sku.def.promotionPrice');
    const finalOrigPrice = origPrice1 || 0;
    
    console.log('\n[ALIEXPRESS API V2] ===== FINAL PRICES =====');
    console.log('[ALIEXPRESS API V2] Main Price (will be used for x3 calculation):', finalMainPrice);
    console.log('[ALIEXPRESS API V2] Original Price (compare at):', finalOrigPrice);
    console.log('[ALIEXPRESS API V2] Currency:', item.currency || 'USD');
    console.log('[ALIEXPRESS API V2] ===========================\n');

    return {
      title: item.title || 'Product',
      description: {
        html: item.description?.html || '',
        images: item.description?.images || [],
      },
      price: finalMainPrice,
      originalPrice: finalOrigPrice,
      currency: item.currency || 'USD',
      images: (item.images || []).map(normalizeImageUrl),
      categories: item.categories || [],
      sku: item.sku,
      ratings: {
        average: extractPrice(item.averageStarRate, true, 'V2-rating') || 4.5,
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
    
    // ============ COMPREHENSIVE PRICE LOGGING - True API ============
    console.log('\n[ALIEXPRESS TRUE API] ========================================');
    console.log('[ALIEXPRESS TRUE API] RAW API RESPONSE - All price fields:');
    console.log('[ALIEXPRESS TRUE API] product.sale_price:', product.sale_price);
    console.log('[ALIEXPRESS TRUE API] product.price:', product.price);
    console.log('[ALIEXPRESS TRUE API] product.original_price:', product.original_price);
    console.log('[ALIEXPRESS TRUE API] product.currency:', product.currency);
    console.log('[ALIEXPRESS TRUE API] ========================================\n');

    // Extract prices with detailed logging
    console.log('[ALIEXPRESS TRUE API] Now extracting MAIN PRICE...');
    const mainPrice1 = extractPrice(product.sale_price, true, 'TrueAPI-sale_price');
    const mainPrice2 = extractPrice(product.price, true, 'TrueAPI-price');
    const finalMainPrice = mainPrice1 || mainPrice2 || 0;
    
    console.log('[ALIEXPRESS TRUE API] Now extracting ORIGINAL PRICE...');
    const origPrice = extractPrice(product.original_price, true, 'TrueAPI-original_price');
    const finalOrigPrice = origPrice || 0;
    
    console.log('\n[ALIEXPRESS TRUE API] ===== FINAL PRICES =====');
    console.log('[ALIEXPRESS TRUE API] Main Price (will be used for x3 calculation):', finalMainPrice);
    console.log('[ALIEXPRESS TRUE API] Original Price (compare at):', finalOrigPrice);
    console.log('[ALIEXPRESS TRUE API] Currency:', product.currency || 'EUR');
    console.log('[ALIEXPRESS TRUE API] ===========================\n');

    return {
      title: product.title || 'Product',
      description: {
        html: product.description || '',
        images: product.description_images || [],
      },
      price: finalMainPrice,
      originalPrice: finalOrigPrice,
      currency: product.currency || 'EUR',
      images: (product.images || []).map(normalizeImageUrl),
      categories: product.categories?.map((c: string) => ({ name: c })) || [],
      ratings: {
        average: extractPrice(product.rating, true, 'TrueAPI-rating') || 4.5,
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
  console.log('\n[ALIEXPRESS FETCH] ############################################################');
  console.log('[ALIEXPRESS FETCH] Starting product fetch for:', productIdOrUrl);
  console.log('[ALIEXPRESS FETCH] ############################################################\n');
  
  // Extract product ID if URL is provided
  // Support both .com and regional domains (.us, .ru, etc.)
  let productId = productIdOrUrl;
  if (/aliexpress\.[a-z]{2,3}\/item\//i.test(productIdOrUrl)) {
    const extractedId = extractProductId(productIdOrUrl);
    if (!extractedId) {
      throw new Error('Invalid AliExpress URL');
    }
    productId = extractedId;
    console.log('[ALIEXPRESS FETCH] Extracted product ID from URL:', productId);
  }

  console.log('[ALIEXPRESS FETCH] Product ID:', productId);

  // Try primary API
  console.log('\n[ALIEXPRESS FETCH] Trying DataHub API v6...');
  let result = await fetchFromDataHubApi(productId);
  if (result) {
    console.log('\n[ALIEXPRESS FETCH] ===== FINAL RESULT FROM API V6 =====');
    console.log('[ALIEXPRESS FETCH] Title:', result.title);
    console.log('[ALIEXPRESS FETCH] PRICE:', result.price, result.currency);
    console.log('[ALIEXPRESS FETCH] ORIGINAL PRICE:', result.originalPrice, result.currency);
    console.log('[ALIEXPRESS FETCH] ========================================\n');
    return result;
  }

  // Try fallback API V2
  console.log('\n[ALIEXPRESS FETCH] V6 failed, trying DataHub API v2...');
  result = await fetchFromDataHubApiV2(productId);
  if (result) {
    console.log('\n[ALIEXPRESS FETCH] ===== FINAL RESULT FROM API V2 =====');
    console.log('[ALIEXPRESS FETCH] Title:', result.title);
    console.log('[ALIEXPRESS FETCH] PRICE:', result.price, result.currency);
    console.log('[ALIEXPRESS FETCH] ORIGINAL PRICE:', result.originalPrice, result.currency);
    console.log('[ALIEXPRESS FETCH] ========================================\n');
    return result;
  }

  // Try True API as final fallback
  console.log('\n[ALIEXPRESS FETCH] V2 failed, trying True API...');
  result = await fetchFromTrueApi(productId);
  if (result) {
    console.log('\n[ALIEXPRESS FETCH] ===== FINAL RESULT FROM TRUE API =====');
    console.log('[ALIEXPRESS FETCH] Title:', result.title);
    console.log('[ALIEXPRESS FETCH] PRICE:', result.price, result.currency);
    console.log('[ALIEXPRESS FETCH] ORIGINAL PRICE:', result.originalPrice, result.currency);
    console.log('[ALIEXPRESS FETCH] ========================================\n');
    return result;
  }

  console.log('[ALIEXPRESS FETCH] ALL APIs FAILED!');
  throw new Error('Failed to fetch product data from all APIs');
}

