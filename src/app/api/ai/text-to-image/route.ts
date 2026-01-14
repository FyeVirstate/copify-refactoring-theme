import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120; // 2 minutes timeout for image generation

const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY || '';

/**
 * POST /api/ai/text-to-image
 * 
 * Generate an image from text prompt using FAL nano-banana-pro
 * Costs 1 credit per successful generation
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

    // Check if FAL key is configured
    if (!FAL_KEY) {
      return NextResponse.json(
        { success: false, message: 'FAL API key not configured' },
        { status: 500 }
      );
    }

    // Check database
    if (!prisma) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { prompt, aspect_ratio = '1:1', num_images = 1 } = body;

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: 'Prompt requis (minimum 3 caractères)' },
        { status: 400 }
      );
    }

    // Check user balance for image generation
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

    console.log('[Text-to-Image] Generating image...', {
      userId: session.user.id,
      promptLength: prompt.length,
      aspectRatio: aspect_ratio,
      currentCredits: user.balanceImageGeneration,
    });

    // Call FAL nano-banana-pro text-to-image
    const response = await fetch('https://fal.run/fal-ai/nano-banana-pro', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        num_images,
        aspect_ratio,
        output_format: 'png',
        resolution: '1K',
        limit_generations: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Text-to-Image] FAL API failed:', errorText);
      return NextResponse.json(
        { success: false, message: "Échec de la génération de l'image" },
        { status: 500 }
      );
    }

    const result = await response.json();

    if (result.images && result.images.length > 0) {
      console.log('[Text-to-Image] Success', {
        userId: session.user.id,
        imagesGenerated: result.images.length,
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

      console.log('[Text-to-Image] Credit deducted, remaining:', updatedUser?.balanceImageGeneration);

      return NextResponse.json({
        success: true,
        images: result.images.map((img: { url: string; width?: number; height?: number }) => ({
          url: img.url,
          width: img.width,
          height: img.height,
        })),
        remainingCredits: updatedUser?.balanceImageGeneration || 0
      });
    } else {
      console.warn('[Text-to-Image] No images returned');
      return NextResponse.json({
        success: false,
        message: "Aucune image générée",
      });
    }

  } catch (error) {
    console.error('[Text-to-Image] Error:', error);
    return NextResponse.json(
      { success: false, message: "Une erreur s'est produite lors de la génération." },
      { status: 500 }
    );
  }
}
