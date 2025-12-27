import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Trial duration in hours (7 days = 168 hours)
const TRIAL_HOURS_DEFAULT = 168;
const TRIAL_HOURS_MARCUUS = 168;

// Default limits for trial/free users
const DEFAULT_FREE_LIMITS = {
  limitShopTracker: 3,
  limitProductExporter: 3,
  limitGenerateProduct: 1,
  limitVideoGeneration: 3,
  limitImageGeneration: 5,
};

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

// Helper to calculate trial days remaining
function getTrialDaysRemaining(user: {
  utmSource: string | null;
  createdAt: Date | null;
  startOfferDate: Date | null;
}): number {
  const trialHours = user.utmSource === 'Marcuus' ? TRIAL_HOURS_MARCUUS : TRIAL_HOURS_DEFAULT;
  
  // Check start_offer_date first
  if (user.startOfferDate) {
    const hoursRemaining = TRIAL_HOURS_DEFAULT - ((Date.now() - new Date(user.startOfferDate).getTime()) / (1000 * 60 * 60));
    if (hoursRemaining > 0) {
      return Math.ceil(hoursRemaining / 24);
    }
  }
  
  // Check created_at
  if (user.createdAt) {
    const hoursRemaining = trialHours - ((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60));
    if (hoursRemaining > 0) {
      return Math.ceil(hoursRemaining / 24);
    }
  }
  
  return 0;
}

// Define plan type to avoid null reference
type PlanType = {
  id: bigint;
  identifier: string;
  title: string;
  price: number;
  dayFreeTrial: number;
  info: string | null;
  stripeId: string;
  stripeIdEn: string;
  leaderboardShop: number;
  limitShopTracker: number;
  limitShopExporter: number;
  limitProductExporter: number;
  topShopsCount: number | null;
  topProductsCount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  limitGenerateProduct: number;
  limitImportTheme: number;
  topAdsCount: number | null;
  maxLicenses: number;
  limitVideoGeneration: number;
  limitImageGeneration: number;
} | null;

// Helper to get active plan for user
async function getActivePlan(userId: bigint, user: {
  utmSource: string | null;
  createdAt: Date | null;
  startOfferDate: Date | null;
}): Promise<{ plan: PlanType, isOnTrial: boolean }> {
  if (!prisma) {
    return { plan: null, isOnTrial: isUserOnTrial(user) };
  }
  
  // Check for active subscription using raw SQL (correct snake_case field names)
  const subscriptions = await prisma.$queryRaw<Array<{
    id: bigint;
    name: string;
    stripe_status: string;
    trial_ends_at: Date | null;
  }>>`
    SELECT id, name, stripe_status, trial_ends_at 
    FROM subscriptions 
    WHERE user_id = ${userId}::bigint 
      AND stripe_status = 'active'
    ORDER BY id DESC
    LIMIT 1
  `;
  
  const subscription = subscriptions[0];
  
  if (subscription) {
    // User has an active subscription - get the plan
    const plan = await prisma.plan.findFirst({
      where: {
        identifier: subscription.name,
      },
    });
    
    // Check if subscription itself is on trial (Laravel's onTrial method)
    const subscriptionIsOnTrial = subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date();
    
    return { plan, isOnTrial: subscriptionIsOnTrial || false };
  }
  
  // Check if user is on trial (no active subscription, but within trial period)
  if (isUserOnTrial(user)) {
    // Try to find trial plan in DB, otherwise use default limits
    let trialPlan = await prisma.plan.findFirst({
      where: {
        identifier: 'trial',
      },
    });
    
    // If no trial plan exists in DB, create a virtual one with default limits
    if (!trialPlan) {
      trialPlan = {
        id: BigInt(0),
        identifier: 'trial',
        title: 'Essai Gratuit',
        price: 0,
        dayFreeTrial: 5,
        info: null,
        stripeId: '',
        stripeIdEn: '',
        leaderboardShop: 0,
        limitShopTracker: DEFAULT_FREE_LIMITS.limitShopTracker,
        limitShopExporter: 0,
        limitProductExporter: DEFAULT_FREE_LIMITS.limitProductExporter,
        limitGenerateProduct: DEFAULT_FREE_LIMITS.limitGenerateProduct,
        limitImportTheme: 0,
        limitVideoGeneration: DEFAULT_FREE_LIMITS.limitVideoGeneration,
        limitImageGeneration: DEFAULT_FREE_LIMITS.limitImageGeneration,
        topShopsCount: 50,
        topProductsCount: 50,
        topAdsCount: 50,
        maxLicenses: 0,
        createdAt: null,
        updatedAt: null,
      };
    }
    return { plan: trialPlan, isOnTrial: true };
  }
  
  // User's trial has expired and no active subscription - still use free limits
  // This allows them to see their usage vs the limit they had
  const expiredPlan = {
    id: BigInt(0),
    identifier: 'expired',
    title: 'Expiré',
    price: 0,
    dayFreeTrial: 0,
    info: null,
    stripeId: '',
    stripeIdEn: '',
    leaderboardShop: 0,
    limitShopTracker: DEFAULT_FREE_LIMITS.limitShopTracker,
    limitShopExporter: 0,
    limitProductExporter: DEFAULT_FREE_LIMITS.limitProductExporter,
    limitGenerateProduct: DEFAULT_FREE_LIMITS.limitGenerateProduct,
    limitImportTheme: 0,
    limitVideoGeneration: DEFAULT_FREE_LIMITS.limitVideoGeneration,
    limitImageGeneration: DEFAULT_FREE_LIMITS.limitImageGeneration,
    topShopsCount: 50,
    topProductsCount: 50,
    topAdsCount: 50,
    maxLicenses: 0,
    createdAt: null,
    updatedAt: null,
  };
  return { plan: expiredPlan, isOnTrial: false };
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
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
    const { plan, isOnTrial } = await getActivePlan(userId, user);
    
    // Get count of tracked shops (user_shops)
    const trackedShopsCount = await prisma.userShop.count({
      where: {
        userId,
        deletedAt: null,
      },
    });
    
    // Determine limits and usage based on plan
    // Also check if plan identifier is 'trial' (Laravel's isOnTrial checks this)
    const isActuallyOnTrial = isOnTrial || plan?.identifier === 'trial';
    const isPro = plan?.identifier?.includes('pro') ?? false;
    const isBasic = plan?.identifier?.includes('basic') ?? false;
    const isUnlimited = isPro || isBasic;
    
    // Count actual usage from database instead of relying on balance
    // This is more accurate, especially for users who never had a subscription
    const [productExportCount, storeGenerationCount] = await Promise.all([
      prisma.productExport.count({ where: { userId } }),
      prisma.generateStore.count({ where: { userId } }),
    ]);
    
    // For product exports
    const productExportLimit = plan?.limitProductExporter ?? 0;
    const productExportUsed = productExportCount;
    const productExportRemaining = Math.max(0, productExportLimit - productExportUsed);
    
    // For store generation
    const generateProductLimit = plan?.limitGenerateProduct ?? 0;
    const generateProductUsed = storeGenerationCount;
    const generateProductRemaining = Math.max(0, generateProductLimit - generateProductUsed);
    
    // For shop tracker: limit is from plan, used is count of tracked shops
    const shopTrackerLimit = plan?.limitShopTracker ?? 0;
    const shopTrackerUsed = trackedShopsCount;
    
    // Calculate trial status
    const isExpired = plan?.identifier === 'expired';
    const trialDaysRemaining = isActuallyOnTrial ? getTrialDaysRemaining(user) : 0;
    
    // Return stats
    return NextResponse.json({
      success: true,
      stats: {
        // Plan info
        plan: {
          identifier: plan?.identifier ?? 'expired',
          title: plan?.title ?? 'Expired',
          isOnTrial: isActuallyOnTrial,
          isExpired,
          trialDaysRemaining,
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

