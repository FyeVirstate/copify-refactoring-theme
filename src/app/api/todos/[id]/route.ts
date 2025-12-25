/**
 * Todo Detail API Route
 * Adapted for Laravel database structure
 * 
 * PATCH /api/todos/[id] - Update todo (toggle complete, edit)
 * DELETE /api/todos/[id] - Delete todo
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH - Update todo
const updateSchema = z.object({
  details: z.string().min(1).optional(),
  isCompleted: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)
  const { id } = await params
  const todoId = BigInt(id)

  try {
    // Verify ownership
    const existing = await prisma.todo.findFirst({
      where: { id: todoId, userId }
    })

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Todo not found'
      }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const updateData: any = {}
    if (validated.details !== undefined) updateData.details = validated.details
    if (validated.isCompleted !== undefined) updateData.checked = validated.isCompleted ? 1 : 0

    const todo = await prisma.todo.update({
      where: { id: todoId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Todo updated successfully',
      data: {
        id: todo.id.toString(),
        details: todo.details,
        isCompleted: todo.checked === 1,
        isDefaultTask: todo.defaultTask === 1,
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

    console.error('Failed to update todo:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update todo'
    }, { status: 500 })
  }
}

// DELETE - Delete todo (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)
  const { id } = await params
  const todoId = BigInt(id)

  try {
    // Verify ownership and soft delete
    const existing = await prisma.todo.findFirst({
      where: { id: todoId, userId }
    })

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Todo not found'
      }, { status: 404 })
    }

    // Soft delete by setting deletedAt
    await prisma.todo.update({
      where: { id: todoId },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'Todo deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete todo:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete todo'
    }, { status: 500 })
  }
}
