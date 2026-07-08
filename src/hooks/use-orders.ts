import { useAppData } from "@/components/providers/app-data-provider";

export function useOrders() {
  const { orders, createOrder, updateOrder, deleteOrder } = useAppData();

  return {
    orders,
    isLoading: false,
    createOrder,
    updateOrder,
    deleteOrder,
    refreshOrders: async () => {},
  };
}
