import type { Mapper } from "./mapper";
import type { Invoice } from "@/types/invoice";
import type { PaymentStatus } from "@/types/order";
import { apiFetch } from "@/lib/api-client";
import { logServiceError } from "./utils";

export interface InvoiceDTO {
  id: string;
  businessId: string;
  orderId: string;
  invoiceCode: string;
  verificationCode: string;
  integritySeal: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class InvoiceMapper implements Mapper<InvoiceDTO, Invoice> {
  toDomain(raw: InvoiceDTO): Invoice {
    return { ...raw };
  }

  toDTO(domain: Invoice): InvoiceDTO {
    return { ...domain };
  }
}

export interface InvoiceService {
  getInvoices(businessId: string): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  createInvoice(payload: Omit<InvoiceDTO, "id" | "createdAt" | "updatedAt" | "verificationCode" | "integritySeal" | "invoiceCode">): Promise<Invoice>;
  createInvoiceFromOrder(orderId: string, notes?: string): Promise<Invoice | null>;
}

export class ApiInvoiceService implements InvoiceService {
  private mapper = new InvoiceMapper();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getInvoices(_businessId: string): Promise<Invoice[]> {
    try {
      const response = await apiFetch<InvoiceDTO[]>("/api/invoices?limit=100");
      return response.map((item) => this.mapper.toDomain(item));
    } catch (err) {
      logServiceError("Failed to fetch invoices", err);
      return [];
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const response = await apiFetch<InvoiceDTO>(`/api/invoices/${id}`);
      return this.mapper.toDomain(response);
    } catch (err) {
      logServiceError("Failed to fetch invoice by ID", err);
      return null;
    }
  }

  async createInvoice(payload: Omit<InvoiceDTO, "id" | "createdAt" | "updatedAt" | "verificationCode" | "integritySeal" | "invoiceCode">): Promise<Invoice> {
    try {
      const response = await apiFetch<InvoiceDTO>("/api/invoices", {
        method: "POST",
        body: JSON.stringify({ orderId: payload.orderId, notes: payload.notes }),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rapiin-storage-sync"));
      }
      return this.mapper.toDomain(response);
    } catch (err) {
      logServiceError("Failed to create invoice", err);
      throw err;
    }
  }

  async createInvoiceFromOrder(orderId: string, notes?: string): Promise<Invoice | null> {
    try {
      const response = await apiFetch<InvoiceDTO>("/api/invoices", {
        method: "POST",
        body: JSON.stringify({ orderId, notes }),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rapiin-storage-sync"));
      }
      return this.mapper.toDomain(response);
    } catch (err) {
      logServiceError("Failed to create invoice from order", err);
      return null;
    }
  }
}
