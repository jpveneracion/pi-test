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

        setPiReady(true);
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
        setStatus("Connection failed. Please use Pi Network app.");
        console.error("Pi SDK error:", error);
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
        onReadyForServerApproval: (paymentId) => {
          console.log("Payment ready for approval:", paymentId);
          // TODO: Call your backend API to approve payment
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("Payment completed:", paymentId, txid);
          alert("Payment completed successfully!");
          // TODO: Call your backend API to complete payment
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
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          fontSize: "0.9rem",
        }}
      >
        <h3 style={{ marginBottom: "0.5rem" }}>ℹ️ Information</h3>
        <p style={{ marginBottom: "0.5rem" }}>
          This app uses the Pi Network SDK for payments.
        </p>
        <p style={{ color: "#666", fontSize: "0.8rem" }}>
          For best results, access through Pi Network app environment.
        </p>
      </div>
    </main>
  );
}
