import type { Business } from "@/types/business";

export const mockBusiness: Business = {
  id: "biz_001",
  ownerName: "",
  name: "",
  slug: "",
  whatsappNumber: "",
  mode: "BOOKING_SERVICE",
  operationalModel: "RESOURCE_BOOKING",
  usesResources: true,
  resourceLabel: "Tim",
  resourceCount: 0,
  resources: [],
  defaultBookingDurationMinutes: 60,
  niche: "STUDIO_MUSIK",
  description: "Kelola booking online dengan mudah.",
  address: "",
  openingHours: "09:00 - 18:00",
  logoUrl: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
