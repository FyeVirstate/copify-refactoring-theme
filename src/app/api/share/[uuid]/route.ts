import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// GET - Get shared shops by UUID (public endpoint - no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }

  try {
    const { uuid } = await params;

    if (!uuid) {
      return NextResponse.json({ error: "UUID is required" }, { status: 400 });
    }

    // Find the user share by UUID
    const userShare = await prisma.userShare.findUnique({
      where: { shareUuid: uuid },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!userShare) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    // Get shared shop IDs
    let sharedShopIds: {shop_id: bigint}[] = [];
    try {
      sharedShopIds = await prisma.$queryRawUnsafe<{shop_id: bigint}[]>(
        `SELECT shop_id FROM shared_shops WHERE user_share_id = $1`,
        userShare.id
      );
    } catch (e) {
      console.log("Error fetching shared shop ids:", e);
      // Table might not exist
      return NextResponse.json({
        user: {
          name: userShare.user?.name || null,
          email: null
        },
        shops: []
      });
    }

    if (sharedShopIds.length === 0) {
      return NextResponse.json({
        user: {
          name: userShare.user?.name || null,
          email: null // Don't expose email
        },
        shops: []
      });
    }

    // Get shop details with traffic
    const shopIds = sharedShopIds.map(s => s.shop_id);
    const shops = await prisma.shop.findMany({
      where: {
        id: { in: shopIds }
      },
      include: {
        traffic: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        products: {
          where: { bestProduct: true },
          orderBy: { sort: 'asc' },
          take: 3,
          include: {
            images: {
              take: 1
            },
            variants: {
              take: 1
            }
          }
        }
      }
    });

    // Format shops data
    const formattedShops = shops.map(shop => {
      const traffic = shop.traffic?.[0];
      
      // Parse countries from traffic
      let countries: { code: string; value: number }[] = [];
      if (traffic?.countries) {
        try {
          const countriesData = typeof traffic.countries === 'string' 
            ? JSON.parse(traffic.countries)
            : traffic.countries;
          
          if (Array.isArray(countriesData)) {
            countries = countriesData.slice(0, 5).map((c: { code?: string; Code?: string; CountryCode?: string; value?: number; Value?: number }) => ({
              code: c.code || c.Code || c.CountryCode || 'US',
              value: Math.round((c.value || c.Value || 0) * 100)
            }));
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Calculate traffic growth
      let trafficGrowth1M = 0;
      let trafficGrowth3M = 0;
      if (traffic?.visits) {
        try {
          const visits = traffic.visits.split(',').map(Number);
          if (visits.length >= 2 && visits[1] !== 0) {
            trafficGrowth1M = Math.round(((visits[0] - visits[1]) / visits[1]) * 100);
          }
          if (visits.length >= 3 && visits[2] !== 0) {
            trafficGrowth3M = Math.round(((visits[0] - visits[2]) / visits[2]) * 100);
          }
        } catch (e) {
          // Ignore
        }
      }
      
      // Use growth_rate if available
      if (traffic?.growthRate !== undefined && traffic?.growthRate !== null) {
        trafficGrowth1M = traffic.growthRate;
      }

      // Get main traffic source icon
      let mainSource = '/img/socials/google.svg';
      if (traffic?.mainSource) {
        const sourceLower = traffic.mainSource.toLowerCase();
        if (sourceLower.includes('facebook')) mainSource = '/img/socials/facebook.svg';
        else if (sourceLower.includes('google')) mainSource = '/img/socials/google.svg';
        else if (sourceLower.includes('tiktok')) mainSource = '/img/socials/tiktok.svg';
        else if (sourceLower.includes('instagram')) mainSource = '/img/socials/instagram.svg';
        else if (sourceLower.includes('pinterest')) mainSource = '/img/socials/pinterest.svg';
        else if (sourceLower.includes('meta')) mainSource = '/img/socials/meta.svg';
        else if (sourceLower.includes('reddit')) mainSource = '/img/socials/reddit.svg';
        else if (sourceLower.includes('snapchat')) mainSource = '/img/socials/snapchat.svg';
      }

      // Format products
      const products = shop.products?.map(product => ({
        id: Number(product.id),
        title: product.title || '',
        handle: product.handle || '',
        image: product.images?.[0]?.src || null,
        price: product.variants?.[0]?.price?.toString() || null
      })) || [];

      return {
        id: Number(shop.id),
        url: shop.url,
        name: shop.merchantName || shop.metaTitle?.split('|')[0]?.trim() || null,
        screenshot: shop.screenshot,
        country: shop.country,
        currency: shop.currency || 'USD',
        monthlyRevenue: traffic?.estimatedMonthly ? Math.ceil(traffic.estimatedMonthly) : null,
        dailyRevenue: null,
        activeAds: shop.activeAds,
        activeAdsGrowth: null, // Would need historical data
        trafficGrowth1M,
        trafficGrowth3M,
        mainSource,
        countries,
        products
      };
    });

    return NextResponse.json({
      user: {
        name: userShare.user?.name || null,
        email: null
      },
      shops: formattedShops
    });

  } catch (error) {
    console.error("Error fetching shared shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared shops", details: String(error) },
      { status: 500 }
    );
  }
}
