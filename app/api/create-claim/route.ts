import { NextResponse } from "next/server";

// Disable SSL verification for sandbox environment only
if (process.env.NEXT_PUBLIC_PI_SANDBOX !== "false") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, memo, uid, metadata } = body;

    console.log("=== CREATE CLAIM (A2U) API CALLED ===");
    console.log("Request body:", body);
    console.log("Amount:", amount, typeof amount);
    console.log("Memo:", memo);
    console.log("UID:", uid);
    console.log("Metadata:", metadata);
    console.log("Environment:", process.env.NEXT_PUBLIC_PI_SANDBOX !== "false" ? "SANDBOX" : "PRODUCTION");
    console.log("PI_API_KEY exists:", !!process.env.PI_API_KEY);
    console.log("PI_API_KEY prefix:", process.env.PI_API_KEY?.substring(0, 10) + "...");

    if (!amount || !uid) {
      console.error("Missing required fields:", { amount: !!amount, uid: !!uid });
      return NextResponse.json(
        { error: "Amount and UID are required", received: { amount: !!amount, uid: !!uid } },
        { status: 400 }
      );
    }

    // Convert amount to number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    console.log("Parsed amount:", numAmount);

    if (isNaN(numAmount) || numAmount <= 0) {
      console.error("Invalid amount:", numAmount);
      return NextResponse.json(
        { error: "Invalid amount", amount: numAmount },
        { status: 400 }
      );
    }

    // Pi Network API endpoint for creating A2U payments (claims/payouts)
    const piApiUrl = process.env.NEXT_PUBLIC_PI_SANDBOX !== "false"
      ? "https://sandbox-api.minepi.com/v2/payments"
      : "https://api.minepi.com/v2/payments";

    console.log("Calling Pi API:", piApiUrl);

    const requestData = {
      amount: numAmount,
      memo: memo || "Claim payment",
      metadata: metadata || {},
      uid: uid, // Target user UID
    };

    console.log("Request data:", JSON.stringify(requestData, null, 2));

    // Create the A2U payment (App to User)
    const response = await fetch(piApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.PI_API_KEY}`,
      },
      body: JSON.stringify(requestData),
    });

    console.log("Pi API response status:", response.status);
    console.log("Pi API response ok:", response.ok);

    if (!response.ok) {
      const responseText = await response.text();
      console.error("=== CLAIM CREATION FAILED ===");
      console.error("Response status:", response.status);
      console.error("Response body:", responseText);
      console.error("Response headers:", Object.fromEntries(response.headers.entries()));

      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
        console.error("Parsed error:", errorData);
      } catch (e) {
        errorData = { raw_response: responseText };
      }

      return NextResponse.json(
        {
          error: "Failed to create claim",
          details: errorData,
          status: response.status,
          pi_error: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("=== CLAIM CREATED SUCCESSFULLY ===");
    console.log("Response data:", data);
    console.log("Payment ID:", data.payment_id);

    return NextResponse.json({
      success: true,
      paymentId: data.payment_id,
      data: data
    });

  } catch (error) {
    console.error("=== CLAIM CREATION EXCEPTION ===");
    console.error("Error:", error);
    console.error("Error message:", error instanceof Error ? error.message : 'Unknown error');
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'Unknown',
      },
      { status: 500 }
    );
  }
}