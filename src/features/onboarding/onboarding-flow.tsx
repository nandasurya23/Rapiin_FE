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
import { createBusinessResources } from "@/lib/constants/business";
import type { BusinessResource } from "@/types/business";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";
import { normalizePhoneNumber } from "@/lib/validation";
import { Select } from "@/components/ui/select";

type Step = 1 | 2 | 3;

const NICHE_OPTIONS = [
  { value: "BARBERSHOP", label: "Barbershop" },
  { value: "SALON", label: "Salon / Studio Kecantikan" },
  { value: "NAIL_ART", label: "Nail Art / Kuku" },
  { value: "STUDIO_FOTO", label: "Studio Foto" },
  { value: "STUDIO_MUSIK", label: "Studio Musik / Rekaman" },
  { value: "SERVICE_AC", label: "Servis AC / Elektronik" },
  { value: "BENGKEL", label: "Bengkel Mobil / Motor" },
  { value: "LES_PRIVAT", label: "Les Privat / Bimbel" },
  { value: "LAUNDRY", label: "Laundry (dengan booking)" },
  { value: "FUTSAL", label: "Lapangan Futsal / Olahraga" },
  { value: "WARNET", label: "Warnet / Game Center / PS" },
  { value: "RENTAL", label: "Rental Alat / Kendaraan" },
  { value: "TATTOO", label: "Tattoo & Body Art" },
  { value: "TOUR", label: "Tour & Travel / Wisata" },
  { value: "LAINNYA", label: "Jasa Lainnya" },
];

const NICHE_RESOURCE_LABELS: Record<string, string> = {
  BARBERSHOP: "Kapster",
  SALON: "Terapis",
  NAIL_ART: "Nail Artist",
  STUDIO_FOTO: "Studio",
  STUDIO_MUSIK: "Studio",
  SERVICE_AC: "Teknisi",
  BENGKEL: "Mekanik",
  LES_PRIVAT: "Tutor",
  LAUNDRY: "Mesin",
  FUTSAL: "Lapangan",
  WARNET: "PC",
  RENTAL: "Unit",
  TATTOO: "Artist",
  TOUR: "Pemandu",
  LAINNYA: "Staf",
};

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
      if (!form.niche.trim()) {
        nextErrors.niche = "Kategori bisnis wajib diisi.";
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

  async function finish(action?: "new-order" | "share-link") {
    if (isSubmitting) return;
    if (!validateStep(3)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await completeOnboarding({
        ...form,
        whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
        resourceCount: form.usesResources ? Math.max(1, Number(form.resourceCount) || 1) : undefined,
        resources: form.usesResources ? form.resources : [],
        defaultBookingDurationMinutes: undefined,
      });
      toast.success("Setup bisnis selesai", "Dashboard siap dipakai.");
      await new Promise((resolve) => setTimeout(resolve, 180));
      let redirectUrl = `/dashboard/${response?.slug || business.slug}`;
      if (action === "new-order") {
        redirectUrl = `/dashboard/${response?.slug || business.slug}/orders?action=new-order`;
      } else if (action === "share-link") {
        redirectUrl = `/dashboard/${response?.slug || business.slug}/business-link`;
      }
      window.location.href = redirectUrl;
    } catch (err) {
      toast.error("Gagal memproses onboarding", err instanceof Error ? err.message : "Kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
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
                  hasError={!!errors.name}
                />
                {errors.name ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.name}</p> : null}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Kategori Bisnis Jasa / Sewa</span>
                <Select
                  value={form.niche}
                  options={NICHE_OPTIONS}
                  onValueChange={(val) => {
                    setForm((current) => {
                      const nextLabel = NICHE_RESOURCE_LABELS[val] || "Staf";
                      const isResourceBased = ["FUTSAL", "WARNET", "RENTAL", "STUDIO_MUSIK", "STUDIO_FOTO"].includes(val);
                      return {
                        ...current,
                        niche: val,
                        resourceLabel: nextLabel,
                        usesResources: isResourceBased,
                        operationalModel: isResourceBased ? "RESOURCE_BOOKING" : "APPOINTMENT",
                        resources: isResourceBased ? updateResources(nextLabel, current.resourceCount) : [],
                      };
                    });
                  }}
                  placeholder="Pilih Kategori"
                  hasError={!!errors.niche}
                />
                {errors.niche ? (
                  <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.niche}</p>
                ) : (
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    💡 Membantu sistem mengatur sebutan unit/tim yang paling sesuai secara otomatis.
                  </p>
                )}
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-6">
              <div className="grid gap-4">
                <p className="text-sm font-extrabold text-[var(--color-text)]">Pengaturan Slot & Jadwal</p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">Apakah pelanggan Anda memesan staf, ruangan, lapangan, atau unit khusus tertentu?</p>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((current) => ({
                        ...current,
                        mode: "BOOKING_SERVICE",
                        operationalModel: "APPOINTMENT",
                        usesResources: false,
                        resources: [],
                      }));
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 relative flex flex-col justify-between ${
                      !form.usesResources
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]/60 ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)]"
                    }`}
                  >
                    {!form.usesResources && (
                      <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-[var(--color-primary)]" />
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-[var(--color-text)]">Booking Langsung ke Jadwal</div>
                      <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">Cocok untuk: salon, servis, klinik, konsultasi — pelanggan pilih tanggal & jam.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForm((current) => ({
                        ...current,
                        mode: "BOOKING_SERVICE",
                        operationalModel: "RESOURCE_BOOKING",
                        usesResources: true,
                        resources: updateResources(current.resourceLabel, current.resourceCount),
                      }));
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 relative flex flex-col justify-between ${
                      form.usesResources
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]/60 ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)]"
                    }`}
                  >
                    {form.usesResources && (
                      <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-[var(--color-primary)]" />
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-[var(--color-text)]">Pilih Unit / Tempat / Orang Tertentu</div>
                      <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">Cocok untuk: lapangan, warnet (PC), kapster tertentu — pelanggan pilih unit spesifik.</p>
                    </div>
                  </button>
                </div>
              </div>

              {form.usesResources ? (
                <div className="grid gap-4 pt-4 border-t border-[var(--color-border)]">
                  <p className="text-sm font-extrabold text-[var(--color-text)]">Setup Unit / Staf</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Sebutan (Contoh: Staf, Kapster, Ruangan)</span>
                      <Input
                        value={form.resourceLabel}
                        onChange={(e) => setForm(c => ({ ...c, resourceLabel: e.target.value, resources: updateResources(e.target.value, c.resourceCount) }))}
                        placeholder="Contoh: Staf"
                        hasError={!!errors.resourceLabel}
                      />
                      {errors.resourceLabel ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{errors.resourceLabel}</p> : null}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Jumlah {form.resourceLabel || "Unit"}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-11 w-11 rounded-xl font-bold flex items-center justify-center p-0 shrink-0 text-lg border border-[var(--color-border)]"
                          onClick={() => {
                            const nextCount = Math.max(1, (Number(form.resourceCount) || 1) - 1);
                            setForm(c => ({ ...c, resourceCount: String(nextCount), resources: updateResources(c.resourceLabel, String(nextCount)) }));
                          }}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          className="text-center"
                          value={form.resourceCount}
                          onChange={(e) => setForm(c => ({ ...c, resourceCount: e.target.value, resources: updateResources(c.resourceLabel, e.target.value) }))}
                          hasError={!!errors.resourceCount}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-11 w-11 rounded-xl font-bold flex items-center justify-center p-0 shrink-0 text-lg border border-[var(--color-border)]"
                          onClick={() => {
                            const nextCount = (Number(form.resourceCount) || 1) + 1;
                            setForm(c => ({ ...c, resourceCount: String(nextCount), resources: updateResources(c.resourceLabel, String(nextCount)) }));
                          }}
                        >
                          +
                        </Button>
                      </div>
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
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Deskripsi Singkat Bisnis</span>
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Contoh: Booking salon cepat, servis AC bergaransi, atau potong rambut kekinian."
                  hasError={!!errors.description}
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
                  Sekarang Anda bisa langsung mengatur jam buka toko, mengelola jadwal kosong, dan membagikan link booking ke pelanggan.
                </p>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Ringkasan Setup</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-[var(--color-text)]"><span className="font-bold">Mode bisnis:</span> Booking Jasa</p>
                    <p className="text-[var(--color-text)]">
                      <span className="font-bold">Cara kerja:</span>{" "}
                      {form.usesResources ? `Booking per ${form.resourceLabel}` : "Jadwal kosong langsung"}
                    </p>
                    {form.usesResources ? <p className="text-[var(--color-text)]"><span className="font-bold">Unit aktif:</span> {form.resources.map((resource: BusinessResource) => resource.name).join(", ")}</p> : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button type="button" variant="secondary" className="rounded-xl h-11 text-xs font-bold" onClick={() => void finish("new-order")} isLoading={isSubmitting} disabled={isSubmitting}>
                  Tambah Order Pertama
                </Button>
                <Button type="button" variant="secondary" className="rounded-xl h-11 text-xs font-bold" onClick={() => void finish("share-link")} isLoading={isSubmitting} disabled={isSubmitting}>
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
