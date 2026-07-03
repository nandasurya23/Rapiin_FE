import { useState, useEffect, useCallback } from "react";
import { LocalBusinessService } from "@/services/business.service.local";
import type { BusinessDTO } from "@/services/business.service";
import type { Business } from "@/types/business";
import { useAppData } from "@/components/providers/app-data-provider";

const businessService = new LocalBusinessService();

export function useBusiness() {
  const { business: initialBusiness } = useAppData();
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBusiness = useCallback(async () => {
    if (!initialBusiness?.id) return;
    try {
      setIsLoading(true);
      const data = await businessService.getBusinessById(initialBusiness.id);
      if (data) setBusiness(data);
    } catch (error) {
      console.error("Failed to fetch business", error);
    } finally {
      setIsLoading(false);
    }
  }, [initialBusiness?.id]);

  useEffect(() => {
    fetchBusiness();

    const handleSync = () => {
      fetchBusiness();
    };

    window.addEventListener("rapiin-storage-sync", handleSync);
    return () => {
      window.removeEventListener("rapiin-storage-sync", handleSync);
    };
  }, [fetchBusiness]);

  const updateBusiness = useCallback(
    async (payload: Partial<Omit<BusinessDTO, "id" | "createdAt" | "updatedAt">>) => {
      if (!business?.id) throw new Error("No active business");
      return businessService.updateBusiness(business.id, payload);
    },
    [business?.id]
  );

  return {
    business,
    isLoading,
    updateBusiness,
    saveBusinessSettings: updateBusiness,
    refreshBusiness: fetchBusiness,
  };
}
