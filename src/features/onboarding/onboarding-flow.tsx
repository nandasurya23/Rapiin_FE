"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { PageHeader } from "@/components/shared/page-header";
import { createBusinessResources, DURATION_OPTIONS } from "@/lib/constants/business";
import type { BusinessResource } from "@/types/business";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";
import { normalizePhoneNumber } from "@/lib/validation";
import { Select } from "@/components/ui/select";
import { getPlanDefinition, getSubscriptionForBusiness } from "@/lib/subscription";

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
 const { business, hydrated, completeOnboarding, currentUser, auth, subscriptionForCurrentBusiness } = useAppData();
 const [step, setStep] = useState<Step>(1);
 const [errors, setErrors] = useState<{
  name?: string;
  whatsappNumber?: string;
  resourceLabel?: string;
  resourceCount?: string;
  resources?: string;
  niche?: string;
  description?: string;
  openingHours?: string;
  timezone?: string;
  bookingCapacity?: string;
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
  openingHours: business.openingHours ?? "08:00-21:00",
  timezone: business.timezone ?? "Asia/Jakarta",
  bookingCapacity: String(business.bookingCapacity ?? 1),
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
   openingHours: business.openingHours ?? "08:00-21:00",
   timezone: business.timezone ?? "Asia/Jakarta",
   bookingCapacity: String(business.bookingCapacity ?? 1),
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
   if (!form.openingHours) {
    nextErrors.openingHours = "Jam operasional wajib diisi.";
   }
   if (!form.timezone) {
    nextErrors.timezone = "Zona waktu wajib diisi.";
   }
  }

  if (currentStep === 2) {
    // Konfirmasi mode saja, tidak ada validasi teknis tambahan
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
    resourceCount: form.usesResources ? 1 : undefined,
    resources: form.usesResources ? [{ id: "temp", name: `${form.resourceLabel || "Unit"} 1`, isActive: true }] : [],
    defaultBookingDurationMinutes: 60,
    bookingCapacity: 1,
   });
   toast.success("Setup bisnis selesai", "Dashboard siap dipakai.");
   let redirectUrl = `/dashboard/${response?.slug || business.slug}`;
   if (action === "new-order") {
    redirectUrl = `/dashboard/${response?.slug || business.slug}/orders?action=new-order`;
   } else if (action === "share-link") {
    redirectUrl = `/dashboard/${response?.slug || business.slug}/business-link`;
   }
   router.push(redirectUrl);
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-warning-text)]">
       <Sparkles className="h-3 w-3 text-[var(--color-accent-hover)]" />
       Setup Bisnis
      </span>
     }
     action={
      <div className="flex items-center gap-2 sm:shrink-0">
       <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
         <div key={s} className="flex items-center gap-2">
          <div
           className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
            s < step
             ? "bg-[var(--color-success)] text-white"
             : s === step
             ? "bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary-surface)]"
             : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
           )}
          >
           {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
           <div
            className={cn(
             "h-1 w-6 sm:w-10 rounded-full transition-all duration-300",
             s < step ? "bg-[var(--color-success)]" : "bg-[var(--color-surface-inset)]"
            )}
           />
          )}
         </div>
        ))}
       </div>
      </div>
     }
    />

    <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
     <div className="space-y-6 p-6 sm:p-8">

      {step === 1 ? (
       <div className="grid gap-6 animate-fade-in">
        <label className="block relative">
         <div className="flex justify-between items-center mb-1.5">
           <span className="block text-sm font-bold text-[var(--color-text)]">Nama Bisnis</span>
         </div>
         <Input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Contoh: Rapiin Studio"
          hasError={!!errors.name}
          className="h-11 text-base"
         />
         {errors.name ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium animate-fade-in">{errors.name}</p> : null}
        </label>

        <label className="block relative">
         <div className="flex justify-between items-center mb-1.5">
           <span className="block text-sm font-bold text-[var(--color-text)]">Kategori Bisnis Jasa / Sewa</span>
         </div>
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
              usesResources: true,
              operationalModel: isResourceBased ? "RESOURCE_BOOKING" : "APPOINTMENT",
             resources: isResourceBased ? updateResources(nextLabel, current.resourceCount) : [],
            };
           });
          }}
          placeholder="Pilih Kategori"
          hasError={!!errors.niche}
         />
         {errors.niche ? (
          <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium animate-fade-in">{errors.niche}</p>
         ) : (
          <p className="mt-2 text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed">
           💡 Membantu sistem mengatur sebutan unit/tim yang paling sesuai secara otomatis.
          </p>
         )}
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
         <label className="block relative">
          <div className="flex justify-between items-center mb-1.5">
            <span className="block text-sm font-bold text-[var(--color-text)]">Jam Operasional</span>
          </div>
          <div className="flex items-center gap-2">
            <datalist id="time-options">
              {Array.from({ length: 25 }, (_, i) => (
                <option key={i} value={`${String(i).padStart(2, "0")}:00`} />
              ))}
            </datalist>
            <Input
              type="text"
              list="time-options"
              value={(form.openingHours.split("-")[0] || "").trim() || "08:00"}
              onChange={(event) => {
                const end = (form.openingHours.split("-")[1] || "").trim() || "21:00";
                setForm((current) => ({ ...current, openingHours: `${event.target.value}-${end}` }));
              }}
              placeholder="08:00"
              hasError={!!errors.openingHours}
              className="text-center"
            />
            <span className="text-[var(--color-text-secondary)] font-bold">-</span>
            <Input
              type="text"
              list="time-options"
              value={(form.openingHours.split("-")[1] || "").trim() || "21:00"}
              onChange={(event) => {
                const start = (form.openingHours.split("-")[0] || "").trim() || "08:00";
                setForm((current) => ({ ...current, openingHours: `${start}-${event.target.value}` }));
              }}
              placeholder="21:00"
              hasError={!!errors.openingHours}
              className="text-center"
            />
          </div>
          {errors.openingHours ? (
           <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium animate-fade-in">{errors.openingHours}</p>
          ) : null}
         </label>
         
         <label className="block relative">
          <div className="flex justify-between items-center mb-1.5">
            <span className="block text-sm font-bold text-[var(--color-text)]">Zona Waktu</span>
          </div>
          <Select
           value={form.timezone}
           options={[
            { value: "Asia/Jakarta", label: "WIB (Jakarta)" },
            { value: "Asia/Makassar", label: "WITA (Makassar)" },
            { value: "Asia/Jayapura", label: "WIT (Jayapura)" }
           ]}
           onValueChange={(val) => setForm((current) => ({ ...current, timezone: val }))}
           placeholder="Pilih Zona Waktu"
           hasError={!!errors.timezone}
          />
          {errors.timezone ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium animate-fade-in">{errors.timezone}</p> : null}
         </label>
        </div>
       </div>
      ) : null}

      {step === 2 ? (
       <div className="grid gap-8 animate-fade-up">
        <div className="grid gap-5">
         <div>
          <h3 className="text-xl font-bold text-[var(--color-text)]">Pilih Mode Bisnis Utama</h3>
          <p className="text-[15px] font-medium text-[var(--color-text-secondary)] leading-relaxed mt-1">
           Sesuaikan sistem dengan cara Anda berjualan agar fitur yang muncul pas untuk bisnis Anda.
          </p>
         </div>
         
        {/* 2B: Saran tambah layanan — hanya untuk BOOKING_SERVICE */}
        {form.mode === "BOOKING_SERVICE" && (
         <div className="rounded-2xl border border-[var(--color-info-border)] bg-[var(--color-info-surface)] p-5 flex items-start gap-4 animate-scale-in">
          <Sparkles className="h-5 w-5 shrink-0 mt-0.5 text-[var(--color-primary)]" />
          <div className="space-y-1.5">
           <p className="text-base font-bold text-[var(--color-text)]">
            Tambahkan Daftar Layanan Setelah Ini
           </p>
           <p className="text-[13px] font-medium text-[var(--color-text-secondary)] leading-relaxed">
            Tambah layanan (misal: Potong Rambut, Creambath) agar pelanggan bisa memilih layanan dan melihat harga sebelum booking.
            Bisa dilakukan di <strong>Pengaturan → Layanan &amp; Produk</strong> kapan saja setelah dashboard dibuka.
           </p>
          </div>
         </div>
        )}

         <div className="grid gap-4 sm:grid-cols-3">
          <button
           type="button"
           onClick={() => {
             setForm((current) => ({
              ...current,
              mode: "BOOKING_SERVICE",
              operationalModel: current.operationalModel === "APPOINTMENT" || current.operationalModel === "RESOURCE_BOOKING" ? current.operationalModel : "APPOINTMENT",
              usesResources: true,
              resources: current.resources.length > 0 ? current.resources : updateResources(current.resourceLabel, current.resourceCount),
             }));
           }}
           className={cn(
            "rounded-2xl border p-5 text-left transition-all duration-300 relative flex flex-col gap-2.5",
            form.mode === "BOOKING_SERVICE"
             ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)] shadow-[var(--shadow-md)] ring-2 ring-[var(--color-primary)]/20 scale-[1.02]"
             : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] hover:shadow-[var(--shadow-sm)]"
           )}
          >
           {form.mode === "BOOKING_SERVICE" && (
            <div className="absolute top-4 right-4 text-[var(--color-primary)] animate-scale-in">
             <CheckCircle2 className="h-5 w-5" />
            </div>
           )}
           <div className="text-lg font-bold text-[var(--color-text)]">Jasa / Sewa</div>
           <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed">
            Pelanggan pesan jadwal (tanggal & jam). Cocok untuk: Salon, Lapangan, Konsultasi.
           </p>
          </button>

          <button
           type="button"
           onClick={() => {
            setForm((current) => ({
             ...current,
             mode: "PRODUCT_ORDER",
             operationalModel: "ORDER_REQUEST",
             usesResources: false,
             resources: [],
            }));
           }}
           className={cn(
            "rounded-2xl border p-5 text-left transition-all duration-300 relative flex flex-col gap-2.5",
            form.mode === "PRODUCT_ORDER"
             ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)] shadow-[var(--shadow-md)] ring-2 ring-[var(--color-primary)]/20 scale-[1.02]"
             : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] hover:shadow-[var(--shadow-sm)]"
           )}
          >
           {form.mode === "PRODUCT_ORDER" && (
            <div className="absolute top-4 right-4 text-[var(--color-primary)] animate-scale-in">
             <CheckCircle2 className="h-5 w-5" />
            </div>
           )}
           <div className="text-lg font-bold text-[var(--color-text)]">Produk Fisik</div>
           <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed">
            Pelanggan pesan barang/makanan. Cocok untuk: Toko Kue, Katering, Toko Baju.
           </p>
          </button>

          <button
           type="button"
           onClick={() => {
            setForm((current) => ({
             ...current,
             mode: "CUSTOM_REQUEST",
             operationalModel: "ORDER_REQUEST",
             usesResources: false,
             resources: [],
            }));
           }}
           className={cn(
            "rounded-2xl border p-5 text-left transition-all duration-300 relative flex flex-col gap-2.5",
            form.mode === "CUSTOM_REQUEST"
             ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)] shadow-[var(--shadow-md)] ring-2 ring-[var(--color-primary)]/20 scale-[1.02]"
             : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] hover:shadow-[var(--shadow-sm)]"
           )}
          >
           {form.mode === "CUSTOM_REQUEST" && (
            <div className="absolute top-4 right-4 text-[var(--color-primary)] animate-scale-in">
             <CheckCircle2 className="h-5 w-5" />
            </div>
           )}
           <div className="text-lg font-bold text-[var(--color-text)]">Request Custom</div>
           <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed">
            Pelanggan mengajukan detail khusus tanpa jadwal. Cocok untuk: Jahit, Desain.
           </p>
          </button>
         </div>
        </div>


       </div>
      ) : null}

      {step === 3 ? (
       <div className="grid gap-6 animate-fade-up">
        <label className="block relative">
         <div className="flex justify-between items-center mb-1.5">
           <span className="block text-sm font-bold text-[var(--color-text)]">Deskripsi Singkat Bisnis</span>
         </div>
         <Textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Contoh: Booking salon cepat, servis AC bergaransi, atau potong rambut kekinian."
          hasError={!!errors.description}
          className="min-h-[100px] text-base rounded-[var(--radius-lg)] p-3 border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-[var(--state-focus-ring)] focus:ring-3"
         />
         {errors.description ? <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium animate-fade-in">{errors.description}</p> : null}
        </label>

        {/* Setup Summary Card */}
        <div className="relative overflow-hidden rounded-2xl shadow-[var(--shadow-md)] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary-surface)] via-[var(--color-surface-elevated)] to-[var(--color-surface)] p-6 space-y-4">
         <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-[var(--color-primary)] animate-scale-in" />
          <h3 className="text-xl font-bold text-[var(--color-text)]">Dashboard kamu sudah siap 🎉</h3>
         </div>
         <p className="text-[15px] font-medium text-[var(--color-text-secondary)] leading-relaxed">
          Dashboard Anda siap digunakan. Anda bisa mengatur jam operasional, menambah daftar layanan/produk, dan membagikan link booking ke pelanggan.
         </p>
         
         {form.mode === "BOOKING_SERVICE" && form.usesResources && (
           <div className="mt-4 rounded-xl bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] p-4 shadow-sm">
             <p className="text-sm font-bold text-[var(--color-warning-text)] flex items-center gap-2">
               ⚠️ Tindakan Lanjutan:
             </p>
             <p className="text-[13px] font-medium text-[var(--color-warning-text)]/90 mt-1.5 leading-relaxed">
               Sistem telah membuatkan 1 {form.resourceLabel || "Unit"} sementara untuk kelancaran setup. Jangan lupa masuk ke menu <strong>Pengaturan Unit</strong> di Dashboard setelah ini untuk merubah namanya menjadi unit asli Anda (contoh: Lapangan 1, Kapster Budi, dll).
             </p>
           </div>
         )}
         
         <div className="rounded-xl border border-[var(--color-border)] bg-white/50 backdrop-blur-sm px-5 py-5 space-y-3 mt-4">
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Ringkasan Setup</p>
          <div className="space-y-2 text-[15px]">
           <p className="text-[var(--color-text)]"><span className="font-bold text-[var(--color-primary)]">Mode bisnis:</span> {form.mode === "BOOKING_SERVICE" ? "Booking Jasa" : form.mode === "PRODUCT_ORDER" ? "Jual Produk Fisik" : "Request Custom"}</p>
           {form.mode === "BOOKING_SERVICE" && (
            <p className="text-[var(--color-text)]">
             <span className="font-bold text-[var(--color-primary)]">Cara kerja:</span>{" "}
             {form.operationalModel === "RESOURCE_BOOKING" ? `Booking per ${form.resourceLabel}` : "Jadwal kosong langsung"}
            </p>
           )}
          </div>
         </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
         <Button type="button" variant="secondary" className="rounded-xl h-12 text-sm font-bold shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]" onClick={() => void finish("new-order")} isLoading={isSubmitting} disabled={isSubmitting}>
          Tambah Order
         </Button>
         <Button type="button" variant="secondary" className="rounded-xl h-12 text-sm font-bold shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]" onClick={() => void finish("share-link")} isLoading={isSubmitting} disabled={isSubmitting}>
          Bagikan Link
         </Button>
         <Button type="button" className="rounded-xl h-12 text-sm font-bold shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]" onClick={() => void finish()} isLoading={isSubmitting} disabled={isSubmitting}>
          Lihat Dashboard
         </Button>
        </div>
       </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
       <Button type="button" variant="secondary" className="rounded-xl h-12 px-6 font-bold text-[15px]" onClick={back} disabled={step === 1 || isSubmitting}>
        ← Kembali
       </Button>
       {step < 3 ? (
        <Button type="button" className="rounded-xl h-12 px-6 font-bold text-[15px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]" onClick={next}>
         {step === 2 ? "Review Setup →" : "Lanjut →"}
        </Button>
       ) : null}
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}
