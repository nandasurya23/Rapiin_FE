import type { BusinessMode, BusinessModeOption, BusinessResource, NicheTemplateOption, OperationalModel, OperationalModelOption } from "@/types/business";
import { DEFAULT_BOOKING_DURATION_MINUTES } from "@/lib/booking";

export const BUSINESS_MODE_OPTIONS: BusinessModeOption[] = [
  {
    value: "BOOKING_SERVICE",
    label: "Booking Jasa",
    helperText: "Jadwal, layanan, & janji temu. Contoh: Salon, Barbershop, Klinik, Studio Foto, Futsal.",
  },
  {
    value: "PRODUCT_ORDER",
    label: "Order Produk",
    helperText: "Penjualan barang atau makanan fisik. Contoh: Toko Online, Toko Kue, Katering, Makanan.",
  },
  {
    value: "CUSTOM_REQUEST",
    label: "Request Custom",
    helperText: "Layanan sesuai permintaan khusus. Contoh: Jahit Baju, Service AC, Desain Grafis.",
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

export const NICHE_TEMPLATE_OPTIONS: NicheTemplateOption[] = [
  { value: "STUDIO_MUSIK", label: "Studio Musik" },
  { value: "BARBERSHOP", label: "Barbershop" },
  { value: "TATTOO", label: "Tattoo Studio" },
  { value: "RENTAL", label: "Rental Motor" },
  { value: "TOUR", label: "Tour Travel" },
  { value: "LAUNDRY", label: "Laundry" },
  { value: "MAKANAN", label: "Catering / Makanan" },
  { value: "HANDMADE", label: "Produk Handmade" },
  { value: "CUSTOM", label: "Jasa Custom" },
  { value: "LAINNYA", label: "Lainnya" },
];

export const NicheTemplateLabel: Record<NicheTemplateOption["value"], string> = {
  STUDIO_MUSIK: "Studio Musik",
  BARBERSHOP: "Barbershop",
  TATTOO: "Tattoo Studio",
  RENTAL: "Rental Motor",
  TOUR: "Tour Travel",
  LAUNDRY: "Laundry",
  MAKANAN: "Catering / Makanan",
  HANDMADE: "Produk Handmade",
  CUSTOM: "Jasa Custom",
  LAINNYA: "Lainnya",
};

export const RESOURCE_LABEL_SUGGESTIONS = ["Staf", "Tim", "Kapster", "Ruangan", "Meja", "PS", "Lapangan", "Court", "Studio", "Room"] as const;

export function getDefaultOperationalModel(mode: BusinessMode): OperationalModel {
  if (mode === "BOOKING_SERVICE") {
    return "APPOINTMENT";
  }

  return "ORDER_REQUEST";
}

export function doesOperationalModelUseResources(model: OperationalModel) {
  return model === "RESOURCE_BOOKING";
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
