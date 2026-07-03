import type { Mapper } from "./mapper";
import type { Business, BusinessMode, OperationalModel, NicheTemplate, BusinessResource, PublicCatalogItem } from "@/types/business";

export interface BusinessDTO {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export class BusinessMapper implements Mapper<BusinessDTO, Business> {
  toDomain(raw: BusinessDTO): Business {
    return { ...raw };
  }

  toDTO(domain: Business): BusinessDTO {
    return { ...domain };
  }
}

export interface BusinessService {
  getBusinessById(id: string): Promise<Business | null>;
  getBusinessBySlug(slug: string): Promise<Business | null>;
  updateBusiness(id: string, payload: Partial<Omit<BusinessDTO, "id" | "createdAt" | "updatedAt">>): Promise<Business | null>;
}
