import type { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

/**
 * Base auth configuration for Edge Runtime (middleware)
 * This config does NOT include database operations because Prisma
 * doesn't work in Edge Runtime without special adapters.
 * 
 * The full auth config (with database) is in auth.ts
 */
export const authConfig: NextAuthConfig = {
  providers: [
    // Only add Google provider if credentials are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    ] : []),
    
    // Credentials provider (authorize is handled in auth.ts)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        devMode: { label: "Dev Mode", type: "text" }
      },
      // This authorize is only for Edge Runtime (middleware)
      // The actual authorization happens in auth.ts
      authorize: async () => null,
    })
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      
      // Public routes that don't require authentication
      const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/share']
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
      
      // Dashboard routes that require authentication
      const isDashboardRoute = pathname.startsWith('/dashboard')
      
      // API routes
      const isApiRoute = pathname.startsWith('/api')
      const isAuthApiRoute = pathname.startsWith('/api/auth')
      const isPublicApiRoute = pathname.startsWith('/api/public')
      const isShareApiRoute = pathname.startsWith('/api/share/') // Public share API
      
      // Redirect logged out users trying to access dashboard
      if (isDashboardRoute && !isLoggedIn) {
        return false // Will redirect to signIn page
      }
      
      // Redirect logged in users away from login/register (but not share page)
      if (isLoggedIn && isPublicRoute && !pathname.startsWith('/share')) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      
      // Protect API routes (except auth, public, and share routes)
      if (isApiRoute && !isAuthApiRoute && !isPublicApiRoute && !isShareApiRoute && !isLoggedIn) {
        return false
      }
      
      return true
    },
  },

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
}
