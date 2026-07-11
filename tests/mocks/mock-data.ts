import type { Business } from "@/types/business";
import type { Customer } from "@/types/customer";
import type { Order } from "@/types/order";
import type { Invoice } from "@/types/invoice";

export const mockBusiness: Business = {
  id: "biz_123",
  ownerName: "Nanda Surya",
  name: "Rapiin Cleaners",
  slug: "rapiin-cleaners",
  whatsappNumber: "628123456789",
  mode: "BOOKING_SERVICE",
  operationalModel: "RESOURCE_BOOKING",
  usesResources: true,
  resourceLabel: "Staf",
  resourceCount: 2,
  resources: [
    { id: "res_1", name: "Budi", isActive: true },
    { id: "res_2", name: "Siti", isActive: true },
  ],
  defaultBookingDurationMinutes: 60,
  niche: "LAUNDRY",
  description: "Jasa Laundry Kilat & Terpercaya",
  address: "Jl. Sudirman No. 12",
  openingHours: "08:00 - 20:00",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

export const mockCustomer: Customer = {
  id: "cust_123",
  businessId: "biz_123",
  name: "John Doe",
  whatsappNumber: "628987654321",
  status: "NEW",
  source: "WhatsApp",
  notes: "Pelanggan setia laundry bedcover",
  createdAt: "2026-07-02T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
};

export const mockOrder: Order = {
  id: "ord_123",
  businessId: "biz_123",
  customerId: "cust_123",
  customerName: "John Doe",
  whatsappNumber: "628987654321",
  title: "Cuci Bedcover King",
  mode: "BOOKING_SERVICE",
  status: "WAITING_DP",
  paymentStatus: "UNPAID",
  scheduledDate: "2026-07-15",
  scheduledTime: "10:00",
  bookingDurationMinutes: 60,
  bookingHoldExpiresAt: "2026-07-11T12:00:00.000Z",
  resourceId: "res_1",
  resourceNameSnapshot: "Budi",
  totalAmount: 50000,
  dpAmount: 10000,
  notes: "Harap wangi lavender",
  createdAt: "2026-07-10T00:00:00.000Z",
  updatedAt: "2026-07-10T00:00:00.000Z",
};

export const mockInvoice: Invoice = {
  id: "inv_123",
  businessId: "biz_123",
  orderId: "ord_123",
  invoiceCode: "INV-2026-0001",
  verificationCode: "VERIFY-9988",
  integritySeal: "SEAL-SHA-256",
  customerName: "John Doe",
  totalAmount: 50000,
  paymentStatus: "UNPAID",
  notes: "Tagihan cuci bedcover",
  createdAt: "2026-07-10T00:05:00.000Z",
  updatedAt: "2026-07-10T00:05:00.000Z",
};
