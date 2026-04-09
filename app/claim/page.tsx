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
  const [paymentResult, setPaymentResult] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState("Waiting for Pi SDK...");

  useEffect(() => {
    // Wait for Pi SDK to be available
    const waitForPi = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        clearInterval(waitForPi);
        setAuthStatus("Initializing Pi SDK...");

        // Initialize the Pi SDK first
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
        setAuthStatus("Authenticating...");
        const auth = await window.Pi.authenticate(
          ["username", "payments"], // Request payment scope!
          (payment: unknown) => {
            console.log("Incomplete payment found:", payment);
          }
        );

        console.log("Authenticated:", auth.user);
        setUser(auth.user);
        setIsPiReady(true);
        setAuthStatus(`Ready - Welcome ${auth.user.username}!`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Auth error:", err);
        setAuthStatus(`Authentication failed: ${errorMessage}`);
      }
    }
  }, []);

  const handleClaim = async () => {
    if (!window.Pi || !user) {
      alert("Pi SDK not ready or not authenticated. Please open in Pi Browser.");
      return;
    }

    setIsLoading(true);
    setPaymentResult(null);

    try {
      console.log("Starting A2U claim flow for user:", user.uid);
      setPaymentResult("Creating claim payment...");

      // Step 1: Call backend to create the A2U payment
      const createResponse = await fetch('/api/create-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: "0.01",
          memo: "Claim Salary Test",
          uid: user.uid, // Target user's UID
          metadata: {
            transaction_id: `claim_${Date.now()}`,
            user_id: user.uid,
            username: user.username
          }
        }),
      });

      const createData = await createResponse.json();
      console.log("Claim creation response:", createData);

      if (!createResponse.ok) {
        alert(`❌ Failed to create claim:\n${createData.error}`);
        setPaymentResult(`❌ Failed to create claim: ${createData.error}`);
        setIsLoading(false);
        return;
      }

      const paymentId = createData.paymentId;
      console.log("Claim created with payment ID:", paymentId);
      alert(`✅ Claim created!\n\nPayment ID: ${paymentId}\n\nNow you'll see the wallet popup to accept the payment.`);

      // Step 2: Use the paymentId to show payment to user
      setPaymentResult(`✅ Claim created! Waiting for you to accept in wallet...`);

      await window.Pi.createPayment(
        {
          paymentId: paymentId, // Use the paymentId from backend
        },
        {
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log("✅ User accepted claim!", paymentId, txid);
            alert(`✅ You accepted the claim!\n\nPayment ID: ${paymentId}\nTXID: ${txid}\n\nCompleting payment...`);
            setPaymentResult(`✅ Claim accepted! Completing payment...`);

            try {
              const response = await fetch('/api/complete-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, txid }),
              });

              if (response.ok) {
                const result = await response.json();
                alert(`✅ Claim payment completed successfully!\n\nPayment ID: ${paymentId}\nStatus: Completed`);
                setPaymentResult(`✅ Claim completed! Status: Completed`);
              } else {
                const error = await response.json();
                alert(`❌ Complete failed: ${error.error}`);
                setPaymentResult(`❌ Complete failed: ${error.error}`);
              }
            } catch (error) {
              alert(`❌ Complete error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              setPaymentResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
              setIsLoading(false);
            }
          },

          onCancel: (paymentId: string) => {
            console.log("❌ User rejected claim:", paymentId);
            alert(`❌ Claim cancelled: ${paymentId}`);
            setPaymentResult(`❌ Claim cancelled`);
            setIsLoading(false);
          },

          onError: (error: unknown) => {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error("❌ Claim error:", error);
            alert(`❌ Claim error: ${errorMsg}`);
            setPaymentResult(`❌ Error: ${errorMsg}`);
            setIsLoading(false);
          }
        }
      );

    } catch (error) {
      console.error("Claim flow error:", error);
      alert(`Claim Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPaymentResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: "600px", margin: "0 auto" }}>
      <h1>🧪 Claim Test</h1>

      <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "5px" }}>
        <p style={{ margin: 0, fontSize: "14px" }}>{authStatus}</p>
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
        {isLoading ? 'Processing...' : 'Claim 0.01 Test-π'}
      </button>

      {paymentResult && (
        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f0f0f0", borderRadius: "5px" }}>
          <p style={{ margin: 0, fontSize: "14px", wordBreak: "break-word" }}>{paymentResult}</p>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <a href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}