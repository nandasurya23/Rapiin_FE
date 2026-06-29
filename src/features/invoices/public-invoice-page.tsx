"use client";

import { Download, ReceiptText, Send, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import * as htmlToImage from "html-to-image";
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
    <main className="page-enter mx-auto min-h-screen max-w-[1380px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <Badge tone={isFallback ? "warning" : "success"}>{isFallback ? "Fallback nota" : "Nota publik"}</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">Nota {invoice.invoiceCode}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Customer bisa lihat ringkasan nota tanpa perlu login.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={ROUTES.publicBusiness(business.slug)}>Lihat Bisnis</LinkButton>
            <Button
              type="button"
              variant="secondary"
              isLoading={loadingAction === "copy-share-message"}
              onClick={async () => {
                setLoadingAction("copy-share-message");
                  try {
                    await copyToClipboard(shareMessage);
                    toast.success("Ringkasan nota disalin");
                  } finally {
                    setLoadingAction(null);
                  }
              }}
            >
              <Send className="h-4 w-4" />
              Salin Ringkasan
            </Button>
          </div>
        </div>

        <Card className="bg-[var(--color-primary-surface)]">
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">{business.name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Nota siap dibaca di HP.</p>
              </div>
              <ReceiptText className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <p className="text-xs text-[var(--color-text-muted)]">Tanggal</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{formatDate(invoice.createdAt)}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <p className="text-xs text-[var(--color-text-muted)]">Status</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{invoice.paymentStatus}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.14fr_0.86fr]">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Detail nota</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Tampilan nota resmi dengan kode verifikasi dan segel integritas.</p>
              </div>
            </div>
            <div id="invoice-sheet-container">
              <InvoiceSheet business={business} invoice={invoice} order={order} />
            </div>

            <div className="flex flex-wrap gap-2">
              <WhatsAppButton
                phoneNumber={order?.whatsappNumber ?? business.whatsappNumber}
                message={shareMessage}
                label="Kirim Nota WA"
              />
              <Button
                type="button"
                variant="secondary"
                isLoading={loadingAction === "copy-invoice-code"}
                onClick={async () => {
                  setLoadingAction("copy-invoice-code");
                  try {
                    await copyToClipboard(invoice.invoiceCode);
                    toast.success("Kode invoice disalin");
                  } finally {
                    setLoadingAction(null);
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Salin Kode
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Download / share gambar</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">Simpan nota sebagai file gambar untuk langsung dikirim via WhatsApp.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                isLoading={loadingAction === "share-image"}
                onClick={handleShareImage}
              >
                <Share2 className="h-4 w-4" />
                Bagikan Gambar Nota
              </Button>
              <Button
                type="button"
                variant="secondary"
                isLoading={loadingAction === "download-image"}
                onClick={handleDownloadImage}
              >
                <Download className="h-4 w-4" />
                Unduh Gambar (.PNG)
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 pt-4 border-t border-[var(--color-border)]">
              <LinkButton href={ROUTES.businessLink}>Link Bisnis</LinkButton>
              <LinkButton href={ROUTES.dashboard} variant="secondary">
                Kembali ke App
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
