import { useAppData } from "@/components/providers/app-data-provider";

export function useInvoices() {
  const { invoices, createInvoiceFromOrder } = useAppData();

  return {
    invoices,
    isLoading: false,
    createInvoiceFromOrder,
    refreshInvoices: async () => {},
  };
}
