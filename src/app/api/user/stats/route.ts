import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Trial duration in hours (5 days = 119 hours, 7 days for Marcuus = 168 hours)
const TRIAL_HOURS_DEFAULT = 119;
const TRIAL_HOURS_MARCUUS = 168;

// Helper to check if user is on trial
function isUserOnTrial(user: {
  utmSource: string | null;
  createdAt: Date | null;
  startOfferDate: Date | null;
}): boolean {
  const trialHours = user.utmSource === 'Marcuus' ? TRIAL_HOURS_MARCUUS : TRIAL_HOURS_DEFAULT;
  
  // Check start_offer_date first
  if (user.startOfferDate) {
    const hoursSinceOffer = (Date.now() - new Date(user.startOfferDate).getTime()) / (1000 * 60 * 60);
    if (hoursSinceOffer < TRIAL_HOURS_DEFAULT) {
      return true;
    }
  }
  
  // Check created_at
  if (user.createdAt) {
    const hoursSinceCreation = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < trialHours) {
      return true;
    }
  }
  
  return false;
}

// Helper to get active plan for user
async function getActivePlan(userId: bigint, user: {
  utmSource: string | null;
  createdAt: Date | null;
  startOfferDate: Date | null;
}) {
  // Check for active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      stripeStatus: 'active',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  if (subscription) {
    // User has an active subscription - get the plan
    const plan = await prisma.plan.findFirst({
      where: {
        identifier: subscription.name,
      },
    });
    return plan;
  }
  
  // Check if user is on trial
  if (isUserOnTrial(user)) {
    const trialPlan = await prisma.plan.findFirst({
      where: {
        identifier: 'trial',
      },
    });
    return trialPlan;
  }
  
  // User's trial has expired and no active subscription
  const expiredPlan = await prisma.plan.findFirst({
    where: {
      identifier: 'expired',
    },
  });
  return expiredPlan;
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = BigInt(session.user.id);
    
    // Get user with balances
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        utmSource: true,
        createdAt: true,
        startOfferDate: true,
        balanceProductExporter: true,
        balanceGenerateProduct: true,
        balanceShopExporter: true,
        balanceVideoGeneration: true,
        balanceImageGeneration: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get active plan
    const plan = await getActivePlan(userId, user);
    
    // Get count of tracked shops (user_shops)
    const trackedShopsCount = await prisma.userShop.count({
      where: {
        userId,
        deletedAt: null,
      },
    });
    
    // Determine limits and usage based on plan
    const isOnTrial = isUserOnTrial(user);
    const isPro = plan?.identifier?.includes('pro') ?? false;
    const isBasic = plan?.identifier?.includes('basic') ?? false;
    const isUnlimited = isPro || isBasic;
    
    // Calculate remaining/used values
    // For product exports: balance_product_exporter is how many have been used
    // Remaining = limit - balance
    const productExportLimit = plan?.limitProductExporter ?? 0;
    const productExportUsed = user.balanceProductExporter;
    const productExportRemaining = isUnlimited ? Infinity : Math.max(0, productExportLimit - productExportUsed);
    
    // For generate product (store generation): similar logic
    const generateProductLimit = plan?.limitGenerateProduct ?? 0;
    const generateProductUsed = user.balanceGenerateProduct;
    const generateProductRemaining = isUnlimited ? Infinity : Math.max(0, generateProductLimit - generateProductUsed);
    
    // For shop tracker: limit is from plan, used is count of tracked shops
    const shopTrackerLimit = plan?.limitShopTracker ?? 0;
    const shopTrackerUsed = trackedShopsCount;
    
    // Return stats
    return NextResponse.json({
      success: true,
      stats: {
        // Plan info
        plan: {
          identifier: plan?.identifier ?? 'expired',
          title: plan?.title ?? 'Expired',
          isOnTrial,
          isPro,
          isBasic,
          isUnlimited,
        },
        // Tracked shops
        trackedShops: {
          used: shopTrackerUsed,
          limit: shopTrackerLimit,
          isUnlimited: false, // Always has a limit
        },
        // Product exports
        productExports: {
          used: productExportUsed,
          limit: productExportLimit,
          remaining: productExportRemaining,
          isUnlimited,
        },
        // Store generation
        storeGeneration: {
          used: generateProductUsed,
          limit: generateProductLimit,
          remaining: generateProductRemaining,
          isUnlimited,
        },
        // Additional stats for potential use
        videoGeneration: {
          used: user.balanceVideoGeneration,
          limit: plan?.limitVideoGeneration ?? 0,
          remaining: Math.max(0, (plan?.limitVideoGeneration ?? 0) - user.balanceVideoGeneration),
        },
        imageGeneration: {
          used: user.balanceImageGeneration,
          limit: plan?.limitImageGeneration ?? 0,
          remaining: Math.max(0, (plan?.limitImageGeneration ?? 0) - user.balanceImageGeneration),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}

