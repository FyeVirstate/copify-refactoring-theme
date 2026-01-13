/**
 * Amazon Product Service
 * 
 * Fetches product data from Amazon using RapidAPI (real-time-amazon-data)
 * Mirrors Laravel's DashboardController Amazon methods
 */

const AMAZON_RAPIDAPI_HOST = process.env.AMAZON_RAPIDAPI_HOST || 'real-time-amazon-data.p.rapidapi.com';
// Default key from Laravel config (same as copyfy-theme)
const AMAZON_RAPIDAPI_KEY = process.env.AMAZON_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY || '0195f6b9e2mshf728d226ba3a9b4p1cd80cjsne047e7e50f2c';

export interface AmazonProductData {
  asin: string;
  title: string;
  description: {
    html: string;
    images: string[];
  };
  images: string[];
  vendor: string | null;
  category: string | null;
  tags: string[];
  price: string | null;
  compareAtPrice: string | null;
  about: string[];
  raw: Record<string, unknown>;
}

/**
 * Extract ASIN from Amazon URL or direct ASIN input
 * Mirrors Laravel's extractAmazonAsin()
 */
export function extractAmazonAsin(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  // Direct ASIN input (10 alphanumeric characters)
  if (/^[A-Z0-9]{10}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // URL patterns to extract ASIN
  const patterns = [
    /(?:dp|gp\/product|gp\/aw\/d|gp\/offer-listing|o\/ASIN|product\/detail)\/([A-Z0-9]{10})(?=[\/\?\&#]|$)/i,
    /[?&]asin=([A-Z0-9]{10})(?=[^A-Z0-9]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Build Amazon product URL from ASIN
 */
export function buildAmazonProductUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin.toUpperCase()}`;
}

/**
 * Normalize image URL (handle protocol-relative URLs)
 */
function normalizeImageUrl(url: string): string {
  if (!url) return url;
  
  // Handle protocol-relative URLs
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  // Ensure https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  
  return url;
}

/**
 * Fetch Amazon product from RapidAPI
 */
async function fetchAmazonProductFromApi(asin: string, country: string = 'US'): Promise<Record<string, unknown> | null> {
  const url = `https://${AMAZON_RAPIDAPI_HOST}/product-details?asin=${encodeURIComponent(asin)}&country=${encodeURIComponent(country)}`;
  
  console.log(`[Amazon API] Fetching product ${asin} from ${country}...`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': AMAZON_RAPIDAPI_HOST,
        'x-rapidapi-key': AMAZON_RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      console.warn(`[Amazon API] Request failed for country ${country}:`, response.status);
      return null;
    }

    const data = await response.json();
    return extractAmazonProductPayload(data);
    
  } catch (error) {
    console.warn(`[Amazon API] Error fetching from ${country}:`, error);
    return null;
  }
}

/**
 * Extract product from API response payload
 */
function extractAmazonProductPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  
  // Try different response structures
  const candidates = [
    (data.data as Record<string, unknown>)?.product,
    data.data,
    data.product,
    data.result,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && Object.keys(candidate as object).length > 0) {
      return candidate as Record<string, unknown>;
    }
  }

  return null;
}

/**
 * Normalize Amazon images from various response formats
 */
function normalizeAmazonImages(product: Record<string, unknown>): string[] {
  const images: string[] = [];
  const candidates: unknown[] = [];

  // Collect all possible image sources
  if (Array.isArray(product.product_photos)) {
    candidates.push(...product.product_photos);
  }
  if (product.product_photo) {
    candidates.push(product.product_photo);
  }
  if (Array.isArray(product.images)) {
    candidates.push(...product.images);
  }
  if (product.main_image) {
    candidates.push(product.main_image);
  }
  if (typeof product.primary_image === 'string') {
    candidates.push(product.primary_image);
  }

  // Process and deduplicate
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      images.push(normalizeImageUrl(candidate));
    }
  }

  const uniqueImages = [...new Set(images)];

  // Fallback placeholder if no images
  if (uniqueImages.length === 0) {
    uniqueImages.push('https://via.placeholder.com/800x800.png?text=Product');
  }

  return uniqueImages;
}

/**
 * Normalize Amazon "About" / feature bullets
 */
function normalizeAmazonAbout(product: Record<string, unknown>): string[] {
  const bullets: string[] = [];

  const aboutProduct = product.about_product || product.feature_bullets || product.features;

  if (Array.isArray(aboutProduct)) {
    for (const item of aboutProduct) {
      if (typeof item === 'string' && item.trim()) {
        bullets.push(item.trim());
      }
    }
  } else if (typeof aboutProduct === 'string' && aboutProduct.trim()) {
    bullets.push(aboutProduct.trim());
  }

  return [...new Set(bullets)];
}

/**
 * Build HTML description from Amazon product data
 */
function buildAmazonDescriptionHtml(product: Record<string, unknown>, about: string[]): string {
  const paragraphs: string[] = [];

  // Try to get raw description
  const rawDescription = product.product_description || product.product_description_html || product.description;

  if (typeof rawDescription === 'string') {
    // Strip HTML tags and split by newlines
    const stripped = rawDescription.replace(/<[^>]*>/g, '');
    const lines = stripped.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    paragraphs.push(...lines);
  } else if (Array.isArray(rawDescription)) {
    for (const item of rawDescription) {
      if (typeof item === 'string' && item.trim()) {
        paragraphs.push(item.trim());
      }
    }
  }

  // Build HTML
  let html = '';
  
  // Add "About" bullets as a list if available
  if (about.length > 0) {
    html += '<ul>\n';
    for (const bullet of about) {
      html += `  <li>${bullet}</li>\n`;
    }
    html += '</ul>\n';
  }

  // Add description paragraphs
  for (const paragraph of paragraphs) {
    html += `<p>${paragraph}</p>\n`;
  }

  return html.trim();
}

/**
 * Extract numeric price from various formats
 */
function extractNumericPrice(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value.toFixed(2);
  }

  if (typeof value === 'string') {
    // Remove currency symbols and extract number
    const match = value.match(/[\d,]+\.?\d*/);
    if (match) {
      const num = parseFloat(match[0].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        return num.toFixed(2);
      }
    }
  }

  return null;
}

/**
 * Normalize Amazon price
 */
function normalizeAmazonPrice(product: Record<string, unknown>): string | null {
  const candidates = [
    product.product_price,
    product.product_price_value,
    (product.buybox_winner as Record<string, unknown>)?.price as Record<string, unknown> | undefined,
    (product.pricing as Record<string, unknown>)?.current_price as Record<string, unknown> | undefined,
    product.price,
  ];

  for (const candidate of candidates) {
    // Handle nested value objects
    if (candidate && typeof candidate === 'object') {
      const val = (candidate as Record<string, unknown>).value;
      const price = extractNumericPrice(val);
      if (price) return price;
    }
    
    const price = extractNumericPrice(candidate);
    if (price) return price;
  }

  return null;
}

/**
 * Normalize Amazon compare at price (original price)
 */
function normalizeAmazonComparePrice(product: Record<string, unknown>, fallback: string | null = null): string | null {
  const candidates = [
    product.product_original_price,
    (product.pricing as Record<string, unknown>)?.original_price as Record<string, unknown> | undefined,
    product.list_price,
    product.original_price,
  ];

  for (const candidate of candidates) {
    // Handle nested value objects
    if (candidate && typeof candidate === 'object') {
      const val = (candidate as Record<string, unknown>).value;
      const price = extractNumericPrice(val);
      if (price) return price;
    }
    
    const price = extractNumericPrice(candidate);
    if (price) return price;
  }

  return fallback;
}

/**
 * Normalize Amazon category
 */
function normalizeAmazonCategory(product: Record<string, unknown>): string | null {
  if (typeof product.product_category === 'string') {
    return product.product_category;
  }

  if (Array.isArray(product.categories) && product.categories.length > 0) {
    const first = product.categories[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'name' in first) {
      return (first as Record<string, unknown>).name as string;
    }
  }

  if (typeof product.category === 'string') {
    return product.category;
  }

  if (Array.isArray(product.category_path) && product.category_path.length > 0) {
    const last = product.category_path[product.category_path.length - 1];
    if (last && typeof last === 'object' && 'name' in last) {
      return (last as Record<string, unknown>).name as string;
    }
  }

  return null;
}

/**
 * Normalize Amazon tags
 */
function normalizeAmazonTags(product: Record<string, unknown>, about: string[], category: string | null): string[] {
  const tags: string[] = [];

  // Add category as tag
  if (category) {
    tags.push(category);
  }

  // Extract keywords from about bullets
  for (const bullet of about) {
    // Get first few words as potential tags
    const words = bullet.split(/\s+/).slice(0, 3);
    if (words.length > 0) {
      tags.push(words.join(' '));
    }
  }

  // Add brand as tag
  const brand = product.brand || product.manufacturer;
  if (typeof brand === 'string' && brand.trim()) {
    tags.push(brand.trim());
  }

  return [...new Set(tags)].slice(0, 10); // Max 10 tags
}

/**
 * Fetch Amazon product data by ASIN
 * Mirrors Laravel's fetchAmazonProductData()
 */
export async function fetchAmazonProduct(asin: string): Promise<AmazonProductData> {
  // Try US first (default)
  let product = await fetchAmazonProductFromApi(asin, 'US');

  // If empty, fallback to FR
  if (!product) {
    product = await fetchAmazonProductFromApi(asin, 'FR');
  }

  if (!product) {
    throw new Error('Amazon product data is missing. Please check if the product exists.');
  }

  // Extract title
  const title = (product.product_title || product.title || product.name) as string | undefined;
  if (!title) {
    throw new Error('Amazon product title not found.');
  }

  // Normalize all data
  const images = normalizeAmazonImages(product);
  const about = normalizeAmazonAbout(product);
  const descriptionHtml = buildAmazonDescriptionHtml(product, about);
  const price = normalizeAmazonPrice(product);
  const comparePrice = normalizeAmazonComparePrice(product, price);
  const category = normalizeAmazonCategory(product);
  const tags = normalizeAmazonTags(product, about, category);
  
  const brand = (product.brand || product.manufacturer || product.product_byline || product.byline) as string | null;

  console.log(`[Amazon API] Successfully fetched: ${title}`);

  return {
    asin,
    title,
    description: {
      html: descriptionHtml,
      images,
    },
    images,
    vendor: brand,
    category,
    tags,
    price,
    compareAtPrice: comparePrice,
    about,
    raw: product,
  };
}
