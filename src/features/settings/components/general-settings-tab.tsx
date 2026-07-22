"use client";

import NextImage from "next/image";
import { Sparkles, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { compressLogoImage } from "@/lib/image";
import { BUSINESS_MODE_OPTIONS, getDefaultOperationalModel, doesOperationalModelUseResources } from "@/lib/constants/business";
import type { BusinessResource, OperationalModel, PublicCatalogItem } from "@/types/business";

export type SettingsFormState = {
  name: string;
  whatsappNumber: string;
  mode: (typeof BUSINESS_MODE_OPTIONS)[number]["value"];
  niche: string;
  operationalModel: OperationalModel;
  resourceLabel: string;
  resourceCount: string;
  bookingCapacity: string;
  defaultBookingDurationMinutes: string;
  openingHours: string;
  timezone: string;
  address: string;
  description: string;
  paymentInstructions: string;
  resources: BusinessResource[];
  services: PublicCatalogItem[];
  logoUrl: string;
};

export type FormErrors = Partial<Record<keyof SettingsFormState, string>> & {
  resources?: string;
  services?: string;
};

interface GeneralSettingsTabProps {
  form: SettingsFormState;
  errors: FormErrors;
  updateForm: <K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) => void;
  setForm: React.Dispatch<React.SetStateAction<SettingsFormState>>;
  buildResources: (label: string, count: string, current: BusinessResource[]) => BusinessResource[];
}

export function GeneralSettingsTab({
  form,
  errors,
  updateForm,
  setForm,
  buildResources,
}: GeneralSettingsTabProps) {
  const toast = useToast();

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Profil Bisnis</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Informasi dasar bisnis yang akan tampil pada halaman publik pelanggan.
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-[var(--color-primary)] animate-pulse" />
        </div>

        {/* Premium Logo Uploader */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 relative overflow-hidden transition-all duration-300 hover:border-[var(--color-border-strong)]">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            {form.logoUrl ? (
              <NextImage
                src={form.logoUrl}
                alt="Logo Preview"
                width={80}
                height={80}
                className="h-full w-full object-contain p-1.5 transition-transform duration-300 hover:scale-105"
                unoptimized
              />
            ) : (
              <span className="text-[10px] font-bold text-[var(--color-text-muted)] select-none uppercase tracking-wider">
                No Logo
              </span>
            )}
          </div>

          <div className="space-y-2 z-10 flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Logo Bisnis</h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              Format JPG, PNG, atau WEBP. Direkomendasikan rasio persegi 1:1.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-[var(--color-primary-hover)] hover:shadow active:scale-95">
                <Upload className="h-3.5 w-3.5" />
                Pilih Logo Baru
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const base64 = await compressLogoImage(file);
                      updateForm("logoUrl", base64);
                      toast.success("Logo berhasil dimuat!");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Gagal membaca file");
                    }
                  }}
                />
              </label>
              {form.logoUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    updateForm("logoUrl", "");
                    toast.info("Logo dihapus.");
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold border-[var(--color-border)] rounded-xl"
                >
                  <X className="h-3.5 w-3.5" />
                  Hapus Logo
                </Button>
              )}
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 h-12 w-12 rounded-full bg-slate-500/[0.01] pointer-events-none" />
        </div>

        {/* Form Fields Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Nama Bisnis
            </span>
            <Input value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
            {errors.name ? <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.name}</p> : null}
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Nomor WhatsApp
            </span>
            <Input
              value={form.whatsappNumber}
              onChange={(event) => {
                event.target.value = event.target.value.replace(/[^\d]/g, "");
                updateForm("whatsappNumber", event.target.value);
              }}
            />
            {errors.whatsappNumber ? (
              <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.whatsappNumber}</p>
            ) : (
              <p className="mt-1.5 text-[11px] text-[var(--color-text-secondary)]">
                Nomor bawaan dari saat pendaftaran. Bisa diubah jika nomor operasional bisnis berbeda.
              </p>
            )}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Mode Bisnis
            </span>
            <Select
              value={form.mode}
              onValueChange={(value) => {
                const nextMode = value as SettingsFormState["mode"];
                const nextOperationalModel =
                  nextMode === "BOOKING_SERVICE" ? form.operationalModel : getDefaultOperationalModel(nextMode);
                const nextUsesResources = doesOperationalModelUseResources(nextOperationalModel);
                const nextResources = nextUsesResources
                  ? buildResources(form.resourceLabel, form.resourceCount, form.resources)
                  : form.resources.map((resource) => ({ ...resource, isActive: false }));

                setForm((current) => ({
                  ...current,
                  mode: nextMode,
                  operationalModel: nextOperationalModel,
                  resources: nextResources,
                }));
              }}
              options={BUSINESS_MODE_OPTIONS}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Kategori Bisnis
            </span>
            <Input
              value={form.niche}
              onChange={(e) => updateForm("niche", e.target.value)}
              placeholder="Contoh: Warnet, Barbershop, Rental PS, Futsal..."
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Deskripsi Singkat Bisnis
          </span>
          <Textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} rows={3} />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Alamat Fisik
            </span>
            <Input value={form.address} onChange={(event) => updateForm("address", event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Jam Operasional
            </span>
            <div className="flex items-center gap-2">
              <datalist id="time-options">
                {Array.from({ length: 25 }, (_, i) => (
                  <option key={i} value={`${String(i).padStart(2, "0")}:00`} />
                ))}
              </datalist>
              <Input
                type="text"
                list="time-options"
                placeholder="09:00"
                value={form.openingHours.split(" - ")[0] || "09:00"}
                onChange={(event) => {
                  const end = form.openingHours.split(" - ")[1] || "21:00";
                  updateForm("openingHours", `${event.target.value} - ${end}`);
                }}
              />
              <span className="text-[var(--color-text-secondary)] font-bold">-</span>
              <Input
                type="text"
                list="time-options"
                placeholder="24:00"
                value={form.openingHours.split(" - ")[1] || "24:00"}
                onChange={(event) => {
                  const start = form.openingHours.split(" - ")[0] || "09:00";
                  updateForm("openingHours", `${start} - ${event.target.value}`);
                }}
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Zona Waktu
            </span>
            <Select
              value={form.timezone}
              onValueChange={(value) => updateForm("timezone", value)}
              options={[
                { value: "Asia/Jakarta", label: "WIB (Waktu Indonesia Barat)" },
                { value: "Asia/Makassar", label: "WITA (Waktu Indonesia Tengah)" },
                { value: "Asia/Jayapura", label: "WIT (Waktu Indonesia Timur)" },
              ]}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Instruksi Pembayaran / Detail Rekening
          </span>
          <Textarea
            value={form.paymentInstructions}
            onChange={(event) => updateForm("paymentInstructions", event.target.value)}
            placeholder="Contoh:&#10;Transfer Bank BCA: 123-4567-890 a.n. Toko Rapiin&#10;Mandiri: 987-654-3210 a.n. Toko Rapiin"
            rows={3}
          />
          <p className="mt-2 text-[10px] text-[var(--color-text-muted)] leading-relaxed">
            Ditampilkan otomatis di Nota Digital pelanggan untuk memudahkan mereka melakukan transfer pembayaran.
          </p>
        </label>
      </div>
    </div>
  );
}
