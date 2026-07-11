import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiCustomerService, type CustomerDTO } from "@/services/customer.service";
import { useAppData } from "@/components/providers/app-data-provider";

const customerService = new ApiCustomerService();

export function useCustomers() {
  const queryClient = useQueryClient();
  const { business, canAccessWriteMode, readOnlyReason, canCreateCustomer, currentBusinessUsage } = useAppData();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", business?.id],
    queryFn: () => customerService.getCustomers(business?.id || ""),
    enabled: !!business?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<CustomerDTO, "id" | "createdAt" | "updatedAt" | "businessId">) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      if (!canCreateCustomer) {
        throw new Error(`Batas customer plan ini sudah penuh (${currentBusinessUsage.used}/${currentBusinessUsage.limit}).`);
      }
      return customerService.createCustomer({
        ...payload,
        businessId: business.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Omit<CustomerDTO, "id" | "createdAt" | "updatedAt" | "businessId">> }) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return customerService.updateCustomer(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return customerService.deleteCustomer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  return {
    customers,
    isLoading,
    createCustomer: (payload: Omit<CustomerDTO, "id" | "createdAt" | "updatedAt" | "businessId">) => createMutation.mutateAsync(payload),
    updateCustomer: (id: string, payload: Partial<Omit<CustomerDTO, "id" | "createdAt" | "updatedAt" | "businessId">>) => updateMutation.mutateAsync({ id, payload }),
    deleteCustomer: (id: string) => deleteMutation.mutateAsync(id),
    refreshCustomers: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  };
}
