import { NextResponse } from 'next/server';
import { balanceTracker } from '../../lib/balanceTracker';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, memo, paymentId, type, txid, action } = body;

    // DEBUG: Log incoming payment request
    console.log('🔍 [Payment] Incoming Request:', {
      amount,
      memo,
      paymentId,
      type,
      txid,
      action,
      timestamp: new Date().toISOString()
    });

    // Server-side only - never exposed to frontend
    const apiKey = process.env.PI_API_KEY;
    const appWallet = process.env.PI_APP_WALLET;
    const apiUrl = process.env.PI_API_URL || 'https://api.minepi.com/v2';

    if (!apiKey || !appWallet) {
      console.log('❌ [Payment] Server configuration error');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Step 1: APPROVE payment - when payment is created and ready for user approval
    if (action === 'approve') {
      console.log(`🔍 [Payment] Approving payment ${paymentId}...`);

      const approveResponse = await fetch(`${apiUrl}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      });

      if (!approveResponse.ok) {
        const errorData = await approveResponse.json().catch(() => ({}));
        console.log(`❌ [Payment] Approve failed:`, errorData);
        return NextResponse.json(
          { error: 'Payment approval failed', details: errorData },
          { status: approveResponse.status }
        );
      }

      const approveData = await approveResponse.json();
      console.log(`✅ [Payment] Payment approved:`, approveData);

      return NextResponse.json({
        success: true,
        payment: approveData,
        message: 'Payment approved successfully'
      });
    }

    // Step 2: COMPLETE payment - after user has approved in wallet
    if (action === 'complete') {
      console.log(`🔍 [Payment] Completing payment ${paymentId}...`);

      const completeResponse = await fetch(`${apiUrl}/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}));
        console.log(`❌ [Payment] Complete failed:`, errorData);
        return NextResponse.json(
          { error: 'Payment completion failed', details: errorData },
          { status: completeResponse.status }
        );
      }

      const completeData = await completeResponse.json();
      console.log(`✅ [Payment] Payment completed:`, completeData);

      // Only add balance after successful completion
      if (type === 'deposit') {
        balanceTracker.addDeposit(parseFloat(amount.toString()), paymentId);
        console.log(`[Payment] Deposit processed. New balance: ${balanceTracker.getBalance()} Pi`);
      }

      return NextResponse.json({
        success: true,
        payment: completeData,
        message: 'Payment completed successfully'
      });
    }

    // Default: Verify payment status (for checking/completed payments)
    console.log(`🔍 [Payment] Verifying payment ${paymentId} with Pi API...`);

    const response = await fetch(`${apiUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log(`[Payment] API verification failed:`, errorData);
      return NextResponse.json(
        { error: 'Payment verification failed', details: errorData },
        { status: response.status }
      );
    }

    const paymentData = await response.json();
    console.log(`[Payment] API Response:`, {
      id: paymentData.id,
      status: paymentData.status,
      amount: paymentData.amount,
      from: paymentData.from_address,
      to: paymentData.to_address,
      txid: paymentData.transaction_id
    });

    // CRITICAL: Only add balance if payment is actually completed
    const validStatuses = ['completed', 'success', 'approved', 'verified'];
    const isPaymentCompleted = validStatuses.includes(paymentData.status?.toLowerCase());

    // Log transaction for tracking
    console.log(`[Payment] ${type || 'transaction'} - Amount: ${amount} Pi, Payment ID: ${paymentId}, Status: ${paymentData.status}`);
    console.log(`[Payment] Is payment completed: ${isPaymentCompleted}`);

    // TODO: Add your business logic here
    if (type === 'deposit' && isPaymentCompleted) {
      // Handle deposit - ONLY if payment is actually completed
      balanceTracker.addDeposit(parseFloat(amount.toString()), paymentId);

      console.log(`[Payment] Processing deposit of ${amount} Pi`);
      console.log(`[Payment] New balance: ${balanceTracker.getBalance()} Pi`);
    } else if (type === 'deposit' && !isPaymentCompleted) {
      console.log(`[Payment] Payment not completed - not adding to balance`);
      return NextResponse.json({
        success: false,
        payment: paymentData,
        message: `Payment not completed. Current status: ${paymentData.status}`
      });
    }

    return NextResponse.json({
      success: true,
      payment: paymentData,
      message: 'Payment processed successfully'
    });

  } catch (error: unknown) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}