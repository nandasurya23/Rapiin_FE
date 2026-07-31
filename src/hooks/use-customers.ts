import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiCustomerService, type CustomerDTO } from "@/services/customer.service";
import { useAppData } from "@/components/providers/app-data-provider";
import { canCreateCustomer as canCreateCustomerByState, getCustomerUsage } from "@/lib/subscription";

const customerService = new ApiCustomerService();

export function useCustomers(options?: { enablePolling?: boolean; intervalMs?: number }) {
  const queryClient = useQueryClient();
  const { business, canAccessWriteMode, readOnlyReason, subscriptions } = useAppData();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", business?.id],
    queryFn: () => customerService.getCustomers(business?.id || ""),
    enabled: !!business?.id && business.id !== "biz_default",
    refetchInterval: options?.enablePolling ? (options.intervalMs ?? 30000) : false,
    refetchOnWindowFocus: options?.enablePolling ? true : undefined,
  });

  const { businessUsage } = useAppData();
  const canCreateCustomer = canCreateCustomerByState({ businessUsage, business: business!, subscriptions, customers });
  const currentBusinessUsage = getCustomerUsage({ businessUsage, business: business!, subscriptions, customers });

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
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });
      const previousCustomers = queryClient.getQueryData<CustomerDTO[]>(["customers", business?.id]);
      if (previousCustomers) {
        queryClient.setQueryData<CustomerDTO[]>(
          ["customers", business?.id],
          previousCustomers.map((c) => (c.id === id ? ({ ...c, ...payload } as CustomerDTO) : c))
        );
      }
      return { previousCustomers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(["customers", business?.id], context.previousCustomers);
      }
    },
    onSettled: () => {
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
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });
      const previousCustomers = queryClient.getQueryData<CustomerDTO[]>(["customers", business?.id]);
      if (previousCustomers) {
        queryClient.setQueryData<CustomerDTO[]>(
          ["customers", business?.id],
          previousCustomers.filter((c) => c.id !== id)
        );
      }
      return { previousCustomers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(["customers", business?.id], context.previousCustomers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  return {
    customers,
    isLoading,
    canCreateCustomer,
    currentBusinessUsage,
    createCustomer: (payload: Omit<CustomerDTO, "id" | "createdAt" | "updatedAt" | "businessId">) => createMutation.mutateAsync(payload),
    updateCustomer: (id: string, payload: Partial<Omit<CustomerDTO, "id" | "createdAt" | "updatedAt" | "businessId">>) => updateMutation.mutateAsync({ id, payload }),
    deleteCustomer: (id: string) => deleteMutation.mutateAsync(id),
    refreshCustomers: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  };
}
