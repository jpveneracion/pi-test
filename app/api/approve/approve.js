import { NextResponse } from "next/server";

export async function POST(req) {
  const { paymentId } = await req.json();

  try {
    const res = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );

    const data = await res.json();

    return NextResponse.json({ success: true, data });
  }  catch (err) {
  return NextResponse.json({
    error: true,
    message: err.message,
  });
}
}