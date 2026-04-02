"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Connecting to Pi Network...");
  const [piReady, setPiReady] = useState(false);

  useEffect(() => {
    let checkInterval;

    const initPi = async () => {
      try {
        // Wait for Pi SDK to load
        const waitForPi = () => {
          return new Promise((resolve) => {
            if (window.Pi) {
              resolve(window.Pi);
            } else {
              checkInterval = setInterval(() => {
                if (window.Pi) {
                  clearInterval(checkInterval);
                  resolve(window.Pi);
                }
              }, 500);
            }
          });
        };

        const Pi = await waitForPi();

        // Initialize Pi SDK
        Pi.init({
          version: "2.0",
          sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX !== "false",
        });

        setStatus("Initializing SDK...");
        setPiReady(true);

        // Wait for SDK to be fully initialized before authenticating
        await new Promise(resolve => setTimeout(resolve, 2000));

        setStatus("Authenticating...");

        // Authenticate user
        const auth = await Pi.authenticate(
          ["username", "payments"],
          (payment) => {
            console.log("Incomplete payment found:", payment);
          }
        );

        setUser(auth.user);
        setStatus("Ready");
      } catch (error) {
        const errorMessage = error.message || "Unknown error";
        console.error("Pi SDK error:", error);

        if (errorMessage.includes("not initialized")) {
          setStatus("SDK initialization failed. Please use Pi Network app.");
        } else if (errorMessage.includes("User denied")) {
          setStatus("Authentication cancelled by user.");
        } else {
          setStatus(`Connection failed: ${errorMessage}. Please use Pi Network app.`);
        }
      }
    };

    initPi();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  const handlePayment = async () => {
    if (!window.Pi || !piReady) {
      alert("Pi Network is not ready. Please try again.");
      return;
    }

    try {
      const paymentData = {
        amount: 1,
        memo: "Test Payment",
        metadata: { itemId: "test-1" },
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId) => {
          console.log("Payment ready for approval:", paymentId);
          try {
            const response = await fetch("/api/approve-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            });
            if (!response.ok) {
              throw new Error("Failed to approve payment");
            }
            console.log("Payment approved successfully");
          } catch (error) {
            console.error("Approval error:", error);
            setStatus("Payment approval failed");
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log("Payment ready for completion:", paymentId, txid);
          try {
            const response = await fetch("/api/complete-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });
            if (!response.ok) {
              throw new Error("Failed to complete payment");
            }
            console.log("Payment completed successfully");
            alert("Payment completed successfully!");
          } catch (error) {
            console.error("Completion error:", error);
            setStatus("Payment completion failed");
          }
        },
        onCancel: (paymentId) => {
          console.log("Payment cancelled:", paymentId);
          setStatus("Payment cancelled");
        },
        onError: (error) => {
          console.error("Payment error:", error);
          setStatus("Payment failed");
        },
      };

      await window.Pi.createPayment(paymentData, callbacks);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
        Pi Network Payment App
      </h1>

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ fontSize: "1.1rem" }}>{status}</p>
      </div>

      {user && (
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "1rem" }}>
            Welcome, <strong>{user.username}</strong>!
          </p>
          <button
            onClick={handlePayment}
            style={{
              padding: "1rem 2rem",
              backgroundColor: "#7b2cbf",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onMouseOver={(e) =>
              (e.target.style.backgroundColor = "#9d4edd")
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundColor = "#7b2cbf")
            }
          >
            Pay 1 Pi
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          fontSize: "0.9rem",
        }}
      >
        <h3 style={{ marginBottom: "0.5rem" }}>⚠️ Important</h3>
        <p style={{ marginBottom: "0.5rem" }}>
          This Pi Network app must be accessed through the Pi Network app environment to work properly.
        </p>
        <p style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          <strong>Testing in regular browser will fail</strong> - this is expected behavior!
        </p>
        <p style={{ color: "#666", fontSize: "0.8rem" }}>
          Access via: <code>https://sandbox.minepi.com/mobile-app-ui/app/your-app-name</code>
        </p>
      </div>
    </main>
  );
}
