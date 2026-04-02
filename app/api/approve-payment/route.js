import { NextResponse } from "next/server";
import { fetch } from 'undici';

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

    // Call Pi Network API to approve the payment (ignoring SSL errors for sandbox)
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.PI_API_KEY}`,
      },
      // Ignore SSL certificate errors for sandbox
      dispatcher: new (await import('undici')).Agent({
        connect: {
          rejectUnauthorized: process.env.NEXT_PUBLIC_PI_SANDBOX !== "false" ? false : true,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Payment approval failed:", errorData);
      console.error("Response status:", response.status);
      return NextResponse.json(
        { error: "Failed to approve payment", details: errorData },
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
