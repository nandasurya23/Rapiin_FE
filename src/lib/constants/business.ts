import type { BusinessMode, BusinessModeOption, BusinessResource, OperationalModel, OperationalModelOption, PaymentTimingOption } from "@/types/business";
import { DEFAULT_BOOKING_DURATION_MINUTES } from "@/lib/booking";

export const BUSINESS_MODE_OPTIONS: BusinessModeOption[] = [
  {
    value: "BOOKING_SERVICE",
    label: "Booking Jasa (Appointment & Resource)",
    helperText: "Jadwal, layanan, janji temu, dan sewa unit. Contoh: Salon, Klinik, Barbershop, Futsal, Rental PS, Studio Foto, Warnet.",
  },
  {
    value: "PRODUCT_ORDER",
    label: "Order Produk (Barang FIsik)",
    helperText: "Penjualan barang, makanan fisik, atau hampers multi-item. Contoh: Toko Roti, Bakery, Florist, Hampers, Katering.",
  },
  {
    value: "CUSTOM_REQUEST",
    label: "Service Order & Request Custom",
    helperText: "Layanan berbasis order atau permintaan khusus tanpa batas jam ketat. Contoh: Laundry, Cuci Sepatu, Jahit Baju, Service AC.",
  },
];

export const OPERATIONAL_MODEL_OPTIONS: OperationalModelOption[] = [
  {
    value: "APPOINTMENT",
    label: "Customer pilih jadwal biasa",
    helperText: "Pelanggan hanya perlu pesan jam kosong. Contoh: salon kecantikan, servis mobil, salon umum.",
  },
  {
    value: "RESOURCE_BOOKING",
    label: "Customer pesan untuk unit/staf tertentu",
    helperText: "Pelanggan harus memilih staf, lapangan, atau ruangan spesifik. Contoh: barbershop dengan kapster tertentu, rental studio, lapangan olahraga.",
  },
  {
    value: "ORDER_REQUEST",
    label: "Customer kirim order / request",
    helperText: "Pelanggan mengirim detail pesanan tanpa batas jam. Contoh: katering harian, laundry kiloan.",
  },
];

export const PAYMENT_TIMING_OPTIONS: PaymentTimingOption[] = [
  {
    value: "PAYMENT_ON_BOOKING",
    label: "Saat Mengisi Form",
    helperText: "Pelanggan harus membayar (DP/Full) dan upload bukti sebelum pesanan terkirim. Cocok untuk sewa studio, lapangan, atau layanan yang butuh komitmen awal.",
  },
  {
    value: "PAYMENT_AFTER_CONFIRMATION",
    label: "Setelah Dikonfirmasi Admin",
    helperText: "Pelanggan kirim form dulu, admin cek jadwal, lalu kirim tagihan. Cocok untuk klinik, dokter, salon, atau layanan berbasis appointment.",
  },
  {
    value: "PAYMENT_AFTER_INVOICE",
    label: "Setelah Invoice/Penawaran Diterbitkan",
    helperText: "Pelanggan kirim request detail, admin buatkan penawaran harga, baru dibayar. Cocok untuk percetakan, katering, jasa kontraktor.",
  },
  {
    value: "NO_PAYMENT",
    label: "Tanpa Pembayaran Online",
    helperText: "Tidak ada sistem tagihan online. Bayar langsung di tempat (Cash On Delivery/On Site).",
  },
];

export const RESOURCE_LABEL_SUGGESTIONS = ["Staf", "Tim", "Kapster", "Ruangan", "Meja", "PS", "Lapangan", "Court", "Studio", "Room"] as const;

export const DURATION_OPTIONS = [
  { value: "15", label: "15 Menit" },
  { value: "30", label: "30 Menit" },
  { value: "45", label: "45 Menit" },
  { value: "60", label: "1 Jam" },
  { value: "90", label: "1.5 Jam" },
  { value: "120", label: "2 Jam" },
  { value: "150", label: "2.5 Jam" },
  { value: "180", label: "3 Jam" },
  { value: "240", label: "4 Jam" },
  { value: "300", label: "5 Jam" },
  { value: "360", label: "6 Jam" },
  { value: "720", label: "12 Jam" },
  { value: "1440", label: "24 Jam (1 Hari)" },
];

export function getDefaultOperationalModel(mode: BusinessMode): OperationalModel {
  if (mode === "BOOKING_SERVICE") {
    return "APPOINTMENT";
  }

  return "ORDER_REQUEST";
}

export function doesOperationalModelUseResources(model: OperationalModel) {
  return model === "RESOURCE_BOOKING" || model === "APPOINTMENT";
}

export function createBusinessResources(resourceLabel: string, resourceCount: number): BusinessResource[] {
  const safeLabel = resourceLabel.trim() || "Staf";
  const safeCount = Math.max(1, resourceCount);

  return Array.from({ length: safeCount }, (_, index) => ({
    id: `res_${index + 1}`,
    name: `${safeLabel} ${index + 1}`,
    isActive: true,
  }));
}

export function getDefaultBusinessConfigForMode(mode: BusinessMode) {
  const operationalModel = getDefaultOperationalModel(mode);
  const usesResources = doesOperationalModelUseResources(operationalModel);

  return {
    mode,
    operationalModel,
    usesResources,
    resourceLabel: usesResources ? "Staf" : undefined,
    resourceCount: usesResources ? 1 : undefined,
    resources: usesResources ? createBusinessResources("Staf", 1) : [],
    defaultBookingDurationMinutes: mode === "BOOKING_SERVICE" ? DEFAULT_BOOKING_DURATION_MINUTES : undefined,
  };
}
