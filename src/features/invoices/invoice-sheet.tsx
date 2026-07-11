import Image from "next/image";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { INVOICE_LEGAL_COPY, isInvoiceIntegrityValid } from "@/lib/invoice";
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
  console.log("INVOICE_IN_SHEET:", invoice);
  const isValid = isInvoiceIntegrityValid(invoice);

  return (
    <div className={`relative mx-auto w-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] sm:rounded-2xl ${compact ? '' : 'max-w-md'}`}>
      {/* Security Watermark Pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Invalid Watermark Overlay */}
      {!isValid && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-10">
          <span className="text-[80px] font-black uppercase tracking-widest text-red-600 opacity-20 -rotate-45 select-none text-center leading-none">
            INVALID
          </span>
        </div>
      )}

      <div className="relative px-6 pt-8 pb-6 bg-[var(--color-surface)]/90 backdrop-blur-[2px]">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {business.logoUrl && (
            <Image
              src={business.logoUrl}
              alt={business.name}
              width={64}
              height={64}
              className="mb-4 h-16 w-16 rounded-full object-cover border border-[var(--color-border)] shadow-sm bg-white"
              unoptimized
            />
          )}
          <h3 className="text-xl font-bold tracking-tight text-[var(--color-text)]">{business.name}</h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-semibold">Nota Resmi</p>
        </div>

        <div className="mt-6 border-t-2 border-dashed border-[var(--color-border)] pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-[var(--color-text-secondary)]">Status</span>
            <PaymentStatusBadge status={invoice.paymentStatus} />
          </div>
          <InvoiceRow label="No. Nota" value={invoice.invoiceCode} valueClass="font-mono text-sm font-semibold text-[var(--color-text)]" />
          <InvoiceRow label="Tanggal" value={formatDateTime(invoice.createdAt)} />
          <InvoiceRow label="Customer" value={invoice.customerName} />
          <InvoiceRow label="Jadwal" value={order?.scheduledDate ? `${formatDate(order.scheduledDate)}${order.scheduledTime ? `, ${order.scheduledTime}` : ""}` : "-"} />
        </div>

        <div className="mt-6 border-t-2 border-dashed border-[var(--color-border)] pt-6">
          <h4 className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-3">Pesanan</h4>
          <div className="flex justify-between items-start mb-2">
            <div className="pr-4">
              <p className="text-sm font-medium text-[var(--color-text)]">{order?.title ?? "Layanan / order"}</p>
              {invoice.notes && <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{invoice.notes}</p>}
            </div>
            <p className="text-sm font-semibold text-[var(--color-text)] shrink-0">{formatCurrency(invoice.totalAmount)}</p>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--color-border)]">
            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Total Tagihan</span>
            <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>

        {invoice.paymentStatus !== "PAID" && business.paymentInstructions && (
          <div className="mt-6 border-t-2 border-dashed border-[var(--color-border)] pt-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">Instruksi Pembayaran</h4>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && business.paymentInstructions) {
                    void navigator.clipboard.writeText(business.paymentInstructions);
                    toast.success("Info rekening disalin!");
                  }
                }}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                Salin
              </button>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line bg-[var(--color-surface-elevated)] p-3 rounded-lg border border-[var(--color-border)]">
              {business.paymentInstructions}
            </p>
          </div>
        )}

        {/* Security Seal */}
        <div className={`mt-6 border-t-2 border-dashed border-[var(--color-border)] pt-6 text-center`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            {isValid ? <ShieldCheck className="h-5 w-5 text-emerald-500" /> : <ShieldAlert className="h-5 w-5 text-red-500" />}
            <span className={`text-xs font-bold uppercase tracking-widest ${isValid ? 'text-emerald-600' : 'text-red-600'}`}>
              {isValid ? "Segel Digital Valid" : "Segel Rusak / Tidak Valid"}
            </span>
          </div>
          
          <div className="bg-[var(--color-surface-elevated)] p-3 rounded-lg border border-[var(--color-border)] text-left space-y-2 mt-3">
            <div>
              <p className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold tracking-wider">Kode Verifikasi</p>
              <p className="font-mono text-xs font-semibold text-[var(--color-text)] break-all">{invoice.verificationCode}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold tracking-wider">Segel Integritas</p>
              <p className="font-mono text-[10px] text-[var(--color-text-secondary)] break-all">{invoice.integritySeal}</p>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-[var(--color-navy-900)] px-6 py-4 text-center text-white relative z-20">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/50 mb-1">Rapiin Secure Receipt</p>
        <p className="text-[10px] text-white/40 leading-relaxed max-w-xs mx-auto">
          {INVOICE_LEGAL_COPY}
        </p>
      </div>
    </div>
  );
}

function InvoiceRow({ label, value, valueClass = "text-sm font-medium text-[var(--color-text)] text-right" }: { label: string; value: string, valueClass?: string }) {
  return (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-sm text-[var(--color-text-secondary)] pr-4">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
