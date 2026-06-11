import type { BusinessMode, BusinessModeOption, BusinessResource, NicheTemplateOption, OperationalModel, OperationalModelOption } from "@/types/business";
import { DEFAULT_BOOKING_DURATION_MINUTES } from "@/lib/booking";

export const BUSINESS_MODE_OPTIONS: BusinessModeOption[] = [
  {
    value: "BOOKING_SERVICE",
    label: "Booking Jasa",
    helperText: "Untuk jadwal, layanan, DP, dan appointment.",
  },
  {
    value: "PRODUCT_ORDER",
    label: "Order Produk",
    helperText: "Untuk pesanan barang, makanan, atau produk fisik.",
  },
  {
    value: "CUSTOM_REQUEST",
    label: "Request Custom",
    helperText: "Untuk permintaan jasa khusus, quotation, dan project kecil.",
  },
];

export const OPERATIONAL_MODEL_OPTIONS: OperationalModelOption[] = [
  {
    value: "APPOINTMENT",
    label: "Customer pilih jadwal",
    helperText: "Cocok untuk salon, barber, tattoo, dan jasa booking biasa.",
  },
  {
    value: "RESOURCE_BOOKING",
    label: "Customer pilih jadwal dan bisnis punya beberapa unit/slot",
    helperText: "Cocok untuk studio, billiard, PS, futsal, badminton, dan room rental.",
  },
  {
    value: "ORDER_REQUEST",
    label: "Customer kirim order / request",
    helperText: "Cocok untuk catering, laundry, makanan, dan custom order.",
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

export const RESOURCE_LABEL_SUGGESTIONS = ["Meja", "PS", "Lapangan", "Court", "Studio", "Room", "Slot"] as const;

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
  const safeLabel = resourceLabel.trim() || "Slot";
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
    resourceLabel: usesResources ? "Slot" : undefined,
    resourceCount: usesResources ? 1 : undefined,
    resources: usesResources ? createBusinessResources("Slot", 1) : [],
    defaultBookingDurationMinutes: mode === "BOOKING_SERVICE" ? DEFAULT_BOOKING_DURATION_MINUTES : undefined,
  };
}
