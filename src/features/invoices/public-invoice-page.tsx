"use client";

import { Download, ReceiptText, Send, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import * as htmlToImage from "html-to-image";
import Image from "next/image";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { getEntityById } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";
import { InvoiceSheet } from "@/features/invoices/invoice-sheet";

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function PublicInvoicePage({ invoiceCode }: { invoiceCode: string }) {
  const toast = useToast();
  const { business, invoices, orders } = useAppData();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const invoice = useMemo(
    () => invoices.find((item) => item.invoiceCode === invoiceCode) ?? invoices[0],
    [invoiceCode, invoices]
  );
  const order = invoice ? getEntityById(orders, invoice.orderId) : undefined;
  
  const [invoiceLink, setInvoiceLink] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined" && invoice) {
      setInvoiceLink(`${window.location.origin}/invoice/${invoice.invoiceCode}`);
    }
  }, [invoice]);

  if (!invoice) {
    return null;
  }
  const isFallback = invoice.invoiceCode !== invoiceCode;

  const shareMessage = `Halo ${invoice.customerName}, ini nota untuk ${invoice.invoiceCode}. Totalnya ${formatCurrency(invoice.totalAmount)}.\n\nLihat nota lengkap di:\n${invoiceLink}`;

  async function handleShareImage() {
    const node = document.getElementById("invoice-sheet-container");
    if (!node) {
      toast.error("Gagal mendeteksi elemen nota");
      return;
    }

    setLoadingAction("share-image");
    try {
      const dataUrl = await htmlToImage.toPng(node, {
        backgroundColor: "#ffffff",
        style: {
          borderRadius: "0",
        }
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `invoice-${invoice.invoiceCode}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Nota ${invoice.invoiceCode}`,
          text: `Halo, berikut nota pembayaran Anda untuk ${invoice.invoiceCode}.`,
        });
        toast.success("Nota berhasil dibagikan");
      } else {
        const link = document.createElement("a");
        link.download = `invoice-${invoice.invoiceCode}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Gambar nota diunduh (Web Share tidak didukung di browser ini)");
      }
    } catch (err) {
      toast.error("Gagal mengekspor gambar nota", err instanceof Error ? err.message : "");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDownloadImage() {
    const node = document.getElementById("invoice-sheet-container");
    if (!node) {
      toast.error("Gagal mendeteksi elemen nota");
      return;
    }

    setLoadingAction("download-image");
    try {
      const dataUrl = await htmlToImage.toPng(node, {
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `invoice-${invoice.invoiceCode}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Gambar nota berhasil diunduh");
    } catch (err) {
      toast.error("Gagal mengunduh gambar nota", err instanceof Error ? err.message : "");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <main className="page-enter mx-auto min-h-screen max-w-lg px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6">
        {/* Header Info */}
        <div className="text-center">
          <Badge tone={isFallback ? "warning" : "success"} className="mb-3">
            {isFallback ? "Fallback nota" : "Nota Resmi Publik"}
          </Badge>
          <p className="text-sm text-[var(--color-text-secondary)]">Nota ini sah dan otomatis diterbitkan oleh sistem.</p>
        </div>

        {/* Invoice Sheet */}
        <div id="invoice-sheet-container" className="mx-auto w-full max-w-[400px]">
          <InvoiceSheet business={business} invoice={invoice} order={order} />
        </div>

        {/* Action Buttons */}
        <div className="grid gap-3 pt-6 border-t border-[var(--color-border)]">
          <WhatsAppButton
            phoneNumber={order?.whatsappNumber ?? business.whatsappNumber}
            message={shareMessage}
            label="Kirim ke WhatsApp"
          />
          <Button
            type="button"
            isLoading={loadingAction === "share-image"}
            onClick={handleShareImage}
          >
            <Share2 className="h-4 w-4" />
            Bagikan Gambar Nota
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              isLoading={loadingAction === "download-image"}
              onClick={handleDownloadImage}
            >
              <Download className="h-4 w-4" />
              Unduh (.PNG)
            </Button>
            <Button
              type="button"
              variant="secondary"
              isLoading={loadingAction === "copy-share-message"}
              onClick={async () => {
                setLoadingAction("copy-share-message");
                try {
                  await copyToClipboard(shareMessage);
                  toast.success("Teks nota disalin");
                } finally {
                  setLoadingAction(null);
                }
              }}
            >
              <Send className="h-4 w-4" />
              Salin Teks
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4 mt-2">
            <LinkButton href={ROUTES.publicBusiness(business.slug)} variant="secondary" className="text-xs py-1.5 px-3 h-auto">
              Profil Bisnis
            </LinkButton>
            <span className="text-[var(--color-border)]">|</span>
            <LinkButton href={ROUTES.dashboard} variant="secondary" className="text-xs py-1.5 px-3 h-auto">
              Buat Nota Sendiri
            </LinkButton>
          </div>
        </div>
      </div>

      {/* Powered By Rapiin Footer */}
      <div className="mt-8 flex justify-center pb-8">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-widest">Powered by</span>
          <Image src="/images/rapiin.png" alt="Rapiin" width={80} height={24} className="h-5 w-auto object-contain grayscale hover:grayscale-0 transition-all" />
        </a>
      </div>
    </main>
  );
}
