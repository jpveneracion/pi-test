import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Test endpoint to check Pi Network API connectivity and response
    const piApiUrl = process.env.PI_API_URL || 'https://api.minepi.com/v2';
    const apiKey = process.env.PI_API_KEY;

    console.log('🔍 [Test] Pi API URL:', piApiUrl);
    console.log('🔍 [Test] API Key exists:', !!apiKey);
    console.log('🔍 [Test] API Key length:', apiKey?.length);

    return NextResponse.json({
      test: 'Pi Network API connectivity test',
      apiUrl: piApiUrl,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      timestamp: new Date().toISOString(),
      envVars: {
        PI_API_URL: process.env.PI_API_URL,
        PI_APP_WALLET: process.env.PI_APP_WALLET,
        NEXT_PUBLIC_PI_APP_WALLET: process.env.NEXT_PUBLIC_PI_APP_WALLET
      }
    });
  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}