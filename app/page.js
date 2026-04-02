"use client";

import { PiButton } from "@/components/PiButton";
import { usePiConnection } from "pi-sdk-react";

export default function Home() {
  const { connected, user } = usePiConnection();

  return (
    <main style={{ padding: 20 }}>
      <h1>Pi Payment Integration</h1>

      {connected ? (
        <>
          <p>Welcome {user?.username || "Pi User"}</p>
          <PiButton
            paymentData={{
              amount: 1,
              memo: "Test Payment",
              metadata: { test: true }
            }}
          >
            Pay 1 Pi
          </PiButton>
        </>
      ) : (
        <p>Connecting to Pi Network...</p>
      )}
    </main>
  );
}