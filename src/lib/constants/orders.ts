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
  INQUIRY: "Booking Baru",
  WAITING_DP: "Menunggu DP (15m)",
  CONFIRMED: "Jadwal Terkunci",
  ORDER_BARU: "Pesanan Baru",
  DIPROSES: "Sedang Dikerjakan",
  DIKIRIM_DIAMBIL: "Siap Ambil / Kirim",
  REQUEST_MASUK: "Permintaan Masuk",
  DIBAHAS: "Sedang Diskusi",
  PENAWARAN_DIKIRIM: "Penawaran Kirim",
  DEAL: "Deal / Disetujui",
  SELESAI: "Selesai & Lunas",
  BATAL: "Dibatalkan",
};

export const ORDER_STATUS_BY_MODE: Record<BusinessMode, StatusOption[]> = {
  BOOKING_SERVICE: [
    { value: "INQUIRY", label: "Booking Baru", tone: "info" },
    { value: "WAITING_DP", label: "Menunggu DP (15m)", tone: "warning" },
    { value: "CONFIRMED", label: "Jadwal Terkunci", tone: "success" },
    { value: "SELESAI", label: "Selesai & Lunas", tone: "success" },
    { value: "BATAL", label: "Dibatalkan", tone: "danger" },
  ],
  PRODUCT_ORDER: [
    { value: "ORDER_BARU", label: "Pesanan Baru", tone: "info" },
    { value: "DIPROSES", label: "Sedang Dikerjakan", tone: "warning" },
    { value: "DIKIRIM_DIAMBIL", label: "Siap Ambil / Kirim", tone: "info" },
    { value: "SELESAI", label: "Selesai & Lunas", tone: "success" },
    { value: "BATAL", label: "Dibatalkan", tone: "danger" },
  ],
  CUSTOM_REQUEST: [
    { value: "REQUEST_MASUK", label: "Permintaan Masuk", tone: "info" },
    { value: "DIBAHAS", label: "Sedang Diskusi", tone: "warning" },
    { value: "PENAWARAN_DIKIRIM", label: "Penawaran Kirim", tone: "info" },
    { value: "DEAL", label: "Deal / Disetujui", tone: "success" },
    { value: "SELESAI", label: "Selesai & Lunas", tone: "success" },
    { value: "BATAL", label: "Dibatalkan", tone: "danger" },
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

export const ORDER_STATUS_TRANSITIONS_BY_MODE_FE: Record<string, Partial<Record<OrderStatus, OrderStatus[]>>> = {
  BOOKING_SERVICE: {
    INQUIRY: ["WAITING_DP", "CONFIRMED", "BATAL"],
    WAITING_DP: ["CONFIRMED", "BATAL"],
    CONFIRMED: ["SELESAI", "BATAL"],
    SELESAI: [],
    BATAL: [],
  },
  PRODUCT_ORDER: {
    ORDER_BARU: ["DIPROSES", "DIKIRIM_DIAMBIL", "SELESAI", "BATAL"],
    DIPROSES: ["DIKIRIM_DIAMBIL", "SELESAI", "BATAL"],
    DIKIRIM_DIAMBIL: ["SELESAI", "BATAL"],
    SELESAI: [],
    BATAL: [],
  },
  CUSTOM_REQUEST: {
    REQUEST_MASUK: ["DIBAHAS", "PENAWARAN_DIKIRIM", "DEAL", "SELESAI", "BATAL"],
    DIBAHAS: ["PENAWARAN_DIKIRIM", "DEAL", "SELESAI", "BATAL"],
    PENAWARAN_DIKIRIM: ["DEAL", "SELESAI", "BATAL"],
    DEAL: ["SELESAI", "BATAL"],
    SELESAI: [],
    BATAL: [],
  },
};

export function getValidStatusOptions(currentStatus: OrderStatus | undefined, mode: BusinessMode): StatusOption[] {
  const allOptions = ORDER_STATUS_BY_MODE[mode] ?? [];
  if (!currentStatus) {
    return allOptions;
  }
  const allowedNext = ORDER_STATUS_TRANSITIONS_BY_MODE_FE[mode]?.[currentStatus] ?? [];
  return allOptions.filter(
    (opt) => opt.value === currentStatus || allowedNext.includes(opt.value)
  );
}
