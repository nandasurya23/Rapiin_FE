"use client";

import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { RESOURCE_LABEL_SUGGESTIONS } from "@/lib/constants/business";
import type { BusinessResource } from "@/types/business";
import type { FormErrors, SettingsFormState } from "./general-settings-tab";

interface ResourceSettingsTabProps {
  form: SettingsFormState;
  errors: FormErrors;
  referencedResourceIds: Set<string>;
  setForm: React.Dispatch<React.SetStateAction<SettingsFormState>>;
  buildResources: (label: string, count: string, current: BusinessResource[]) => BusinessResource[];
}

export function ResourceSettingsTab({
  form,
  errors,
  referencedResourceIds,
  setForm,
  buildResources,
}: ResourceSettingsTabProps) {
  const toast = useToast();

  return (
    <section className="animate-fade-up">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="space-y-5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Pengaturan Staf & Fasilitas</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Dipakai untuk mengelola daftar staf/karyawan, meja restoran, lapangan olahraga, kamar sewa, atau ruangan studio.
              </p>
            </div>
            <Badge tone="info" className="w-fit">
              {form.resources.filter((resource) => resource.isActive).length} Unit Aktif
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
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
                    resources: buildResources(nextLabel, current.resourceCount, current.resources),
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
                        resources: buildResources(label, current.resourceCount, current.resources),
                      }))
                    }
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)] active:scale-95"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Jumlah Unit / Karyawan
              </span>
              <Input
                type="number"
                min={1}
                value={form.resourceCount}
                onChange={(event) => {
                  const nextCount = event.target.value;
                  setForm((current) => ({
                    ...current,
                    resourceCount: nextCount,
                    resources: buildResources(current.resourceLabel, nextCount, current.resources),
                  }));
                }}
              />
              {errors.resourceCount ? (
                <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.resourceCount}</p>
              ) : null}
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
                  <label className="block flex-1">
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

                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full text-xs font-bold py-1.5 border-[var(--color-border)] hover:bg-[var(--color-surface)]"
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
                  </div>
                </div>
              );
            })}
          </div>

          {errors.resources ? <p className="text-xs font-bold text-[var(--color-danger)]">{errors.resources}</p> : null}

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
        </div>
      </div>
    </section>
  );
}
