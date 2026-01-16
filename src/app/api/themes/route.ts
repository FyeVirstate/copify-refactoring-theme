/**
 * Themes API Route
 * Get available themes for filtering (from shop_themes table)
 * 
 * GET /api/themes
 * 
 * Returns themes used by 10+ shops, ordered by popularity (top 100)
 */

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  if (!prisma) {
    return NextResponse.json({
      success: false,
      error: 'Database not available'
    }, { status: 500 })
  }

  try {
    // Fetch themes from shop_themes table, grouped by name with count
    // Same logic as Laravel: themes used by 10+ shops, top 100 most popular
    const themes = await prisma.$queryRaw<{ name: string; shop_count: bigint }[]>`
      SELECT name, COUNT(*) as shop_count
      FROM shop_themes
      WHERE name IS NOT NULL AND name != ''
      GROUP BY name
      HAVING COUNT(*) > 10
      ORDER BY shop_count DESC
      LIMIT 100
    `

    // Format response - convert bigint to number, capitalize theme names
    const data = themes.map(theme => {
      // Capitalize first letter of each word
      const capitalizedName = theme.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      
      return {
        id: theme.name, // Keep original for filtering
        label: capitalizedName, // Capitalized for display
        count: Number(theme.shop_count)
      }
    })

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Failed to fetch themes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch themes'
    }, { status: 500 })
  }
}
