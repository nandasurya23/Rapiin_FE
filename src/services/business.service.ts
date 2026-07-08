import type { Mapper } from "./mapper";
import type { Business, BusinessMode, OperationalModel, NicheTemplate, BusinessResource, PublicCatalogItem } from "@/types/business";
import { apiFetch } from "@/lib/api-client";

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

export class ApiBusinessService implements BusinessService {
  private mapper = new BusinessMapper();

  async getBusinessById(id: string): Promise<Business | null> {
    try {
      const response = await apiFetch<BusinessDTO>("/api/business");
      return this.mapper.toDomain(response);
    } catch (err) {
      console.error("Failed to fetch business by ID", err);
      return null;
    }
  }

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    try {
      const response = await apiFetch<BusinessDTO>(`/api/public/b/${slug}`);
      return this.mapper.toDomain(response);
    } catch (err) {
      console.error("Failed to fetch public business profile by slug", err);
      return null;
    }
  }

  async updateBusiness(id: string, payload: Partial<Omit<BusinessDTO, "id" | "createdAt" | "updatedAt">>): Promise<Business | null> {
    try {
      // Backend expects PUT /api/business/settings
      const response = await apiFetch<BusinessDTO>("/api/business/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rapiin-storage-sync"));
      }
      return this.mapper.toDomain(response);
    } catch (err) {
      console.error("Failed to update business settings", err);
      return null;
    }
  }
}
