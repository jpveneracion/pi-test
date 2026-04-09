'use client';

import React, { useEffect, useState } from 'react';

interface PiUser {
  username: string;
  uid: string;
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<number>(0);
  const [totalDeposits, setTotalDeposits] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<PiUser | null>(null);

  useEffect(() => {
    // Check what user data we have
    const storedUser = localStorage.getItem('piroll_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        console.log('🔍 [Dashboard] Stored user data:', userData);
      } catch (error) {
        console.error('[Dashboard] Error parsing stored user:', error);
      }
    }

    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/balance');
        if (response.ok) {
          const data = await response.json();
          setBalance(data.balance);
          setTotalDeposits(data.totalDeposits);
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    fetchBalance();
  }, []);
  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to Escrow Dashboard
            </h1>
            <p className="text-zinc-400">
              Manage your payments and transactions
            </p>
            {currentUser && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400 font-medium mb-2">🔍 Current User Data:</p>
                <div className="text-xs text-zinc-300 space-y-1">
                  <p>Username: <span className="text-white font-mono">{currentUser.username || 'Not found'}</span></p>
                  <p>UID: <span className="text-white font-mono">{currentUser.uid || 'Not found'}</span></p>
                </div>
              </div>
            )}
          </div>
          <a
            href="/logout"
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Logout
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stat Card 1 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Total Transactions
              </h3>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">0</p>
            <p className="text-sm text-zinc-400">Active transactions</p>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Available Balance
              </h3>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{balance.toFixed(2)} π</p>
            <p className="text-sm text-zinc-400">{totalDeposits} deposit{totalDeposits !== 1 ? 's' : ''} made</p>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Pending Timesheets
              </h3>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">0</p>
            <p className="text-sm text-zinc-400">Awaiting approval</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a
              href="/deposit"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              💰 Deposit Funds
            </a>
            <a
              href="/claim"
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              Claim
            </a>
            <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
              Create Payment
            </button>
            <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
              View Reports
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-zinc-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No recent activity</p>
            <p className="text-sm mt-2">Start by making deposits or processing payments</p>
          </div>
        </div>
      </div>
    </main>
  );
}