'use client';

import React, { useEffect, useState } from 'react';

export default function TestPaymentPage() {
  const [isPiReady, setIsPiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<string | null>(null);

  useEffect(() => {
    const waitForPi = setInterval(() => {
      if (typeof window !== "undefined" && window.Pi) {
        setIsPiReady(true);
        clearInterval(waitForPi);
      }
    }, 100);

    return () => clearInterval(waitForPi);
  }, []);

  const handleTestPayment = async () => {
    if (!window.Pi) {
      alert("Pi SDK not ready. Please open in Pi Browser.");
      return;
    }

    setIsLoading(true);
    setPaymentResult(null);

    try {
      alert("Creating test payment...");

      const paymentData = {
        amount: "0.0100000", // Must be string with 7 decimals
        memo: "Test payment from Escrow",
        metadata: {
          transaction_id: `test_${Date.now()}`,
          user_id: "test_user"
        }
      };

      alert(`Creating payment with:\nAmount: ${paymentData.amount}\nMemo: ${paymentData.memo}\n\nCheck if wallet popup appears!`);

      // Step 1: Create payment with callbacks
      await window.Pi.createPayment(
        paymentData,
        {
          onReadyForServerApproval: async (paymentId: string) => {
            alert(`✅ onReadyForServerApproval fired!\n\nPayment ID: ${paymentId}\n\nCalling backend approve endpoint...\n\n💡 Wallet popup should appear NOW!`);
            setPaymentResult(`⏳ Payment created: ${paymentId}. Calling approve endpoint...`);

            try {
              const response = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentId: paymentId,
                  amount: 0.01,
                  memo: "Test payment from Escrow",
                  type: "test",
                  action: "approve",
                  txid: ""
                }),
              });

              if (response.ok) {
                const result = await response.json();
                alert(`✅ Approve endpoint called!\n\nNow check your Pi Browser for wallet popup.`);
                setPaymentResult(`✅ Backend approved. Waiting for wallet approval...`);
              } else {
                const error = await response.json();
                alert(`❌ Approve failed: ${error.error}`);
                setPaymentResult(`❌ Approve failed: ${error.error}`);
              }
            } catch (error) {
              alert(`❌ Approve error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              setPaymentResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            alert(`✅ Payment approved in wallet!\n\nPayment ID: ${paymentId}\nTXID: ${txid}\n\nCalling complete endpoint...`);
            setPaymentResult(`✅ Wallet approved! Calling complete endpoint...`);

            try {
              const response = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentId: paymentId,
                  amount: 0.01,
                  memo: "Test payment from Escrow",
                  type: "test",
                  action: "complete",
                  txid: txid
                }),
              });

              if (response.ok) {
                const result = await response.json();
                alert(`✅ Test payment successful!\n\nPayment ID: ${result.payment?.id}\nStatus: ${result.payment?.status}`);
                setPaymentResult(`✅ Payment completed! Status: ${result.payment?.status}`);
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
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Pi Network Payment Test
          </h1>
          <p className="text-zinc-400">
            Test if payment authorization popup appears in Pi Browser
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">SDK Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPiReady ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-zinc-300">
                Pi SDK: {isPiReady ? 'Ready' : 'Not Ready'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-zinc-300">
                Payment Scope: Included in Auth
              </span>
            </div>
          </div>
        </div>

        {/* Test Payment Button */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Test Payment</h2>
          <div className="space-y-4">
            <div className="bg-zinc-800 rounded p-4">
              <p className="text-sm text-zinc-400 mb-2">Payment Details:</p>
              <ul className="text-sm text-zinc-300 space-y-1">
                <li>• Amount: 0.01 Pi</li>
                <li>• Memo: "Test payment from Escrow"</li>
                <li>• Purpose: Test wallet popup</li>
              </ul>
            </div>

            <button
              onClick={handleTestPayment}
              disabled={!isPiReady || isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-lg transition-colors"
            >
              {isLoading ? 'Processing...' : 'Test Payment Popup'}
            </button>

            {paymentResult && (
              <div className="bg-zinc-800 rounded p-4">
                <p className="text-sm text-zinc-400 mb-2">Result:</p>
                <p className="text-sm text-zinc-300 break-all">{paymentResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">What Should Happen</h2>
          <ol className="text-zinc-300 space-y-2 text-sm">
            <li>1. Click "Test Payment Popup" button</li>
            <li>2. Pi Browser wallet popup should appear</li>
            <li>3. You'll see payment confirmation request</li>
            <li>4. Can approve or cancel the test payment</li>
          </ol>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <p className="text-yellow-400 text-sm">
              ⚠️ If no popup appears, check:
              • Opened in Pi Browser (not regular browser)
              • App domain matches Pi Developer Portal
              • App has proper permissions
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-zinc-400 hover:text-white text-sm"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}