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
    if (!window.Pi) {
      alert("Pi SDK not ready. Please open in Pi Browser.");
      return;
    }

    setIsLoading(true);
    setPaymentResult(null);

    try {
      alert("Creating claim payment...");

      const paymentData = {
        amount: "0.0100000", // Must be string with 7 decimals (like test-payment)
        memo: "Claim Salary Test",
        metadata: {
          transaction_id: `claim_${Date.now()}`,
          user_id: "claim_user"
        }
      };

      alert(`Creating payment with:\nAmount: ${paymentData.amount}\nMemo: ${paymentData.memo}\n\nCheck if wallet popup appears!`);

      // Step 1: Create payment with callbacks (exactly like test-payment)
      await window.Pi.createPayment(
        paymentData,
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log("✅ onReadyForServerApproval fired!", paymentId);
            alert(`✅ Payment created!\n\nPayment ID: ${paymentId}\n\nCalling backend approve endpoint...\n\n💡 Check browser console for detailed logs`);

            setPaymentResult(`⏳ Payment created: ${paymentId}. Calling approve endpoint...`);

            try {
              console.log("Calling /api/approve-payment with:", { paymentId });
              const response = await fetch('/api/approve-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId }),
              });

              console.log("Response status:", response.status);
              console.log("Response ok:", response.ok);

              const responseData = await response.json();
              console.log("Response data:", responseData);

              if (response.ok) {
                alert(`✅ Backend approved successfully!\n\nNow check your Pi Browser for wallet popup to approve the payment.`);
                setPaymentResult(`✅ Backend approved. Waiting for wallet approval...`);
              } else {
                console.error("Approval failed:", responseData);
                alert(`❌ Backend approval failed:\nStatus: ${response.status}\nError: ${responseData.error}\nDetails: ${JSON.stringify(responseData.details || responseData)}`);
                setPaymentResult(`❌ Approve failed: ${responseData.error}`);
                setIsLoading(false);
              }
            } catch (error) {
              console.error("Approval exception:", error);
              alert(`❌ Approval error:\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck browser console for details`);
              setPaymentResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              setIsLoading(false);
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            alert(`✅ Payment approved in wallet!\n\nPayment ID: ${paymentId}\nTXID: ${txid}\n\nCalling complete endpoint...`);
            setPaymentResult(`✅ Wallet approved! Calling complete endpoint...`);

            try {
              const response = await fetch('/api/complete-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, txid }),
              });

              if (response.ok) {
                const result = await response.json();
                alert(`✅ Claim payment successful!\n\nPayment completed!`);
                setPaymentResult(`✅ Payment completed!`);
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

          onCancel: async (paymentId: string) => {
            alert(`❌ Payment cancelled: ${paymentId}`);
            setPaymentResult(`❌ Payment cancelled`);
            setIsLoading(false);
          },

          onError: async (error: unknown) => {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            alert(`❌ Payment error: ${errorMsg}`);
            setPaymentResult(`❌ Error: ${errorMsg}`);
            setIsLoading(false);
          }
        }
      );

    } catch (error) {
      alert(`Payment Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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