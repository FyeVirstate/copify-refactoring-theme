'use client'

import { useState, useCallback } from 'react'

interface Todo {
  id: number
  title: string
  description: string | null
  isCompleted: boolean
  dueDate: string | null
  priority: string
  createdAt: string
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/todos')
      const data = await res.json()

      if (data.success) {
        setTodos(data.data)
        return data.data
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch todos')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create todo
  const createTodo = async (todoData: {
    title: string
    description?: string
    dueDate?: string
    priority?: 'low' | 'medium' | 'high'
  }) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todoData),
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    setTodos(prev => [data.data, ...prev])
    return data.data
  }

  // Update todo
  const updateTodo = async (id: number, updates: {
    title?: string
    description?: string
    isCompleted?: boolean
    dueDate?: string | null
    priority?: 'low' | 'medium' | 'high'
  }) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, ...data.data } : todo
    ))

    return data.data
  }

  // Toggle complete
  const toggleComplete = async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    return updateTodo(id, { isCompleted: !todo.isCompleted })
  }

  // Delete todo
  const deleteTodo = async (id: number) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    setTodos(prev => prev.filter(todo => todo.id !== id))
  }

  return {
    todos,
    isLoading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
  }
}
