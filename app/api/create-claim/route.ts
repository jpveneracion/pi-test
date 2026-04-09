import { NextResponse } from "next/server";

// Disable SSL verification for sandbox environment only
if (process.env.NEXT_PUBLIC_PI_SANDBOX !== "false") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(request: Request) {
  try {
    const { amount, memo, uid, metadata } = await request.json();

    console.log("=== CREATE CLAIM (A2U) API CALLED ===");
    console.log("Amount:", amount);
    console.log("Memo:", memo);
    console.log("UID:", uid);
    console.log("Metadata:", metadata);
    console.log("Environment:", process.env.NEXT_PUBLIC_PI_SANDBOX !== "false" ? "SANDBOX" : "PRODUCTION");

    if (!amount || !uid) {
      return NextResponse.json(
        { error: "Amount and UID are required" },
        { status: 400 }
      );
    }

    // Pi Network API endpoint for creating A2U payments (claims/payouts)
    const piApiUrl = process.env.NEXT_PUBLIC_PI_SANDBOX !== "false"
      ? "https://sandbox-api.minepi.com/v2/payments"
      : "https://api.minepi.com/v2/payments";

    console.log("Calling Pi API:", piApiUrl);

    // Create the A2U payment (App to User)
    const response = await fetch(piApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.PI_API_KEY}`,
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        memo: memo || "Claim payment",
        metadata: metadata || {},
        uid: uid, // Target user UID
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("Claim creation failed");
      console.error("Response status:", response.status);
      console.error("Response body:", responseText);

      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { raw_response: responseText };
      }

      return NextResponse.json(
        { error: "Failed to create claim", details: errorData, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Claim created successfully:", data);
    console.log("Payment ID:", data.payment_id);

    return NextResponse.json({
      success: true,
      paymentId: data.payment_id,
      data: data
    });

  } catch (error) {
    console.error("Claim creation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}