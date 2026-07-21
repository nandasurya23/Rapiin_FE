import { PublicInvoicePage as PublicInvoiceView } from "@/features/invoices/public-invoice-page";
import { apiFetch } from "@/lib/api-client";

export default async function PublicInvoicePage({
 params,
 searchParams,
}: {
 params: Promise<{ invoiceCode: string }>;
 searchParams: Promise<{ seal?: string }>;
}) {
 const { invoiceCode } = await params;
 const { seal } = await searchParams;

 let initialData = null;
 if (invoiceCode && seal) {
  try {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const response = await apiFetch<any>(`/api/public/invoice/${invoiceCode}?seal=${seal}`);
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

 return <PublicInvoiceView invoiceCode={invoiceCode} initialData={initialData} />;
}
