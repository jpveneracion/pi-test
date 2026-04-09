"use client";

import { useEffect, useState } from "react";

interface PiUser {
  username: string;
  uid: string;
}

export default function ClaimTest() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [isPiReady, setIsPiReady] = useState(false);
  const [status, setStatus] = useState("Waiting for Pi SDK...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for Pi SDK to be available (like test-payment page)
    const waitForPi = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        setIsPiReady(true);
        setStatus("Pi SDK ready - Authenticating...");
        clearInterval(waitForPi);

        // Now authenticate
        authenticate();
      }
    }, 100);

    return () => clearInterval(waitForPi);

    // Define authenticate function inside useEffect to avoid dependency issues
    async function authenticate() {
      if (!window.Pi) {
        const errorMsg = "Pi SDK not available. Please open in Pi Network app.";
        console.error(errorMsg);
        setError(errorMsg);
        setStatus(errorMsg);
        return;
      }

      try {
        setStatus("Authenticating...");

        const auth = await window.Pi.authenticate(
          ["username", "payments"],
          (payment: unknown) => {
            console.log("Incomplete payment found:", payment);
          }
        );

        console.log("Authenticated:", auth.user);
        setUser(auth.user);
        setStatus("Ready");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Auth error:", err);
        setError(`Authentication failed: ${errorMessage}`);
        setStatus(`Authentication failed: ${errorMessage}`);
      }
    }
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
            disabled={!isPiReady}
            style={{
              padding: "12px 20px",
              fontSize: "16px",
              cursor: isPiReady ? "pointer" : "not-allowed",
              backgroundColor: isPiReady ? "#7b2cbf" : "#ccc",
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