import type { Mapper } from "./mapper";
import type { Customer, CustomerStatus } from "@/types/customer";

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
