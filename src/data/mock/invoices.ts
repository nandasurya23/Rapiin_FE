import type { Invoice } from "@/types/invoice";
import { buildInvoiceIntegritySeal, buildInvoiceVerificationCode } from "@/lib/invoice";

function createMockInvoice(
  invoice: Omit<Invoice, "verificationCode" | "integritySeal">
): Invoice {
  const verificationCode = buildInvoiceVerificationCode(invoice);
  const integritySeal = buildInvoiceIntegritySeal({
    ...invoice,
    verificationCode,
  });

  return {
    ...invoice,
    verificationCode,
    integritySeal,
  };
}

export const mockInvoices: Invoice[] = [
  createMockInvoice({
    id: "inv_001",
    businessId: "biz_001",
    orderId: "ord_003",
    invoiceCode: "INV-20260608-001",
    customerName: "Dimas Sound",
    totalAmount: 180000,
    paymentStatus: "PAID",
    notes: "Pembayaran lunas.",
    createdAt: "2026-06-08T16:30:00.000Z",
    updatedAt: "2026-06-08T16:30:00.000Z",
  }),
  createMockInvoice({
    id: "inv_002",
    businessId: "biz_001",
    orderId: "ord_002",
    invoiceCode: "INV-20260609-001",
    customerName: "Mira Nada",
    totalAmount: 420000,
    paymentStatus: "DP_PAID",
    notes: "Menunggu pelunasan setelah selesai.",
    createdAt: "2026-06-09T15:15:00.000Z",
    updatedAt: "2026-06-09T15:15:00.000Z",
  }),
];
