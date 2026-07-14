import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiBusinessService } from "@/services/business.service";
import { useAppData } from "@/components/providers/app-data-provider";
import type { Business } from "@/types/business";

const businessService = new ApiBusinessService();

export function useBusiness() {
  const queryClient = useQueryClient();
  const { business: initialBusiness, canAccessWriteMode, readOnlyReason } = useAppData();

  const { data: queryBusiness, isLoading } = useQuery({
    queryKey: ["business", initialBusiness?.id],
    queryFn: () => businessService.getBusinessById(initialBusiness?.id || ""),
    enabled: !!initialBusiness?.id && initialBusiness.id !== "biz_default",
    initialData: initialBusiness || undefined,
  });

  const business = (queryBusiness || initialBusiness) as Business;

  const updateBusinessMutation = useMutation({
    mutationFn: async (payload: Partial<Business>) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return businessService.updateBusiness(business.id, payload);
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(["business", initialBusiness?.id], data);
      }
    },
  });

  return {
    business,
    isLoading,
    updateBusiness: (payload: Partial<Business>) => updateBusinessMutation.mutateAsync(payload),
    saveBusinessSettings: (payload: Partial<Business>) => updateBusinessMutation.mutateAsync(payload),
    refreshBusiness: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business"] });
    },
  };
}
