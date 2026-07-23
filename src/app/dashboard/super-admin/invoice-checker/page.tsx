import { Metadata } from "next";
import { InvoiceCheckerPage } from "@/features/super-admin/invoice-checker-page";

export const metadata: Metadata = {
  title: "Cek Asli Nota | Super Admin",
  description: "Cek keaslian nota untuk investigasi",
};

export default function Page() {
  return <InvoiceCheckerPage role="SUPER_ADMIN" />;
}
