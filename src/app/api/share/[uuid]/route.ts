import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// GET - Get shared shops by UUID (public endpoint)
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
    const sharedShopIds = await prisma.$queryRawUnsafe<{shop_id: bigint}[]>(
      `SELECT shop_id FROM shared_shops WHERE user_share_id = $1`,
      userShare.id
    );

    if (sharedShopIds.length === 0) {
      return NextResponse.json({
        user: {
          name: userShare.user?.name || null,
          email: null // Don't expose email
        },
        shops: []
      });
    }

    // Get shop details
    const shopIds = sharedShopIds.map(s => s.shop_id);
    const shops = await prisma.shop.findMany({
      where: {
        id: { in: shopIds }
      },
      include: {
        traffic: {
          select: {
            countries: true
          },
          take: 1
        }
      }
    });

    // Format shops data
    const formattedShops = shops.map(shop => {
      // Parse countries from traffic
      let countries: { code: string; value: number }[] = [];
      if (shop.traffic?.[0]?.countries) {
        try {
          const countriesData = typeof shop.traffic[0].countries === 'string' 
            ? JSON.parse(shop.traffic[0].countries)
            : shop.traffic[0].countries;
          
          if (Array.isArray(countriesData)) {
            countries = countriesData.slice(0, 5).map((c: { code?: string; Code?: string; value?: number; Value?: number }) => ({
              code: c.code || c.Code || '',
              value: Math.round((c.value || c.Value || 0) * 100)
            }));
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      return {
        id: Number(shop.id),
        url: shop.url,
        name: shop.merchantName || shop.metaTitle?.split('|')[0]?.trim() || null,
        screenshot: shop.screenshot,
        country: shop.country,
        currency: shop.currency,
        monthlyRevenue: null, // Would need to calculate from traffic
        dailyRevenue: null,
        activeAds: shop.activeAds,
        countries
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
      { error: "Failed to fetch shared shops" },
      { status: 500 }
    );
  }
}

