import { NextResponse } from "next/server";
import https from 'https';

// Disable SSL verification for sandbox environment only
if (process.env.NEXT_PUBLIC_PI_SANDBOX !== "false") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(request) {
  try {
    const { paymentId } = await request.json();

    console.log("=== APPROVE PAYMENT API CALLED ===");
    console.log("Payment ID:", paymentId);
    console.log("NEXT_PUBLIC_PI_SANDBOX value:", process.env.NEXT_PUBLIC_PI_SANDBOX);
    console.log("NEXT_PUBLIC_PI_SANDBOX !== 'false':", process.env.NEXT_PUBLIC_PI_SANDBOX !== "false");
    console.log("Environment:", process.env.NEXT_PUBLIC_PI_SANDBOX !== "false" ? "SANDBOX" : "PRODUCTION");
    console.log("PI_API_KEY exists:", !!process.env.PI_API_KEY);
    console.log("PI_API_KEY prefix:", process.env.PI_API_KEY?.substring(0, 10) + "...");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Pi Network API endpoint for approving payments
    const piApiUrl = process.env.NEXT_PUBLIC_PI_SANDBOX !== "false"
      ? "https://sandbox-api.minepi.com/v2/payments"
      : "https://api.minepi.com/v2/payments";

    const fullUrl = `${piApiUrl}/${paymentId}/approve`;
    console.log("Calling Pi API:", fullUrl);

    // Call Pi Network API to approve the payment
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.PI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("Payment approval failed");
      console.error("Response status:", response.status);
      console.error("Response body:", responseText);
      console.error("Response headers:", Object.fromEntries(response.headers.entries()));

      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { raw_response: responseText };
      }

      return NextResponse.json(
        { error: "Failed to approve payment", details: errorData, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Payment approved successfully:", data);
    console.log("=== APPROVE PAYMENT API DONE ===");
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Payment approval error:", error);
    console.error("Error cause:", error.cause);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
        cause: error.cause?.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
