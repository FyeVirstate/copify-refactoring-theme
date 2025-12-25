/**
 * Categories/Niches API Route
 * Get available categories for filtering
 * 
 * GET /api/categories
 */

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

type CategoryName = {
  en?: string
  fr?: string
  [key: string]: string | undefined
}

export async function GET() {
  if (!prisma) {
    return NextResponse.json({
      success: false,
      error: 'Database not available'
    }, { status: 500 })
  }

  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null }, // Only get top-level categories
      include: {
        children: true,
        _count: {
          select: { shops: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: categories.map(cat => {
        // Handle JSON name field (translatable)
        const nameObj = cat.name as CategoryName | null
        const name = nameObj?.en || nameObj?.fr || 'Unknown'
        
        return {
          id: Number(cat.id),
          name,
          shopCount: cat._count.shops,
          children: cat.children?.map(child => {
            const childNameObj = child.name as CategoryName | null
            const childName = childNameObj?.en || childNameObj?.fr || 'Unknown'
            return {
              id: Number(child.id),
              name: childName,
            }
          }) || []
        }
      })
    })

  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories'
    }, { status: 500 })
  }
}
