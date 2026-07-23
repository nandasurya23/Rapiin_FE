import { PublicInvoicePage as PublicInvoiceView } from "@/features/invoices/public-invoice-page";
import { apiFetch } from "@/lib/api-client";

export default async function PublicInvoicePage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = await params;

 let initialData = null;
 if (id) {
  try {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const response = await apiFetch<any>(`/api/public/invoice/${id}`);
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
