import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { INVOICE_AUTH_COPY, INVOICE_LEGAL_COPY, isInvoiceIntegrityValid } from "@/lib/invoice";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Business } from "@/types/business";
import type { Invoice } from "@/types/invoice";
import type { Order } from "@/types/order";

type InvoiceSheetProps = {
  business: Business;
  invoice: Invoice;
  order?: Order;
  compact?: boolean;
};

export function InvoiceSheet({ business, invoice, order, compact = false }: InvoiceSheetProps) {
  const isValid = isInvoiceIntegrityValid(invoice);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-40 bg-[radial-gradient(circle_at_top,_rgba(20,83,45,0.08),_transparent_70%)] sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,_rgba(247,248,245,0.95),_rgba(255,255,255,0))]" />

      <div className="relative border-b border-slate-200 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Nota Resmi</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{business.name}</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
              Dokumen pembayaran sederhana untuk kebutuhan operasional harian UMKM.
            </p>
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:min-w-[240px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Nomor Nota</span>
              <Badge tone="neutral">{invoice.invoiceCode}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">Tanggal dibuat</span>
              <span className="text-sm font-medium text-slate-900">{formatDate(invoice.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">Status bayar</span>
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rincian pembayaran</p>
                  <p className="mt-1 text-sm text-slate-600">Ringkasan item utama dari order yang sudah dicatat admin.</p>
                </div>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">1 item</span>
              </div>

              <div className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-950">{order?.title ?? "Layanan / order"}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {invoice.notes ?? "Tagihan ini dibuat dari order aktif yang sudah tercatat di Rapiin."}
                  </p>
                </div>
                <p className="shrink-0 text-base font-semibold text-slate-950">{formatCurrency(invoice.totalAmount)}</p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">Total tagihan</span>
                  <span className="text-2xl font-semibold tracking-tight text-slate-950">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Verifikasi dokumen</p>
              <div className="mt-3 flex items-start gap-3">
                {isValid ? (
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-red-700" />
                )}
                <div>
                  <p className={`font-medium ${isValid ? "text-emerald-800" : "text-red-800"}`}>
                    {isValid ? "Segel nota valid" : "Segel nota tidak valid"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {isValid
                      ? "Data inti nota cocok dengan segel integritas yang tersimpan."
                      : "Ada data inti nota yang berubah setelah dokumen dibuat. Periksa ulang sebelum dibagikan."}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Kode verifikasi</span>
                  <span className="font-semibold tracking-[0.18em] text-slate-950">{invoice.verificationCode}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Segel integritas</span>
                  <span className="font-semibold tracking-[0.12em] text-slate-950">{invoice.integritySeal}</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                <p className="font-medium">Catatan legal</p>
                <p className="mt-1">{INVOICE_AUTH_COPY}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-slate-200 bg-slate-950 px-5 py-4 text-white sm:px-7">
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
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-950">{value}</p>
    </div>
  );
}
