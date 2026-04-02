"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("Initializing...");
  const [piSdkLoaded, setPiSdkLoaded] = useState(false);
  const [windowPiExists, setWindowPiExists] = useState(false);

  useEffect(() => {
    let retryTimeout;

    async function initPi() {
      try {
        setStatus("Checking for Pi SDK...");

        // Check if Pi SDK exists and is loaded
        if (window.Pi && window.Pi.init) {
          setWindowPiExists(true);
          setStatus("Pi SDK found! Initializing...");

          // Initialize Pi SDK first
          window.Pi.init({
            version: "2.0",
            sandbox: true,
          });

          setPiSdkLoaded(true);
          setStatus("Pi SDK initialized! Waiting for connection...");

          // Wait a bit for init to complete before authenticating
          setTimeout(async () => {
            try {
              setStatus("Attempting authentication...");

              // Try to authenticate
              const auth = await window.Pi.authenticate(
                ["username", "payments"],
                (payment) => {
                  console.log("Incomplete payment found:", payment);
                }
              );

              setStatus(`✅ Authenticated as: ${auth.user.username}`);
            } catch (authError) {
              setStatus(`Auth Error: ${authError.message}`);
              console.error("Authentication Error:", authError);
            }
          }, 1000);

        } else {
          setWindowPiExists(false);
          setStatus("Pi SDK not loaded yet. Waiting...");
          // Wait and try again
          retryTimeout = setTimeout(initPi, 1000);
        }
      } catch (error) {
        setStatus(`Error: ${error.message}`);
        console.error("Pi SDK Error:", error);
      }
    }

    // Start initialization
    initPi();

    // Cleanup
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Pi Network Debug</h1>

      <div style={{ marginTop: 20 }}>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Pi SDK Loaded:</strong> {piSdkLoaded ? "✅ Yes" : "❌ No"}</p>
      </div>

      <div style={{ marginTop: 20, padding: 10, border: "1px solid #ccc" }}>
        <h3>Debug Info:</h3>
        <p>Window.Pi exists: {windowPiExists ? "Yes" : "No"}</p>
        <p>Environment: {process.env.NEXT_PUBLIC_PI_SANDBOX === "true" ? "Sandbox" : "Production"}</p>
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: "#666" }}>
        <p>Open browser console (F12) for more details</p>

        <div style={{ marginTop: 20, padding: 15, backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: 5 }}>
          <strong>⚠️ Important:</strong>
          <p style={{ marginTop: 10 }}>This Pi Network app will only work properly when accessed through the Pi Network sandbox environment:</p>
          <p style={{ marginTop: 5, fontSize: 11 }}>
            <code>https://sandbox.minepi.com/mobile-app-ui/app/your-app-name</code>
          </p>
          <p style={{ marginTop: 10, fontSize: 11 }}>
            The &quot;origin mismatch&quot; error in the console is normal when testing in a regular browser.
          </p>
        </div>
      </div>
    </main>
  );
}