import { useAppData } from "@/components/providers/app-data-provider";

export function useBusiness() {
  const { business, updateBusiness, saveBusinessSettings } = useAppData();

  return {
    business,
    isLoading: false,
    updateBusiness,
    saveBusinessSettings,
    refreshBusiness: async () => {},
  };
}
