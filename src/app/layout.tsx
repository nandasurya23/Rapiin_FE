import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AppDataProvider } from "@/components/providers/app-data-provider";

export const metadata: Metadata = {
  title: "Rapiin",
  description: "Buku admin online untuk UMKM yang jualan lewat WhatsApp.",
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>
          <AppDataProvider>{children}</AppDataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
