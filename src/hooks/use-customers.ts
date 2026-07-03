import { useState, useEffect, useCallback } from "react";
import { LocalCustomerService } from "@/services/customer.service.local";
import type { CustomerDTO } from "@/services/customer.service";
import { useAppData } from "@/components/providers/app-data-provider";

const customerService = new LocalCustomerService();

export function useCustomers() {
  const { business } = useAppData();
  const [customers, setCustomers] = useState<CustomerDTO[]>(() => {
    if (typeof window === "undefined" || !business?.id) return [];
    try {
      const raw = window.localStorage.getItem("rapiin-app-storage");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return (parsed.customers || []).filter((c: { businessId: string }) => c.businessId === business.id);
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!business?.id) return;
    try {
      setIsLoading(true);
      const data = await customerService.getCustomers(business.id);
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setIsLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchCustomers();

    const handleSync = () => {
      fetchCustomers();
    };

    window.addEventListener("rapiin-storage-sync", handleSync);
    return () => {
      window.removeEventListener("rapiin-storage-sync", handleSync);
    };
  }, [fetchCustomers]);

  const createCustomer = useCallback(
    async (payload: Omit<CustomerDTO, "id" | "createdAt" | "updatedAt" | "businessId">) => {
      if (!business?.id) throw new Error("No active business");
      return customerService.createCustomer({ ...payload, businessId: business.id });
    },
    [business?.id]
  );

  const updateCustomer = useCallback(
    async (id: string, payload: Partial<Omit<CustomerDTO, "id" | "createdAt" | "updatedAt">>) => {
      return customerService.updateCustomer(id, payload);
    },
    []
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      return customerService.deleteCustomer(id);
    },
    []
  );

  return {
    customers,
    isLoading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers: fetchCustomers,
  };
}
