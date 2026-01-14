/**
 * AI Color Palette Generation API
 * 
 * Analyzes product images and generates a harmonious color palette
 * using OpenAI GPT-4 Vision based on the product appearance.
 * 
 * POST /api/ai/analyze-colors
 * - imageUrl: URL of the product image to analyze
 * - productTitle: Product title for context
 * - Returns: Suggested color palette (primary, secondary, accent, background, text)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateColorPalette, getDefaultPalettes, ColorPalette } from '@/lib/services/color-palette';

export const maxDuration = 60; // 60 seconds max

/**
 * POST /api/ai/analyze-colors
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

    const body = await request.json();
    const { imageUrl, productTitle } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log(`[Color Palette API] Analyzing colors for: ${productTitle || 'Unknown product'}`);

    // Generate color palette using the service
    const palette = await generateColorPalette(
      imageUrl,
      productTitle || 'Product'
    );

    console.log(`[Color Palette API] Generated palette: ${palette.name}`);

    return NextResponse.json({
      success: true,
      palette,
      source: process.env.OPENAI_API_KEY ? 'ai' : 'default',
    });

  } catch (error) {
    console.error('[Color Palette API] Error:', error);
    
    // Return default palette on error
    const defaultPalettes = getDefaultPalettes();
    const fallbackPalette = defaultPalettes[0];
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze colors',
      palette: fallbackPalette,
      source: 'fallback',
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/analyze-colors
 * Returns available default palettes and provider status
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    defaultPalettes: getDefaultPalettes(),
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
    },
  });
}
