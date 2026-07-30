import { PublicInvoicePage as PublicInvoiceView } from "@/features/invoices/public-invoice-page";
import { apiFetch } from "@/lib/api-client";
import type { Invoice } from "@/types/invoice";
import type { Order } from "@/types/order";
import type { Business } from "@/types/business";

export default async function PublicInvoicePage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = await params;

 let initialData = null;
 if (id) {
  try {
   const response = await apiFetch<Invoice & { order: Order; business: Business }>(`/api/public/invoice/${id}`);
   if (response) {
    initialData = {
     invoice: response,
     order: response.order,
     business: response.business,
    };
   }
  } catch (err) {
   console.error("Failed to fetch public invoice on server:", err);
  }
 }

 return <PublicInvoiceView id={id} initialData={initialData} />;
}
