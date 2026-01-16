import NextAuth, { DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import { syncUserToCustomerIo, sendCustomerIoEvent, CustomerIoEvents, buildUserPayload } from "./customerio"

// Check if we're in dev mode and if database is available
const isDevMode = process.env.NODE_ENV === 'development'
const hasDatabase = !!process.env.DATABASE_URL && prisma !== null

// Extend the session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      type: 'email' | 'Google';
      lang: string;
      activePlan?: {
        identifier: string;
        title: string;
        limitGenerateProduct: number;
        limitVideoGeneration: number;
        limitImageGeneration: number;
        limitProductExport: number;
        topShopsCount: number;
        topProductsCount: number;
        topAdsCount: number;
      };
      balances: {
        generateProduct: number;
        videoGeneration: number;
        imageGeneration: number;
        productExporter: number;
        shopExporter: number;
        importTheme: number;
      };
      shopifyDomain: string | null;
      hasShopify: boolean;
      isOnTrial: boolean;
      trialDaysRemaining?: number;
      trialEndsAt?: string | null;
    } & DefaultSession["user"]
  }

  interface User {
    type?: 'email' | 'Google';
    lang?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    type?: 'email' | 'Google';
    lang?: string;
    balances?: {
      generateProduct: number;
      videoGeneration: number;
      imageGeneration: number;
      productExporter: number;
      shopExporter: number;
      importTheme: number;
    };
    shopifyDomain?: string | null;
    hasShopify?: boolean;
    activePlan?: {
      identifier: string;
      title: string;
      limitGenerateProduct: number;
      limitVideoGeneration: number;
      limitImageGeneration: number;
      limitProductExport: number;
      topShopsCount: number;
      topProductsCount: number;
      topAdsCount: number;
    };
    isOnTrial?: boolean;
    trialDaysRemaining?: number;
    trialEndsAt?: string | null;
  }
}

// Mock user data for dev mode
const DEV_USER_SESSION = {
  activePlan: {
    identifier: 'pro',
    title: 'Pro (Dev)',
    limitGenerateProduct: 100,
    limitVideoGeneration: 50,
    limitImageGeneration: 100,
    limitProductExport: 500,
    topShopsCount: 1000,
    topProductsCount: 5000,
    topAdsCount: 2000,
  },
  balances: {
    generateProduct: 50,
    videoGeneration: 25,
    imageGeneration: 50,
    productExporter: 100,
    shopExporter: 50,
    importTheme: 10,
  },
}

// Build providers array
const providers = [
  // Google OAuth (only if configured)
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ] : []),
  
  // Credentials provider
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      devMode: { label: "Dev Mode", type: "text" }
    },
    async authorize(credentials) {
      console.log("[Auth] authorize called with email:", credentials?.email)
      
      // Dev mode login (no database required)
      if (isDevMode && credentials?.devMode === "true") {
        console.log("[Auth] Dev mode login")
        return {
          id: "dev-user-1",
          email: "dev@copyfy.io",
          name: "Dev User",
          type: "email" as const,
          lang: "fr",
        }
      }

      // Normal login requires database
      if (!hasDatabase || !prisma) {
        console.log("[Auth] No database available")
        return null
      }

      if (!credentials?.email || !credentials?.password) {
        console.log("[Auth] Missing email or password")
        return null
      }

      const emailLower = (credentials.email as string).toLowerCase()
      console.log("[Auth] Looking for user with email:", emailLower)

      try {
        const user = await prisma.user.findUnique({
          where: { email: emailLower }
        })

        console.log("[Auth] User found:", user ? `ID ${user.id}, type: ${user.type}` : "NO")

        if (!user) {
          console.log("[Auth] User not found")
          return null
        }

        if (!user.password) {
          console.log("[Auth] User has no password (might be Google-only)")
          return null
        }

        // Check if Google-only account
        if (user.type === 'Google') {
          console.log("[Auth] Google-only account, rejecting credentials login")
          throw new Error('GOOGLE_ONLY_ACCOUNT')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        console.log("[Auth] Password valid:", isPasswordValid)

        if (!isPasswordValid) {
          console.log("[Auth] Invalid password")
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })

        // Sync to Customer.io on login (fire and forget)
        buildUserPayload({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          lang: user.lang,
          lastLogin: new Date(),
        }).then(payload => {
          syncUserToCustomerIo(payload).catch(err => {
            console.error('[Auth] Customer.io sync error:', err);
          });
        });

        console.log("[Auth] Login successful for user:", user.id)

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          type: user.type as "email" | "Google",
          lang: user.lang,
        }
      } catch (error) {
        console.error("[Auth] Error during authorization:", error)
        throw error
      }
    },
  })
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  
  // Only use PrismaAdapter if database is available
  // NOTE: PrismaAdapter doesn't work well with credentials, so we skip it for now
  // ...(hasDatabase && prisma ? { adapter: PrismaAdapter(prisma) as any } : {}),
  
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
      const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
      
      // Dashboard routes that require authentication
      const isDashboardRoute = pathname.startsWith('/dashboard')
      
      // API routes
      const isApiRoute = pathname.startsWith('/api')
      const isAuthApiRoute = pathname.startsWith('/api/auth')
      const isPublicApiRoute = pathname.startsWith('/api/public')
      
      // Redirect logged out users trying to access dashboard
      if (isDashboardRoute && !isLoggedIn) {
        return false // Will redirect to signIn page
      }
      
      // Redirect logged in users away from login/register
      if (isLoggedIn && isPublicRoute) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      
      // Protect API routes (except auth and public routes)
      if (isApiRoute && !isAuthApiRoute && !isPublicApiRoute && !isLoggedIn) {
        return false
      }
      
      return true
    },
    
    async signIn({ user, account, profile }) {
      // Dev mode - allow all sign ins
      if (isDevMode && !hasDatabase) {
        return true
      }

      // For Google OAuth (requires database)
      if (account?.provider === "google" && hasDatabase && prisma) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          // Get trial plan for initial credits
          const trialPlan = await prisma.plan.findFirst({
            where: { identifier: 'trial' }
          })

          // Create new user with trial credits
          // For OAuth users, we set a random password (they'll use OAuth to login)
          const randomPassword = await bcrypt.hash(crypto.randomUUID(), 12)
          
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              password: randomPassword,
              type: 'Google',
              createdAt: new Date(), // Important for trial period calculation
              emailVerifiedAt: new Date(),
              balanceGenerateProduct: trialPlan?.limitGenerateProduct ?? 0,
              balanceVideoGeneration: trialPlan?.limitVideoGeneration ?? 0,
              balanceImageGeneration: trialPlan?.limitImageGeneration ?? 0,
              balanceProductExporter: trialPlan?.limitProductExporter ?? 0,
              backupCode: Math.floor(100000 + Math.random() * 900000).toString(),
              cancelToken: crypto.randomUUID(),
              verifyToken: crypto.randomUUID(),
            }
          })

          // Sync new Google user to Customer.io
          const customerIoPayload = await buildUserPayload({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            createdAt: newUser.createdAt,
            lang: newUser.lang,
            emailVerifiedAt: newUser.emailVerifiedAt,
          }, {
            activePlan: { identifier: 'trial', title: 'Free Trial' },
            generateStoresCount: 0,
            generateProductsCount: 0,
          });
          
          // Fire and forget - don't block OAuth flow
          syncUserToCustomerIo(customerIoPayload).catch(err => {
            console.error('[Auth] Customer.io sync error:', err);
          });

          // Send free_trial event
          sendCustomerIoEvent(Number(newUser.id), CustomerIoEvents.FREE_TRIAL, {
            plan_name: 'Free Trial',
          }).catch(err => {
            console.error('[Auth] Customer.io event error:', err);
          })
        } else {
          // Update last login
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLogin: new Date() }
          })

          // Sync to Customer.io on Google login (fire and forget)
          buildUserPayload({
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            createdAt: existingUser.createdAt,
            lang: existingUser.lang,
            lastLogin: new Date(),
          }).then(payload => {
            syncUserToCustomerIo(payload).catch(err => {
              console.error('[Auth] Customer.io sync error:', err);
            });
          });
        }
      }

      return true
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.type = user.type
        token.lang = user.lang
      }

      // Dev mode without database - use mock data
      if (isDevMode && !hasDatabase) {
        if (token.id === "dev-user-1") {
          token.type = "email"
          token.lang = "fr"
          token.balances = DEV_USER_SESSION.balances
          token.activePlan = DEV_USER_SESSION.activePlan
          token.isOnTrial = false
          token.shopifyDomain = null
          token.hasShopify = false
          token.trialEndsAt = null
        }
        return token
      }

      // Refresh user data from database
      if (token.id && hasDatabase && prisma) {
        try {
          const userId = parseInt(token.id as string)
          if (isNaN(userId)) {
            // Dev user ID, skip database lookup
            return token
          }
          
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
              subscriptions: {
                where: {
                  stripeStatus: 'active',
                },
                take: 1
              }
            }
          })

          if (dbUser) {
            token.type = dbUser.type
            token.lang = dbUser.lang
            token.balances = {
              generateProduct: dbUser.balanceGenerateProduct,
              videoGeneration: dbUser.balanceVideoGeneration,
              imageGeneration: dbUser.balanceImageGeneration,
              productExporter: dbUser.balanceProductExporter,
              shopExporter: dbUser.balanceShopExporter,
              importTheme: dbUser.balanceImportTheme,
            }
            token.shopifyDomain = dbUser.shopifyDomain
            token.hasShopify = !!dbUser.shopifyDomain && !!dbUser.shopifyAccessToken
            token.trialEndsAt = dbUser.trialEndsAt?.toISOString() ?? null
            
            // Determine active plan
            const activeSub = dbUser.subscriptions[0]
            if (activeSub) {
              // Fetch the plan based on subscription name
              const activePlan = await prisma.plan.findFirst({
                where: { identifier: activeSub.name }
              })
              
              if (activePlan) {
                token.activePlan = {
                  identifier: activeSub.name,
                  title: activePlan.title,
                  limitGenerateProduct: activePlan.limitGenerateProduct,
                  limitVideoGeneration: activePlan.limitVideoGeneration,
                  limitImageGeneration: activePlan.limitImageGeneration,
                  limitProductExport: activePlan.limitProductExporter,
                  topShopsCount: activePlan.topShopsCount ?? 0,
                  topProductsCount: activePlan.topProductsCount ?? 0,
                  topAdsCount: activePlan.topAdsCount ?? 0,
                }
                token.isOnTrial = false
              }
            } else {
              // Trial or expired - check if within trial period
              const trialHours = 168 // 7 days trial for all users
              const createdAtTime = dbUser.createdAt ? new Date(dbUser.createdAt).getTime() : Date.now()
              const hoursSinceCreation = Math.floor(
                (Date.now() - createdAtTime) / (1000 * 60 * 60)
              )
              
              if (hoursSinceCreation < trialHours) {
                const trialPlan = await prisma.plan.findFirst({
                  where: { identifier: 'trial' }
                })
                
                const daysRemaining = Math.ceil((trialHours - hoursSinceCreation) / 24)
                
                token.activePlan = {
                  identifier: 'trial',
                  title: dbUser.lang === 'fr' ? 'Essai gratuit' : 'Free Trial',
                  limitGenerateProduct: trialPlan?.limitGenerateProduct ?? 0,
                  limitVideoGeneration: trialPlan?.limitVideoGeneration ?? 0,
                  limitImageGeneration: trialPlan?.limitImageGeneration ?? 0,
                  limitProductExport: trialPlan?.limitProductExporter ?? 0,
                  topShopsCount: trialPlan?.topShopsCount ?? 0,
                  topProductsCount: trialPlan?.topProductsCount ?? 0,
                  topAdsCount: trialPlan?.topAdsCount ?? 0,
                }
                token.isOnTrial = true
                token.trialDaysRemaining = daysRemaining
              } else {
                token.activePlan = {
                  identifier: 'expired',
                  title: 'Expired',
                  limitGenerateProduct: 0,
                  limitVideoGeneration: 0,
                  limitImageGeneration: 0,
                  limitProductExport: 0,
                  topShopsCount: 0,
                  topProductsCount: 0,
                  topAdsCount: 0,
                }
                token.isOnTrial = false
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user from database:", error)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.type = token.type as 'email' | 'Google'
        session.user.lang = token.lang as string
        session.user.activePlan = token.activePlan as typeof DEV_USER_SESSION.activePlan | undefined
        session.user.balances = (token.balances ?? DEV_USER_SESSION.balances) as typeof DEV_USER_SESSION.balances
        session.user.shopifyDomain = (token.shopifyDomain ?? null) as string | null
        session.user.hasShopify = (token.hasShopify ?? false) as boolean
        session.user.isOnTrial = (token.isOnTrial ?? false) as boolean
        session.user.trialDaysRemaining = token.trialDaysRemaining as number | undefined
        session.user.trialEndsAt = (token.trialEndsAt ?? null) as string | null
      }
      return session
    }
  },

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})
