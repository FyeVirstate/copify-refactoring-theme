import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateQuickPreview } from '@/lib/services/theme-preview';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ai/preview?productId=123
 * Returns HTML preview for a generated product
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ message: 'Missing productId parameter' }, { status: 400 });
  }

  try {
    // Fetch the generated product
    const product = await prisma.generate_products.findFirst({
      where: {
        id: BigInt(productId),
        user_id: BigInt(userId),
      },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Extract AI content
    const aiContent = product.aicontent as any || {};
    const productContent = product.product_content as any || {};
    const images = (product.ai_generated_images as string[]) || [];

    // Build preview content
    const previewContent = {
      title: product.product_name || aiContent.title || 'Product',
      description: product.product_description || aiContent.description || '',
      price: aiContent.price || productContent.price || '€0.00',
      compareAtPrice: aiContent.compare_at_price || productContent.compare_at_price,
      features: aiContent.features || [],
      benefits: aiContent.benefits || [],
      faq: aiContent.faq || [],
      testimonials: aiContent.testimonials || [],
      images: images.length > 0 ? images : (aiContent.images || []),
      mainCatchyText: aiContent.mainCatchyText || aiContent.headline || product.product_name,
      subMainCatchyText: aiContent.subMainCatchyText || aiContent.subheadline || product.product_description,
      specialOffer: aiContent.specialOffer || aiContent.announcement || '🚚 Livraison gratuite !',
      deliveryInformation: aiContent.deliveryInformation,
      howItWorks: aiContent.howItWorks,
      storeName: aiContent.store_name || 'CopyfyAI Store',
    };

    // Generate preview HTML
    const html = generateQuickPreview(previewContent, {
      themeStyle: 'light',
      primaryColor: '#0066FF',
    });

    // Return HTML with proper headers
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error generating preview:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/ai/preview
 * Generate preview from AI content directly (without saving)
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { aiContent, options } = body;

    if (!aiContent) {
      return NextResponse.json({ message: 'Missing aiContent' }, { status: 400 });
    }

    // Generate preview HTML
    const html = generateQuickPreview(aiContent, options || {});

    // Return HTML
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error generating preview:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

