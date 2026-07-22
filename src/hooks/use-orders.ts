import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiOrderService, type OrderDTO } from "@/services/order.service";
import { useAppData } from "@/components/providers/app-data-provider";
import { canCreateOrder as canCreateOrderByState, getOrderUsage } from "@/lib/subscription";

const orderService = new ApiOrderService();

export function useOrders() {
  const queryClient = useQueryClient();
  const { business, canAccessWriteMode, readOnlyReason, subscriptions } = useAppData();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", business?.id],
    queryFn: () => orderService.getOrders(business?.id || ""),
    enabled: !!business?.id && business.id !== "biz_default",
  });

  const canCreateOrder = canCreateOrderByState({ business: business!, subscriptions, orders });
  const currentOrderUsage = getOrderUsage({ business: business!, subscriptions, orders });

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
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previousOrders = queryClient.getQueryData<OrderDTO[]>(["orders", business?.id]);
      if (previousOrders) {
        queryClient.setQueryData<OrderDTO[]>(
          ["orders", business?.id],
          previousOrders.map((o) => (o.id === id ? ({ ...o, ...payload } as OrderDTO) : o))
        );
      }
      return { previousOrders };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders", business?.id], context.previousOrders);
      }
    },
    onSettled: () => {
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
    canCreateOrder,
    currentOrderUsage,
    createOrder: (payload: Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "businessId" | "customerId">) => createMutation.mutateAsync(payload),
    updateOrder: (id: string, payload: Partial<Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "businessId">>) => updateMutation.mutateAsync({ id, payload }),
    deleteOrder: (id: string) => deleteMutation.mutateAsync(id),
    refreshOrders: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  };
}
