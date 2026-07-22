import type { BusinessMode } from "@/types/business";
import type { ID, Timestamped } from "@/types/common";
import type { CustomerStatus } from "@/types/customer";

export type PaymentStatus = "UNPAID" | "DP_PAID" | "PAID" | "REFUNDED" | "CANCELLED";

export type OrderStatus =
  | "INQUIRY"
  | "WAITING_DP"
  | "CONFIRMED"
  | "ORDER_BARU"
  | "DIPROSES"
  | "DIKIRIM_DIAMBIL"
  | "REQUEST_MASUK"
  | "DIBAHAS"
  | "PENAWARAN_DIKIRIM"
  | "DEAL"
  | "SELESAI"
  | "BATAL";

export type Order = Timestamped & {
  id: ID;
  businessId: ID;
  customerId: ID;
  customerName: string;
  whatsappNumber: string;
  title: string;
  mode: BusinessMode;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  bookingDurationMinutes?: number;
  bookingHoldExpiresAt?: string;
  resourceId?: ID;
  resourceNameSnapshot?: string;
  serviceId?: ID;
  totalAmount?: number;
  dpAmount?: number;
  notes?: string;
  lastFollowUpAt?: string;
  customerStatusSnapshot?: CustomerStatus;
};

export type StatusOption = {
  value: OrderStatus;
  label: string;
  tone: "info" | "warning" | "success" | "danger" | "neutral";
};
