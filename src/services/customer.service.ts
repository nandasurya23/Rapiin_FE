import type { Mapper } from "./mapper";
import type { Customer, CustomerStatus } from "@/types/customer";
import { apiFetch } from "@/lib/api-client";

export interface CustomerDTO {
  id: string;
  businessId: string;
  name: string;
  whatsappNumber: string;
  status: CustomerStatus;
  source?: string;
  notes?: string;
  lastInteractionAt?: string;
  lastOrderSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export class CustomerMapper implements Mapper<CustomerDTO, Customer> {
  toDomain(raw: CustomerDTO): Customer {
    return { ...raw };
  }

  toDTO(domain: Customer): CustomerDTO {
    return { ...domain };
  }
}

export interface CustomerService {
  getCustomers(businessId: string): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(payload: Omit<CustomerDTO, "id" | "createdAt" | "updatedAt">): Promise<Customer>;
  updateCustomer(id: string, payload: Partial<Omit<CustomerDTO, "id" | "createdAt" | "updatedAt">>): Promise<Customer | null>;
  deleteCustomer(id: string): Promise<void>;
}

export class ApiCustomerService implements CustomerService {
  private mapper = new CustomerMapper();

  async getCustomers(businessId: string): Promise<Customer[]> {
    try {
      // Use large limit to load all customers for dashboard/lists
      const response = await apiFetch<CustomerDTO[]>("/api/customers?limit=100");
      return response.map((item) => this.mapper.toDomain(item));
    } catch (err) {
      console.error("Failed to fetch customers", err);
      return [];
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const customers = await this.getCustomers("");
      return customers.find((c) => c.id === id) || null;
    } catch (err) {
      console.error("Failed to fetch customer by ID", err);
      return null;
    }
  }

  async createCustomer(payload: Omit<CustomerDTO, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    try {
      const response = await apiFetch<CustomerDTO>("/api/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rapiin-storage-sync"));
      }
      return this.mapper.toDomain(response);
    } catch (err) {
      console.error("Failed to create customer", err);
      throw err;
    }
  }

  async updateCustomer(id: string, payload: Partial<Omit<CustomerDTO, "id" | "createdAt" | "updatedAt">>): Promise<Customer | null> {
    try {
      const response = await apiFetch<CustomerDTO>(`/api/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rapiin-storage-sync"));
      }
      return this.mapper.toDomain(response);
    } catch (err) {
      console.error("Failed to update customer", err);
      return null;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await apiFetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rapiin-storage-sync"));
      }
    } catch (err) {
      console.error("Failed to delete customer", err);
    }
  }
}
