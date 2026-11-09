import type { CheckoutDetails } from "./checkout.ts";

export const fulfillmentStatuses = ["unfulfilled", "packed", "shipped", "delivered"] as const;
export type FulfillmentStatus = typeof fulfillmentStatuses[number];
export type OrderFilter = "all" | "pending" | "paid" | FulfillmentStatus;
export type AdminOrder = {
  id: string; receipt: string; status: string; fulfillmentStatus: FulfillmentStatus;
  amountPaise: number; currency: string; customerName: string; city: string;
  createdAt: string; updatedAt: string; notificationStatus: string | null;
};
export type NotificationRecord = {
  id: string; status: string; attempts: number; lastError: string | null;
  nextAttemptAt: string; sentAt: string | null; firstAttemptAt: string | null;
};
export type AdminOrderDetail = AdminOrder & {
  customer: CheckoutDetails;
  items: { productId: string; variantId?: string; name: string; size?: string; quantity: number; unitPricePaise: number }[];
  paymentId: string | null; razorpayOrderId: string | null;
  notification: NotificationRecord | null;
  history: { id: string; fromStatus: string; toStatus: string; actor: string; createdAt: string }[];
};
export type OrdersResult = {
  orders: AdminOrder[]; total: number; page: number; pageSize: number;
  summary: { paid: number; unfulfilled: number; shipped: number; notificationIssues: number };
};
