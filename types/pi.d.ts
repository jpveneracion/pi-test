// Shared Pi Network type definitions

interface PiUser {
  uid: string;
  username: string;
}

interface PiAuthResponse {
  accessToken: string;
  user: PiUser;
}

interface PaymentCallbacks {
  onReadyForServerApproval?: (paymentId: string) => void | Promise<void>;
  onReadyForServerCompletion?: (paymentId: string, txid: string) => void | Promise<void>;
  onCancel?: (paymentId: string) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}

interface Payment {
  amount: string; // CRITICAL: Must be STRING with 7 decimal places
  memo: string;
  metadata: { [key: string]: string };
}

interface PiSDK {
  init: (options: { version: string; sandbox?: boolean }) => void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void
  ) => Promise<PiAuthResponse>;
  createPayment: (payment: Payment, callbacks: PaymentCallbacks) => Promise<{ paymentId: string }>;
}

declare global {
  interface Window {
    Pi: PiSDK;
  }
}

export {};