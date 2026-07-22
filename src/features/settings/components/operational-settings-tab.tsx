"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { doesOperationalModelUseResources } from "@/lib/constants/business";
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
          <Select
            value={form.operationalModel}
            onValueChange={(value) => {
              const nextOperationalModel = value as OperationalModel;
              const nextUsesResources = doesOperationalModelUseResources(nextOperationalModel);

              setForm((current) => ({
                ...current,
                operationalModel: nextOperationalModel,
                resources: nextUsesResources
                  ? buildResources(current.resourceLabel, current.resourceCount, current.resources)
                  : current.resources.map((resource) => ({ ...resource, isActive: false })),
              }));
            }}
            options={modeOptions}
          />
        </label>

        {form.mode !== "BOOKING_SERVICE" && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            📌 <strong>Mode Request Order:</strong> Customer tidak perlu memilih tanggal dan jam. Form publik akan fokus mengumpulkan detail order/request kebutuhan dari customer.
          </div>
        )}

        {form.mode === "BOOKING_SERVICE" && form.operationalModel === "APPOINTMENT" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
              📌 <strong>Model Janji Temu (Appointment):</strong> Sangat cocok untuk salon, barber, terapis, klinik, studio foto, dan jasa yang memerlukan reservasi waktu global tanpa alokasi unit tertentu.
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

        {usesResources ? (
          <div className="rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] px-4 py-4 text-xs text-[var(--color-warning-text)] leading-relaxed">
            ⚠️ <strong>Model Pilihan Tim & Unit:</strong> Customer publik memesan jadwal secara terpusat. Sistem otomatis memvalidasi sisa staf/unit yang tersedia, lalu admin dapat mengalokasikan unit spesifik melalui panel pesanan.
          </div>
        ) : null}
      </div>
    </div>
  );
}
