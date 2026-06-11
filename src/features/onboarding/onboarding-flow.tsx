"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import {
  BUSINESS_MODE_OPTIONS,
  createBusinessResources,
  doesOperationalModelUseResources,
  getDefaultOperationalModel,
  NICHE_TEMPLATE_OPTIONS,
  OPERATIONAL_MODEL_OPTIONS,
  RESOURCE_LABEL_SUGGESTIONS,
} from "@/lib/constants/business";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";
import type { BusinessResource, OperationalModel } from "@/types/business";

type Step = 1 | 2 | 3 | 4 | 5;

export function OnboardingFlow() {
  const router = useRouter();
  const toast = useToast();
  const { business, hydrated, completeOnboarding } = useAppData();
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<{
    name?: string;
    whatsappNumber?: string;
    resourceLabel?: string;
    resourceCount?: string;
    resources?: string;
  }>({});
  const [form, setForm] = useState({
    name: business.name,
    whatsappNumber: business.whatsappNumber,
    mode: business.mode,
    operationalModel: business.operationalModel,
    usesResources: business.usesResources,
    resourceLabel: business.resourceLabel ?? "Slot",
    resourceCount: String(business.resourceCount ?? 1),
    resources: business.resources ?? [],
    defaultBookingDurationMinutes: String(business.defaultBookingDurationMinutes ?? 60),
    niche: business.niche,
    description: business.description,
  });

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setForm({
      name: business.name,
      whatsappNumber: business.whatsappNumber,
      mode: business.mode,
      operationalModel: business.operationalModel,
      usesResources: business.usesResources,
      resourceLabel: business.resourceLabel ?? "Slot",
      resourceCount: String(business.resourceCount ?? 1),
      resources: business.resources ?? [],
      defaultBookingDurationMinutes: String(business.defaultBookingDurationMinutes ?? 60),
      niche: business.niche,
      description: business.description,
    });
  }, [business.defaultBookingDurationMinutes, business.description, business.mode, business.name, business.niche, business.operationalModel, business.resourceCount, business.resourceLabel, business.resources, business.usesResources, business.whatsappNumber, hydrated]);

  const progress = useMemo(() => `${step} / 5`, [step]);

  function updateResources(resourceLabel: string, resourceCount: string) {
    const count = Math.max(1, Number(resourceCount) || 1);
    return createBusinessResources(resourceLabel, count);
  }

  function validateStep(currentStep: Step) {
    const nextErrors: typeof errors = {};

    if (currentStep === 1) {
      if (!form.name.trim()) {
        nextErrors.name = "Nama bisnis wajib diisi.";
      }

      if (!form.whatsappNumber.trim()) {
        nextErrors.whatsappNumber = "Nomor WhatsApp wajib diisi.";
      } else if (!isValidPhoneNumber(form.whatsappNumber)) {
        nextErrors.whatsappNumber = "Nomor WhatsApp harus 9-15 digit angka.";
      }
    }

    if (currentStep === 4 && form.usesResources) {
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
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function next() {
    if (!validateStep(step)) {
      return;
    }

    setStep((current) => Math.min(5, current + 1) as Step);
  }

  function back() {
    setStep((current) => Math.max(1, current - 1) as Step);
  }

  async function finish() {
    completeOnboarding({
      ...form,
      whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
      resourceCount: form.usesResources ? Math.max(1, Number(form.resourceCount) || 1) : undefined,
      resources: form.usesResources ? form.resources : [],
      defaultBookingDurationMinutes:
        form.mode === "BOOKING_SERVICE" ? Math.max(15, Number(form.defaultBookingDurationMinutes) || 60) : undefined,
    });
    toast.success("Setup bisnis selesai", "Dashboard siap dipakai.");
    await new Promise((resolve) => setTimeout(resolve, 180));
    router.push(ROUTES.dashboard);
  }

  function handleModeChange(nextMode: typeof form.mode) {
    const nextOperationalModel = nextMode === "BOOKING_SERVICE" ? form.operationalModel : getDefaultOperationalModel(nextMode);
    const nextUsesResources = nextMode === "BOOKING_SERVICE" && doesOperationalModelUseResources(nextOperationalModel);
    const nextResources = nextUsesResources ? updateResources(form.resourceLabel, form.resourceCount) : [];

    setForm((current) => ({
      ...current,
      mode: nextMode,
      operationalModel: nextOperationalModel,
      usesResources: nextUsesResources,
      resources: nextResources,
    }));
  }

  function handleOperationalModelChange(nextOperationalModel: OperationalModel) {
    const nextUsesResources = doesOperationalModelUseResources(nextOperationalModel);
    setForm((current) => ({
      ...current,
      operationalModel: nextOperationalModel,
      usesResources: nextUsesResources,
      resources: nextUsesResources ? updateResources(current.resourceLabel, current.resourceCount) : [],
    }));
  }

  function updateResourceNames(updater: (current: BusinessResource[]) => BusinessResource[]) {
    setForm((current) => ({
      ...current,
      resources: updater(current.resources),
    }));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardBody className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-700">Onboarding bisnis</p>
              <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Siapkan bisnis kamu</h1>
            </div>
            <div className="rounded-md bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">{progress}</div>
          </div>

          {step === 1 ? (
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Nama bisnis</span>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Contoh: Rapiin Studio"
                />
                {errors.name ? <p className="mt-1 text-xs text-status-danger">{errors.name}</p> : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Nomor WhatsApp bisnis</span>
                <Input
                  value={form.whatsappNumber}
                  onChange={(event) => setForm((current) => ({ ...current, whatsappNumber: event.target.value }))}
                  placeholder="08123456789"
                />
                {errors.whatsappNumber ? <p className="mt-1 text-xs text-status-danger">{errors.whatsappNumber}</p> : null}
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <p className="text-sm text-text-secondary">Pilih cara jualan yang paling dekat dengan bisnismu.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {BUSINESS_MODE_OPTIONS.map((option) => {
                  const active = form.mode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleModeChange(option.value)}
                      className={`rounded-xl border p-4 text-left transition ${
                        active ? "border-brand-500 bg-brand-50" : "border-border bg-surface hover:bg-muted"
                      }`}
                    >
                      <div className="text-sm font-semibold text-text-primary">{option.label}</div>
                      <p className="mt-2 text-sm text-text-secondary">{option.helperText}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4">
              {form.mode === "BOOKING_SERVICE" ? (
                <>
                  <p className="text-sm text-text-secondary">Pilih cara kerja booking yang paling dekat dengan operasional bisnismu.</p>
                  <div className="grid gap-3">
                    {OPERATIONAL_MODEL_OPTIONS.filter((option) => option.value !== "ORDER_REQUEST").map((option) => {
                      const active = form.operationalModel === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleOperationalModelChange(option.value)}
                          className={`rounded-xl border p-4 text-left transition ${
                            active ? "border-brand-500 bg-brand-50" : "border-border bg-surface hover:bg-muted"
                          }`}
                        >
                          <div className="text-sm font-semibold text-text-primary">{option.label}</div>
                          <p className="mt-2 text-sm text-text-secondary">{option.helperText}</p>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <Card className="bg-muted/25">
                  <CardBody className="space-y-2 p-5">
                    <p className="text-sm font-medium text-text-primary">Cara kerja bisnis</p>
                    <p className="text-sm text-text-secondary">
                      Untuk bisnis order/request, customer tidak perlu pilih slot atau unit. Customer cukup kirim detail order atau request.
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-4">
              {form.mode === "BOOKING_SERVICE" ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Durasi default booking (menit)</span>
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      value={form.defaultBookingDurationMinutes}
                      onChange={(event) => setForm((current) => ({ ...current, defaultBookingDurationMinutes: event.target.value }))}
                      placeholder="60"
                    />
                  </label>

                  {form.usesResources ? (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-text-primary">Nama unit</span>
                        <Input
                          value={form.resourceLabel}
                          onChange={(event) => {
                            const nextLabel = event.target.value;
                            setForm((current) => ({
                              ...current,
                              resourceLabel: nextLabel,
                              resources: updateResources(nextLabel, current.resourceCount),
                            }));
                          }}
                          placeholder="Contoh: Lapangan, Meja, PS, Room"
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
                                  resources: updateResources(label, current.resourceCount),
                                }))
                              }
                              className="rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary hover:bg-muted"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-text-primary">Jumlah unit</span>
                        <Input
                          type="number"
                          min={1}
                          value={form.resourceCount}
                          onChange={(event) => {
                            const nextCount = event.target.value;
                            setForm((current) => ({
                              ...current,
                              resourceCount: nextCount,
                              resources: updateResources(current.resourceLabel, nextCount),
                            }));
                          }}
                          placeholder="2"
                        />
                        {errors.resourceCount ? <p className="mt-1 text-xs text-status-danger">{errors.resourceCount}</p> : null}
                      </label>
                      <div className="grid gap-3">
                        <p className="text-sm font-medium text-text-primary">Nama tiap unit</p>
                        {form.resources.map((resource, index) => (
                          <label key={resource.id} className="block">
                            <span className="mb-2 block text-sm text-text-secondary">Unit {index + 1}</span>
                            <Input
                              value={resource.name}
                              onChange={(event) =>
                                updateResourceNames((current) =>
                                  current.map((item) => (item.id === resource.id ? { ...item, name: event.target.value } : item))
                                )
                              }
                            />
                          </label>
                        ))}
                        {errors.resources ? <p className="text-xs text-status-danger">{errors.resources}</p> : null}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <Card className="bg-muted/25">
                  <CardBody className="space-y-2 p-5">
                    <p className="text-sm font-medium text-text-primary">Flow customer</p>
                    <p className="text-sm text-text-secondary">
                      Customer akan kirim order atau request tanpa pilih slot. Detail seperti jumlah, deadline, budget, dan catatan akan muncul sesuai mode bisnis.
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Pilih template niche</span>
                <Select
                  value={form.niche}
                  onValueChange={(value) => setForm((current) => ({ ...current, niche: value as typeof form.niche }))}
                  options={NICHE_TEMPLATE_OPTIONS}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Deskripsi singkat</span>
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Contoh: Booking studio, follow-up cepat, dan nota sederhana."
                />
              </label>
              <Card className="bg-brand-50">
                <CardBody className="space-y-3 p-5">
                  <p className="text-sm font-medium text-brand-800">Dashboard kamu sudah siap</p>
                  <p className="text-sm text-text-secondary">
                    Sekarang kamu bisa mulai tambah customer, catat order, atau bagikan link bisnis dengan flow yang sesuai cara kerja usahamu.
                  </p>
                  <div className="rounded-lg border border-brand-100 bg-white/70 px-4 py-3 text-sm text-text-secondary">
                    <p className="font-medium text-text-primary">Ringkasan setup</p>
                    <p className="mt-1">Mode bisnis: {BUSINESS_MODE_OPTIONS.find((option) => option.value === form.mode)?.label}</p>
                    <p className="mt-1">
                      Cara kerja:{" "}
                      {form.mode === "BOOKING_SERVICE"
                        ? OPERATIONAL_MODEL_OPTIONS.find((option) => option.value === form.operationalModel)?.label
                        : "Customer kirim order / request"}
                    </p>
                    {form.usesResources ? <p className="mt-1">Unit aktif: {form.resources.map((resource) => resource.name).join(", ")}</p> : null}
                  </div>
                </CardBody>
              </Card>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button type="button" variant="secondary" onClick={() => void finish()}>
                  Tambah Order Pertama
                </Button>
                <Button type="button" variant="secondary" onClick={() => void finish()}>
                  Bagikan Link Bisnis
                </Button>
                <Button type="button" onClick={() => void finish()}>
                  Lihat Dashboard
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={back} disabled={step === 1}>
              Kembali
            </Button>
            {step < 5 ? (
              <Button type="button" onClick={next}>
                {step === 4 ? "Review Setup" : "Lanjut"}
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
