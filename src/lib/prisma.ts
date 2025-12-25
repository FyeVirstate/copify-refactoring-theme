import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only create PrismaClient if DATABASE_URL is set
const hasDatabase = !!process.env.DATABASE_URL

let prismaInstance: PrismaClient | null = null

if (hasDatabase && process.env.DATABASE_URL) {
  // Check if we already have a global instance
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma
  } else {
    // Create standard Prisma client
    prismaInstance = new PrismaClient()
    
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance
    }
  }
}

// Export prisma (can be null if no database)
export const prisma = prismaInstance
