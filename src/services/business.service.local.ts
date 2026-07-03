import { readAppStorageState, writeAppStorageState } from "@/lib/storage-service";
import type { BusinessService, BusinessDTO } from "./business.service";
import { BusinessMapper } from "./business.service";
import type { Business } from "@/types/business";

export class LocalBusinessService implements BusinessService {
  private mapper = new BusinessMapper();

  async getBusinessById(id: string): Promise<Business | null> {
    const state = readAppStorageState();
    if (state.business.id !== id) return null;
    return this.mapper.toDomain(this.mapper.toDTO(state.business));
  }

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    const state = readAppStorageState();
    if (state.business.slug !== slug) return null;
    return this.mapper.toDomain(this.mapper.toDTO(state.business));
  }

  async updateBusiness(id: string, payload: Partial<Omit<BusinessDTO, "id" | "createdAt" | "updatedAt">>): Promise<Business | null> {
    const state = readAppStorageState();
    if (state.business.id !== id) return null;

    const updated = {
      ...state.business,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    state.business = updated;
    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return this.mapper.toDomain(this.mapper.toDTO(updated));
  }
}
