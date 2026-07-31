"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { doesOperationalModelUseResources, DURATION_OPTIONS, PAYMENT_TIMING_OPTIONS } from "@/lib/constants/business";
import type { BusinessResource, OperationalModel } from "@/types/business";
import type { FormErrors, SettingsFormState } from "./general-settings-tab";

interface OperationalSettingsTabProps {
  form: SettingsFormState;
  errors: FormErrors;
  modeOptions: { value: string; label: string }[];
  usesResources: boolean;
  updateForm: <K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) => void;
  setForm: React.Dispatch<React.SetStateAction<SettingsFormState>>;
  buildResources: (label: string, count: string, current: BusinessResource[]) => BusinessResource[];
}

export function OperationalSettingsTab({
  form,
  errors,
  modeOptions,
  usesResources,
  updateForm,
  setForm,
  buildResources,
}: OperationalSettingsTabProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="space-y-5 p-5">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">Cara Kerja Bisnis</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Tentukan bagaimana customer memilih jadwal, unit slot, atau cukup request order.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary-surface)]/20 p-4">
          <p className="text-sm font-bold text-[var(--color-text)] mb-1">
            ✨ Pembaruan Sistem (Phase 3)
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Pengaturan <strong>Kapasitas</strong> dan <strong>Durasi Layanan</strong> kini dipindahkan. Atur kapasitas di tab <strong>Tim & Unit</strong> dan durasi di tab <strong>Katalog Layanan</strong> agar lebih akurat.
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Tipe Usaha
          </span>
          <div className="flex h-11 w-full items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-sm text-[var(--color-text-muted)] cursor-not-allowed opacity-80">
            <span>
              {modeOptions.find((opt) => opt.value === form.operationalModel)?.label ||
                form.operationalModel}
            </span>
          </div>
          <p className="mt-2 text-[10px] font-bold text-[var(--color-warning-text)]">
            🔒 Mode operasional telah dikunci sejak Onboarding. Hubungi support jika butuh reset.
          </p>
        </label>

        {form.mode !== "BOOKING_SERVICE" && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            📌 <strong>Mode Request Order:</strong> Customer tidak perlu memilih tanggal dan jam. Form publik akan fokus mengumpulkan detail order/request kebutuhan dari customer.
          </div>
        )}

        {form.mode === "BOOKING_SERVICE" && form.operationalModel === "APPOINTMENT" ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            📌 <strong>Bebas (Asal Jam Kosong):</strong> Sangat cocok untuk salon, klinik, dan jasa yang memerlukan reservasi waktu tanpa pelanggan memilih unit/staf spesifik. Sistem otomatis mengatur alokasi asal belum penuh.
          </div>
        ) : null}

        {form.operationalModel === "RESOURCE_BOOKING" ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            📌 <strong>Pilih Unit / Orang Khusus:</strong> Customer wajib memilih unit spesifik (misal: Meja 1, Kapster Budi). Jadwal hanya tersedia jika unit/orang tersebut kosong di jam yang diinginkan.
          </div>
        ) : null}

        <div className="pt-4 border-t border-[var(--color-border)]">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Kapan Pelanggan Harus Membayar?
            </span>
            <div className="flex w-full items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-text-muted)] cursor-not-allowed opacity-80">
              <div>
                <p className="font-bold text-[var(--color-text)]">
                  {PAYMENT_TIMING_OPTIONS.find((opt) => opt.value === form.paymentTiming)?.label || form.paymentTiming}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  {PAYMENT_TIMING_OPTIONS.find((opt) => opt.value === form.paymentTiming)?.helperText}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[10px] font-bold text-[var(--color-warning-text)]">
              🔒 Timing pembayaran telah dikunci untuk menjaga konsistensi alur Invoice dan OCR.
            </p>
          </label>
        </div>

        <div className="pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            className="w-full"
            onClick={() => updateForm("autoCreateOrderFromSubmission", !form.autoCreateOrderFromSubmission)}
          >
            <div className="flex w-full items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-elevated)] transition-all duration-300">
                <div className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${
                  form.autoCreateOrderFromSubmission
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-border-strong)]"
                }`}>
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${
                    form.autoCreateOrderFromSubmission ? "translate-x-4" : "translate-x-0"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">
                    Auto-Buat Order dari Request Publik
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {form.autoCreateOrderFromSubmission
                      ? "✅ Aktif — Setiap permintaan dari halaman publik langsung masuk sebagai Order di Dashboard Anda."
                      : "🔴 Nonaktif — Permintaan masuk sebagai Submission terlebih dahulu. Anda perlu review manual sebelum menjadi Order."}
                  </p>
                </div>
              </div>
          </button>
        </div>

        <div className="pt-6 border-t border-[var(--color-border)] mt-4">
          <div className="rounded-2xl border border-[var(--color-primary-surface)] bg-[var(--color-primary-surface)]/20 p-5">
            <h3 className="text-sm font-bold text-[var(--color-text)] mb-2">Perubahan Model Bisnis</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
              Konfigurasi bisnis di atas telah dikunci untuk menjaga konsistensi data transaksi Anda. Jika model bisnis Anda berubah, Anda dapat mengajukan perubahan konfigurasi melalui proses review oleh Admin Rapiin.
            </p>
            <button
              type="button"
              className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
              onClick={() => {
                alert("Mohon hubungi Support Rapiin melalui WhatsApp untuk mengajukan perubahan model bisnis.");
              }}
            >
              Ajukan Perubahan Mode Bisnis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
