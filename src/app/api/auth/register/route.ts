import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { syncUserToCustomerIo, sendCustomerIoEvent, CustomerIoEvents, buildUserPayload } from "@/lib/customerio"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  lang: z.enum(['fr', 'en']).default('fr'),
  utmSource: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // Check if database is available
  if (!prisma) {
    return NextResponse.json({ 
      error: 'DATABASE_NOT_CONFIGURED',
      message: 'Database is not configured. Please contact support.' 
    }, { status: 503 })
  }

  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parsed.error.issues 
      }, { status: 400 })
    }

    const { name, email, password, lang, utmSource } = parsed.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      // Check if it's a Google account
      if (existingUser.type === 'Google') {
        return NextResponse.json({ 
          error: 'GOOGLE_ACCOUNT_EXISTS',
          message: 'An account with this email already exists. Please sign in with Google.' 
        }, { status: 409 })
      }
      
      return NextResponse.json({ 
        error: 'EMAIL_EXISTS',
        message: 'An account with this email already exists. Please sign in.' 
      }, { status: 409 })
    }

    // Get trial plan for initial credits
    const trialPlan = await prisma.plan.findFirst({
      where: { identifier: 'trial' }
    })

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with createdAt for trial period calculation
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        type: 'email',
        lang,
        utmSource,
        createdAt: new Date(), // Important for trial period calculation
        balanceGenerateProduct: trialPlan?.limitGenerateProduct ?? 0,
        balanceVideoGeneration: trialPlan?.limitVideoGeneration ?? 0,
        balanceImageGeneration: trialPlan?.limitImageGeneration ?? 0,
        balanceProductExporter: trialPlan?.limitProductExporter ?? 0,
        backupCode: Math.floor(100000 + Math.random() * 900000).toString(),
        cancelToken: crypto.randomUUID(),
        verifyToken: crypto.randomUUID(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        lang: true,
        createdAt: true,
      }
    })

    // TODO: Send verification email

    // Sync user to Customer.io (async, don't block response)
    const customerIoPayload = await buildUserPayload({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lang: user.lang,
      utmSource: utmSource || null,
    }, {
      activePlan: { identifier: 'trial', title: 'Free Trial' },
      generateStoresCount: 0,
      generateProductsCount: 0,
    });
    
    // Fire and forget - don't wait for Customer.io
    syncUserToCustomerIo(customerIoPayload).catch(err => {
      console.error('[Register] Customer.io sync error:', err);
    });

    // Send free_trial event
    sendCustomerIoEvent(Number(user.id), CustomerIoEvents.FREE_TRIAL, {
      plan_name: 'Free Trial',
      trial_ends_at: null, // Will be calculated based on createdAt + 7 days
    }).catch(err => {
      console.error('[Register] Customer.io event error:', err);
    });

    // Convert BigInt to string for JSON serialization
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        id: user.id.toString(),
      },
      message: 'Account created successfully. Please check your email to verify your account.',
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'REGISTRATION_FAILED',
      message: 'An error occurred during registration. Please try again.' 
    }, { status: 500 })
  }
}
