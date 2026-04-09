"use client";

import { useEffect, useState } from "react";

interface PiUser {
  username: string;
  uid: string;
}

export default function ClaimTest() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Initializing Pi SDK...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onIncompletePaymentFound(payment: unknown) {
      console.log("Incomplete payment:", payment);
    }

    async function start() {
      const Pi = window.Pi;

      if (!Pi) {
        const errorMsg = "Pi SDK not available. Please open in Pi Network app.";
        console.error(errorMsg);
        setError(errorMsg);
        setStatus(errorMsg);
        return;
      }

      setStatus("Initializing SDK...");

      Pi.init({
        version: "2.0",
        sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX !== "false",
      });

      setStatus("Authenticating...");

      try {
        const auth = await Pi.authenticate(
          ["username", "payments"],
          onIncompletePaymentFound
        );

        console.log("Authenticated:", auth.user);
        setUser(auth.user);
        setReady(true);
        setStatus("Ready");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Auth error:", err);
        setError(`Authentication failed: ${errorMessage}`);
        setStatus(`Authentication failed: ${errorMessage}`);
      }
    }

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
      amount: "0.01",
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

      onError: (err: unknown) => {
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
    <div style={{ padding: 20, maxWidth: "600px", margin: "0 auto" }}>
      <h1>🧪 Claim Test (Single Page)</h1>

      <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: error ? "#fee" : "#f0f0f0", borderRadius: "5px" }}>
        <p style={{ margin: 0, fontSize: "14px" }}>{status}</p>
      </div>

      {!user && !error && <p>Authenticating...</p>}

      {error && (
        <div style={{ padding: "15px", backgroundColor: "#fee", border: "1px solid #f55", borderRadius: "5px", marginBottom: "20px" }}>
          <p style={{ margin: 0, color: "#c00" }}>⚠️ {error}</p>
          <p style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
            This page requires the Pi Network app environment to work.
          </p>
        </div>
      )}

      {user && (
        <>
          <p>Welcome <strong>{user.username}</strong>!</p>

          <button
            onClick={handleClaim}
            disabled={!ready}
            style={{
              padding: "12px 20px",
              fontSize: "16px",
              cursor: ready ? "pointer" : "not-allowed",
              backgroundColor: ready ? "#7b2cbf" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Claim 0.01 Test-π
          </button>
        </>
      )}
    </div>
  );
}