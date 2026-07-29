"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { doesOperationalModelUseResources, DURATION_OPTIONS } from "@/lib/constants/business";
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
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
              📌 <strong>Bebas (Asal Jam Kosong):</strong> Sangat cocok untuk salon, klinik, dan jasa yang memerlukan reservasi waktu tanpa pelanggan memilih unit/staf spesifik. Sistem otomatis mengatur alokasi asal belum penuh.
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Kapasitas Booking Bersamaan
              </span>
              <Input
                type="number"
                min={1}
                value={form.bookingCapacity}
                onChange={(event) => updateForm("bookingCapacity", event.target.value)}
              />
              <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                Jumlah pelanggan maksimal yang bisa dilayani di jam yang sama (misal jumlah kursi barber/staf terapis aktif).
              </p>
              {errors.bookingCapacity ? (
                <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.bookingCapacity}</p>
              ) : null}
            </label>
          </div>
        ) : null}

        {form.operationalModel === "RESOURCE_BOOKING" ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            📌 <strong>Pilih Unit / Orang Khusus:</strong> Customer wajib memilih unit spesifik (misal: Meja 1, Kapster Budi). Jadwal hanya tersedia jika unit/orang tersebut kosong di jam yang diinginkan.
          </div>
        ) : null}

        {form.mode === "BOOKING_SERVICE" ? (
          <div className="pt-4 border-t border-[var(--color-border)]">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Durasi Default Booking (Menit)
              </span>
              <Select
                value={String(form.defaultBookingDurationMinutes)}
                options={DURATION_OPTIONS}
                onValueChange={(val) => updateForm("defaultBookingDurationMinutes", val)}
                placeholder="Pilih Durasi"
              />
              <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                Durasi standar untuk pemesanan jika layanan tidak memiliki durasi spesifik (misal: 60 menit).
              </p>
              {errors.defaultBookingDurationMinutes ? (
                <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.defaultBookingDurationMinutes}</p>
              ) : null}
            </label>
          </div>
        ) : null}

        {/* 1E: autoCreateOrderFromSubmission toggle */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => updateForm("autoCreateOrderFromSubmission", !form.autoCreateOrderFromSubmission)}
            className="flex w-full items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-left transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]"
          >
              <div className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                form.autoCreateOrderFromSubmission
                  ? "bg-[var(--color-primary)]"
                  : "bg-[var(--color-border-strong)]"
              }`}>
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
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
            </button>
        </div>
      </div>
    </div>
  );
}
