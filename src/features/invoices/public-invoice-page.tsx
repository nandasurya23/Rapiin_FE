"use client";

import { Download, Send, Share2, CheckCircle2, Clock, MapPin, Package, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import * as htmlToImage from "html-to-image";
import Image from "next/image";
import { Button, LinkButton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { getEntityById } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";
import { useInvoices } from "@/hooks/use-invoices";
import { InvoiceSheet } from "@/features/invoices/invoice-sheet";

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function PublicInvoicePage({ invoiceCode }: { invoiceCode: string }) {
  const toast = useToast();
  const { business, orders } = useAppData();
  const { invoices } = useInvoices();
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

  // --- LIVE TRACKER LOGIC ---
  const [queueAhead, setQueueAhead] = useState(0);

  useEffect(() => {
    if (!order) return;
    
    function calculateQueue() {
      if (!order) return;
      // Hitung order aktif (PROSES, MENUNGGU, WAITING_DP) yang masuk sebelum order ini
      const activeStatuses = ["MENUNGGU", "WAITING_DP", "PROSES"];
      const ahead = orders.filter((o) => 
        activeStatuses.includes(o.status) && 
        new Date(o.createdAt).getTime() < new Date(order.createdAt).getTime()
      );
      setQueueAhead(ahead.length);
    }

    calculateQueue();
    // Auto refresh setiap 30 detik (polling lokal)
    const interval = setInterval(calculateQueue, 30000); 
    return () => clearInterval(interval);
  }, [order, orders]);
  // ---------------------------

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
          {invoice.integritySeal && (
            <div className="flex items-center justify-center gap-1.5 mt-1 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                Dilindungi Integrity Seal
              </span>
            </div>
          )}
          <p className="text-sm text-[var(--color-text-secondary)]">Nota ini sah dan otomatis diterbitkan oleh sistem.</p>
        </div>

        {/* Live Order Tracker */}
        {order && order.status !== "BATAL" && (() => {
          const getTrackerState = () => {
            if (order.status === "SELESAI") return { step: 4, title: "Selesai" };
            if (order.status === "WAITING_DP" || order.status === "CONFIRMED") return { step: 1, title: "Menunggu" };
            if (order.status === "DIPROSES") {
              if (queueAhead > 0) return { step: 2, title: "Dalam Antrean" };
              return { step: 3, title: "Sedang Diproses" };
            }
            return { step: 1, title: "Dikonfirmasi" };
          };
          const trackerState = getTrackerState();

          return (
            <div className="mx-auto w-full max-w-[400px]">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-md relative overflow-hidden">
                {/* Glow background */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] via-indigo-500 to-[var(--color-accent)] opacity-80" />
                
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-base font-black tracking-tight text-[var(--color-text)]">Live Tracker</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {trackerState.step < 4 && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
                        {trackerState.step < 4 ? "Live Update Aktif" : "Pesanan Selesai"}
                      </span>
                    </div>
                  </div>
                  {trackerState.step === 2 && queueAhead > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-[var(--color-primary)] leading-none">{queueAhead}</span>
                      <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">
                        {business.mode === "BOOKING_SERVICE" ? "Orang Antre" : "Antrean"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Steps */}
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-[calc(100%-32px)] before:w-0.5 before:bg-gradient-to-b before:from-[var(--color-border)] before:to-transparent">
                  
                  {/* Step 1 */}
                  <div className="relative flex items-start gap-4 mb-6">
                    <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2", trackerState.step >= 1 ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] shadow-sm" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]")}>
                      {trackerState.step > 1 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className={cn("h-4 w-4", trackerState.step === 1 && "animate-pulse text-[var(--color-primary)]")} />}
                    </div>
                    <div className="pt-1.5">
                      <p className={cn("text-sm font-bold", trackerState.step >= 1 ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]")}>Pesanan Diterima</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] font-medium mt-0.5">Menunggu konfirmasi atau pembayaran DP.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-4 mb-6">
                    <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2", trackerState.step >= 2 ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] shadow-sm" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]")}>
                      {trackerState.step > 2 ? <CheckCircle2 className="h-4 w-4" /> : <MapPin className={cn("h-4 w-4", trackerState.step === 2 && "animate-bounce text-[var(--color-primary)]")} />}
                    </div>
                    <div className="pt-1.5">
                      <p className={cn("text-sm font-bold", trackerState.step >= 2 ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]")}>Dalam Antrean</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] font-medium mt-0.5">Pesanan sudah masuk daftar tunggu kami.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start gap-4 mb-6">
                    <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2", trackerState.step >= 3 ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] shadow-sm" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]")}>
                      {trackerState.step > 3 ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className={cn("h-4 w-4", trackerState.step === 3 && "animate-spin text-[var(--color-primary)]")} />}
                    </div>
                    <div className="pt-1.5">
                      <p className={cn("text-sm font-bold", trackerState.step >= 3 ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]")}>Sedang Diproses</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] font-medium mt-0.5">Layanan atau produk Anda sedang dikerjakan.</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex items-start gap-4">
                    <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2", trackerState.step >= 4 ? "border-[var(--color-success)] bg-[var(--color-success-surface)] text-[var(--color-success)] shadow-sm" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]")}>
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="pt-1.5">
                      <p className={cn("text-sm font-bold", trackerState.step >= 4 ? "text-[var(--color-success-text)]" : "text-[var(--color-text-muted)]")}>Selesai & Siap</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] font-medium mt-0.5">Terima kasih telah menggunakan layanan kami!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
