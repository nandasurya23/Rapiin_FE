"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
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
    resourceLabel: business.resourceLabel ?? "Staf",
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
      resourceLabel: business.resourceLabel ?? "Staf",
      resourceCount: String(business.resourceCount ?? 1),
      resources: business.resources ?? [],
      defaultBookingDurationMinutes: String(business.defaultBookingDurationMinutes ?? 60),
      niche: business.niche,
      description: business.description,
    });
  }, [business.defaultBookingDurationMinutes, business.description, business.mode, business.name, business.niche, business.operationalModel, business.resourceCount, business.resourceLabel, business.resources, business.usesResources, business.whatsappNumber, hydrated]);

  // Auto-detect niche based on business name keywords
  useEffect(() => {
    const nameLower = form.name.toLowerCase().trim();
    if (!nameLower) return;

    if (nameLower.match(/barber|cukur|pangkas|rambut|salon|potong/i)) {
      setForm((current) => current.niche === "BARBERSHOP" ? current : { ...current, niche: "BARBERSHOP" });
    } else if (nameLower.match(/studio|musik|band|sound|rekaman|latihan/i)) {
      setForm((current) => current.niche === "STUDIO_MUSIK" ? current : { ...current, niche: "STUDIO_MUSIK" });
    } else if (nameLower.match(/tato|tattoo|ink/i)) {
      setForm((current) => current.niche === "TATTOO" ? current : { ...current, niche: "TATTOO" });
    } else if (nameLower.match(/sewa|rental|rent|car|motor|kamera/i)) {
      setForm((current) => current.niche === "RENTAL" ? current : { ...current, niche: "RENTAL" });
    } else if (nameLower.match(/tour|travel|trip|wisata|piknik|liburan/i)) {
      setForm((current) => current.niche === "TOUR" ? current : { ...current, niche: "TOUR" });
    } else if (nameLower.match(/laundry|cuci|setrika|kiloan/i)) {
      setForm((current) => current.niche === "LAUNDRY" ? current : { ...current, niche: "LAUNDRY" });
    } else if (nameLower.match(/katering|catering|makanan|warung|resto|cafe|kopi|coffee|nasi|bakso|mie|dapur|kitchen/i)) {
      setForm((current) => current.niche === "MAKANAN" ? current : { ...current, niche: "MAKANAN" });
    } else if (nameLower.match(/craft|handmade|art|bunga|florist|souvenir|rajut|gift/i)) {
      setForm((current) => current.niche === "HANDMADE" ? current : { ...current, niche: "HANDMADE" });
    }
  }, [form.name]);

  const progress = useMemo(() => {
    if (form.mode !== "BOOKING_SERVICE") {
      const mappedStep = step === 5 ? 3 : step;
      return `${mappedStep} / 3`;
    }
    return `${step} / 5`;
  }, [step, form.mode]);

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

    if (step === 2 && form.mode !== "BOOKING_SERVICE") {
      setStep(5);
    } else {
      setStep((current) => Math.min(5, current + 1) as Step);
    }
  }

  function back() {
    if (step === 5 && form.mode !== "BOOKING_SERVICE") {
      setStep(2);
    } else {
      setStep((current) => Math.max(1, current - 1) as Step);
    }
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

  const stepTitles: Record<number, { title: string; subtitle: string }> = {
    1: { title: "Info Dasar Bisnis", subtitle: "Nama dan nomor WhatsApp aktif bisnis kamu." },
    2: { title: "Mode Operasi", subtitle: "Cara jualan yang paling sesuai dengan model bisnismu." },
    3: { title: "Cara Kerja Booking", subtitle: "Pengaturan slot atau request untuk layananmu." },
    4: { title: "Konfigurasi Unit", subtitle: "Durasi dan sumber daya (jika ada) untuk booking." },
    5: { title: "Template & Finalisasi", subtitle: "Pilih niche dan deskripsi untuk landing page publikmu." },
  };
  const currentStepInfo = stepTitles[step] ?? stepTitles[1];

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">

        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] px-6 py-6 sm:px-8 sm:py-7 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                <Sparkles className="h-3 w-3" />
                Setup Bisnis
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                {currentStepInfo.title}
              </h1>
              <p className="text-sm text-white/60 leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-3 sm:shrink-0">
              <div className="flex gap-1.5">
                {(form.mode === "BOOKING_SERVICE" ? [1, 2, 3, 4, 5] : [1, 2, 5]).map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                      s < step ? "bg-amber-400" : s === step ? "bg-white" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <span className="rounded-xl bg-white/10 border border-white/[0.12] px-3 py-1 text-xs font-extrabold text-white">
                {progress}
              </span>
            </div>
          </div>
        </div>

        <Card className="w-full border-[var(--color-border)] shadow-[var(--shadow-md)]">
          <CardBody className="space-y-6 p-6 sm:p-8">

          {step === 1 ? (
            <div className="grid gap-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nama Bisnis</span>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Contoh: Rapiin Studio"
                />
                {errors.name ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.name}</p> : null}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nomor WhatsApp Bisnis</span>
                <Input
                  value={form.whatsappNumber}
                  onChange={(event) => setForm((current) => ({ ...current, whatsappNumber: event.target.value }))}
                  placeholder="08123456789"
                />
                {errors.whatsappNumber ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.whatsappNumber}</p> : null}
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">Pilih cara jualan yang paling dekat dengan bisnismu.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {BUSINESS_MODE_OPTIONS.map((option) => {
                  const active = form.mode === option.value;
                  const hasExamples = option.helperText.includes("Contoh:");
                  const mainText = hasExamples ? option.helperText.split("Contoh:")[0].trim() : option.helperText;
                  const examplesText = hasExamples ? option.helperText.split("Contoh:")[1].trim() : "";

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleModeChange(option.value)}
                      className={`rounded-2xl border p-4 text-left transition-all duration-200 relative flex flex-col justify-between ${
                        active
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]/60 ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]"
                      }`}
                    >
                      {active && (
                        <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-[var(--color-primary)]" />
                      )}
                      <div>
                        <div className="text-sm font-extrabold text-[var(--color-text)]">{option.label}</div>
                        <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">{mainText}</p>
                      </div>
                      {hasExamples && (
                        <div className="mt-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]/40 px-2.5 py-2 text-[10px] text-[var(--color-text-muted)] font-bold leading-normal">
                          <span className="text-[var(--color-primary)] font-extrabold">Contoh:</span> {examplesText}
                        </div>
                      )}
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
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">Pilih cara kerja booking yang paling dekat dengan operasional bisnismu.</p>
                  <div className="grid gap-3">
                    {OPERATIONAL_MODEL_OPTIONS.filter((option) => option.value !== "ORDER_REQUEST").map((option) => {
                      const active = form.operationalModel === option.value;
                      const hasExamples = option.helperText.includes("Contoh:");
                      const mainText = hasExamples ? option.helperText.split("Contoh:")[0].trim() : option.helperText;
                      const examplesText = hasExamples ? option.helperText.split("Contoh:")[1].trim() : "";

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleOperationalModelChange(option.value)}
                          className={`rounded-2xl border p-4 text-left transition-all duration-200 relative flex flex-col justify-between ${
                            active
                              ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]/60 ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]"
                          }`}
                        >
                          {active && (
                            <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-[var(--color-primary)]" />
                          )}
                          <div>
                            <div className="text-sm font-extrabold text-[var(--color-text)]">{option.label}</div>
                            <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">{mainText}</p>
                          </div>
                          {hasExamples && (
                            <div className="mt-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]/40 px-2.5 py-2 text-[10px] text-[var(--color-text-muted)] font-bold leading-normal">
                              <span className="text-[var(--color-primary)] font-extrabold">Contoh:</span> {examplesText}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 space-y-2">
                  <p className="text-sm font-extrabold text-[var(--color-text)]">Cara kerja bisnis</p>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Untuk bisnis order/request, customer tidak perlu pilih slot atau unit. Customer cukup kirim detail order atau request.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-5">
              {form.mode === "BOOKING_SERVICE" ? (
                <>
                  <div className="block space-y-2">
                    <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Durasi Default Pertemuan</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "15 Menit", value: "15" },
                        { label: "30 Menit", value: "30" },
                        { label: "45 Menit", value: "45" },
                        { label: "1 Jam", value: "60" },
                        { label: "90 Menit", value: "90" },
                        { label: "2 Jam", value: "120" },
                      ].map((opt) => {
                        const active = form.defaultBookingDurationMinutes === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, defaultBookingDurationMinutes: opt.value }))}
                            className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                              active
                                ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)]"
                                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const val = form.defaultBookingDurationMinutes;
                          if (val === "15" || val === "30" || val === "45" || val === "60" || val === "90" || val === "120") {
                            setForm((current) => ({ ...current, defaultBookingDurationMinutes: "40" }));
                          }
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                          form.defaultBookingDurationMinutes !== "15" &&
                          form.defaultBookingDurationMinutes !== "30" &&
                          form.defaultBookingDurationMinutes !== "45" &&
                          form.defaultBookingDurationMinutes !== "60" &&
                          form.defaultBookingDurationMinutes !== "90" &&
                          form.defaultBookingDurationMinutes !== "120"
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)]"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                        }`}
                      >
                        Kustom
                      </button>
                    </div>

                    {form.defaultBookingDurationMinutes !== "15" &&
                      form.defaultBookingDurationMinutes !== "30" &&
                      form.defaultBookingDurationMinutes !== "45" &&
                      form.defaultBookingDurationMinutes !== "60" &&
                      form.defaultBookingDurationMinutes !== "90" &&
                      form.defaultBookingDurationMinutes !== "120" && (
                        <div className="mt-2.5 animate-fade-in max-w-[220px] space-y-1">
                          <Input
                            type="number"
                            min={15}
                            step={15}
                            value={form.defaultBookingDurationMinutes}
                            onChange={(event) => setForm((current) => ({ ...current, defaultBookingDurationMinutes: event.target.value }))}
                            placeholder="Menit (contoh: 40)"
                          />
                          <span className="block text-[10px] text-[var(--color-text-secondary)]">Masukkan durasi dalam satuan menit.</span>
                        </div>
                      )}
                  </div>

                   {form.usesResources ? (
                    <>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Penyebutan Tim / Staf / Aset</span>
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
                          placeholder="Contoh: Staf, Kapster, Terapis, Ruangan, Meja"
                        />
                        {errors.resourceLabel ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.resourceLabel}</p> : null}
                        <div className="mt-3 flex flex-wrap gap-2">
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
                              className="rounded-xl border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)] transition-colors"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Jumlah Staf / Unit</span>
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
                        {errors.resourceCount ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.resourceCount}</p> : null}
                      </label>
                      <div className="grid gap-3">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Beri Nama Tiap Staf / Unit</p>
                        {form.resources.map((resource, index) => (
                          <label key={resource.id} className="block">
                            <span className="mb-1.5 block text-xs text-[var(--color-text-secondary)] font-semibold">{form.resourceLabel || "Tim/Staf"} {index + 1}</span>
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
                        {errors.resources ? <p className="text-xs text-[var(--color-danger)] font-medium">{errors.resources}</p> : null}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 space-y-2">
                  <p className="text-sm font-extrabold text-[var(--color-text)]">Flow Customer</p>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Customer akan kirim order atau request tanpa pilih slot. Detail seperti jumlah, deadline, budget, dan catatan akan muncul sesuai mode bisnis.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Template Niche Bisnis</span>
                <Select
                  value={form.niche}
                  onValueChange={(value) => setForm((current) => ({ ...current, niche: value as typeof form.niche }))}
                  options={NICHE_TEMPLATE_OPTIONS}
                />
                <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  💡 Kategori ini akan otomatis memuat contoh menu/layanan yang siap pakai di halaman booking Anda. Anda tidak perlu membuat daftar layanan dari nol!
                </p>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Deskripsi Singkat Bisnis</span>
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Contoh: Booking studio, follow-up cepat, dan nota sederhana."
                />
              </label>

              {/* Setup Summary Card */}
              <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary-surface)] to-[var(--color-surface-elevated)] p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />
                  <p className="font-extrabold text-[var(--color-text)]">Dashboard kamu sudah siap 🎉</p>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Sekarang kamu bisa mulai tambah customer, catat order, atau bagikan link bisnis dengan flow yang sesuai cara kerja usahamu.
                </p>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Ringkasan Setup</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-[var(--color-text)]"><span className="font-bold">Mode bisnis:</span> {BUSINESS_MODE_OPTIONS.find((option) => option.value === form.mode)?.label}</p>
                    <p className="text-[var(--color-text)]">
                      <span className="font-bold">Cara kerja:</span>{" "}
                      {form.mode === "BOOKING_SERVICE"
                        ? OPERATIONAL_MODEL_OPTIONS.find((option) => option.value === form.operationalModel)?.label
                        : "Customer kirim order / request"}
                    </p>
                    {form.usesResources ? <p className="text-[var(--color-text)]"><span className="font-bold">Unit aktif:</span> {form.resources.map((resource) => resource.name).join(", ")}</p> : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button type="button" variant="secondary" className="rounded-xl h-11 text-xs font-bold" onClick={() => void finish()}>
                  Tambah Order Pertama
                </Button>
                <Button type="button" variant="secondary" className="rounded-xl h-11 text-xs font-bold" onClick={() => void finish()}>
                  Bagikan Link Bisnis
                </Button>
                <Button type="button" className="rounded-xl h-11 font-bold" onClick={() => void finish()}>
                  Lihat Dashboard
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5">
            <Button type="button" variant="secondary" className="rounded-xl h-11 px-5 font-bold text-sm" onClick={back} disabled={step === 1}>
              ← Kembali
            </Button>
            {step < 5 ? (
              <Button type="button" className="rounded-xl h-11 px-5 font-bold text-sm" onClick={next}>
                {step === 4 ? "Review Setup →" : "Lanjut →"}
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
