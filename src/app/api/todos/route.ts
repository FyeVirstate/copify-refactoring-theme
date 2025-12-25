/**
 * Todo List API Route
 * Adapted for Laravel database structure
 * 
 * GET /api/todos - Get user's todos
 * POST /api/todos - Create new todo
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// GET - Get user's todos
export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)

  try {
    const todos = await prisma.todo.findMany({
      where: { 
        userId,
        deletedAt: null,
      },
      orderBy: [
        { checked: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: todos.map(todo => ({
        id: todo.id.toString(),
        details: todo.details,
        isCompleted: todo.checked === 1,
        isDefaultTask: todo.defaultTask === 1,
        createdAt: todo.createdAt,
      }))
    })

  } catch (error) {
    console.error('Failed to fetch todos:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch todos'
    }, { status: 500 })
  }
}

// POST - Create new todo
const createSchema = z.object({
  details: z.string().min(1),
})

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
    const validated = createSchema.parse(body)

    const todo = await prisma.todo.create({
      data: {
        userId,
        details: validated.details,
        checked: 0,
        defaultTask: 0,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Todo created successfully',
      data: {
        id: todo.id.toString(),
        details: todo.details,
        isCompleted: todo.checked === 1,
        isDefaultTask: todo.defaultTask === 1,
        createdAt: todo.createdAt,
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

    console.error('Failed to create todo:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create todo'
    }, { status: 500 })
  }
}
