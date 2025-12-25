import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

/**
 * Middleware using auth config WITHOUT Prisma adapter
 * 
 * The full auth config (with Prisma) is used in API routes and pages.
 * This separation is necessary because Prisma's client engine doesn't
 * work in Edge Runtime without special configuration.
 */
export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    // Match all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|public|flags|img|images|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$).*)',
  ],
}
