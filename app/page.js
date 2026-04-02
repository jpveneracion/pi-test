"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    alert("Component Loaded");

    if (!window.Pi) {
      alert("Loading Pi SDK script");

      const script = document.createElement("script");
      script.src = "https://sdk.minepi.com/pi-sdk.js";

      script.onload = () => {
        alert("Pi SDK script loaded");
        initPi();
      };

      script.onerror = () => {
        alert("Failed to load Pi SDK script");
      };

      document.body.appendChild(script);
    } else {
      alert("Pi already exists");
      initPi();
    }

    async function initPi() {
      alert("initPi called");

      const Pi = window.Pi;

      if (!Pi) {
        alert("Pi object not found");
        return;
      }

      Pi.init({
        version: "2.0",
        sandbox: true,
      });

      alert("Pi initialized");

      try {
        const auth = await Pi.authenticate(
          ["username", "payments"],
          onIncompletePaymentFound
        );

        alert("Authenticated: " + auth.user.username);
        setUser(auth.user);
      } catch (err) {
        alert("Auth Error: " + JSON.stringify(err));
      }
    }

    function onIncompletePaymentFound(payment) {
      alert("Incomplete Payment Found: " + payment.identifier);
    }
  }, []);

  const handlePayment = async () => {
    const Pi = window.Pi;

    if (!Pi) {
      alert("Pi not initialized");
      return;
    }

    alert("Starting Payment");

    const paymentData = {
      amount: 1,
      memo: "Test Payment",
      metadata: { test: true },
    };

    const callbacks = {
      onReadyForServerApproval: async (paymentId) => {
        alert("Approve: " + paymentId);

        try {
          const res = await fetch("/api/approve", {
            method: "POST",
            body: JSON.stringify({ paymentId }),
          });

          const data = await res.json();
          alert("Approve Response: " + JSON.stringify(data));
        } catch (err) {
          alert("Approve Error: " + err.message);
        }
      },

      onReadyForServerCompletion: async (paymentId, txid) => {
        alert("Complete: " + paymentId + " | " + txid);

        try {
          const res = await fetch("/api/complete", {
            method: "POST",
            body: JSON.stringify({ paymentId, txid }),
          });

          const data = await res.json();
          alert("Complete Response: " + JSON.stringify(data));
        } catch (err) {
          alert("Complete Error: " + err.message);
        }
      },

      onCancel: (paymentId) => {
        alert("Cancelled: " + paymentId);
      },

      onError: (err) => {
        alert("Payment Error: " + JSON.stringify(err));
      },
    };

    try {
      await Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      alert("Create Payment Error: " + JSON.stringify(err));
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Pi Test Clean</h1>

      {user ? (
        <>
          <p>Welcome {user.username}</p>
          <button onClick={handlePayment}>Pay 1 Pi</button>
        </>
      ) : (
        <p>Authenticating...</p>
      )}
    </main>
  );
}