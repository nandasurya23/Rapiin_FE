import type { Business } from "@/types/business";

export const mockBusiness: Business = {
  id: "biz_001",
  ownerName: "Nanda",
  name: "Rapiin Studio",
  slug: "rapiin-studio",
  whatsappNumber: "6281234567890",
  mode: "BOOKING_SERVICE",
  operationalModel: "RESOURCE_BOOKING",
  usesResources: true,
  resourceLabel: "Studio",
  resourceCount: 3,
  resources: [
    { id: "res_1", name: "Studio 1", isActive: true },
    { id: "res_2", name: "Studio 2", isActive: true },
    { id: "res_3", name: "Studio 3", isActive: true },
  ],
  defaultBookingDurationMinutes: 60,
  niche: "STUDIO_MUSIK",
  description: "Bantu customer booking dengan cepat dan follow-up rapi dari WhatsApp.",
  address: "Jl. Melati No. 12, Makassar",
  openingHours: "Setiap hari 09.00 - 21.00",
  logoUrl: undefined,
  createdAt: "2025-06-01T08:00:00.000Z",
  updatedAt: "2025-06-01T08:00:00.000Z",
};
