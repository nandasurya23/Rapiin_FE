"use client";

import { PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatRupiahInput } from "@/lib/format";
import type { FormErrors, SettingsFormState } from "./general-settings-tab";

interface CatalogSettingsTabProps {
  form: SettingsFormState;
  errors: FormErrors;
  setForm: React.Dispatch<React.SetStateAction<SettingsFormState>>;
}

export function CatalogSettingsTab({ form, errors, setForm }: CatalogSettingsTabProps) {
  return (
    <section className="animate-fade-up">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="space-y-5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                Katalog {form.mode === "BOOKING_SERVICE" ? "Layanan" : form.mode === "PRODUCT_ORDER" ? "Produk" : "Request"}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Tambahkan daftar {form.mode === "BOOKING_SERVICE" ? "layanan" : "produk"} yang Anda tawarkan ke pelanggan.
              </p>
            </div>
            <Badge tone="info" className="w-fit">
              {form.services.length} Item
            </Badge>
          </div>

          <div className="space-y-4">
            {form.services.map((service) => (
              <div
                key={service.id}
                className="relative flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 hover:border-[var(--color-border-strong)] transition"
              >
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        services: current.services.filter((item) => item.id !== service.id),
                      }))
                    }
                    className="text-[var(--color-danger)] hover:text-red-700 transition"
                    title="Hapus item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 pr-8">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Nama
                    </span>
                    <Input
                      value={service.name}
                      placeholder={form.mode === "BOOKING_SERVICE" ? "Cukur Rambut" : "Nasi Goreng"}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          services: current.services.map((item) =>
                            item.id === service.id ? { ...item, name: event.target.value } : item
                          ),
                        }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Harga (Label)
                    </span>
                    <Input
                      value={service.priceLabel || ""}
                      placeholder="Contoh: Rp 50.000 atau Gratis"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          services: current.services.map((item) =>
                            item.id === service.id ? { ...item, priceLabel: formatRupiahInput(event.target.value) } : item
                          ),
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Deskripsi
                  </span>
                  <Textarea
                    value={service.description}
                    placeholder="Jelaskan detail dari layanan/produk ini"
                    rows={2}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        services: current.services.map((item) =>
                          item.id === service.id ? { ...item, description: event.target.value } : item
                        ),
                      }))
                    }
                  />
                </label>
                {form.mode === "BOOKING_SERVICE" && (
                  <label className="block w-1/2">
                    <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Durasi (Jam)
                    </span>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={service.durationMinutes ? service.durationMinutes / 60 : ""}
                      placeholder="1"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          services: current.services.map((item) =>
                            item.id === service.id
                              ? { ...item, durationMinutes: (parseInt(event.target.value, 10) || 0) * 60 || undefined }
                              : item
                          ),
                        }))
                      }
                    />
                  </label>
                )}
              </div>
            ))}
          </div>

          {errors.services ? <p className="text-xs font-bold text-[var(--color-danger)]">{errors.services}</p> : null}

          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                services: [
                  ...current.services,
                  {
                    id: `svc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                    name: "",
                    description: "",
                    priceLabel: "",
                    durationMinutes: current.mode === "BOOKING_SERVICE" ? 60 : undefined,
                  },
                ],
              }))
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline active:scale-95 mt-2"
          >
            <PlusCircle className="h-4 w-4" />
            Tambah Item Baru
          </button>
        </div>
      </div>
    </section>
  );
}
