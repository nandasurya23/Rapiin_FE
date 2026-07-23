import { Metadata } from "next";
import { InvoiceCheckerPage } from "@/features/super-admin/invoice-checker-page";

export const metadata: Metadata = {
  title: "Cek Asli Nota (Pro) | Rapiin",
  description: "Cek keaslian nota untuk keamanan transaksi",
};

export default function Page() {
  return <InvoiceCheckerPage role="OWNER" />;
}
