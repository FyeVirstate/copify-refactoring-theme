/**
 * Saved Searches API Route
 * Save and retrieve filter presets
 * 
 * GET /api/saved-searches - Get user's saved searches
 * POST /api/saved-searches - Save a new search
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// GET - Get user's saved searches
export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)
  const searchParams = request.nextUrl.searchParams
  const modelName = searchParams.get('type') // 'shops', 'ads', 'products'

  try {
    const where: { userId: bigint; modelName?: string } = { userId }
    if (modelName) {
      where.modelName = modelName
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: savedSearches.map(search => ({
        id: Number(search.id),
        name: search.name,
        type: search.modelName,
        filters: search.searchParameters,
        createdAt: search.createdAt,
      }))
    })

  } catch (error) {
    console.error('Failed to fetch saved searches:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch saved searches'
    }, { status: 500 })
  }
}

// POST - Save a new search
const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['shops', 'ads', 'products'] as const),
  filters: z.record(z.string(), z.unknown()),
})

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)

  try {
    const body = await request.json()
    const validated = createSchema.parse(body)

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId,
        name: validated.name,
        modelName: validated.type,
        searchParameters: validated.filters as object,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Search saved successfully',
      data: {
        id: Number(savedSearch.id),
        name: savedSearch.name,
        type: savedSearch.modelName,
        filters: savedSearch.searchParameters,
        createdAt: savedSearch.createdAt,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Failed to save search:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save search'
    }, { status: 500 })
  }
}

// DELETE - Delete a saved search
export async function DELETE(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = BigInt(session.user.id)
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Search ID is required' }, { status: 400 })
  }

  try {
    const deleted = await prisma.savedSearch.deleteMany({
      where: {
        id: BigInt(id),
        userId,
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json({
        success: false,
        error: 'Saved search not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Saved search deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete saved search:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete saved search'
    }, { status: 500 })
  }
}
