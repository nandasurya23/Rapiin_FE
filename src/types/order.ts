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

export interface Order {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  whatsappNumber: string;
  title: string;
  mode: BusinessMode;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: "CASH" | "NON_CASH";
  scheduledDate?: string;
  scheduledTime?: string;
  bookingDurationMinutes?: number;
  resourceId?: string;
  resourceNameSnapshot?: string;
  serviceId?: string;
  totalAmount?: number;
  dpAmount?: number;
  isLocked: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
  customerStatusSnapshot?: CustomerStatus;
  pointsEarned?: number;
  pointsUsed?: number;
}

export interface Payment {
  id: string;
  businessId: string;
  orderId: string;
  amount: number;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  proof?: PaymentProof;
}

export interface PaymentProof {
  id: string;
  paymentId: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  ocrResult?: OCRResult;
}

export interface OCRResult {
  id: string;
  paymentProofId: string;
  extractedText: string;
  extractedAmount?: number;
  bankName?: string;
  transferDate?: string;
  referenceNumber?: string;
  confidenceScore: number;
  matchStatus: "MATCH" | "PARTIAL_MATCH" | "MISMATCH" | "UNVERIFIED";
  recommendationRating?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type StatusOption = {
  value: OrderStatus;
  label: string;
  tone: "info" | "warning" | "success" | "danger" | "neutral";
};
