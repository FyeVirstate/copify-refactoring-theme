/**
 * AI Store Images Generation API Route
 * Mirrors Laravel GenerateAIImagesJob behavior
 * 
 * POST /api/ai/generate-store-images
 * - Generates 5 AI images for a store using FAL AI
 * - Shows progress step by step
 * 
 * POST /api/ai/generate-store-images?stream=true
 * - Same but with Server-Sent Events for real-time progress
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { FalAIService, GENERATION_STEPS, GenerationProgress } from "@/lib/services/fal-ai"

export const maxDuration = 300 // 5 minutes max for Vercel

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const useStream = request.nextUrl.searchParams.get('stream') === 'true'

  try {
    const body = await request.json()
    const { 
      productId, 
      images = [], 
      aiContent = {} 
    } = body

    // Validate request
    if (!images || images.length === 0) {
      return NextResponse.json({ 
        error: 'No images provided',
        message: 'Please provide at least one image URL to generate from'
      }, { status: 400 })
    }

    // Check API keys
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!falKey) {
      return NextResponse.json({ 
        error: 'FAL_KEY not configured',
        message: 'Please add FAL_KEY to your environment variables'
      }, { status: 500 })
    }

    if (!openaiKey) {
      return NextResponse.json({ 
        error: 'OPENAI_API_KEY not configured',
        message: 'Please add OPENAI_API_KEY to your environment variables'
      }, { status: 500 })
    }

    // For streaming response (Server-Sent Events)
    if (useStream) {
      const encoder = new TextEncoder()
      
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: unknown) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
          }

          try {
            // Initialize FAL AI service
            const falService = new FalAIService()

            // Start generation with progress updates
            const result = await falService.generateStoreImages(
              images,
              aiContent,
              (progress: GenerationProgress) => {
                sendEvent('progress', progress)
              }
            )

            // Send final result
            sendEvent('complete', result)

            // Update product with generated images if productId provided
            if (productId && prisma && result.success) {
              try {
                await updateProductWithImages(productId, result.recommended_images)
                sendEvent('saved', { productId, saved: true })
              } catch (saveError) {
                console.error('Failed to save images to product:', saveError)
                sendEvent('save_error', { error: 'Failed to save images to database' })
              }
            }

          } catch (error) {
            console.error('Stream generation error:', error)
            sendEvent('error', { 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          } finally {
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Non-streaming response
    const falService = new FalAIService()
    
    console.log('[API] Starting image generation...', {
      imageCount: images.length,
      hasAiContent: Object.keys(aiContent).length > 0
    })

    const result = await falService.generateStoreImages(images, aiContent)

    // Update product with generated images if productId provided
    if (productId && prisma && result.success) {
      try {
        await updateProductWithImages(productId, result.recommended_images)
      } catch (saveError) {
        console.error('Failed to save images to product:', saveError)
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate images'
    }, { status: 500 })
  }
}

/**
 * Helper to update product with generated images
 */
async function updateProductWithImages(
  productId: string | number, 
  images: Array<{ image_url: string; prompt: string; index: number }>
) {
  if (!prisma) return

  const id = typeof productId === 'string' ? BigInt(productId) : BigInt(productId)

  // Get existing product
  const product = await prisma.generateProduct.findUnique({
    where: { id },
    select: { aiGeneratedImages: true }
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // Build recommended_images array
  const recommendedImages = images.map(img => ({
    index: img.index,
    image_type: 'recommended',
    special_index: img.index,
    prompt: img.prompt,
    image_url: img.image_url,
    image_url_no_bg: null
  }))

  // Merge with existing or create new
  const existingData = (product.aiGeneratedImages as Record<string, unknown>) || {}
  
  const newData = {
    ...existingData,
    success: true,
    total_images: recommendedImages.length,
    recommended_images: recommendedImages,
    generated_at: new Date().toISOString()
  }

  // Update the product
  await prisma.generateProduct.update({
    where: { id },
    data: {
      aiGeneratedImages: newData
    }
  })

  console.log(`[API] Saved ${recommendedImages.length} images to product ${productId}`)
}

/**
 * GET - Get generation steps info
 */
export async function GET() {
  return NextResponse.json({
    steps: GENERATION_STEPS,
    totalSteps: GENERATION_STEPS.length,
    estimatedTime: '45-90 seconds',
    features: [
      'Background removal with FAL AI',
      'Smart prompt generation with GPT-4o',
      'Parallel image generation (5 images)',
      'Real-time progress updates with streaming'
    ]
  })
}
