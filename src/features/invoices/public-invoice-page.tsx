"use client";

import { Download, Send, ReceiptText, CircleDollarSign } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { getEntityById } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";

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
  if (!invoice) {
    return null;
  }
  const isFallback = invoice.invoiceCode !== invoiceCode;

  const shareMessage = `Halo ${invoice.customerName}, ini nota untuk ${invoice.invoiceCode}. Totalnya ${formatCurrency(invoice.totalAmount)}.`;

  return (
    <main className="page-enter mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 rounded-2xl border border-border/80 bg-surface p-5 shadow-soft lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          <Badge tone={isFallback ? "warning" : "success"}>{isFallback ? "Fallback nota" : "Nota publik"}</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Nota {invoice.invoiceCode}</h1>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
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

        <Card className="bg-brand-50">
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-brand-800">{business.name}</p>
                <p className="text-sm text-text-secondary">Nota siap dibaca di HP.</p>
              </div>
              <ReceiptText className="h-5 w-5 text-brand-700" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                <p className="text-xs text-text-muted">Tanggal</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{formatDate(invoice.createdAt)}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                <p className="text-xs text-text-muted">Status</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{invoice.paymentStatus}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Detail nota</h2>
                <p className="text-sm text-text-secondary">Ringkasan invoice sederhana yang gampang dibaca.</p>
              </div>
              <PaymentStatusBadge status={invoice.paymentStatus} />
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{business.name}</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">{invoice.invoiceCode}</p>
                  <p className="mt-1 text-sm text-text-secondary">Dibuat: {formatDateTime(invoice.createdAt)}</p>
                </div>
                <Badge tone="info">{formatCurrency(invoice.totalAmount)}</Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoBox label="Customer" value={invoice.customerName} />
                <InfoBox label="Order" value={order?.title ?? "-"} />
                <InfoBox label="Jadwal" value={order?.scheduledDate ? `${formatDate(order.scheduledDate)} ${order.scheduledTime ?? ""}` : "-"} />
                <InfoBox label="Pembayaran" value={invoice.paymentStatus} />
              </div>

                <div className="mt-5 rounded-xl border border-border/70 bg-surface px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-text-primary">Rincian item</p>
                  <CircleDollarSign className="h-4 w-4 text-brand-700" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-text-primary">{order?.title ?? "Nota layanan"}</p>
                    <p className="mt-1 text-text-secondary">Item utama dari order yang dipilih.</p>
                  </div>
                  <p className="font-medium text-text-primary">{formatCurrency(invoice.totalAmount)}</p>
                </div>
                <div className="mt-4 border-t border-border pt-4 text-sm text-text-secondary">
                  <p>Catatan: {invoice.notes ?? "-"}</p>
                </div>
              </div>
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
              <h2 className="text-lg font-semibold text-text-primary">Download / print</h2>
              <p className="text-sm text-text-secondary">Masih placeholder kalau export PDF belum siap.</p>
            </div>
            <div className="rounded-2xl border border-dashed border-border/80 p-5 text-sm text-text-secondary">
              <div className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 text-brand-700" />
                <p>
                  Area ini bisa nanti diganti dengan PDF, print stylesheet, atau export gambar tanpa mengubah alur utama.
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface px-4 py-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 font-medium text-text-primary">{value}</p>
    </div>
  );
}
