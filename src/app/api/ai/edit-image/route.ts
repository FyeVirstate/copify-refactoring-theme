import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120; // 2 minutes timeout for image generation

// External API URL for image editing (same as Laravel)
const AI_EDIT_IMAGE_API = process.env.AI_EDIT_IMAGE_API || 'https://web-production-663df.up.railway.app/api/edit-image';
const AI_API_TOKEN = process.env.AI_API_TOKEN || 'copyfyai-secret-token-2024';

interface EditImageRequest {
  source_image: string;
  prompt: string;
  input_images?: string[];
  num_images?: number;
  aspect_ratio?: string;
  output_format?: string;
  limit_generations?: boolean;
}

interface EditImageResponse {
  success: boolean;
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  message?: string;
  error?: string;
}

/**
 * POST /api/ai/edit-image
 * 
 * Edit an image using AI
 * Mirrors Laravel's AICreativeController@editImage
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body: EditImageRequest = await request.json();

    // Validate required fields
    if (!body.source_image) {
      return NextResponse.json(
        { success: false, message: 'Image source requise' },
        { status: 400 }
      );
    }

    if (!body.prompt || body.prompt.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: 'Instruction requise (minimum 3 caractères)' },
        { status: 400 }
      );
    }

    // Check user balance for image generation
    if (!prisma) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 503 }
      );
    }

    const userId = BigInt(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balanceImageGeneration: true }
    });

    if (!user || user.balanceImageGeneration <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Crédits IA insuffisants. Achetez des crédits pour continuer.',
        code: 'INSUFFICIENT_CREDITS',
        remainingCredits: user?.balanceImageGeneration || 0
      }, { status: 403 });
    }

    // Prepare payload for external API
    const payload = {
      source_image: body.source_image,
      prompt: body.prompt,
      input_images: body.input_images || [],
      num_images: body.num_images || 1,
      aspect_ratio: body.aspect_ratio || 'auto',
      output_format: body.output_format || 'png',
      limit_generations: body.limit_generations ?? true,
      use_pro_model: true,
    };

    console.log('[AI Edit Image] Calling external API', {
      userId: session.user.id,
      sourceImage: body.source_image.substring(0, 50) + '...',
      promptLength: body.prompt.length,
      inputImagesCount: body.input_images?.length || 0,
    });

    // Call external API
    const response = await fetch(AI_EDIT_IMAGE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[AI Edit Image] API failed', {
        status: response.status,
        statusText: response.statusText,
      });

      return NextResponse.json(
        { 
          success: false, 
          message: "Échec de la modification de l'image. Veuillez réessayer.",
        },
        { status: response.status }
      );
    }

    const responseData: EditImageResponse = await response.json();

    // Check if generation was successful
    if (responseData.success && responseData.images && responseData.images.length > 0) {
      console.log('[AI Edit Image] Success', {
        userId: session.user.id,
        imagesGenerated: responseData.images.length,
      });

      // Deduct 1 credit from user balance (only on success)
      await prisma.user.update({
        where: { id: userId },
        data: { balanceImageGeneration: { decrement: 1 } }
      });

      // Get updated balance
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { balanceImageGeneration: true }
      });

      console.log('[AI Edit Image] Credit deducted, remaining:', updatedUser?.balanceImageGeneration);

      return NextResponse.json({
        success: true,
        images: responseData.images,
        remainingCredits: updatedUser?.balanceImageGeneration || 0
      });
    } else {
      console.warn('[AI Edit Image] No images returned', responseData);
      
      return NextResponse.json({
        success: false,
        message: responseData.message || "Échec de la génération de l'image",
      });
    }

  } catch (error) {
    console.error('[AI Edit Image] Error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'Délai de connexion dépassé. Veuillez réessayer.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Une erreur s'est produite lors de la modification de l'image." },
      { status: 500 }
    );
  }
}
