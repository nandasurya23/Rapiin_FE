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
  INQUIRY: "Tanya-Tanya",
  WAITING_DP: "Menunggu DP",
  CONFIRMED: "Disetujui",
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
    { value: "INQUIRY", label: "Tanya-Tanya", tone: "info" },
    { value: "WAITING_DP", label: "Menunggu DP", tone: "warning" },
    { value: "CONFIRMED", label: "Disetujui", tone: "success" },
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

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  INQUIRY: ["WAITING_DP", "CONFIRMED", "REQUEST_MASUK", "DEAL", "SELESAI", "BATAL"],
  WAITING_DP: ["CONFIRMED", "SELESAI", "BATAL"],
  CONFIRMED: ["ORDER_BARU", "DIPROSES", "DIBAHAS", "SELESAI", "BATAL"],
  ORDER_BARU: ["DIPROSES", "SELESAI", "BATAL"],
  DIPROSES: ["DIKIRIM_DIAMBIL", "SELESAI", "BATAL"],
  DIKIRIM_DIAMBIL: ["SELESAI", "BATAL"],
  REQUEST_MASUK: ["DIBAHAS", "SELESAI", "BATAL"],
  DIBAHAS: ["PENAWARAN_DIKIRIM", "DEAL", "SELESAI", "BATAL"],
  PENAWARAN_DIKIRIM: ["DEAL", "SELESAI", "BATAL"],
  DEAL: ["SELESAI", "BATAL"],
  SELESAI: [],
  BATAL: [],
};

export function getValidStatusOptions(currentStatus: OrderStatus | undefined, mode: BusinessMode): StatusOption[] {
  const allOptions = ORDER_STATUS_BY_MODE[mode] ?? [];
  if (!currentStatus) {
    return allOptions;
  }
  const allowedNext = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
  return allOptions.filter(
    (opt) => opt.value === currentStatus || allowedNext.includes(opt.value)
  );
}
