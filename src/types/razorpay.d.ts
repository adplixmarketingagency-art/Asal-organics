export {};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      prefill?: { name?: string; email?: string; contact?: string };
      theme?: { color?: string };
      retry?: { enabled: boolean };
      handler: (payment: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) => void | Promise<void>;
      modal?: { ondismiss?: () => void };
    }) => { open: () => void; close: () => void; on: (event: "payment.failed", callback: () => void) => void };
  }
}
