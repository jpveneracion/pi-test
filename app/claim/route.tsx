"use client";

import { useEffect, useState } from "react";

interface PiUser {
  username: string;
  uid: string;
}

export default function ClaimTest() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      console.log("Initializing Pi SDK...");

      if (!window.Pi) {
        const script = document.createElement("script");
        script.src = "https://sdk.minepi.com/pi-sdk.js";

        script.onload = () => {
          console.log("Pi SDK loaded");
          start();
        };

        document.body.appendChild(script);
      } else {
        start();
      }
    }

    async function start() {
      const Pi = window.Pi;

      if (!Pi) {
        console.error("Pi not found");
        return;
      }

      Pi.init({ version: "2.0" });

      try {
        const auth = await Pi.authenticate(
          ["username", "payments"],
          onIncompletePaymentFound
        );

        console.log("Authenticated:", auth.user);
        setUser(auth.user);
        setReady(true);
      } catch (err) {
        console.error("Auth error:", err);
      }
    }

    function onIncompletePaymentFound(payment: unknown) {
      console.log("Incomplete payment:", payment);
    }

    init();
  }, []);

  const handleClaim = async () => {
    const Pi = window.Pi;

    if (!Pi) {
      alert("Pi not ready");
      return;
    }

    console.log("Starting claim...");

    const paymentData = {
      amount: 0.01,
      memo: "Claim Salary Test",
      metadata: { type: "claim_test" },
    };

    const callbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("APPROVAL NEEDED:", paymentId);
        // TEMP: no backend yet
      },

      onReadyForServerCompletion: async (
        paymentId: string,
        txid: string
      ) => {
        console.log("COMPLETED:", paymentId, txid);
      },

      onCancel: (paymentId: string) => {
        console.log("CANCELLED:", paymentId);
      },

      onError: (err: Error) => {
        console.error("ERROR:", err);
      },
    };

    try {
      await Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      console.error("Create payment failed:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🧪 Claim Test (Single Page)</h1>

      {!user && <p>Authenticating...</p>}

      {user && (
        <>
          <p>Welcome {user.username}</p>

          <button
            onClick={handleClaim}
            disabled={!ready}
            style={{
              padding: "12px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Claim 0.01 Test-π
          </button>
        </>
      )}
    </div>
  );
}