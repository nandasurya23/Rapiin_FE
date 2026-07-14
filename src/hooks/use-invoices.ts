import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiInvoiceService } from "@/services/invoice.service";
import { useAppData } from "@/components/providers/app-data-provider";

const invoiceService = new ApiInvoiceService();

export function useInvoices() {
  const queryClient = useQueryClient();
  const { business, canCreateInvoice, readOnlyReason } = useAppData();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", business?.id],
    queryFn: () => invoiceService.getInvoices(business?.id || ""),
    enabled: !!business?.id && business.id !== "biz_default",
  });

  const createInvoiceFromOrderMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes?: string }) => {
      if (!canCreateInvoice) {
        throw new Error(readOnlyReason || "Mode baca saja aktif.");
      }
      return invoiceService.createInvoiceFromOrder(orderId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return {
    invoices,
    isLoading,
    createInvoiceFromOrder: (orderId: string, notes?: string) => createInvoiceFromOrderMutation.mutateAsync({ orderId, notes }),
    refreshInvoices: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  };
}
