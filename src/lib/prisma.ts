import { PrismaClient } from '@prisma/client'

// Disable Prisma debug logs (prisma:query spam in console)
// This removes prisma from DEBUG env var to stop verbose query logging
if (typeof process !== 'undefined' && process.env?.DEBUG) {
  delete process.env.DEBUG;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Singleton pattern for Prisma Client
// This prevents connection exhaustion in serverless environments (Vercel)
function getPrismaClient(): PrismaClient | null {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.warn('[Prisma] DATABASE_URL is not set')
    return null
  }

  // Return existing global instance if available
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // Create new instance - only log errors (no queries, no warnings spam)
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  })

  // Store in global scope to prevent multiple instances
  // This is important for BOTH development AND production on serverless
  globalForPrisma.prisma = client

  return client
}

// Export prisma instance (can be null if DATABASE_URL not set)
export const prisma = getPrismaClient()

// Also export a function to get prisma lazily (useful for edge cases)
export function getPrisma(): PrismaClient {
  const client = getPrismaClient()
  if (!client) {
    throw new Error('Database is not configured. Please set DATABASE_URL environment variable.')
  }
  return client
}
