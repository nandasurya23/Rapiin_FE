import type { Mapper } from "./mapper";
import type { Invoice } from "@/types/invoice";
import type { PaymentStatus } from "@/types/order";

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
