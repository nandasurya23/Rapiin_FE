import { readAppStorageState, writeAppStorageState, createInvoiceRecord } from "@/lib/storage-service";
import type { InvoiceService, InvoiceDTO } from "./invoice.service";
import { InvoiceMapper } from "./invoice.service";
import type { Invoice } from "@/types/invoice";

export class LocalInvoiceService implements InvoiceService {
  private mapper = new InvoiceMapper();

  private createInvoiceCode(orderId: string, sequence: number) {
    return `INV-${orderId.toUpperCase()}-${String(sequence).padStart(3, "0")}`;
  }

  async getInvoices(businessId: string): Promise<Invoice[]> {
    const state = readAppStorageState();
    return state.invoices
      .filter((i) => i.businessId === businessId)
      .map((i) => this.mapper.toDomain(this.mapper.toDTO(i)));
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const state = readAppStorageState();
    const invoice = state.invoices.find((i) => i.id === id);
    return invoice ? this.mapper.toDomain(this.mapper.toDTO(invoice)) : null;
  }

  async createInvoice(payload: Omit<InvoiceDTO, "id" | "createdAt" | "updatedAt" | "verificationCode" | "integritySeal" | "invoiceCode">): Promise<Invoice> {
    const state = readAppStorageState();
    
    const newInvoice = createInvoiceRecord({
      businessId: payload.businessId,
      orderId: payload.orderId,
      customerName: payload.customerName,
      totalAmount: payload.totalAmount,
      paymentStatus: payload.paymentStatus,
      notes: payload.notes,
      invoiceCode: this.createInvoiceCode(payload.orderId, state.invoices.length + 1),
    });

    state.invoices = [newInvoice, ...state.invoices];
    writeAppStorageState(state);
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return this.mapper.toDomain(this.mapper.toDTO(newInvoice));
  }

  async createInvoiceFromOrder(orderId: string, notes?: string): Promise<Invoice | null> {
    const state = readAppStorageState();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return null;

    const existingInvoice = state.invoices.find((invoice) => invoice.orderId === order.id);
    if (existingInvoice) return this.mapper.toDomain(this.mapper.toDTO(existingInvoice));

    const nextInvoice = createInvoiceRecord({
      businessId: state.business.id,
      orderId: order.id,
      invoiceCode: this.createInvoiceCode(order.id, state.invoices.length + 1),
      customerName: order.customerName,
      totalAmount: order.totalAmount ?? 0,
      paymentStatus: order.paymentStatus,
      notes: notes?.trim() || "Nota dibuat dari order.",
    });

    state.invoices = [nextInvoice, ...state.invoices];
    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return this.mapper.toDomain(this.mapper.toDTO(nextInvoice));
  }
}
