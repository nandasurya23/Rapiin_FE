"use client";

import { PlusCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { RESOURCE_LABEL_SUGGESTIONS } from "@/lib/constants/business";
import type { BusinessResource, WorkingHours } from "@/types/business";
import type { FormErrors, SettingsFormState } from "./general-settings-tab";
import { useAppData } from "@/components/providers/app-data-provider";
import { getSubscriptionForBusiness, getPlanDefinition } from "@/lib/subscription";

interface ResourceSettingsTabProps {
  form: SettingsFormState;
  errors: FormErrors;
  referencedResourceIds: Set<string>;
  setForm: React.Dispatch<React.SetStateAction<SettingsFormState>>;
}

/** Pill toggle: Ikuti Bisnis / Custom Shift */
function WorkingHoursPill({
  value,
  onChange,
}: {
  value: WorkingHours | undefined;
  onChange: (next: WorkingHours) => void;
}) {
  const isCustom = value !== null && value !== undefined;

  return (
    <div className="mt-3">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
        <Clock className="inline-block h-3 w-3 mr-1 mb-0.5" />
        Jam Kerja
      </span>

      {/* Toggle pills */}
      <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden text-xs font-bold w-fit">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`px-3 py-1.5 transition-all ${
            !isCustom
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          }`}
        >
          Ikuti Bisnis
        </button>
        <button
          type="button"
          onClick={() => onChange({ start: "08:00", end: "17:00" })}
          className={`px-3 py-1.5 transition-all ${
            isCustom
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          }`}
        >
          Custom Shift
        </button>
      </div>

      {/* Custom shift inputs */}
      {isCustom && value && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              Mulai
            </label>
            <input
              type="time"
              value={value.start}
              onChange={(e) => onChange({ ...value, start: e.target.value })}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <span className="mt-4 text-[var(--color-text-muted)]">–</span>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              Selesai
            </label>
            <input
              type="time"
              value={value.end}
              onChange={(e) => onChange({ ...value, end: e.target.value })}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      )}

      <p className="mt-1.5 text-[10px] text-[var(--color-text-muted)]">
        {isCustom
          ? "Kapster ini hanya tersedia di rentang jam yang ditentukan."
          : "Kapster akan tersedia selama jam operasional bisnis."}
      </p>
    </div>
  );
}

export function ResourceSettingsTab({
  form,
  errors,
  referencedResourceIds,
  setForm,
}: ResourceSettingsTabProps) {
  const toast = useToast();
  const { business, subscriptions } = useAppData();
  const subscription = getSubscriptionForBusiness(subscriptions, business.id);
  const planDef = getPlanDefinition(subscription?.planCode ?? "FREE_TRIAL");
  const staffLimit = planDef.staffLimit;
  const isLimitReached = form.resources.length >= staffLimit;

  return (
    <section className="animate-fade-up">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="space-y-5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Pengaturan Staf &amp; Fasilitas</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Daftar <strong>kapster, terapis, atau unit</strong> yang bisa dipilih customer saat booking.
                Mereka tidak perlu akun login. Untuk kasir/admin yang perlu login, undang mereka di tab <strong>Manajemen Tim</strong>.
              </p>
            </div>
            <Badge tone="info" className="w-fit">
              {form.resources.filter((resource) => resource.isActive).length} Unit Aktif
            </Badge>
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Label Penamaan (Staf, Ruangan, Meja, Lapangan)
              </span>
              <Input
                value={form.resourceLabel}
                onChange={(event) => {
                  const nextLabel = event.target.value;
                  setForm((current) => ({
                    ...current,
                    resourceLabel: nextLabel,
                  }));
                }}
                placeholder="Contoh: Meja, Studio, Lapangan, Kamar"
              />
              {errors.resourceLabel ? (
                <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.resourceLabel}</p>
              ) : null}

              {/* Label suggestions list */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {RESOURCE_LABEL_SUGGESTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        resourceLabel: label,
                      }))
                    }
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)] active:scale-95"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </label>
          </div>

          {/* Units List */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {form.resources.map((resource, index) => {
              const isReferenced = referencedResourceIds.has(resource.id);

              return (
                <div
                  key={resource.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 hover:border-[var(--color-border-strong)] transition"
                >
                  <div className="flex gap-3">
                    <label className="block flex-[2]">
                      <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
                        {form.resourceLabel || "Unit"} #{index + 1}
                      </span>
                      <Input
                        value={resource.name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            resources: current.resources.map((item) =>
                              item.id === resource.id ? { ...item, name: event.target.value } : item
                            ),
                          }))
                        }
                      />
                    </label>
                    <label className="block flex-1">
                      <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Max Kapasitas
                      </span>
                      <Input
                        type="number"
                        min={1}
                        value={resource.maxCapacity ?? 1}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            resources: current.resources.map((item) =>
                              item.id === resource.id ? { ...item, maxCapacity: parseInt(event.target.value) || 1 } : item
                            ),
                          }))
                        }
                      />
                    </label>
                  </div>

                  {/* Working Hours Toggle */}
                  <WorkingHoursPill
                    value={resource.workingHours}
                    onChange={(next) =>
                      setForm((current) => ({
                        ...current,
                        resources: current.resources.map((item) =>
                          item.id === resource.id ? { ...item, workingHours: next } : item
                        ),
                      }))
                    }
                  />

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        tone={resource.isActive ? "success" : "neutral"}
                        className="text-[9px] uppercase tracking-wider font-extrabold"
                      >
                        {resource.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                      {isReferenced ? (
                        <Badge tone="warning" className="text-[9px] uppercase tracking-wider font-extrabold">
                          Dipakai Order
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 text-xs font-bold py-1.5 border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            resources: current.resources.map((item) =>
                              item.id === resource.id ? { ...item, isActive: !item.isActive } : item
                            ),
                          }))
                        }
                      >
                        {resource.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      
                      {!isReferenced && (
                        <Button
                          type="button"
                          variant="danger"
                          className="flex-none px-3 text-xs font-bold py-1.5 bg-[var(--color-danger-surface)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white border border-[var(--color-danger-border)] transition"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus ${resource.name}?`)) {
                              setForm((current) => ({
                                ...current,
                                resources: current.resources.filter((item) => item.id !== resource.id),
                                resourceCount: String(Math.max(1, current.resources.length - 1))
                              }));
                            }
                          }}
                        >
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {errors.resources ? <p className="text-xs font-bold text-[var(--color-danger)]">{errors.resources}</p> : null}

          {isLimitReached ? (
            <div className="mt-2 rounded-xl bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] p-3 text-xs text-[var(--color-warning-text)]">
              Batas maksimal <strong>{staffLimit} {form.resourceLabel.toLowerCase()}</strong> untuk paket {planDef.label} telah tercapai. Upgrade ke Pro untuk menambah lebih banyak unit.
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  resourceCount: String(current.resources.length + 1),
                  resources: [
                    ...current.resources,
                    {
                      id: `res_${Date.now()}_${current.resources.length + 1}`,
                      name: `${current.resourceLabel.trim() || "Slot"} ${current.resources.length + 1}`,
                      isActive: true,
                      workingHours: null, // default: ikuti jam bisnis
                      maxCapacity: 1,
                    },
                  ],
                }));
                toast.success("Unit baru ditambahkan", "Jangan lupa Simpan Pengaturan agar permanen.");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline active:scale-95 mt-2"
            >
              <PlusCircle className="h-4 w-4" />
              Tambah Unit Baru
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
