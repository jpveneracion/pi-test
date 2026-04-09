"use client";

import { useEffect, useState } from "react";

export default function ClaimTest() {
  const [isPiReady, setIsPiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Waiting for Pi SDK...");

  useEffect(() => {
    // Wait for Pi SDK to be available (like test-payment page)
    const waitForPi = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        setIsPiReady(true);
        setStatus("Pi SDK ready - You can now claim!");
        clearInterval(waitForPi);
      }
    }, 100);

    return () => clearInterval(waitForPi);
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
          setStatus(`Payment created: ${paymentId}`);
          // TEMP: no backend yet
        },

        onReadyForServerCompletion: async (
          paymentId: string,
          txid: string
        ) => {
          console.log("COMPLETED:", paymentId, txid);
          setStatus(`Claim completed! TXID: ${txid}`);
          setIsLoading(false);
        },

        onCancel: (paymentId: string) => {
          console.log("CANCELLED:", paymentId);
          setStatus("Claim cancelled");
          setIsLoading(false);
        },

        onError: (err: unknown) => {
          console.error("ERROR:", err);
          setStatus("Claim failed");
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