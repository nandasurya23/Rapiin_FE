"use client";

import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatLongDate } from "@/lib/format";
import type { Business } from "@/types/business";
import type { FormState } from "../hooks/use-public-order-form";

interface PublicOrderReceiptProps {
  business: Business;
  form: FormState;
  waLink: string;
  onReset: () => void;
}

export function PublicOrderReceipt({
  business,
  form,
  waLink,
  onReset,
}: PublicOrderReceiptProps) {
  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="p-6 sm:p-8 space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>

          <div className="inline-flex mx-auto">
            <Badge
              tone="success"
              className="font-extrabold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
            >
              ✓ Tersimpan di Database
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[var(--color-text)]">Pemesanan Terkirim!</h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Terima kasih, data Anda sudah masuk ke sistem kami. Admin akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-left text-sm space-y-3.5 shadow-inner">
            <p className="font-extrabold text-xs uppercase tracking-wider text-[var(--color-text-secondary)] border-b border-[var(--color-border)]/40 pb-2">
              Ringkasan Pemesanan
            </p>
            <div className="space-y-2">
              {form.service || form.product ? (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--color-text-secondary)]">
                    {business.mode === "BOOKING_SERVICE" ? "Layanan" : "Produk"}:
                  </span>
                  <span className="font-extrabold text-[var(--color-text)]">
                    {form.service || form.product}
                  </span>
                </div>
              ) : null}
              {form.scheduledDate ? (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--color-text-secondary)]">Tanggal &amp; Waktu:</span>
                  <span className="font-extrabold text-[var(--color-text)]">
                    {formatLongDate(form.scheduledDate)}{" "}
                    {form.scheduledTime ? `pada ${form.scheduledTime}` : ""}
                  </span>
                </div>
              ) : null}
              {form.name ? (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--color-text-secondary)]">Pelanggan:</span>
                  <span className="font-bold text-[var(--color-text)]">
                    {form.name} ({form.whatsappNumber})
                  </span>
                </div>
              ) : null}
              {form.notes ? (
                <div className="text-xs pt-1 border-t border-[var(--color-border)]/20">
                  <p className="text-[var(--color-text-secondary)]">Catatan:</p>
                  <p className="font-medium text-[var(--color-text)] mt-0.5">{form.notes}</p>
                </div>
              ) : null}
              {business.paymentInstructions ? (
                <div className="pt-2 border-t border-[var(--color-border)]/20 text-xs">
                  <p className="text-[var(--color-text-secondary)] font-bold mb-1">
                    Metode Pembayaran / Transfer:
                  </p>
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 font-mono font-bold text-[var(--color-text)] whitespace-pre-wrap leading-relaxed select-all">
                    {business.paymentInstructions}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm py-3 transition-colors shadow-sm"
              >
                Lanjut ke WhatsApp Admin →
              </a>
            )}
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
            >
              ← Buat Pemesanan Lain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
