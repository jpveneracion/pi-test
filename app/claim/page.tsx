"use client";

import { useEffect, useState } from "react";

interface PiUser {
  username: string;
  uid: string;
}

export default function ClaimTest() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [isPiReady, setIsPiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Waiting for Pi SDK...");

  useEffect(() => {
    // Wait for Pi SDK to be available
    const waitForPi = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        clearInterval(waitForPi);
        setStatus("Initializing Pi SDK...");

        // Initialize the Pi SDK
        window.Pi.init({
          version: "2.0",
        });

        // Give it a moment to initialize, then authenticate
        setTimeout(() => {
          authenticate();
        }, 500);
      }
    }, 100);

    return () => clearInterval(waitForPi);

    async function authenticate() {
      if (!window.Pi) return;

      try {
        setStatus("Authenticating...");

        const auth = await window.Pi.authenticate(
          ["username", "payments"], // Request payment scope!
          (payment: unknown) => {
            console.log("Incomplete payment found:", payment);
          }
        );

        console.log("Authenticated:", auth.user);
        setUser(auth.user);
        setIsPiReady(true);
        setStatus(`Ready - Welcome ${auth.user.username}!`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Auth error:", err);
        setStatus(`Authentication failed: ${errorMessage}`);
      }
    }
  }, []);

  const handleClaim = async () => {
    const Pi = window.Pi;

    if (!Pi) {
      alert("Pi SDK not ready. Please open in Pi Browser.");
      return;
    }

    setIsLoading(true);
    setStatus("Creating claim payment...");

    try {
      const paymentData = {
        amount: "0.01",
        memo: "Claim Salary Test",
        metadata: { type: "claim_test" },
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("APPROVAL NEEDED:", paymentId);
          setStatus(`Payment created: ${paymentId}. Calling backend...`);

          try {
            const response = await fetch('/api/payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: paymentId,
                amount: 0.01,
                memo: "Claim Salary Test",
                type: "claim",
                action: "approve",
                txid: ""
              }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log("✅ Backend approved:", result);
              setStatus("✅ Backend approved. Waiting for wallet approval...");
            } else {
              const error = await response.json();
              console.error(`❌ Approve failed: ${error.error}`);
              setStatus(`❌ Approve failed: ${error.error}`);
              setIsLoading(false);
            }
          } catch (error) {
            console.error(`❌ Approve error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsLoading(false);
          }
        },

        onReadyForServerCompletion: async (
          paymentId: string,
          txid: string
        ) => {
          console.log("COMPLETED:", paymentId, txid);
          setStatus("✅ Wallet approved! Calling complete endpoint...");

          try {
            const response = await fetch('/api/payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: paymentId,
                amount: 0.01,
                memo: "Claim Salary Test",
                type: "claim",
                action: "complete",
                txid: txid
              }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log(`✅ Claim completed! Payment ID: ${result.payment?.id}`);
              setStatus(`✅ Claim completed! Status: ${result.payment?.status}`);
            } else {
              const error = await response.json();
              console.error(`❌ Complete failed: ${error.error}`);
              setStatus(`❌ Complete failed: ${error.error}`);
            }
          } catch (error) {
            console.error(`❌ Complete error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
            setIsLoading(false);
          }
        },

        onCancel: (paymentId: string) => {
          console.log("CANCELLED:", paymentId);
          setStatus("Claim cancelled");
          setIsLoading(false);
        },

        onError: (err: unknown) => {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error("ERROR:", err);
          setStatus(`❌ Payment error: ${errorMsg}`);
          setIsLoading(false);
        },
      };

      await Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      console.error("Create payment failed:", err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: "600px", margin: "0 auto" }}>
      <h1>🧪 Claim Test</h1>

      <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "5px" }}>
        <p style={{ margin: 0, fontSize: "14px" }}>{status}</p>
      </div>

      {user && (
        <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "5px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Logged in as: <strong>{user.username}</strong>
          </p>
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={!isPiReady || isLoading}
        style={{
          padding: "12px 20px",
          fontSize: "16px",
          cursor: (isPiReady && !isLoading) ? "pointer" : "not-allowed",
          backgroundColor: (isPiReady && !isLoading) ? "#7b2cbf" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        {isLoading ? "Processing..." : "Claim 0.01 Test-π"}
      </button>

      <div style={{ marginTop: "20px" }}>
        <a href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}