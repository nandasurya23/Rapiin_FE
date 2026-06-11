import type { Invoice } from "@/types/invoice";

export const mockInvoices: Invoice[] = [
  {
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
  },
  {
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
  },
];
