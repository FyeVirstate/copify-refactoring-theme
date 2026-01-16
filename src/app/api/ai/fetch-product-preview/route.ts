import { NextRequest, NextResponse } from 'next/server';
import { fetchAliExpressProduct, extractProductId } from '@/lib/services/aliexpress';
import { fetchAmazonProduct, extractAmazonAsin } from '@/lib/services/amazon';

// URL type detection (matching Laravel logic)
type UrlType = 'aliexpress' | 'amazon' | 'shopify' | 'unknown';

function detectUrlType(url: string): UrlType {
  if (!url || typeof url !== 'string') return 'unknown';
  
  // Support both aliexpress.com and regional domains (.us, .ru, .fr, etc.)
  const aliexpressRegex = /aliexpress\.[a-z]{2,3}\/item\/(\d+)\.html/i;
  const amazonPatterns = [
    /(?:dp|gp\/product|gp\/aw\/d|gp\/offer-listing|o\/ASIN|product\/detail)\/([A-Z0-9]{10})(?=[\/\?\&#]|$)/i,
    /[?&]asin=([A-Z0-9]{10})(?=[^A-Z0-9]|$)/i,
  ];
  
  if (aliexpressRegex.test(url)) {
    return 'aliexpress';
  }
  
  // Check Amazon patterns
  for (const pattern of amazonPatterns) {
    if (pattern.test(url)) {
      return 'amazon';
    }
  }
  
  // Direct ASIN input
  if (/^[A-Z0-9]{10}$/i.test(url.trim())) {
    return 'amazon';
  }
  
  // Check for Shopify product URL (contains /products/)
  if (url.includes('/products/')) {
    return 'shopify';
  }
  
  return 'unknown';
}

// Beautify URL by ensuring https:// and removing query params
function beautifyUrl(url: string): string {
  if (!url) return url;
  
  // Ensure https:// prefix
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  // Remove query parameters
  const questionMarkIndex = url.indexOf('?');
  if (questionMarkIndex !== -1) {
    url = url.substring(0, questionMarkIndex);
  }
  
  return url;
}

// Clean HTML description: remove tags, decode entities, clean whitespace
function cleanHtmlDescription(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags first
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities (common ones)
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '–',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };
  
  // Replace common entities (case-insensitive)
  for (const [entity, replacement] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'gi'), replacement);
  }
  
  // Decode numeric entities (&#160; etc.)
  text = text.replace(/&#(\d+);/g, (match, dec) => {
    const charCode = parseInt(dec, 10);
    // Skip control characters except newline/tab
    if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
      return ' ';
    }
    return String.fromCharCode(charCode);
  });
  
  // Decode hex entities (&#xA0; etc.)
  text = text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    const charCode = parseInt(hex, 16);
    // Skip control characters except newline/tab
    if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
      return ' ';
    }
    return String.fromCharCode(charCode);
  });
  
  // Replace multiple spaces/newlines/tabs with single space
  text = text.replace(/[\s\n\r\t]+/g, ' ');
  
  // Trim
  text = text.trim();
  
  // If result is empty or only contains special characters, return empty
  if (!text || /^[\s\u00A0\u2000-\u200B\u2028\u2029\uFEFF]*$/.test(text)) {
    return '';
  }
  
  return text;
}

// Fetch product data from Shopify .json endpoint
async function fetchShopifyProductData(url: string): Promise<{
  title: string;
  description: string;
  images: string[];
  price: number | null;
}> {
  const cleanUrl = beautifyUrl(url);
  const jsonUrl = cleanUrl + '.json';
  
  const response = await fetch(jsonUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Shopify product: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.product) {
    throw new Error('Product not found in Shopify response');
  }
  
  const product = data.product;
  
  // Extract images
  const images = (product.images || []).map((img: { src: string }) => img.src);
  
  // Get price from first variant
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.price ? parseFloat(firstVariant.price) : null;
  
  // Clean HTML description: remove tags, decode entities, clean whitespace
  const descriptionText = product.body_html 
    ? cleanHtmlDescription(product.body_html).substring(0, 200)
    : '';
  
  return {
    title: product.title || 'Untitled Product',
    description: descriptionText,
    images,
    price,
  };
}

/**
 * POST /api/ai/fetch-product-preview
 * 
 * Quickly fetch product data (title, image, description) for preview
 * This is a lightweight endpoint that doesn't generate AI content
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productUrl } = body;

    if (!productUrl) {
      return NextResponse.json(
        { error: 'Product URL is required' },
        { status: 400 }
      );
    }

    // Detect URL type
    const urlType = detectUrlType(productUrl);
    
    if (urlType === 'unknown') {
      return NextResponse.json(
        { error: 'Unsupported URL type' },
        { status: 400 }
      );
    }

    if (urlType === 'shopify') {
      // Fetch Shopify product data
      const shopifyData = await fetchShopifyProductData(productUrl);
      
      return NextResponse.json({
        success: true,
        title: shopifyData.title,
        description: shopifyData.description,
        image: shopifyData.images[0] || null,
        price: shopifyData.price,
      });
      
    } else if (urlType === 'aliexpress') {
      // Fetch AliExpress product data
      const productId = extractProductId(productUrl);
      if (!productId) {
        return NextResponse.json(
          { error: 'Could not extract product ID from AliExpress URL' },
          { status: 400 }
        );
      }
      
      const aliexpressData = await fetchAliExpressProduct(productId);
      
      // Clean HTML description: remove tags, decode entities, clean whitespace
      let descriptionText = '';
      if (aliexpressData.description?.html) {
        const cleaned = cleanHtmlDescription(aliexpressData.description.html);
        // Only use if it's not empty after cleaning (not just spaces/entities)
        if (cleaned.trim().length > 0) {
          descriptionText = cleaned.substring(0, 200);
        }
      }
      
      // If description is still empty, use title as fallback (truncated)
      if (!descriptionText && aliexpressData.title) {
        // Use title as description if no description available
        descriptionText = aliexpressData.title.length > 150 
          ? aliexpressData.title.substring(0, 150) + '...'
          : aliexpressData.title;
      }
      
      // Log for debugging - COMPREHENSIVE PRICE LOGGING
      console.log('\n[PRODUCT PREVIEW] ################################################################');
      console.log('[PRODUCT PREVIEW] AliExpress product fetched successfully');
      console.log('[PRODUCT PREVIEW] Title:', aliexpressData.title);
      console.log('[PRODUCT PREVIEW] ===== PRICE DATA =====');
      console.log('[PRODUCT PREVIEW] price (from AliExpress):', aliexpressData.price);
      console.log('[PRODUCT PREVIEW] originalPrice:', aliexpressData.originalPrice);
      console.log('[PRODUCT PREVIEW] currency:', aliexpressData.currency);
      console.log('[PRODUCT PREVIEW] ========================');
      console.log('[PRODUCT PREVIEW] This price will be displayed in the preview card');
      console.log('[PRODUCT PREVIEW] ################################################################\n');
      
      return NextResponse.json({
        success: true,
        title: aliexpressData.title,
        description: descriptionText,
        image: aliexpressData.images[0] || null,
        price: aliexpressData.price,
      });
      
    } else if (urlType === 'amazon') {
      // Fetch Amazon product data
      const asin = extractAmazonAsin(productUrl);
      if (!asin) {
        return NextResponse.json(
          { error: 'Could not extract ASIN from Amazon URL' },
          { status: 400 }
        );
      }
      
      console.log(`[Product Preview] Fetching Amazon product: ${asin}`);
      const amazonData = await fetchAmazonProduct(asin);
      
      // Clean HTML description
      let descriptionText = '';
      if (amazonData.description?.html) {
        const cleaned = cleanHtmlDescription(amazonData.description.html);
        if (cleaned.trim().length > 0) {
          descriptionText = cleaned.substring(0, 200);
        }
      }
      
      // If description is still empty, use about bullets or title as fallback
      if (!descriptionText) {
        if (amazonData.about && amazonData.about.length > 0) {
          descriptionText = amazonData.about.slice(0, 2).join(' ').substring(0, 200);
        } else if (amazonData.title) {
          descriptionText = amazonData.title.length > 150 
            ? amazonData.title.substring(0, 150) + '...'
            : amazonData.title;
        }
      }
      
      // Log for debugging
      console.log('[Product Preview] Amazon data:', {
        title: amazonData.title,
        asin: amazonData.asin,
        hasDescription: !!amazonData.description?.html,
        descriptionLength: descriptionText.length,
        price: amazonData.price,
        imageCount: amazonData.images.length,
      });
      
      return NextResponse.json({
        success: true,
        title: amazonData.title,
        description: descriptionText,
        image: amazonData.images[0] || null,
        price: amazonData.price ? parseFloat(amazonData.price) : null,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported URL type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[Product Preview] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product preview';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
