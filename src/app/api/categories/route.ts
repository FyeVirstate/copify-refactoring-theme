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

interface CategoryRecord {
  id: bigint
  name: unknown
  parentId: bigint | null
  createdAt: Date | null
  updatedAt: Date | null
}

export async function GET() {
  if (!prisma) {
    return NextResponse.json({
      success: false,
      error: 'Database not available'
    }, { status: 500 })
  }

  try {
    // Fetch ALL categories (no relations available in schema)
    const allCategories = await prisma.category.findMany({
      orderBy: { id: 'asc' }
    }) as CategoryRecord[]

    // Build parent-child hierarchy manually
    const parentCategories = allCategories.filter(cat => cat.parentId === null)
    const childCategoriesMap = new Map<number, CategoryRecord[]>()
    
    // Group children by parent ID
    for (const cat of allCategories) {
      if (cat.parentId !== null) {
        const parentIdNum = Number(cat.parentId)
        if (!childCategoriesMap.has(parentIdNum)) {
          childCategoriesMap.set(parentIdNum, [])
        }
        childCategoriesMap.get(parentIdNum)!.push(cat)
      }
    }

    // Format response
    const data = parentCategories.map(cat => {
      const nameObj = cat.name as CategoryName | null
      const name = nameObj?.en || nameObj?.fr || 'Unknown'
      const catId = Number(cat.id)
      
      // Get children for this category
      const children = childCategoriesMap.get(catId) || []
      
      return {
        id: catId,
        name,
        children: children.map(child => {
          const childNameObj = child.name as CategoryName | null
          const childName = childNameObj?.en || childNameObj?.fr || 'Unknown'
          return {
            id: Number(child.id),
            name: childName,
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories'
    }, { status: 500 })
  }
}
