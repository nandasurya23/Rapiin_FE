import type { BusinessMode } from "@/types/business";
import type { OrderStatus, PaymentStatus, StatusOption } from "@/types/order";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Belum Bayar",
  DP_PAID: "Sudah DP",
  PAID: "Lunas",
  REFUNDED: "Refund",
  CANCELLED: "Batal",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  INQUIRY: "Inquiry",
  WAITING_DP: "Menunggu DP",
  CONFIRMED: "Confirmed",
  ORDER_BARU: "Order Baru",
  DIPROSES: "Diproses",
  DIKIRIM_DIAMBIL: "Dikirim / Diambil",
  REQUEST_MASUK: "Request Masuk",
  DIBAHAS: "Dibahas",
  PENAWARAN_DIKIRIM: "Penawaran Dikirim",
  DEAL: "Deal",
  SELESAI: "Selesai",
  BATAL: "Batal",
};

export const ORDER_STATUS_BY_MODE: Record<BusinessMode, StatusOption[]> = {
  BOOKING_SERVICE: [
    { value: "INQUIRY", label: "Inquiry", tone: "info" },
    { value: "WAITING_DP", label: "Menunggu DP", tone: "warning" },
    { value: "CONFIRMED", label: "Confirmed", tone: "success" },
    { value: "SELESAI", label: "Selesai", tone: "success" },
    { value: "BATAL", label: "Batal", tone: "danger" },
  ],
  PRODUCT_ORDER: [
    { value: "ORDER_BARU", label: "Order Baru", tone: "info" },
    { value: "DIPROSES", label: "Diproses", tone: "warning" },
    { value: "DIKIRIM_DIAMBIL", label: "Dikirim / Diambil", tone: "info" },
    { value: "SELESAI", label: "Selesai", tone: "success" },
    { value: "BATAL", label: "Batal", tone: "danger" },
  ],
  CUSTOM_REQUEST: [
    { value: "REQUEST_MASUK", label: "Request Masuk", tone: "info" },
    { value: "DIBAHAS", label: "Dibahas", tone: "warning" },
    { value: "PENAWARAN_DIKIRIM", label: "Penawaran Dikirim", tone: "info" },
    { value: "DEAL", label: "Deal", tone: "success" },
    { value: "SELESAI", label: "Selesai", tone: "success" },
    { value: "BATAL", label: "Batal", tone: "danger" },
  ],
};

export const PAYMENT_FILTER_OPTIONS: Array<{ value: "ALL" | PaymentStatus; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "UNPAID", label: "Belum Bayar" },
  { value: "DP_PAID", label: "Sudah DP" },
  { value: "PAID", label: "Lunas" },
  { value: "REFUNDED", label: "Refund" },
  { value: "CANCELLED", label: "Batal" },
];
