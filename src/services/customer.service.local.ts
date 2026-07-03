import { readAppStorageState, writeAppStorageState, createCustomerRecord } from "@/lib/storage-service";
import type { CustomerService, CustomerDTO } from "./customer.service";
import { CustomerMapper } from "./customer.service";

export class LocalCustomerService implements CustomerService {
  private mapper = new CustomerMapper();

  async getCustomers(businessId: string): Promise<CustomerDTO[]> {
    const state = readAppStorageState();
    return state.customers
      .filter((c) => c.businessId === businessId)
      .map((c) => this.mapper.toDTO(c));
  }

  async getCustomerById(id: string): Promise<CustomerDTO | null> {
    const state = readAppStorageState();
    const customer = state.customers.find((c) => c.id === id);
    return customer ? this.mapper.toDTO(customer) : null;
  }

  async createCustomer(payload: Omit<CustomerDTO, "id" | "createdAt" | "updatedAt">): Promise<CustomerDTO> {
    const state = readAppStorageState();
    
    const newCustomer = createCustomerRecord({
      businessId: payload.businessId,
      name: payload.name,
      whatsappNumber: payload.whatsappNumber,
      status: payload.status,
      source: payload.source,
      notes: payload.notes,
      lastInteractionAt: payload.lastInteractionAt,
      lastOrderSummary: payload.lastOrderSummary,
    });

    state.customers = [newCustomer, ...state.customers];
    writeAppStorageState(state);
    
    // Dispatch event so AppDataProvider can sync if needed
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return this.mapper.toDTO(newCustomer);
  }

  async updateCustomer(id: string, payload: Partial<Omit<CustomerDTO, "id" | "createdAt" | "updatedAt">>): Promise<CustomerDTO | null> {
    const state = readAppStorageState();
    
    const index = state.customers.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = state.customers[index];
    const updated = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    state.customers[index] = updated;
    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return this.mapper.toDTO(updated);
  }

  async deleteCustomer(id: string): Promise<void> {
    const state = readAppStorageState();
    state.customers = state.customers.filter((c) => c.id !== id);
    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }
  }
}

