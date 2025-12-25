/**
 * AI Content Generation API Route
 * Migrated from Laravel OpenAIService::generateContent
 * 
 * POST /api/ai/generate-content
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { OpenAIService } from "@/lib/services/openai"

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
    const body = await request.json()
    
    const {
      type,
      prompt,
      productInfo,
      platform,
    } = body

    // Validate request
    if (!type || !['description', 'ad_copy', 'custom'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid content type. Must be one of: description, ad_copy, custom' 
      }, { status: 400 })
    }

    // Get user language preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lang: true }
    })

    const language = user?.lang || 'en'

    // Initialize OpenAI service
    const openaiService = new OpenAIService()
    let content: string | null = null

    switch (type) {
      case 'description':
        if (!productInfo?.title) {
          return NextResponse.json({ 
            error: 'Product title is required for description generation' 
          }, { status: 400 })
        }
        content = await openaiService.generateProductDescription(productInfo, language)
        break

      case 'ad_copy':
        if (!productInfo?.title || !productInfo?.price || !productInfo?.benefits) {
          return NextResponse.json({ 
            error: 'Product title, price, and benefits are required for ad copy generation' 
          }, { status: 400 })
        }
        const adCopy = await openaiService.generateAdCopy(
          {
            title: productInfo.title,
            price: productInfo.price,
            currency: productInfo.currency || '$',
            benefits: productInfo.benefits,
          },
          platform || 'facebook',
          language
        )
        if (adCopy) {
          return NextResponse.json({
            success: true,
            data: adCopy
          })
        }
        break

      case 'custom':
        if (!prompt) {
          return NextResponse.json({ 
            error: 'Prompt is required for custom content generation' 
          }, { status: 400 })
        }
        content = await openaiService.generateContent(prompt)
        break
    }

    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate content'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        content
      }
    })

  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate content'
    }, { status: 500 })
  }
}
