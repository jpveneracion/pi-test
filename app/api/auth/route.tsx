import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken } = body;

    // DEBUG: Log the incoming request
    console.log('🔍 [AUTH] Incoming Auth Request:', {
      tokenLength: accessToken?.length,
      tokenPrefix: accessToken?.substring(0, 10),
      tokenSuffix: accessToken?.substring(-10),
      fullToken: accessToken
    });

    // 1. Verify the token with Pi Network API
    const piApiUrl = process.env.PI_API_URL || 'https://api.minepi.com/v2';
    console.log('🔍 [AUTH] Calling Pi Network API:', piApiUrl);

    const response = await fetch(`${piApiUrl}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
      },
    });

    console.log('🔍 [AUTH] Pi API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ [AUTH] Pi API Error:', errorText);
      return NextResponse.json({ error: 'Invalid Pi Token', details: errorText }, { status: 401 });
    }

    const piUser = await response.json();

    // DEBUG: Log what we got from Pi Network API
    console.log('🔍 [AUTH] Pi Network API Response:', {
      username: piUser.username,
      uid: piUser.uid,
      app_id: piUser.app_id,
      fullResponse: piUser
    });

    // 2. Database Logic (Laragon / MySQL)
    // Here you would check if piUser.uid exists in your DB.
    // If not, INSERT INTO users (uid, username) VALUES (...)

    return NextResponse.json(
      {
        success: true,
        message: 'Authenticated successfully',
        user: piUser
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error: unknown) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}