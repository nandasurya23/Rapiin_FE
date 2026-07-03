import { useState, useEffect, useCallback } from "react";
import { LocalOrderService } from "@/services/order.service.local";
import type { OrderDTO } from "@/services/order.service";
import type { Order } from "@/types/order";
import { useAppData } from "@/components/providers/app-data-provider";

const orderService = new LocalOrderService();

export function useOrders() {
  const { business } = useAppData();
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window === "undefined" || !business?.id) return [];
    try {
      const raw = window.localStorage.getItem("rapiin-app-storage");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return (parsed.orders || []).filter((o: { businessId: string }) => o.businessId === business.id);
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!business?.id) return;
    try {
      setIsLoading(true);
      const data = await orderService.getOrders(business.id);
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setIsLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchOrders();

    const handleSync = () => {
      fetchOrders();
    };

    window.addEventListener("rapiin-storage-sync", handleSync);
    return () => {
      window.removeEventListener("rapiin-storage-sync", handleSync);
    };
  }, [fetchOrders]);

  const createOrder = useCallback(
    async (payload: Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "businessId" | "customerId">) => {
      if (!business?.id) throw new Error("No active business");
      return orderService.createOrder({ ...payload, businessId: business.id });
    },
    [business?.id]
  );

  const updateOrder = useCallback(
    async (id: string, payload: Partial<Omit<OrderDTO, "id" | "createdAt" | "updatedAt">>) => {
      return orderService.updateOrder(id, payload);
    },
    []
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      return orderService.deleteOrder(id);
    },
    []
  );

  return {
    orders,
    isLoading,
    createOrder,
    updateOrder,
    deleteOrder,
    refreshOrders: fetchOrders,
  };
}
