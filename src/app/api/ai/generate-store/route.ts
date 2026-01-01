import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchAliExpressProduct, extractProductId } from '@/lib/services/aliexpress';
import { generateStoreContent, getLanguageName } from '@/lib/services/store-ai';

export const maxDuration = 60; // Allow up to 60 seconds for AI generation

/**
 * POST /api/ai/generate-store
 * 
 * Generate AI store content from a product URL (AliExpress or Amazon)
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

    // Validate URL format
    const isAliExpress = productUrl.includes('aliexpress.com');
    const isAmazon = productUrl.includes('amazon.');
    
    if (!isAliExpress && !isAmazon) {
      return NextResponse.json(
        { error: 'Please provide a valid AliExpress or Amazon product URL' },
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

    // For now, only support AliExpress
    if (isAmazon) {
      return NextResponse.json(
        { error: 'Amazon product import coming soon. Please use an AliExpress URL for now.' },
        { status: 400 }
      );
    }

    // Extract product ID
    const productId = extractProductId(productUrl);
    if (!productId) {
      return NextResponse.json(
        { error: 'Could not extract product ID from URL' },
        { status: 400 }
      );
    }

    console.log(`[AI Store] Fetching product ${productId} for user ${userId}`);

    // Fetch product data from AliExpress
    const productData = await fetchAliExpressProduct(productId);
    
    console.log(`[AI Store] Product fetched: ${productData.title}`);

    // Generate AI content
    const languageName = getLanguageName(language);
    const aiContent = await generateStoreContent(productData, languageName);
    
    console.log(`[AI Store] AI content generated for: ${aiContent.title}`);

    // Clean URL (remove query parameters)
    const cleanUrl = productUrl.includes('?') 
      ? productUrl.substring(0, productUrl.indexOf('?'))
      : productUrl;

    // Save to database
    const generatedProduct = await prisma.generate_products.create({
      data: {
        user_id: userId,
        shop_url: cleanUrl,
        product_name: aiContent.title,
        product_description: productData.description?.html || null,
        category: productData.categories?.[0]?.name || null,
        language,
        product_id: productId,
        source: 'aliexpress',
        type: 'store',
        aicontent: aiContent as unknown as object,
        product_content: productData as unknown as object,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`[AI Store] Saved generated product ${generatedProduct.id}`);

    // Return the generated content
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

