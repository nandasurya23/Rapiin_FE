import type { Mapper } from "./mapper";
import type { BusinessUsage } from "@/types/subscription";
import type { Business, BusinessMode, OperationalModel, NicheTemplate, BusinessResource, PublicCatalogItem, PaymentTiming } from "@/types/business";
import { apiFetch } from "@/lib/api-client";
import { logServiceError } from "./utils";

export interface ServiceDTO {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  duration: number;
}

export interface BusinessDTO {
  id: string;
  ownerName: string;
  name: string;
  slug: string;
  whatsappNumber: string;
  mode: BusinessMode;
  operationalModel: OperationalModel;
  paymentTiming?: PaymentTiming;
  usesResources: boolean;
  resourceLabel?: string;
  resourceCount?: number;
  resources?: BusinessResource[];
  services?: ServiceDTO[];
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
  autoCreateOrderFromSubmission?: boolean;
  subscriptions?: Record<string, unknown>[];
  createdAt: string;
  updatedAt: string;
}

export class BusinessMapper implements Mapper<BusinessDTO, Business> {
  toDomain(raw: BusinessDTO): Business {
    return {
      ...raw,
      resources: raw.resources || [],
      subscriptions: raw.subscriptions || [],
      paymentTiming: raw.paymentTiming ?? "NO_PAYMENT",
      services: (raw.services || []).map((s: ServiceDTO) => {
        const priceNum = s.price !== undefined ? Number(s.price) : 0;
        return {
          id: s.id,
          name: s.name,
          description: s.description || "",
          price: priceNum,
          priceLabel: priceNum > 0 ? `Rp ${priceNum.toLocaleString("id-ID")}` : "Gratis",
          durationMinutes: s.duration !== undefined ? Number(s.duration) : 60,
        };
      }),
    };
  }

  toDTO(domain: Business): BusinessDTO {
    return {
      ...domain,
      services: (domain.services || []).map((s: PublicCatalogItem) => {
        let priceNum = 0;
        if (s.priceLabel) {
          const clean = s.priceLabel.replace(/[^0-9]/g, "");
          priceNum = Number(clean) || 0;
        }

        return {
          id: s.id,
          name: s.name,
          description: s.description || "",
          price: priceNum,
          duration: s.durationMinutes !== undefined ? Number(s.durationMinutes) : 60,
        };
      }),
    };
  }
}

export interface BusinessUpdateInput {
  ownerName?: string;
  name?: string;
  slug?: string;
  whatsappNumber?: string;
  mode?: BusinessMode;
  operationalModel?: OperationalModel;
  paymentTiming?: PaymentTiming;
  usesResources?: boolean;
  resourceLabel?: string;
  resourceCount?: number;
  resources?: BusinessResource[];
  services?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number | string;
    priceLabel?: string;
    duration?: number;
    durationMinutes?: number;
  }>;
  bookingCapacity?: number;
  defaultBookingDurationMinutes?: number;
  niche?: NicheTemplate;
  description?: string;
  address?: string;
  openingHours?: string;
  timezone?: string;
  logoUrl?: string;
  paymentInstructions?: string;
  closedDates?: Record<string, string>;
  autoCreateOrderFromSubmission?: boolean;
  subscriptions?: Record<string, unknown>[];
  // Optimistic concurrency token (business.updatedAt as last read by the client).
  // Backend rejects with 409 if the business was modified since, instead of
  // silently overwriting another admin's concurrent changes.
  expectedUpdatedAt?: string;
}

export interface BusinessService {
  getBusinessById(id: string): Promise<Business | null>;
  getBusinessBySlug(slug: string): Promise<Business | null>;
  updateBusiness(id: string, payload: BusinessUpdateInput): Promise<Business | null>;
  getBusinessUsage(): Promise<BusinessUsage | undefined>;
}

export class ApiBusinessService implements BusinessService {
  private mapper = new BusinessMapper();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getBusinessById(_id: string): Promise<Business | null> {
    try {
      const response = await apiFetch<BusinessDTO>("/api/business");
      return this.mapper.toDomain(response);
    } catch (err) {
      logServiceError("Failed to fetch business by ID", err);
      return null;
    }
  }

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    try {
      const response = await apiFetch<BusinessDTO>(`/api/public/b/${slug}`);
      return this.mapper.toDomain(response);
    } catch (err) {
      logServiceError("Failed to fetch public business profile by slug", err);
      return null;
    }
  }

  async updateBusiness(id: string, payload: BusinessUpdateInput): Promise<Business | null> {
    // Biarkan error propagate ke caller — jangan ditelan di sini
    // Sebelumnya: try-catch + return null membuat UI selalu tampil "sukses" walau request gagal
    const response = await apiFetch<BusinessDTO>("/api/business/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (typeof window !== "undefined") {

    }
    return this.mapper.toDomain(response);
  }

  async getBusinessUsage(): Promise<BusinessUsage | undefined> {
    try {
      const response = await apiFetch<BusinessUsage>("/api/business/usage");
      return response;
    } catch (err) {
      logServiceError("Failed to fetch business usage", err);
      return undefined;
    }
  }
}
