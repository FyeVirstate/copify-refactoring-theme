import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const FIRST_PROMOTER_API_KEY = "127679f5f3b094fb75da428a8e4fb080";
const FIRST_PROMOTER_BASE_URL = "https://firstpromoter.com/api/v1";

// Get promoter ID by email
async function getPromoterId(email: string): Promise<number | null> {
  try {
    const response = await fetch(
      `${FIRST_PROMOTER_BASE_URL}/promoters/show?promoter_email=${encodeURIComponent(email)}`,
      {
        headers: {
          'X-API-KEY': FIRST_PROMOTER_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.id || null;
  } catch {
    return null;
  }
}

// Get iframe login token for promoter
async function getIframeToken(promoterId: number): Promise<string | null> {
  try {
    const response = await fetch(
      `${FIRST_PROMOTER_BASE_URL}/promoters/iframe_login?promoter_id=${promoterId}`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': FIRST_PROMOTER_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user;
    const promoterId = await getPromoterId(user.email);

    if (!promoterId) {
      // User is not a promoter - return signup URL
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const signupUrl = `https://affiliate.copyfy.io/signup/26980?email=${encodeURIComponent(user.email)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}`;

      return NextResponse.json({
        isPromoter: false,
        signupUrl,
        user: {
          email: user.email,
          name: user.name,
        },
      });
    }

    // User is a promoter - get iframe token
    const accessToken = await getIframeToken(promoterId);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to get affiliate dashboard access' },
        { status: 500 }
      );
    }

    const dashboardUrl = `https://affiliate.copyfy.io/iframe?tk=${accessToken}`;

    return NextResponse.json({
      isPromoter: true,
      promoterId,
      dashboardUrl,
    });
  } catch (error) {
    console.error('Affiliate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
