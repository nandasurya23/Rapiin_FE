import { useAppData } from "@/components/providers/app-data-provider";

export function useCustomers() {
  const { customers, createCustomer, updateCustomer, deleteCustomer } = useAppData();

  return {
    customers,
    isLoading: false,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers: async () => {},
  };
}
