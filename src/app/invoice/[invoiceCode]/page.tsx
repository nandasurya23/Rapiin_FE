import { PublicInvoicePage as PublicInvoiceView } from "@/features/invoices/public-invoice-page";

export default async function PublicInvoicePage({ params }: { params: Promise<{ invoiceCode: string }> }) {
  const { invoiceCode } = await params;

  return <PublicInvoiceView invoiceCode={invoiceCode} />;
}
