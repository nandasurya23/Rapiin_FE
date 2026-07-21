import type { ID, Timestamped } from "@/types/common";
import type { Order } from "@/types/order";

export type BusinessMode = "BOOKING_SERVICE" | "PRODUCT_ORDER" | "CUSTOM_REQUEST";
export type OperationalModel = "APPOINTMENT" | "RESOURCE_BOOKING" | "ORDER_REQUEST";

export type NicheTemplate = string;

export type BusinessResource = {
  id: ID;
  name: string;
  isActive: boolean;
};

export type PublicCatalogItem = {
  id: string;
  name: string;
  description: string;
  priceLabel?: string;
  durationMinutes?: number;
  duration?: number;
};

export type Business = Timestamped & {
  id: ID;
  ownerName: string;
  name: string;
  slug: string;
  whatsappNumber: string;
  mode: BusinessMode;
  operationalModel: OperationalModel;
  usesResources: boolean;
  resourceLabel?: string;
  resourceCount?: number;
  resources?: BusinessResource[];
  services?: PublicCatalogItem[];
  bookingCapacity?: number;
  defaultBookingDurationMinutes?: number;
  niche: NicheTemplate;
  description: string;
  address?: string;
  openingHours?: string;
  timezone?: string;
  logoUrl?: string;
  paymentInstructions?: string;
  closedDates?: Record<string, string>;
  orders?: Partial<Order>[];
  autoCreateOrderFromSubmission?: boolean;
};

export type BusinessModeOption = {
  value: BusinessMode;
  label: string;
  helperText: string;
};

export type OperationalModelOption = {
  value: OperationalModel;
  label: string;
  helperText: string;
};

