/**
 * AI Store Analysis API Route
 * Migrated from Laravel ClaudeAIService::generateDropshippingAnalysis
 * 
 * POST /api/ai/analyze-store
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
      storeName,
      monthlyTraffic,
      monthlyRevenue,
      revenueEvolution3Months,
      revenueEvolution1Month,
      geographicDistribution,
      trafficSources,
      activeAds,
      adsEvolution,
      launchDate,
      productCount,
    } = body

    // Validate required fields
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

    const locale = user?.lang || 'en'

    // Initialize Claude service and generate analysis
    const claudeService = new ClaudeAIService()
    
    const analysis = await claudeService.generateDropshippingAnalysis({
      storeName,
      monthlyTraffic: monthlyTraffic || 0,
      monthlyRevenue: monthlyRevenue || 0,
      revenueEvolution3Months: revenueEvolution3Months || 0,
      revenueEvolution1Month: revenueEvolution1Month || 0,
      geographicDistribution: geographicDistribution || 'Unknown',
      trafficSources: trafficSources || 'Unknown',
      activeAds: activeAds || 0,
      adsEvolution: adsEvolution || '0%',
      launchDate: launchDate || 'Unknown',
      productCount: productCount || 0,
      locale,
    })

    if (!analysis) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate analysis'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Store analysis error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze store'
    }, { status: 500 })
  }
}
