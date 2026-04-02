import { NextResponse } from "next/server";
import { fetch as undiciFetch } from 'undici';

export async function POST(request) {
  try {
    const { paymentId, txid } = await request.json();

    console.log("=== COMPLETE PAYMENT API CALLED ===");
    console.log("Payment ID:", paymentId);
    console.log("Transaction ID:", txid);
    console.log("NEXT_PUBLIC_PI_SANDBOX value:", process.env.NEXT_PUBLIC_PI_SANDBOX);
    console.log("NEXT_PUBLIC_PI_SANDBOX !== 'false':", process.env.NEXT_PUBLIC_PI_SANDBOX !== "false");
    console.log("Environment:", process.env.NEXT_PUBLIC_PI_SANDBOX !== "false" ? "SANDBOX" : "PRODUCTION");
    console.log("PI_API_KEY exists:", !!process.env.PI_API_KEY);
    console.log("PI_API_KEY prefix:", process.env.PI_API_KEY?.substring(0, 10) + "...");

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "Payment ID and Transaction ID are required" },
        { status: 400 }
      );
    }

    // Pi Network API endpoint for completing payments
    const piApiUrl = process.env.NEXT_PUBLIC_PI_SANDBOX !== "false"
      ? "https://sandbox-api.minepi.com/v2/payments"
      : "https://api.minepi.com/v2/payments";

    const fullUrl = `${piApiUrl}/${paymentId}/complete`;
    console.log("Calling Pi API:", fullUrl);
    console.log("Request body:", JSON.stringify({ txid }));

    // Call Pi Network API to complete the payment (ignoring SSL errors for sandbox)
    const response = await undiciFetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.PI_API_KEY}`,
      },
      body: JSON.stringify({ txid }),
      // Ignore SSL certificate errors for sandbox
      dispatcher: new (await import('undici')).Agent({
        connect: {
          rejectUnauthorized: process.env.NEXT_PUBLIC_PI_SANDBOX !== "false" ? false : true,
        },
      }),
    });
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.PI_API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Payment completion failed:", errorData);
      console.error("Response status:", response.status);
      return NextResponse.json(
        { error: "Failed to complete payment", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Payment completed successfully:", data);
    console.log("=== COMPLETE PAYMENT API DONE ===");
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Payment completion error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
