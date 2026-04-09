// Simple in-memory balance tracking (for demo - replace with database in production)
interface Deposit {
  id: string;
  amount: number;
  timestamp: Date;
  paymentId: string;
  status: 'completed' | 'pending' | 'failed';
}

class BalanceTracker {
  private balance: number = 0;
  private deposits: Deposit[] = [];

  addDeposit(amount: number, paymentId: string): Deposit {
    const deposit: Deposit = {
      id: `deposit_${Date.now()}`,
      amount,
      timestamp: new Date(),
      paymentId,
      status: 'completed'
    };

    this.deposits.push(deposit);
    this.balance += amount;

    console.log(`[BalanceTracker] Added deposit: ${amount} Pi, New balance: ${this.balance} Pi`);

    return deposit;
  }

  getBalance(): number {
    return this.balance;
  }

  getDeposits(): Deposit[] {
    return [...this.deposits].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getTotalDeposits(): number {
    return this.deposits.length;
  }

  // For demo purposes - reset balance
  resetBalance(): void {
    this.balance = 0;
    this.deposits = [];
    console.log('[BalanceTracker] Balance reset');
  }
}

// Export singleton instance
export const balanceTracker = new BalanceTracker();