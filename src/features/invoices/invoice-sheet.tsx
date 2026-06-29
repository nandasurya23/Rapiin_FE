import Image from "next/image";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { INVOICE_AUTH_COPY, INVOICE_LEGAL_COPY, isInvoiceIntegrityValid } from "@/lib/invoice";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Business } from "@/types/business";
import type { Invoice } from "@/types/invoice";
import type { Order } from "@/types/order";
import { useToast } from "@/components/ui/toast-provider";

type InvoiceSheetProps = {
  business: Business;
  invoice: Invoice;
  order?: Order;
  compact?: boolean;
};
export function InvoiceSheet({ business, invoice, order, compact = false }: InvoiceSheetProps) {
  const toast = useToast();
  const isValid = isInvoiceIntegrityValid(invoice);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-40 bg-[radial-gradient(circle_at_top,_rgba(20,83,45,0.08),_transparent_70%)] sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,_rgba(247,248,245,0.95),_rgba(255,255,255,0))]" />

      <div className="relative border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {business.logoUrl && (
              <Image
                src={business.logoUrl}
                alt={business.name}
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-xl object-contain border border-[var(--color-border)] bg-white p-1"
                unoptimized
              />
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Nota Resmi</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{business.name}</h3>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Dokumen pembayaran sederhana untuk kebutuhan operasional harian UMKM.
              </p>
            </div>
          </div>
          <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 sm:min-w-[240px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Nomor Nota</span>
              <Badge tone="neutral">{invoice.invoiceCode}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-secondary)]">Tanggal dibuat</span>
              <span className="text-sm font-medium text-[var(--color-text)]">{formatDate(invoice.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-secondary)]">Status bayar</span>
              <PaymentStatusBadge status={invoice.paymentStatus} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-5 py-5 sm:px-7 sm:py-6">
        <div className="grid gap-4 xl:grid-cols-[1.22fr_0.78fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InvoiceField label="Customer" value={invoice.customerName} />
              <InvoiceField label="Order" value={order?.title ?? "Nota layanan / order"} />
              <InvoiceField
                label="Jadwal"
                value={order?.scheduledDate ? `${formatDate(order.scheduledDate)}${order.scheduledTime ? `, ${order.scheduledTime}` : ""}` : "-"}
              />
              <InvoiceField label="Dibuat pada" value={formatDateTime(invoice.createdAt)} />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Rincian pembayaran</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Ringkasan item utama dari order yang sudah dicatat admin.</p>
                </div>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">1 item</span>
              </div>

              <div className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text)]">{order?.title ?? "Layanan / order"}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {invoice.notes ?? "Tagihan ini dibuat dari order aktif yang sudah tercatat di Rapiin."}
                  </p>
                </div>
                <p className="shrink-0 text-base font-semibold text-[var(--color-text)]">{formatCurrency(invoice.totalAmount)}</p>
              </div>

              <div className="border-t border-[var(--color-border)] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[var(--color-text-secondary)]">Total tagihan</span>
                  <span className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {invoice.paymentStatus !== "PAID" && business.paymentInstructions && (
              <div className="rounded-2xl border border-[var(--color-info-border)] bg-[var(--color-primary-surface)]/40 p-4">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--color-info-border)] pb-2 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
                    Instruksi Transfer
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && business.paymentInstructions) {
                        void navigator.clipboard.writeText(business.paymentInstructions);
                        toast.success("Info rekening disalin!");
                      }
                    }}
                    className="text-xs font-bold text-[var(--color-primary)] underline hover:text-[var(--color-primary)] active:text-[var(--color-primary-hover)]"
                  >
                    Salin Rekening
                  </button>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {business.paymentInstructions}
                </p>
              </div>
            )}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Verifikasi dokumen</p>
              <div className="mt-3 flex items-start gap-3">
                {isValid ? (
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--color-success)]" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-[var(--color-danger)]" />
                )}
                <div>
                  <p className={`font-medium ${isValid ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]"}`}>
                    {isValid ? "Segel nota valid" : "Segel nota tidak valid"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {isValid
                      ? "Data inti nota cocok dengan segel integritas yang tersimpan."
                      : "Ada data inti nota yang berubah setelah dokumen dibuat. Periksa ulang sebelum dibagikan."}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--color-text-secondary)]">Kode verifikasi</span>
                  <span className="font-semibold tracking-[0.18em] text-[var(--color-text)]">{invoice.verificationCode}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--color-text-secondary)]">Segel integritas</span>
                  <span className="font-semibold tracking-[0.12em] text-[var(--color-text)]">{invoice.integritySeal}</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] px-4 py-4 text-sm leading-6 text-[var(--color-warning)]">
                <p className="font-medium">Catatan legal</p>
                <p className="mt-1">{INVOICE_AUTH_COPY}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-[var(--color-border)] bg-[var(--color-navy-900)] px-5 py-4 text-white sm:px-7">
        <div className={`grid gap-3 ${compact ? "sm:grid-cols-1" : "sm:grid-cols-[1.2fr_0.8fr]"}`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Hak cipta tampilan nota</p>
            <p className="mt-1 text-sm leading-6 text-white/88">{INVOICE_LEGAL_COPY}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Kode cek cepat</p>
            <p className="mt-1 text-sm font-medium tracking-[0.18em] text-white">{invoice.verificationCode}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-text)]">{value}</p>
    </div>
  );
}
