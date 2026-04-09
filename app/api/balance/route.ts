import { NextResponse } from 'next/server';
import { balanceTracker } from '../../lib/balanceTracker';

export async function GET() {
  try {
    const balance = balanceTracker.getBalance();
    const deposits = balanceTracker.getDeposits();
    const totalDeposits = balanceTracker.getTotalDeposits();

    return NextResponse.json({
      balance,
      totalDeposits,
      deposits,
      currency: 'Pi'
    });
  } catch (error) {
    console.error('[Balance API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}