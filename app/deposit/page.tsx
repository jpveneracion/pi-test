'use client';

import React, { useEffect, useState } from 'react';

interface Deposit {
  id: string;
  amount: number;
  timestamp: string;
  paymentId: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function DepositPage() {
  const [isPiReady, setIsPiReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [amount, setAmount] = useState('1');
  const [depositResult, setDepositResult] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  // Track payment processing to prevent duplicates
  const paymentRef = React.useRef<string | null>(null);

  // Fetch current balance on mount and after deposits
  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setDeposits(data.deposits);
      }
    } catch {
      // Silent fail - will retry on next call
    }
  };

  useEffect(() => {
    let initAttempted = false;

    const initAndAuth = async () => {
      if (initAttempted) return;
      initAttempted = true;

      try {
        // Step 1: Initialize Pi SDK FIRST
        window.Pi.init({ version: "2.0" });

        // Step 2: Wait a moment for init to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 3: Now authenticate with payment scope AND username
        alert('Requesting payment permission from Pi Network...');
        const auth = await window.Pi.authenticate(
          ['username', 'payments'],  // Include both scopes
          () => {
            alert('Incomplete payment found');
          }
        );

        // DEBUG: Show exactly what we got from Pi SDK
        const depositDebugInfo = {
          accessToken: auth.accessToken,
          accessTokenPrefix: auth.accessToken?.substring(0, 20),
          user: auth.user,
          username: auth.user?.username,
          uid: auth.user?.uid,
          rawAuth: JSON.stringify(auth, null, 2)
        };

        console.log('🔍 [DEPOSIT] Pi SDK authenticate() result:', depositDebugInfo);

        // Show the actual user data we received
        alert(`🔍 Deposit Auth Debug:\n\nUsername: ${auth.user?.username}\nUID: ${auth.user?.uid}\n\n📱 Check your Pi Browser - what account is logged in?`);

        // Handle response structure
        const username = auth?.user?.username || 'Unknown User';
        const uid = auth?.user?.uid || 'Unknown UID';

        alert(`✅ Payment permission granted!\nUser: ${username}\nUID: ${uid}`);
        setIsAuthenticated(true);
        setIsPiReady(true);
      } catch (error) {
        alert(`❌ Payment auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsAuthenticated(false);
        setIsPiReady(true); // Still mark as ready so button enables
      }
    };

    const waitForPi = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi && !initAttempted) {
        clearInterval(waitForPi);
        initAndAuth();
      }
    }, 100);

    // Fetch balance when page loads
    fetchBalance();

    return () => clearInterval(waitForPi);
  }, []);

  const handleDeposit = async () => {
    if (!window.Pi) {
      alert("Pi SDK not ready. Please open in Pi Browser.");
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Prevent duplicate payments
    if (paymentRef.current) {
      alert("Payment already in progress. Please wait.");
      return;
    }

    setIsLoading(true);
    setDepositResult(null);
    setPaymentStatus('');  // Clear previous status

    try {
      setPaymentStatus(`⏳ Initiating deposit of ${depositAmount} Pi...`);

      // CRITICAL: Amount must be STRING with exactly 7 decimal places
      const amountString = depositAmount.toFixed(7);

      const paymentData = {
        amount: amountString,  // STRING format required!
        memo: "Deposit to Escrow account",
        metadata: {
          transaction_type: "deposit",
          timestamp: new Date().toISOString(),
          user_id: "admin"
        }
      };

      alert(`🔍 Creating payment with Pi SDK...\n\nAmount: ${amountString} π\nMemo: ${paymentData.memo}\n\nCheck if wallet popup appears!`);

      setPaymentStatus(`⏳ Creating payment: ${amountString} π\n\n💡 Look for Pi wallet popup to approve...`);

      // Create payment with Pi SDK - paymentId comes through callbacks, not return value
      alert(`🔍 About to call window.Pi.createPayment...\n\nPaymentData: ${JSON.stringify(paymentData, null, 2)}\n\nCheck server console for detailed logs.`);

      await window.Pi.createPayment(
        paymentData,
        {
          onReadyForServerApproval: async (paymentId: string) => {
            // Prevent duplicate processing
            if (paymentRef.current) return;
            paymentRef.current = paymentId;

            alert(`🔍 onReadyForServerApproval FIRED!\n\nPayment ID: ${paymentId}\n\nCalling backend approve endpoint...`);
            setPaymentStatus(`⏳ Payment created: ${paymentId}\n\n⏳ Calling Pi API approve endpoint...`);
            console.log(`🔍 [Payment] onReadyForServerApproval: ${paymentId}`);

            try {
              // Step 1: Call backend approve endpoint
              const response = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentId: paymentId,
                  amount: depositAmount,
                  memo: "Deposit to Escrow account",
                  type: "deposit",
                  action: "approve",
                  txid: "" // Will be filled by Pi Network
                }),
              });

              if (response.ok) {
                const result = await response.json();
                console.log(`✅ [Payment] Approve endpoint success:`, result);
                setPaymentStatus(`✅ Payment approved by backend!\n\n⏳ Waiting for you to approve in Pi Browser wallet...`);
                alert(`✅ Backend approved!\n\nNow check your Pi Browser for the wallet popup to approve the payment.`);
              } else {
                const error = await response.json();
                console.error(`❌ [Payment] Approve endpoint failed:`, error);
                setPaymentStatus(`❌ Backend approval failed: ${error.error}`);
                alert(`❌ Backend approval failed: ${error.error}`);
              }
            } catch (error) {
              console.error(`❌ [Payment] Approve endpoint error:`, error);
              setPaymentStatus(`❌ Backend error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setPaymentStatus(`✅ Payment approved! Verifying with Pi Network API...`);
            console.log(`Payment completed: ${paymentId}, TXID: ${txid}`);
            alert(`✅ Payment approved in wallet!\n\nPayment ID: ${paymentId}\nTXID: ${txid}\n\nCalling backend complete endpoint...`);

            try {
              // Step 2: Call backend complete endpoint AFTER user approval
              const response = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentId: paymentId,
                  amount: depositAmount,
                  memo: "Deposit to Escrow account",
                  type: "deposit",
                  action: "complete",
                  txid: txid
                }),
              });

              if (response.ok) {
                const result = await response.json();

                if (result.success) {
                  setPaymentStatus(`✅ Deposit Successful! Amount: ${depositAmount} Pi`);
                  alert(`✅ Deposit Successful!\n\nAmount: ${depositAmount} Pi\nPayment ID: ${paymentId}\nStatus: ${result.payment?.status}\n\n💰 Funds added to your account!`);
                  setDepositResult(`✅ Successfully deposited ${depositAmount} Pi! Payment ID: ${paymentId}`);
                  // Refresh balance after successful deposit
                  fetchBalance();
                } else {
                  setPaymentStatus(`⚠️ Payment not completed. Status: ${result.payment?.status}`);
                  alert(`⚠️ Payment not completed\n\nStatus: ${result.payment?.status}\n\nThe payment exists but hasn't completed yet. You may need to wait or contact support.`);
                  setDepositResult(`⚠️ Payment pending: ${result.payment?.status}`);
                }
              } else {
                const error = await response.json();
                setPaymentStatus(`❌ Deposit verification failed`);
                alert(`❌ Deposit verification failed: ${error.error}`);
                setDepositResult(`❌ Deposit Failed: ${error.error}`);
              }
            } catch (error) {
              setPaymentStatus(`❌ Server error`);
              alert(`❌ Server error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              setDepositResult(`❌ Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
              paymentRef.current = null;
              setIsLoading(false);
            }
          },
          onCancel: async (paymentId: string) => {
            setPaymentStatus(`❌ Payment cancelled: ${paymentId}`);
            paymentRef.current = null;
            setIsLoading(false);
            setDepositResult(`❌ Payment cancelled`);
          },
          onError: async (error: unknown) => {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            setPaymentStatus(`❌ Payment error: ${errorMsg}`);

            // Special handling for missing payments scope
            if (errorMsg.includes('payments') && errorMsg.includes('scope')) {
              alert('⚠️ You need to logout and login again with payment permissions!');
            }

            paymentRef.current = null;
            setIsLoading(false);
            setDepositResult(`❌ Payment error: ${errorMsg}`);
          }
        }
      );

    } catch (error) {
      alert(`Deposit Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDepositResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      paymentRef.current = null;
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Deposit Funds for Escrow
          </h1>
          <p className="text-zinc-400">
            Add Pi to your escrow wallet to use for payments
          </p>
        </div>

        {/* App Wallet Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">App Wallet Information</h2>

          {/* Payment Authentication Status */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-zinc-300">
                Payment Scope: {isAuthenticated ? '✓ Authorized' : 'Authenticating...'}
              </span>
            </div>
          </div>

          {/* Balance Display */}
          <div className="bg-linear-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400 font-medium mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-white">{balance.toFixed(2)} π</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400">Total Deposits</p>
                <p className="text-lg font-semibold text-yellow-400">{deposits.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Wallet Address:</p>
              <p className="text-sm text-yellow-400 font-mono break-all bg-zinc-800 p-3 rounded">
                GDWRVALH77XFBMDIFV3KIFZ3TSMYQIQNSNCRN7SDV5UUHM7BGMWU7SYG
              </p>
            </div>
            <div className="text-xs text-zinc-500">
              ⚠️ Send payments only through this interface for proper tracking
            </div>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Make a Deposit</h2>

          {/* Extension Warning */}
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <p className="text-yellow-400 text-sm">
              ⚠️ <strong>Browser Extensions Warning:</strong> Password managers, form fillers, or other extensions can block the Pi wallet popup. Consider disabling them temporarily if deposits don&apos;t work.
            </p>
          </div>

          {/* Payment Status Display */}
          {paymentStatus && (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm">{paymentStatus}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Amount (Pi)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                placeholder="Enter amount"
                autoComplete="off"
                readOnly={isLoading}
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 0.5, 1, 5].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                >
                  {preset} π
                </button>
              ))}
            </div>

            {/* Deposit Button */}
            <button
              onClick={handleDeposit}
              disabled={!isPiReady || !isAuthenticated || isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-lg transition-colors"
            >
              {isLoading ? 'Processing Deposit...' :
               !isPiReady ? 'Loading Pi SDK...' :
               !isAuthenticated ? 'Authenticating...' :
               `Deposit ${amount} Pi`}
            </button>

            {depositResult && (
              <div className={`p-4 rounded-lg ${depositResult.includes('✅') ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <p className="text-sm break-all">{depositResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
          <ol className="text-zinc-300 space-y-2 text-sm">
            <li>1. Enter the amount you want to deposit</li>
            <li>2. Click &quot;Deposit&quot; to create payment</li>
            <li>3. Approve payment in Pi Browser wallet</li>
            <li>4. Payment verified and added to your balance</li>
            <li>5. Use funds for transactions</li>
          </ol>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
            <p className="text-blue-400 text-sm">
              💡 All deposits are tracked and available for your transactions
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center space-x-4">
          <a
            href="/dashboard"
            className="text-zinc-400 hover:text-white text-sm"
          >
            ← Back to Dashboard
          </a>
          <a
            href="/test-payment"
            className="text-zinc-400 hover:text-white text-sm"
          >
            Test Payment →
          </a>
        </div>
      </div>
    </main>
  );
}