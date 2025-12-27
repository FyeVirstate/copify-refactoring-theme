import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not available" },
      { status: 503 }
    );
  }

  try {
    const apps = await prisma.shopifyApp.findMany({
      where: {
        name: {
          not: "",
        },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        categories: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 500, // Limit to top 500 apps for performance
    });

    // Transform the data
    const transformedApps = apps.map((app) => ({
      id: app.id.toString(),
      name: app.name,
      icon: app.icon || "/img/icons/default-app.png",
      categories: (app.categories as string[]) || [],
    }));

    return NextResponse.json({ apps: transformedApps });
  } catch (error) {
    console.error("Error fetching apps:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

