/**
 * AI Image Generation API Route
 * Adapted for Laravel database schema
 * 
 * POST /api/ai/generate-image
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { ReplicateService } from "@/lib/services/replicate"

// Predefined prompts matching Laravel
const PROMPTS = {
  lifestyle: "Show a real person naturally using the exact same product from the input image — keep the same shape, size, scale, color, material, and design. The product must remain identical and proportional to the person's hand or body. Do NOT modify, resize, or redesign the product. Do NOT add or remove any elements. Simply place it in a realistic lifestyle context with a person using it naturally, under soft natural daylight, in a cozy modern home environment. Maintain true colors, photorealistic lighting, and premium e-commerce quality.",
  packshot: "Keep the exact same product from the input image — same shape, material, proportions, and design. Do NOT change the product structure or invent new parts. Only clean, enhance and isolate it for a professional e-commerce look. Remove background and imperfections. Keep realistic lighting and true colors. Soft natural light, subtle shadow, photorealistic, premium product photo.",
  'image-text': "Keep the exact same product from the input image — same shape, material, proportions, and design. Place it on a clean, minimal background. Add bold, modern, eye-catching text overlay that promotes or describes the product (e.g., discount percentage, product name, key benefit). The text should be professionally designed, readable, and complement the product without covering important details. Use vibrant colors for the text that contrast well with the background. Maintain photorealistic lighting and premium e-commerce quality. The overall composition should look like a social media ad or promotional banner."
}

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)

  try {
    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { stripeStatus: { in: ['active', 'trialing'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check image generation credits
    if (user.balanceImageGeneration <= 0) {
      const isOnTrial = user.trialEndsAt && new Date(user.trialEndsAt) > new Date()
      
      return NextResponse.json({
        success: false,
        error: isOnTrial 
          ? 'Upgrade required to generate more images'
          : 'Image generation limit reached for this billing period',
        featureLimited: 'Image Generation',
        limitType: 'Generation limit reached',
        trialUser: isOnTrial,
        remainingCredits: 0
      }, { status: 403 })
    }

    const body = await request.json()
    
    const {
      imageUrl,
      promptType = 'lifestyle',
      customPrompt,
      aspectRatio = '1:1',
      outputFormat = 'png',
    } = body

    // Validate request
    if (!imageUrl) {
      return NextResponse.json({ 
        error: 'Image URL is required' 
      }, { status: 400 })
    }

    if (!['lifestyle', 'packshot', 'image-text', 'custom'].includes(promptType)) {
      return NextResponse.json({ 
        error: 'Invalid prompt type' 
      }, { status: 400 })
    }

    // Determine the prompt
    let prompt: string
    if (promptType === 'custom') {
      if (!customPrompt) {
        return NextResponse.json({ 
          error: 'Custom prompt is required when promptType is custom' 
        }, { status: 400 })
      }
      prompt = customPrompt
    } else {
      prompt = PROMPTS[promptType as keyof typeof PROMPTS]
    }

    // Create image generation record - adapted for Laravel schema
    const imageGeneration = await prisma.imageGeneration.create({
      data: {
        userId,
        inputImage: imageUrl,
        parameters: {
          prompt,
          promptType,
          aspectRatio,
          outputFormat,
        },
        status: 'processing',
      }
    })

    // Initialize Replicate service
    const replicateService = new ReplicateService()
    
    const result = await replicateService.generateProductImage({
      imageUrl,
      prompt,
      aspectRatio,
      outputFormat,
    })

    if (result.success && result.output) {
      // Get the generated image URL
      const generatedImageUrl = Array.isArray(result.output) 
        ? result.output[0] 
        : result.output

      // Update record as completed - adapted for Laravel schema
      await prisma.imageGeneration.update({
        where: { id: imageGeneration.id },
        data: {
          status: 'completed',
          predictionId: result.prediction_id,
          outputImages: [generatedImageUrl],
          completedAt: new Date(),
        }
      })

      // Deduct user's image generation balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          balanceImageGeneration: { decrement: 1 }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          id: imageGeneration.id.toString(),
          generatedImageUrl,
          originalImageUrl: imageUrl,
          remainingCredits: user.balanceImageGeneration - 1,
        }
      })
    } else {
      // Mark as failed - adapted for Laravel schema
      await prisma.imageGeneration.update({
        where: { id: imageGeneration.id },
        data: {
          status: 'failed',
          error: result.message || 'Unknown error occurred'
        }
      })

      return NextResponse.json({
        success: false,
        error: result.message || 'Failed to generate image'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate image'
    }, { status: 500 })
  }
}

// GET - Get user's image generation history
export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '12')
  const status = searchParams.get('status')

  const where: any = { userId }
  if (status) {
    where.status = status
  }

  const [generations, total] = await Promise.all([
    prisma.imageGeneration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.imageGeneration.count({ where })
  ])

  return NextResponse.json({
    success: true,
    data: generations.map(g => {
      // Extract output images from JSON
      const outputImages = g.outputImages as string[] | null
      const generatedImageUrl = outputImages?.[0] ?? null
      
      return {
        id: g.id.toString(),
        status: g.status,
        originalImageUrl: g.inputImage,
        generatedImageUrl,
        parameters: g.parameters,
        createdAt: g.createdAt,
        completedAt: g.completedAt,
      }
    }),
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    }
  })
}
