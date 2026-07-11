import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiOrderService, type OrderDTO } from "@/services/order.service";
import { useAppData } from "@/components/providers/app-data-provider";

const orderService = new ApiOrderService();

export function useOrders() {
  const queryClient = useQueryClient();
  const { business, canAccessWriteMode, readOnlyReason, canCreateOrder } = useAppData();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", business?.id],
    queryFn: () => orderService.getOrders(business?.id || ""),
    enabled: !!business?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "businessId" | "customerId">) => {
      if (!canCreateOrder) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return orderService.createOrder({
        ...payload,
        businessId: business.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "businessId">> }) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return orderService.updateOrder(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return orderService.deleteOrder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return {
    orders,
    isLoading,
    createOrder: (payload: Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "businessId" | "customerId">) => createMutation.mutateAsync(payload),
    updateOrder: (id: string, payload: Partial<Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "businessId">>) => updateMutation.mutateAsync({ id, payload }),
    deleteOrder: (id: string) => deleteMutation.mutateAsync(id),
    refreshOrders: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  };
}
