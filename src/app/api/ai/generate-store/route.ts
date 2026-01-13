import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchAliExpressProduct, extractProductId } from '@/lib/services/aliexpress';
import { fetchAmazonProduct, extractAmazonAsin, buildAmazonProductUrl } from '@/lib/services/amazon';
import { generateStoreContent, getLanguageName } from '@/lib/services/store-ai';
import { FalAIService } from '@/lib/services/fal-ai';

export const maxDuration = 120; // Allow up to 120 seconds for AI generation + image generation

// URL type detection (matching Laravel logic)
type UrlType = 'aliexpress' | 'amazon' | 'shopify' | 'unknown';

function detectUrlType(url: string): UrlType {
  if (!url || typeof url !== 'string') return 'unknown';
  
  const aliexpressRegex = /aliexpress\.com\/item\/(\d+)\.html/;
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

// Fetch product data from Shopify .json endpoint
async function fetchShopifyProductData(url: string): Promise<{
  title: string;
  description: { html: string };
  images: string[];
  price: number;
  compareAtPrice: number | null;
  vendor: string | null;
  productType: string | null;
  tags: string[];
  variants: Array<{ price: string; compare_at_price: string | null }>;
  raw: Record<string, unknown>;
}> {
  const cleanUrl = beautifyUrl(url);
  const jsonUrl = cleanUrl + '.json';
  
  console.log(`[AI Store] Fetching Shopify product from: ${jsonUrl}`);
  
  const response = await fetch(jsonUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Shopify product: ${response.status} ${response.statusText}`);
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
  const price = parseFloat(firstVariant?.price || '0');
  const compareAtPrice = firstVariant?.compare_at_price 
    ? parseFloat(firstVariant.compare_at_price) 
    : null;
  
  return {
    title: product.title || 'Untitled Product',
    description: {
      html: product.body_html || '',
    },
    images,
    price,
    compareAtPrice,
    vendor: product.vendor || null,
    productType: product.product_type || null,
    tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
    variants: product.variants || [],
    raw: product,
  };
}

/**
 * POST /api/ai/generate-store
 * 
 * Generate AI store content from a product URL (AliExpress, Amazon, or Shopify)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = BigInt(session.user.id);
    const body = await request.json();
    const { productUrl, language = 'en' } = body;

    if (!productUrl) {
      return NextResponse.json(
        { error: 'Product URL is required' },
        { status: 400 }
      );
    }

    // Detect URL type (like Laravel)
    const urlType = detectUrlType(productUrl);
    console.log(`[AI Store] Detected URL type: ${urlType} for URL: ${productUrl}`);
    
    if (urlType === 'unknown') {
      return NextResponse.json(
        { error: 'Please provide a valid AliExpress, Amazon, or Shopify product URL' },
        { status: 400 }
      );
    }

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        balanceGenerateProduct: true,
        subscriptions: {
          where: {
            stripeStatus: { in: ['active', 'trialing'] },
          },
          select: {
            stripePlan: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's plan limits
    const subscription = user.subscriptions[0];
    let planLimit = 0;
    
    if (subscription?.stripePlan) {
      const plan = await prisma.plan.findFirst({
        where: {
          OR: [
            { stripeId: subscription.stripePlan },
            { stripeIdEn: subscription.stripePlan },
          ],
        },
        select: { limitGenerateProduct: true },
      });
      planLimit = plan?.limitGenerateProduct || 0;
    }

    // Count current usage
    const usageCount = await prisma.generateStore.count({
      where: { userId },
    });

    // Check if user has credits (unlimited if planLimit is -1 or 0 means trial limits apply)
    const isUnlimited = planLimit === -1;
    if (!isUnlimited && usageCount >= planLimit && planLimit > 0) {
      return NextResponse.json(
        { error: 'You have reached your store generation limit. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Clean URL (remove query parameters)
    let cleanUrl = beautifyUrl(productUrl);

    let productData: Record<string, unknown>;
    let productId: string;
    let source: string;

    // Fetch product data based on URL type
    if (urlType === 'aliexpress') {
      // Extract AliExpress product ID
      productId = extractProductId(productUrl) || '';
      if (!productId) {
        return NextResponse.json(
          { error: 'Could not extract product ID from AliExpress URL' },
          { status: 400 }
        );
      }
      
      console.log(`[AI Store] Fetching AliExpress product ${productId} for user ${userId}`);
      productData = await fetchAliExpressProduct(productId) as unknown as Record<string, unknown>;
      source = 'aliexpress';
      
    } else if (urlType === 'amazon') {
      // Extract Amazon ASIN
      const asin = extractAmazonAsin(productUrl);
      if (!asin) {
        return NextResponse.json(
          { error: 'Could not extract ASIN from Amazon URL' },
          { status: 400 }
        );
      }
      
      console.log(`[AI Store] Fetching Amazon product ${asin} for user ${userId}`);
      const amazonData = await fetchAmazonProduct(asin);
      productId = asin;
      source = 'amazon';
      cleanUrl = buildAmazonProductUrl(asin);
      
      // Transform Amazon data to match expected format
      productData = {
        title: amazonData.title,
        description: amazonData.description,
        images: amazonData.images,
        price: amazonData.price ? parseFloat(amazonData.price) : null,
        compareAtPrice: amazonData.compareAtPrice ? parseFloat(amazonData.compareAtPrice) : null,
        categories: amazonData.category ? [{ name: amazonData.category }] : [],
        store: {
          name: amazonData.vendor || 'Amazon Seller',
        },
        tags: amazonData.tags,
        about: amazonData.about,
        raw: amazonData.raw,
      };
      
    } else if (urlType === 'shopify') {
      // Fetch Shopify product data
      console.log(`[AI Store] Fetching Shopify product for user ${userId}`);
      const shopifyData = await fetchShopifyProductData(productUrl);
      
      // Extract product handle from URL as the ID
      const urlParts = cleanUrl.split('/products/');
      productId = urlParts[1] || 'shopify-product';
      source = 'shopify';
      
      // Transform Shopify data to match expected format
      productData = {
        title: shopifyData.title,
        description: shopifyData.description,
        images: shopifyData.images,
        price: {
          min: shopifyData.price,
          max: shopifyData.price,
          currency: 'USD',
        },
        categories: shopifyData.productType ? [{ name: shopifyData.productType }] : [],
        store: {
          name: shopifyData.vendor || 'Shopify Store',
        },
        tags: shopifyData.tags,
        raw: shopifyData.raw,
      };
    } else {
      return NextResponse.json(
        { error: 'Unsupported URL type' },
        { status: 400 }
      );
    }

    console.log(`[AI Store] Product fetched: ${(productData as { title?: string }).title || 'Unknown'}`);

    // Generate AI content
    const languageName = getLanguageName(language);
    const aiContent = await generateStoreContent(productData, languageName);
    
    console.log(`[AI Store] AI content generated for: ${aiContent.title}`);

    // Save to database (initial save without AI images)
    const generatedProduct = await prisma.generate_products.create({
      data: {
        user_id: userId,
        shop_url: cleanUrl,
        product_name: aiContent.title,
        product_description: (productData.description as { html?: string })?.html || null,
        category: (productData.categories as Array<{ name?: string }>)?.[0]?.name || null,
        language,
        product_id: productId,
        source: source,
        type: 'store',
        aicontent: aiContent as unknown as object,
        product_content: productData as unknown as object,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`[AI Store] Saved generated product ${generatedProduct.id}`);

    // Step 4: Generate AI images with FAL AI (like Laravel GenerateAIImagesJob)
    let aiGeneratedImages: Array<{
      index: number;
      image_type: string;
      special_index: number;
      prompt: string;
      image_url: string;
      image_url_no_bg: string | null;
    }> = [];

    // Check if FAL_KEY is configured
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (falKey && openaiKey && Array.isArray(aiContent.images) && aiContent.images.length > 0) {
      try {
        console.log(`[AI Store] Starting AI image generation for product ${generatedProduct.id}...`);
        
        const falService = new FalAIService();
        const imageResult = await falService.generateStoreImages(
          aiContent.images as string[],
          aiContent as Record<string, unknown>,
          (progress) => {
            console.log(`[AI Store] Image generation progress: Step ${progress.step}/${progress.totalSteps} - ${progress.stepDescription}`);
          }
        );

        if (imageResult.success && imageResult.recommended_images.length > 0) {
          aiGeneratedImages = imageResult.recommended_images;
          console.log(`[AI Store] ✅ Generated ${aiGeneratedImages.length} AI images in ${imageResult.processing_time}s`);

          // Save in Laravel format: { recommended_images: [...], scrapped_images: [] }
          const aiImagesData = {
            success: true,
            recommended_images: aiGeneratedImages,
            scrapped_images: [],
            processing_time: imageResult.processing_time,
          };

          // Update product with AI generated images
          await prisma.generate_products.update({
            where: { id: generatedProduct.id },
            data: {
              ai_generated_images: aiImagesData as unknown as object,
              updated_at: new Date(),
            },
          });
          console.log(`[AI Store] ✅ Saved AI generated images to product ${generatedProduct.id}`);
        } else {
          console.warn(`[AI Store] ⚠️ AI image generation failed: ${imageResult.error || 'Unknown error'}`);
        }
      } catch (imageError) {
        console.error(`[AI Store] ❌ Error generating AI images:`, imageError);
        // Don't fail the whole request if image generation fails
      }
    } else {
      console.log(`[AI Store] ⚠️ Skipping AI image generation - FAL_KEY or OPENAI_API_KEY not configured or no images available`);
    }

    // Return the generated content with AI images
    return NextResponse.json({
      success: true,
      productId: Number(generatedProduct.id),
      product: {
        title: aiContent.title,
        description: aiContent.description,
        price: aiContent.price,
        compareAtPrice: aiContent.compareAtPrice,
        images: aiContent.images,
      },
      aiContent,
      productData,
      aiGeneratedImages, // Include AI generated images in response
    });

  } catch (error) {
    console.error('[AI Store] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate store';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/generate-store
 * 
 * Get list of generated products for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = BigInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);

    // Get total count
    const total = await prisma.generate_products.count({
      where: { user_id: userId },
    });

    // Get generated products
    const products = await prisma.generate_products.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        product_name: true,
        shop_url: true,
        category: true,
        language: true,
        source: true,
        type: true,
        aicontent: true,
        created_at: true,
      },
    });

    // Format response
    const formattedProducts = products.map(p => {
      const aiContent = p.aicontent as Record<string, unknown> | null;
      return {
        id: Number(p.id),
        title: p.product_name,
        productUrl: p.shop_url,
        image: Array.isArray(aiContent?.images) && aiContent.images.length > 0 
          ? aiContent.images[0] 
          : '/img_not_found.png',
        language: p.language || 'en',
        type: p.type,
        source: p.source,
        category: p.category,
        status: 'completed',
        createdAt: p.created_at?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });

  } catch (error) {
    console.error('[AI Store] Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generated products' },
      { status: 500 }
    );
  }
}

