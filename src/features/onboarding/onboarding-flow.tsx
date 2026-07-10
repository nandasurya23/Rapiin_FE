"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { PageHeader } from "@/components/shared/page-header";
import {
  BUSINESS_MODE_OPTIONS,
  createBusinessResources,
  doesOperationalModelUseResources,
  getDefaultOperationalModel,
  OPERATIONAL_MODEL_OPTIONS,
} from "@/lib/constants/business";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";
import { normalizePhoneNumber } from "@/lib/validation";
import type { OperationalModel } from "@/types/business";

type Step = 1 | 2 | 3;

export function OnboardingFlow() {
  const router = useRouter();
  const toast = useToast();
  const { business, hydrated, completeOnboarding, currentUser, auth } = useAppData();
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<{
    name?: string;
    whatsappNumber?: string;
    resourceLabel?: string;
    resourceCount?: string;
    resources?: string;
    niche?: string;
    description?: string;
  }>({});
  const [form, setForm] = useState({
    name: business.name,
    whatsappNumber: currentUser?.phoneNumber || business.whatsappNumber || "",
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
      whatsappNumber: currentUser?.phoneNumber || business.whatsappNumber || "",
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
  }, [business.defaultBookingDurationMinutes, business.description, business.mode, business.name, business.niche, business.operationalModel, business.resourceCount, business.resourceLabel, business.resources, business.usesResources, business.whatsappNumber, hydrated, currentUser?.phoneNumber]);

  // Route Guard: Lindungi halaman onboarding dari akses tanpa auth atau jika sudah onboarded
  useEffect(() => {
    if (!hydrated) return;

    if (!currentUser) {
      router.replace(ROUTES.login);
      return;
    }

    if (auth.onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [hydrated, currentUser, auth.onboardingCompleted, router]);



  const progress = useMemo(() => {
    return `${step} / 3`;
  }, [step]);

  function updateResources(resourceLabel: string, resourceCount: string) {
    const count = Math.max(1, Number(resourceCount) || 1);
    return createBusinessResources(resourceLabel, count);
  }

  function validateStep(currentStep: Step) {
    const nextErrors: typeof errors = {};

    if (currentStep === 1) {
      if (!form.name.trim()) {
        nextErrors.name = "Nama bisnis wajib diisi.";
      } else if (form.name.trim().length < 2) {
        nextErrors.name = "Nama bisnis minimal 2 karakter.";
      }
    }

    if (currentStep === 2) {
      if (form.usesResources) {
        if (!form.resourceLabel.trim()) {
          nextErrors.resourceLabel = "Sebutan unit/tim wajib diisi.";
        }
        const count = Number(form.resourceCount);
        if (!form.resourceCount.trim() || isNaN(count) || count < 1) {
          nextErrors.resourceCount = "Jumlah unit/tim minimal 1.";
        }
      }
    }

    if (currentStep === 3) {
      if (!form.niche.trim()) {
        nextErrors.niche = "Kategori bisnis wajib diisi.";
      } else if (form.niche.trim().length < 2) {
        nextErrors.niche = "Kategori bisnis minimal 2 karakter.";
      } else if (form.niche.trim().length > 100) {
        nextErrors.niche = "Kategori bisnis maksimal 100 karakter.";
      }

      if (form.description && form.description.trim().length > 500) {
        nextErrors.description = "Deskripsi maksimal 500 karakter.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function next() {
    if (!validateStep(step)) {
      return;
    }
    setStep((current) => Math.min(3, current + 1) as Step);
  }

  function back() {
    setStep((current) => Math.max(1, current - 1) as Step);
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function finish() {
    if (!validateStep(3)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        ...form,
        whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
        resourceCount: form.usesResources ? Math.max(1, Number(form.resourceCount) || 1) : undefined,
        resources: form.usesResources ? form.resources : [],
        defaultBookingDurationMinutes:
          form.mode === "BOOKING_SERVICE" ? Math.max(15, Number(form.defaultBookingDurationMinutes) || 60) : undefined,
      });
      toast.success("Setup bisnis selesai", "Dashboard siap dipakai.");
      await new Promise((resolve) => setTimeout(resolve, 180));
      router.push("/dashboard");
    } catch (err) {
      toast.error("Gagal memproses onboarding", err instanceof Error ? err.message : "Kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
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


  const stepTitles: Record<number, { title: string; subtitle: string }> = {
    1: { title: "Info Dasar Bisnis", subtitle: "Nama dan nomor WhatsApp aktif bisnis kamu." },
    2: { title: "Mode Operasi", subtitle: "Cara jualan yang paling sesuai dengan model bisnismu." },
    3: { title: "Kategori & Finalisasi", subtitle: "Pilih kategori dan deskripsi untuk landing page publikmu." },
  };
  const currentStepInfo = stepTitles[step] ?? stepTitles[1];

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">

        {/* HERO BANNER */}
        <PageHeader
          variant="hero"
          title={currentStepInfo.title}
          description={currentStepInfo.subtitle}
          badge={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3 w-3" />
              Setup Bisnis
            </span>
          }
          action={
            <div className="flex items-center gap-3 sm:shrink-0">
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
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
          }
        />

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

            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-6">
              <div className="grid gap-4">
                <p className="text-sm font-extrabold text-[var(--color-text)]">1. Cara Jualan</p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">Pilih cara jualan yang paling dekat dengan model bisnismu.</p>
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

              {form.mode === "BOOKING_SERVICE" ? (
                <div className="grid gap-4 pt-4 border-t border-[var(--color-border)]">
                  <p className="text-sm font-extrabold text-[var(--color-text)]">2. Cara Kerja Booking</p>
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
                </div>
              ) : null}

              {form.usesResources ? (
                <div className="grid gap-4 pt-4 border-t border-[var(--color-border)]">
                  <p className="text-sm font-extrabold text-[var(--color-text)]">3. Setup Unit/Tim</p>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Karena pelanggan akan memesan unit/staf tertentu, mari siapkan unit/tim Anda.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Sebutan (Contoh: Staf, Lapangan, Ruangan)</span>
                      <Input
                        value={form.resourceLabel}
                        onChange={(e) => setForm(c => ({ ...c, resourceLabel: e.target.value, resources: updateResources(e.target.value, c.resourceCount) }))}
                        placeholder="Contoh: Lapangan"
                      />
                      {errors.resourceLabel ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.resourceLabel}</p> : null}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Jumlah {form.resourceLabel || "Unit"}</span>
                      <Input
                        type="number"
                        min="1"
                        value={form.resourceCount}
                        onChange={(e) => setForm(c => ({ ...c, resourceCount: e.target.value, resources: updateResources(c.resourceLabel, e.target.value) }))}
                      />
                      {errors.resourceCount ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.resourceCount}</p> : null}
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Kategori Bisnis</span>
                <Input
                  value={form.niche}
                  onChange={(e) => setForm((current) => ({ ...current, niche: e.target.value }))}
                  placeholder="Contoh: Warnet, Barbershop, Rental PS, Futsal, Laundry..."
                />
                {errors.niche ? (
                  <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.niche}</p>
                ) : (
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    💡 Tulis kategori bisnis Anda secara bebas sesuai jenis usaha yang dijalankan.
                  </p>
                )}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Deskripsi Singkat Bisnis</span>
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Contoh: Booking studio, follow-up cepat, dan nota sederhana."
                />
                {errors.description ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.description}</p> : null}
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
                <Button type="button" variant="secondary" className="rounded-xl h-11 text-xs font-bold" onClick={() => void finish()} isLoading={isSubmitting} disabled={isSubmitting}>
                  Tambah Order Pertama
                </Button>
                <Button type="button" variant="secondary" className="rounded-xl h-11 text-xs font-bold" onClick={() => void finish()} isLoading={isSubmitting} disabled={isSubmitting}>
                  Bagikan Link Bisnis
                </Button>
                <Button type="button" className="rounded-xl h-11 font-bold" onClick={() => void finish()} isLoading={isSubmitting} disabled={isSubmitting}>
                  Lihat Dashboard
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5">
            <Button type="button" variant="secondary" className="rounded-xl h-11 px-5 font-bold text-sm" onClick={back} disabled={step === 1 || isSubmitting}>
              ← Kembali
            </Button>
            {step < 3 ? (
              <Button type="button" className="rounded-xl h-11 px-5 font-bold text-sm" onClick={next}>
                {step === 2 ? "Review Setup →" : "Lanjut →"}
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
