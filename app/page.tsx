'use client'; // This is essential for window.Pi access

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {QRCodeCanvas} from "qrcode.react"

export default function Home() {
  const router = useRouter();
  const [isPiReady, setIsPiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const waitForPi = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        window.Pi.init({ version: "2.0" });
        setIsPiReady(true);
        clearInterval(waitForPi);
      }
    }, 100);

    return () => clearInterval(waitForPi);
  }, []);

  const handleLogin = async () => {
    if (!window.Pi) {
      alert("Pi SDK not loaded. Please open this app in Pi Browser.");
      return;
    }

    setIsLoading(true);

    try {
      alert("Starting authentication...");

      const scopes = ['username', 'payments'];
      const onIncompletePaymentFound = () => {
        alert("Incomplete payment found");
      };

      const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);

      // DEBUG: Show EXACTLY what we got from Pi SDK
      const debugInfo = {
        accessToken: auth.accessToken,
        accessTokenPrefix: auth.accessToken?.substring(0, 20),
        accessTokenSuffix: auth.accessToken?.substring(-20),
        user: auth.user,
        username: auth.user?.username,
        uid: auth.user?.uid
      };

      alert(`🔍 Pi SDK Response:\n\nUsername: ${auth.user?.username}\nUID: ${auth.user?.uid}\n\nToken: ${auth.accessToken?.substring(0, 15)}...\n\nSending to server...`);

      console.log('🔍 [FRONTEND] Pi SDK authenticate() result:', debugInfo);

      // Send the token to your Next.js Backend
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });

      if (res.ok) {
        const data = await res.json();

        // DEBUG: Show what we got from backend
        alert(`Server response!\n\nBackend User: ${data.user?.username}\nUID: ${data.user?.uid}`);

        // Clear old user data first
        localStorage.removeItem('piroll_user');

        // Store NEW user data for dashboard
        localStorage.setItem('piroll_user', JSON.stringify(data.user));

        // Redirect to dashboard using Next.js router
        router.push('/dashboard');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Auth failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Login Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4">
    <div className="text-center space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">
        Escrow <span className="text-yellow-400">QR Services</span>
      </h1>

      <QRCodeCanvas
        value="pi://wallet.pinet.com/pay-request?publicKey=GDN7QKNY3ZSCEYTGVBITK6G3I4ZH3P7RYS3UKFVKXQAWHQM4OEHIWVE3&name=%40jpx3m"
        size={256}
        level="H"
      />
      
      <p className="text-zinc-400 max-w-xs mx-auto">
        Please sign in with your Pi Network account to access the dashboard.
      </p>

      {!isPiReady && (
        <p className="text-yellow-400 text-sm">
          Loading Pi Network SDK...
        </p>
      )}

      {isPiReady && (
        <p className="text-green-400 text-sm">
          ✓ Pi SDK Ready - Open in Pi Browser
        </p>
      )}

      <div className="space-y-4">
        <button
          onClick={handleLogin}
          disabled={!isPiReady || isLoading}
          className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-bold py-4 px-10 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all transform active:scale-95"
        >
          {isLoading ? 'Connecting...' : !isPiReady ? 'Loading Pi SDK...' : 'Login with Pi Network'}
        </button>

        {/* Debug button to clear cached data */}
        <button
          onClick={() => {
            localStorage.clear();
            alert('✅ Cleared all cached data! Now login with your new user.');
            window.location.reload();
          }}
          className="text-zinc-500 hover:text-zinc-300 text-sm underline"
        >
          Clear cached data
        </button>

        {/* Debug page link */}
        <a
          href="/debug-auth"
          className="text-zinc-500 hover:text-zinc-300 text-sm underline block"
        >
          🔍 Debug Authentication
        </a>
      </div>
    </div>
  </main>
);
}