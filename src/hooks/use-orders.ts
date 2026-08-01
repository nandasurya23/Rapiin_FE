import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiOrderService, type OrderDTO } from "@/services/order.service";
import { useAppData } from "@/components/providers/app-data-provider";
import { canCreateOrder as canCreateOrderByState, getOrderUsage } from "@/lib/subscription";

const orderService = new ApiOrderService();

export function useOrders(options?: {
  enablePolling?: boolean;
  intervalMs?: number;
  // Scope the fetch to a booking/appointment date range instead of the default
  // "most recently created" page — use this for calendar/dashboard/timeline views.
  scheduledFrom?: string;
  scheduledTo?: string;
  limit?: number;
}) {
  const queryClient = useQueryClient();
  const { business, canAccessWriteMode, readOnlyReason, subscriptions } = useAppData();

  // Preserve the exact ["orders", businessId] key for default (unscoped) usage so
  // existing optimistic-update targeting below keeps working unchanged. Only append
  // extra key segments when a date-scoped fetch is actually requested.
  const isScoped = !!(options?.scheduledFrom || options?.scheduledTo || options?.limit);
  const ordersQueryKey = isScoped
    ? (["orders", business?.id, options?.scheduledFrom, options?.scheduledTo, options?.limit] as const)
    : (["orders", business?.id] as const);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: () =>
      orderService.getOrders(business?.id || "", {
        scheduledFrom: options?.scheduledFrom,
        scheduledTo: options?.scheduledTo,
        limit: options?.limit,
      }),
    enabled: !!business?.id && business.id !== "biz_default",
    refetchInterval: options?.enablePolling ? (options.intervalMs ?? 30000) : false,
    refetchOnWindowFocus: options?.enablePolling ? true : undefined,
  });

  const { businessUsage } = useAppData();
  const canCreateOrder = canCreateOrderByState({ businessUsage, business: business!, subscriptions, orders });
  const currentOrderUsage = getOrderUsage({ businessUsage, business: business!, subscriptions, orders });

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
      queryClient.invalidateQueries({ queryKey: ["customers"] });
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
      const previousOrders = queryClient.getQueryData<OrderDTO[]>(ordersQueryKey);
      if (previousOrders) {
        queryClient.setQueryData<OrderDTO[]>(
          ordersQueryKey,
          previousOrders.map((o) => (o.id === id ? ({ ...o, ...payload } as OrderDTO) : o))
        );
      }
      return { previousOrders };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(ordersQueryKey, context.previousOrders);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canAccessWriteMode) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return orderService.deleteOrder(id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previousOrders = queryClient.getQueryData<OrderDTO[]>(ordersQueryKey);
      if (previousOrders) {
        queryClient.setQueryData<OrderDTO[]>(
          ordersQueryKey,
          previousOrders.filter((o) => o.id !== id)
        );
      }
      return { previousOrders };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(ordersQueryKey, context.previousOrders);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
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
