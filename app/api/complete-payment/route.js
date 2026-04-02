import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { paymentId, txid } = await request.json();

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

    // Call Pi Network API to complete the payment
    const response = await fetch(`${piApiUrl}/${paymentId}/complete`, {
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
      return NextResponse.json(
        { error: "Failed to complete payment", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Payment completion error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
