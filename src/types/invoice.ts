import type { ID, Timestamped } from "@/types/common";
import type { PaymentStatus } from "@/types/order";

export type Invoice = Timestamped & {
  id: ID;
  businessId: ID;
  orderId: ID;
  invoiceCode: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
};
