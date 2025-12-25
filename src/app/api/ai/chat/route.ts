/**
 * AI Chat API Route
 * Migrated from Laravel ClaudeAIService::generateDropshippingChatResponse
 * 
 * POST /api/ai/chat
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { ClaudeAIService } from "@/lib/services/claude"

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
      userQuestion,
      storeName,
      monthlyTraffic,
      monthlyRevenue,
      dailyRevenue,
      growthRate,
      revenueEvolution1Month,
      productCount,
      shopAgeMonths,
      currency,
      aov,
    } = body

    // Validate required fields
    if (!userQuestion) {
      return NextResponse.json({ 
        error: 'Question is required' 
      }, { status: 400 })
    }

    if (!storeName) {
      return NextResponse.json({ 
        error: 'Store name is required' 
      }, { status: 400 })
    }

    // Get user language preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lang: true }
    })

    const userLang = user?.lang || 'en'

    // Initialize Claude service and generate chat response
    const claudeService = new ClaudeAIService()
    
    const response = await claudeService.generateDropshippingChatResponse({
      userQuestion,
      storeName,
      monthlyTraffic: monthlyTraffic || 0,
      monthlyRevenue: monthlyRevenue || 0,
      dailyRevenue: dailyRevenue || 0,
      growthRate: growthRate || 0,
      revenueEvolution1Month: revenueEvolution1Month || 0,
      productCount: productCount || 0,
      shopAgeMonths: shopAgeMonths || 0,
      currency: currency || '$',
      aov,
      userLang,
    })

    if (!response) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate response'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        response
      }
    })

  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate chat response'
    }, { status: 500 })
  }
}
