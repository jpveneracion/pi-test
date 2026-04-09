'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear all cached data
    localStorage.removeItem('piroll_user');
    localStorage.removeItem('mypiroll_token');

    alert('✅ Logged out successfully! Redirecting to login...');

    // Redirect to home after 1 second
    setTimeout(() => {
      router.push('/');
    }, 1000);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Logging out...</h1>
        <p className="text-zinc-400">Clearing your session...</p>
      </div>
    </main>
  );
}