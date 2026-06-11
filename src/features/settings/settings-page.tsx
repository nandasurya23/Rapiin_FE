"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import {
  BUSINESS_MODE_OPTIONS,
  createBusinessResources,
  doesOperationalModelUseResources,
  getDefaultOperationalModel,
  NICHE_TEMPLATE_OPTIONS,
  OPERATIONAL_MODEL_OPTIONS,
  RESOURCE_LABEL_SUGGESTIONS,
} from "@/lib/constants/business";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";
import type { BusinessResource, OperationalModel } from "@/types/business";

type SettingsFormState = {
  name: string;
  whatsappNumber: string;
  mode: (typeof BUSINESS_MODE_OPTIONS)[number]["value"];
  niche: (typeof NICHE_TEMPLATE_OPTIONS)[number]["value"];
  operationalModel: OperationalModel;
  resourceLabel: string;
  resourceCount: string;
  defaultBookingDurationMinutes: string;
  openingHours: string;
  address: string;
  description: string;
  resources: BusinessResource[];
};

type FormErrors = Partial<Record<keyof SettingsFormState, string>> & {
  resources?: string;
};

function createFormStateFromBusiness(business: ReturnType<typeof useAppData>["business"]): SettingsFormState {
  return {
    name: business.name,
    whatsappNumber: business.whatsappNumber,
    mode: business.mode,
    niche: business.niche,
    operationalModel: business.operationalModel,
    resourceLabel: business.resourceLabel ?? "Slot",
    resourceCount: String(business.resourceCount ?? business.resources?.length ?? 1),
    defaultBookingDurationMinutes: String(business.defaultBookingDurationMinutes ?? 60),
    openingHours: business.openingHours ?? "",
    address: business.address ?? "",
    description: business.description,
    resources: business.resources ?? [],
  };
}

function buildResources(resourceLabel: string, resourceCount: string, currentResources: BusinessResource[]) {
  const safeLabel = resourceLabel.trim() || "Slot";
  const safeCount = Math.max(1, Number(resourceCount) || 1);
  const fallbackResources = createBusinessResources(safeLabel, safeCount);

  return Array.from({ length: Math.max(currentResources.length, safeCount) }, (_, index) => {
    const existing = currentResources[index];
    const fallback = fallbackResources[index] ?? {
      id: `res_${index + 1}`,
      name: `${safeLabel} ${index + 1}`,
      isActive: false,
    };

    return {
      id: existing?.id ?? fallback.id,
      name: existing?.name ?? fallback.name,
      isActive: index < safeCount ? existing?.isActive ?? true : false,
    };
  });
}

export function SettingsPage() {
  const toast = useToast();
  const { business, orders, saveBusinessSettings } = useAppData();
  const [form, setForm] = useState<SettingsFormState>(createFormStateFromBusiness(business));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(createFormStateFromBusiness(business));
  }, [business]);

  const usesResources = form.operationalModel === "RESOURCE_BOOKING";
  const modeOptions = useMemo(
    () =>
      form.mode === "BOOKING_SERVICE"
        ? OPERATIONAL_MODEL_OPTIONS.filter((option) => option.value !== "ORDER_REQUEST")
        : OPERATIONAL_MODEL_OPTIONS.filter((option) => option.value === "ORDER_REQUEST"),
    [form.mode]
  );
  const referencedResourceIds = useMemo(
    () => new Set(orders.map((order) => order.resourceId).filter(Boolean)),
    [orders]
  );

  function updateForm<K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) {
    setErrors({});
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Nama bisnis wajib diisi.";
    }

    if (!form.whatsappNumber.trim()) {
      nextErrors.whatsappNumber = "Nomor WhatsApp wajib diisi.";
    } else if (!isValidPhoneNumber(form.whatsappNumber)) {
      nextErrors.whatsappNumber = "Nomor WhatsApp harus 9-15 digit angka.";
    }

    if (form.mode === "BOOKING_SERVICE") {
      const parsedDuration = Number(form.defaultBookingDurationMinutes);
      if (!Number.isFinite(parsedDuration) || parsedDuration < 15) {
        nextErrors.defaultBookingDurationMinutes = "Durasi default minimal 15 menit.";
      }
    }

    if (usesResources) {
      if (!form.resourceLabel.trim()) {
        nextErrors.resourceLabel = "Nama unit wajib diisi.";
      }

      const parsedCount = Number(form.resourceCount);
      if (!Number.isFinite(parsedCount) || parsedCount < 1) {
        nextErrors.resourceCount = "Jumlah unit minimal 1.";
      }

      if (form.resources.some((resource) => !resource.name.trim())) {
        nextErrors.resources = "Nama unit tidak boleh kosong.";
      }

      if (!form.resources.some((resource) => resource.isActive)) {
        nextErrors.resources = "Minimal ada 1 unit aktif.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 220));

      saveBusinessSettings({
        name: form.name.trim(),
        whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
        mode: form.mode,
        niche: form.niche,
        operationalModel: form.operationalModel,
        usesResources,
        resourceLabel: usesResources ? form.resourceLabel.trim() : undefined,
        resourceCount: usesResources ? Math.max(1, Number(form.resourceCount) || 1) : undefined,
        resources: usesResources ? form.resources : [],
        defaultBookingDurationMinutes:
          form.mode === "BOOKING_SERVICE" ? Math.max(15, Number(form.defaultBookingDurationMinutes) || 60) : undefined,
        openingHours: form.openingHours.trim() || undefined,
        address: form.address.trim() || undefined,
        description: form.description.trim(),
      });
      toast.success("Pengaturan bisnis disimpan", "Flow form dan booking sudah ikut menyesuaikan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  Pengaturan Operasional
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">Atur cara kerja bisnis</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Halaman ini jadi sumber kebenaran untuk form publik, order admin, kalender, dan availability.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">{form.mode}</Badge>
                <Badge tone={usesResources ? "warning" : "success"}>
                  {usesResources ? `${form.resourceLabel || "Unit"} aktif` : "Tanpa unit khusus"}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardBody className="space-y-5 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Profil bisnis</h2>
              <p className="text-sm text-text-secondary">Data dasar yang tampil di dashboard dan halaman publik.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Nama bisnis</span>
                <Input value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
                {errors.name ? <p className="mt-1 text-xs text-status-danger">{errors.name}</p> : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Nomor WhatsApp</span>
                <Input value={form.whatsappNumber} onChange={(event) => updateForm("whatsappNumber", event.target.value)} />
                {errors.whatsappNumber ? <p className="mt-1 text-xs text-status-danger">{errors.whatsappNumber}</p> : null}
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Mode bisnis</span>
                <Select
                  value={form.mode}
                  onValueChange={(value) => {
                    const nextMode = value as SettingsFormState["mode"];
                    const nextOperationalModel = nextMode === "BOOKING_SERVICE" ? form.operationalModel : getDefaultOperationalModel(nextMode);
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
                <span className="mb-2 block text-sm font-medium text-text-primary">Template niche</span>
                <Select value={form.niche} onValueChange={(value) => updateForm("niche", value as SettingsFormState["niche"])} options={NICHE_TEMPLATE_OPTIONS} />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-primary">Deskripsi singkat</span>
              <Textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Alamat</span>
                <Input value={form.address} onChange={(event) => updateForm("address", event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Jam operasional</span>
                <Input value={form.openingHours} onChange={(event) => updateForm("openingHours", event.target.value)} />
              </label>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Cara kerja bisnis</h2>
              <p className="text-sm text-text-secondary">Menentukan apakah customer pilih jadwal, unit, atau cukup kirim request.</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-primary">Model operasional</span>
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

            {form.mode === "BOOKING_SERVICE" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Durasi default booking (menit)</span>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={form.defaultBookingDurationMinutes}
                  onChange={(event) => updateForm("defaultBookingDurationMinutes", event.target.value)}
                />
                {errors.defaultBookingDurationMinutes ? (
                  <p className="mt-1 text-xs text-status-danger">{errors.defaultBookingDurationMinutes}</p>
                ) : null}
              </label>
            ) : (
              <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-4 text-sm text-text-secondary">
                Untuk mode ini, customer tidak perlu pilih tanggal dan jam. Form publik akan fokus ke detail order / request.
              </div>
            )}

            {form.mode === "BOOKING_SERVICE" && form.operationalModel === "APPOINTMENT" ? (
              <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-4 text-sm text-text-secondary">
                Cocok untuk salon, barber, tattoo, dan jasa yang cukup pakai jadwal global tanpa pemilihan unit.
              </div>
            ) : null}

            {usesResources ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-4 text-sm text-text-secondary">
                Customer publik tidak memilih unit langsung. Sistem hanya cek slot global yang masih tersedia, lalu admin menetapkan unit dari halaman order.
              </div>
            ) : null}
          </CardBody>
        </Card>
      </section>

      {usesResources ? (
        <section>
          <Card>
            <CardBody className="space-y-5 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Unit / Slot</h2>
                  <p className="text-sm text-text-secondary">
                    Dipakai untuk studio, PS, billiard, futsal, badminton, room rental, dan bisnis sejenis.
                  </p>
                </div>
                <Badge tone="info">{form.resources.filter((resource) => resource.isActive).length} unit aktif</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-primary">Label unit</span>
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
                    placeholder="Contoh: Meja, Studio, Lapangan, Court"
                  />
                  {errors.resourceLabel ? <p className="mt-1 text-xs text-status-danger">{errors.resourceLabel}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
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
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary transition hover:bg-muted"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-primary">Jumlah unit target</span>
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
                  {errors.resourceCount ? <p className="mt-1 text-xs text-status-danger">{errors.resourceCount}</p> : null}
                </label>
              </div>

              <div className="space-y-3">
                {form.resources.map((resource, index) => {
                  const isReferenced = referencedResourceIds.has(resource.id);

                  return (
                    <div key={resource.id} className="grid gap-3 rounded-xl border border-border/80 bg-muted/20 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto]">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-text-primary">
                          {form.resourceLabel || "Unit"} {index + 1}
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

                      <div className="flex flex-wrap items-end gap-2">
                        <Badge tone={resource.isActive ? "success" : "neutral"}>
                          {resource.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                        {isReferenced ? <Badge tone="warning">Pernah dipakai order</Badge> : null}
                        <Button
                          type="button"
                          variant="secondary"
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

              {errors.resources ? <p className="text-sm text-status-danger">{errors.resources}</p> : null}

              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    resourceCount: String(current.resources.length + 1),
                    resources: [
                      ...current.resources,
                      {
                        id: `res_${current.resources.length + 1}`,
                        name: `${current.resourceLabel.trim() || "Slot"} ${current.resources.length + 1}`,
                        isActive: true,
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-700"
              >
                <PlusCircle className="h-4 w-4" />
                Tambah unit baru
              </button>
            </CardBody>
          </Card>
        </section>
      ) : null}

      <section>
        <Card className="border-border/80">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Catatan perubahan</h2>
                <p className="text-sm text-text-secondary">
                  Perubahan di sini langsung memengaruhi dashboard, form publik, order admin, dan perhitungan slot.
                </p>
              </div>
              {business.operationalModel === "RESOURCE_BOOKING" && form.operationalModel === "APPOINTMENT" ? (
                <Badge tone="warning">Ada perpindahan model</Badge>
              ) : null}
            </div>

            {business.operationalModel === "RESOURCE_BOOKING" && form.operationalModel === "APPOINTMENT" ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-4 text-sm text-text-secondary">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                  <p>
                    Resource lama tidak dihapus. Booking lama tetap terbaca, tapi booking baru akan memakai jadwal global tanpa unit.
                  </p>
                </div>
              </div>
            ) : null}

            <Button type="button" isLoading={isSaving} onClick={() => void handleSave()}>
              Simpan Pengaturan
            </Button>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
