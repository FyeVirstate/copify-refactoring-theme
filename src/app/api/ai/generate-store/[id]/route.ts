import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ai/generate-store/[id]
 * 
 * Get a specific generated product by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = BigInt(id);
    const userId = BigInt(session.user.id);

    const product = await prisma.generate_products.findFirst({
      where: {
        id: productId,
        user_id: userId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        id: Number(product.id),
        title: product.product_name,
        productUrl: product.shop_url,
        description: product.product_description,
        category: product.category,
        language: product.language,
        source: product.source,
        type: product.type,
        aiContent: product.aicontent,
        productContent: product.product_content,
        aiGeneratedImages: product.ai_generated_images,
        feedbackReceived: product.feedback_received,
        createdAt: product.created_at?.toISOString(),
        updatedAt: product.updated_at?.toISOString(),
      },
    });

  } catch (error) {
    console.error('[AI Store] Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai/generate-store/[id]
 * 
 * Update a generated product's AI content
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = BigInt(id);
    const userId = BigInt(session.user.id);
    const body = await request.json();

    // Verify ownership
    const existingProduct = await prisma.generate_products.findFirst({
      where: {
        id: productId,
        user_id: userId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update the product
    const { aiContent, productName, images } = body;

    // Merge existing AI content with updates
    const existingAiContent = existingProduct.aicontent as Record<string, unknown> || {};
    const updatedAiContent = {
      ...existingAiContent,
      ...aiContent,
    };

    // If images are provided, update them
    if (images && Array.isArray(images)) {
      updatedAiContent.images = images;
    }

    const updatedProduct = await prisma.generate_products.update({
      where: { id: productId },
      data: {
        product_name: productName || existingProduct.product_name,
        aicontent: updatedAiContent as object,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: Number(updatedProduct.id),
        title: updatedProduct.product_name,
        aiContent: updatedProduct.aicontent,
        updatedAt: updatedProduct.updated_at?.toISOString(),
      },
    });

  } catch (error) {
    console.error('[AI Store] Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/generate-store/[id]
 * 
 * Delete a generated product
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = BigInt(id);
    const userId = BigInt(session.user.id);

    // Verify ownership
    const existingProduct = await prisma.generate_products.findFirst({
      where: {
        id: productId,
        user_id: userId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete the product
    await prisma.generate_products.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error) {
    console.error('[AI Store] Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

