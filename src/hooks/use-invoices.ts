import { useState, useEffect, useCallback } from "react";
import { LocalInvoiceService } from "@/services/invoice.service.local";
import type { InvoiceDTO } from "@/services/invoice.service";
import type { Invoice } from "@/types/invoice";
import { useAppData } from "@/components/providers/app-data-provider";

const invoiceService = new LocalInvoiceService();

export function useInvoices() {
  const { business } = useAppData();
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (typeof window === "undefined" || !business?.id) return [];
    try {
      const raw = window.localStorage.getItem("rapiin-app-storage");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return (parsed.invoices || []).filter((i: { businessId: string }) => i.businessId === business.id);
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!business?.id) return;
    try {
      setIsLoading(true);
      const data = await invoiceService.getInvoices(business.id);
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setIsLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchInvoices();

    const handleSync = () => {
      fetchInvoices();
    };

    window.addEventListener("rapiin-storage-sync", handleSync);
    return () => {
      window.removeEventListener("rapiin-storage-sync", handleSync);
    };
  }, [fetchInvoices]);

  const createInvoice = useCallback(
    async (payload: Omit<InvoiceDTO, "id" | "createdAt" | "updatedAt" | "verificationCode" | "integritySeal" | "invoiceCode" | "businessId">) => {
      if (!business?.id) throw new Error("No active business");
      return invoiceService.createInvoice({ ...payload, businessId: business.id });
    },
    [business?.id]
  );

  const createInvoiceFromOrder = useCallback(
    async (orderId: string, notes?: string) => {
      return invoiceService.createInvoiceFromOrder(orderId, notes);
    },
    []
  );

  return {
    invoices,
    isLoading,
    createInvoice,
    createInvoiceFromOrder,
    refreshInvoices: fetchInvoices,
  };
}
