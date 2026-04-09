'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugAuthPage() {
  const router = useRouter();
  const [frontendUser, setFrontendUser] = useState<any>(null);
  const [backendUser, setBackendUser] = useState<any>(null);
  const [localStorageUser, setLocalStorageUser] = useState<any>(null);

  useEffect(() => {
    // Check localStorage
    const storedUser = localStorage.getItem('piroll_user');
    if (storedUser) {
      try {
        setLocalStorageUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, []);

  const testFrontendAuth = async () => {
    if (!window.Pi) {
      alert('Pi SDK not ready. Please open in Pi Browser.');
      return;
    }

    try {
      alert('Testing frontend Pi SDK authentication...');

      const auth = await window.Pi.authenticate(['username'], () => {});

      setFrontendUser(auth.user);

      alert(`✅ Frontend Pi SDK Result:\n\nUsername: ${auth.user?.username}\nUID: ${auth.user?.uid}\n\nNow testing backend...`);

      // Test the same token with backend
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setBackendUser(data.user);

        alert(`🔍 COMPARISON:\n\nFrontend: ${auth.user?.username}\nBackend: ${data.user?.username}\n\nMatch: ${auth.user?.username === data.user?.username ? '✅ YES' : '❌ NO'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔍 Authentication Debug Page
          </h1>
          <p className="text-zinc-400">
            Compare frontend SDK vs backend API responses
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Test Authentication</h2>
          <button
            onClick={testFrontendAuth}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Test Frontend → Backend Authentication
          </button>
        </div>

        {/* LocalStorage User */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">📱 LocalStorage User</h2>
          {localStorageUser ? (
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400">Username: <span className="text-white font-mono">{localStorageUser.username}</span></p>
              <p className="text-zinc-400">UID: <span className="text-white font-mono">{localStorageUser.uid}</span></p>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No user in localStorage</p>
          )}
        </div>

        {/* Frontend SDK User */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">📱 Frontend Pi SDK User</h2>
          {frontendUser ? (
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400">Username: <span className="text-green-400 font-mono">{frontendUser.username}</span></p>
              <p className="text-zinc-400">UID: <span className="text-green-400 font-mono">{frontendUser.uid}</span></p>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Not tested yet</p>
          )}
        </div>

        {/* Backend API User */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🖥️ Backend API User</h2>
          {backendUser ? (
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400">Username: <span className="text-blue-400 font-mono">{backendUser.username}</span></p>
              <p className="text-zinc-400">UID: <span className="text-blue-400 font-mono">{backendUser.uid}</span></p>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Not tested yet</p>
          )}
        </div>

        {/* Comparison */}
        {frontendUser && backendUser && (
          <div className={`p-6 rounded-lg border ${frontendUser.username === backendUser.username ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <h2 className="text-xl font-bold mb-4">🔍 Comparison Result</h2>
            {frontendUser.username === backendUser.username ? (
              <p className="text-green-400">✅ Frontend and Backend match!</p>
            ) : (
              <div className="text-red-400">
                <p>❌ MISMATCH DETECTED!</p>
                <p className="mt-2">Frontend: {frontendUser.username}</p>
                <p>Backend: {backendUser.username}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-zinc-400 hover:text-white text-sm"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </main>
  );
}