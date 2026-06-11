export * from "./business";
export * from "./customers";
export * from "./invoices";
export * from "./messages";
export * from "./orders";
export * from "./reports";

import { mockBusiness } from "./business";
import { mockCustomers } from "./customers";
import { mockInvoices } from "./invoices";
import { mockMessageTemplates } from "./messages";
import { mockOrders } from "./orders";
import { mockReportSummary } from "./reports";

export const mockData = {
  business: mockBusiness,
  customers: mockCustomers,
  invoices: mockInvoices,
  messageTemplates: mockMessageTemplates,
  orders: mockOrders,
  reportSummary: mockReportSummary,
} as const;
