import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Generate a unique 6-character case-sensitive string
function generateUniqueShareId(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shareId = '';
  for (let i = 0; i < 6; i++) {
    shareId += characters[Math.floor(Math.random() * characters.length)];
  }
  return shareId;
}

// Get base URL for share links
function getShareBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

// POST - Update shared shops
export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = BigInt(session.user.id);
    const body = await request.json();
    const { shop_ids } = body;

    if (!shop_ids || !Array.isArray(shop_ids) || shop_ids.length === 0) {
      return NextResponse.json(
        { error: "shop_ids is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    // Ensure shared_shops table exists
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS shared_shops (
          id BIGSERIAL PRIMARY KEY,
          user_share_id BIGINT NOT NULL REFERENCES user_shares(id) ON DELETE CASCADE,
          shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
          created_at TIMESTAMP,
          updated_at TIMESTAMP,
          UNIQUE (user_share_id, shop_id)
        )
      `);
    } catch (e) {
      console.log("Table check:", e);
    }

    // Get or create UserShare
    let userShare = await prisma.userShare.findUnique({
      where: { userId }
    });

    if (!userShare) {
      let shareUuid = generateUniqueShareId();
      let attempts = 0;

      while (attempts < 10) {
        const exists = await prisma.userShare.findUnique({
          where: { shareUuid }
        });
        if (!exists) break;
        shareUuid = generateUniqueShareId();
        attempts++;
      }

      userShare = await prisma.userShare.create({
        data: {
          userId,
          shareUuid,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Delete existing shared shops
    await prisma.$executeRawUnsafe(
      `DELETE FROM shared_shops WHERE user_share_id = $1`,
      userShare.id
    );

    // Insert new shared shops
    for (const shopId of shop_ids) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO shared_shops (user_share_id, shop_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        userShare.id,
        BigInt(shopId)
      );
    }

    // Count
    const countResult = await prisma.$queryRawUnsafe<{count: bigint}[]>(
      `SELECT COUNT(*) as count FROM shared_shops WHERE user_share_id = $1`,
      userShare.id
    );
    const sharedShopsCount = Number(countResult[0]?.count || 0);

    // Generate share URL
    const baseUrl = getShareBaseUrl(request);
    const shareUrl = `${baseUrl}/share/${userShare.shareUuid}`;

    return NextResponse.json({
      success: true,
      share_url: shareUrl,
      shared_shops_count: sharedShopsCount
    });

  } catch (error) {
    console.error("Error updating shared shops:", error);
    return NextResponse.json(
      { error: "Failed to update shared shops", details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Get current user's share link and count
export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = BigInt(session.user.id);

    const userShare = await prisma.userShare.findUnique({
      where: { userId }
    });

    if (!userShare) {
      return NextResponse.json({
        share_url: null,
        shared_shops_count: 0,
        shared_shop_ids: []
      });
    }

    // Get shared shop ids
    const sharedShops = await prisma.$queryRawUnsafe<{shop_id: bigint}[]>(
      `SELECT shop_id FROM shared_shops WHERE user_share_id = $1`,
      userShare.id
    );

    const baseUrl = getShareBaseUrl(request);
    const shareUrl = `${baseUrl}/share/${userShare.shareUuid}`;

    return NextResponse.json({
      share_url: shareUrl,
      shared_shops_count: sharedShops.length,
      shared_shop_ids: sharedShops.map((s: {shop_id: bigint}) => Number(s.shop_id))
    });

  } catch (error) {
    console.error("Error getting share info:", error);
    return NextResponse.json(
      { error: "Failed to get share info" },
      { status: 500 }
    );
  }
}
