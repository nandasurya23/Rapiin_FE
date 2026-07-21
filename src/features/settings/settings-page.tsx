"use client";

import { useEffect, useMemo, useState } from "react";
import NextImage from "next/image";
import { AlertTriangle, PlusCircle, Upload, X, Sparkles, Settings, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { useOrders } from "@/hooks/use-orders";
import { usePermission } from "@/hooks/use-permission";
import { TeamList } from "@/features/team/components/team-list";
import { InviteMemberSheet } from "@/features/team/components/invite-member-sheet";
import { EditMemberSheet } from "@/features/team/components/edit-member-sheet";
import { cn } from "@/lib/cn";
import { useBusiness } from "@/hooks/use-business";
import {
 BUSINESS_MODE_OPTIONS,
 createBusinessResources,
 doesOperationalModelUseResources,
 getDefaultOperationalModel,
 OPERATIONAL_MODEL_OPTIONS,
 RESOURCE_LABEL_SUGGESTIONS,
} from "@/lib/constants/business";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";
import { getPublicCatalog } from "@/lib/public-business";
import { RoleGate } from "@/components/shared/role-gate";
import type { BusinessResource, OperationalModel, PublicCatalogItem } from "@/types/business";
import type { TeamMember } from "@/types/team";
import { teamService } from "@/services/team.service";


function formatRupiahInput(value: string) {
 const numericValue = value.replace(/[^\d]/g, "");
 if (/^\d+$/.test(numericValue) || value === "") {
  if (!numericValue) return "";
  return `Rp ${new Intl.NumberFormat("id-ID").format(parseInt(numericValue, 10))}`;
 }
 return value;
}

function compressLogoImage(file: File, maxW = 180, maxH = 180): Promise<string> {
 return new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
   const img = new Image();
   img.onload = () => {
    const canvas = document.createElement("canvas");
    let width = img.width;
    let height = img.height;

    if (width > height) {
     if (width > maxW) {
      height = Math.round((height * maxW) / width);
      width = maxW;
     }
    } else {
     if (height > maxH) {
      width = Math.round((width * maxH) / height);
      height = maxH;
     }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    resolve(dataUrl);
   };
   img.onerror = () => reject(new Error("Gagal memproses gambar."));
   img.src = e.target?.result as string;
  };
  reader.onerror = () => reject(new Error("Gagal membaca file lokal."));
  reader.readAsDataURL(file);
 });
}

type SettingsFormState = {
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

type FormErrors = Partial<Record<keyof SettingsFormState, string>> & {
 resources?: string;
 services?: string;
};

function mapTimezoneValue(tz: string | null | undefined): string {
 if (!tz) return "Asia/Jakarta";
 if (tz === "WIB") return "Asia/Jakarta";
 if (tz === "WITA") return "Asia/Makassar";
 if (tz === "WIT") return "Asia/Jayapura";
 return tz;
}

function createFormStateFromBusiness(
 business: ReturnType<typeof useAppData>["business"],
 currentUser: ReturnType<typeof useAppData>["currentUser"]
): SettingsFormState {
 return {
  name: business.name,
  whatsappNumber: business.whatsappNumber || currentUser?.phoneNumber || "",
  mode: business.mode,
  niche: business.niche,
  operationalModel: business.operationalModel,
  resourceLabel: business.resourceLabel ?? "Staf",
  resourceCount: String(business.resourceCount ?? business.resources?.length ?? 1),
  bookingCapacity: String(business.bookingCapacity ?? 2),
  defaultBookingDurationMinutes: String(business.defaultBookingDurationMinutes ?? 60),
  openingHours: business.openingHours ?? "",
  timezone: mapTimezoneValue(business.timezone),
  address: business.address ?? "",
  description: business.description,
  paymentInstructions: business.paymentInstructions ?? "",
  resources: business.resources ?? [],
  services: business.services ?? getPublicCatalog(business),
  logoUrl: business.logoUrl ?? "",
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
 const { currentUser } = useAppData();
 const { orders } = useOrders();
 const { business, saveBusinessSettings } = useBusiness();
 const [form, setForm] = useState<SettingsFormState>(createFormStateFromBusiness(business, currentUser));
 const [errors, setErrors] = useState<FormErrors>({});
 const [isSaving, setIsSaving] = useState(false);

 const [activeTab, setActiveTab] = useState<"operational" | "team">("operational");
 const [isInviteOpen, setIsInviteOpen] = useState(false);
 const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
 const [isEditOpen, setIsEditOpen] = useState(false);
 const { hasPermission } = usePermission();

 // Fetch team members from BE API
 const { data: teamMembers = [], refetch: refetchTeam } = useQuery({
  queryKey: ["team", "members"],
  queryFn: () => teamService.getMembers(),
  // Only fetch when team tab is active
  enabled: activeTab === "team",
  staleTime: 30_000,
 });


 const canWriteSettings = hasPermission("settings:write");

 useEffect(() => {
  if (!canWriteSettings) {
   setActiveTab("team");
  }
 }, [canWriteSettings]);

 useEffect(() => {
  setForm(createFormStateFromBusiness(business, currentUser));
 }, [business, currentUser]);

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

  // defaultBookingDurationMinutes removed as per requirements

  if (form.mode === "BOOKING_SERVICE" && form.operationalModel === "APPOINTMENT") {
   const parsedCapacity = Number(form.bookingCapacity);
   if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
    nextErrors.bookingCapacity = "Kapasitas booking minimal 1.";
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

  if (form.services.length === 0) {
   nextErrors.services = "Minimal harus ada 1 layanan/produk.";
  } else if (form.services.some((service) => !service.name.trim())) {
   nextErrors.services = "Nama layanan/produk tidak boleh kosong.";
  }

  setErrors(nextErrors);
  return nextErrors;
 }

 async function handleSave() {
  if (isSaving) return;
  const nextErrors = validateForm();
  const errorKeys = Object.keys(nextErrors);

  if (errorKeys.length > 0) {
   const errorMessages = Object.values(nextErrors).join(" • ");
   toast.error("Gagal menyimpan", errorMessages);
   return;
  }

  setIsSaving(true);
  try {
   await new Promise((resolve) => setTimeout(resolve, 220));

   // Konversi services dari format FE (priceLabel/durationMinutes) ke format BE (price/duration)
   const servicesForBE = form.services.map((s) => {
    let priceNum = 0;
    if (s.priceLabel) {
     const clean = s.priceLabel.replace(/[^0-9]/g, "");
     priceNum = Number(clean) || 0;
    }
    return {
     id: s.id,
     name: s.name,
     description: s.description || "",
     price: priceNum,
     duration: s.durationMinutes !== undefined ? Number(s.durationMinutes) : 60,
    };
   });

   await saveBusinessSettings({
    name: form.name.trim(),
    whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
    mode: form.mode,
    niche: form.niche,
    operationalModel: form.operationalModel,
    usesResources,
    resourceLabel: usesResources ? form.resourceLabel.trim() : undefined,
    resourceCount: usesResources ? Math.max(1, Number(form.resourceCount) || 1) : undefined,
    resources: usesResources ? form.resources : [],
    services: servicesForBE,
    bookingCapacity: (form.mode === "BOOKING_SERVICE" && form.operationalModel === "APPOINTMENT")
     ? Math.max(1, Number(form.bookingCapacity) || 2)
     : undefined,
    defaultBookingDurationMinutes: form.defaultBookingDurationMinutes
     ? Math.max(1, Number(form.defaultBookingDurationMinutes) || 60)
     : undefined,
    openingHours: form.openingHours.trim() || undefined,
    timezone: form.timezone,
    address: form.address.trim() || undefined,
    description: form.description.trim(),
    paymentInstructions: form.paymentInstructions.trim() || undefined,
    logoUrl: form.logoUrl.trim() || undefined,
   });
   toast.success("Pengaturan bisnis disimpan", "Flow form dan booking sudah ikut menyesuaikan.");
  } catch (err) {
   toast.error(
    "Gagal menyimpan pengaturan",
    err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi."
   );
  } finally {
   setIsSaving(false);
  }
 }

 return (
  <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
   <RoleGate 
    allowedRoles={["OWNER", "MANAGER"]} 
    fallback={
     <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-[var(--color-warning-text)] mb-4" />
      <h2 className="text-xl font-bold text-[var(--color-text)]">Akses Ditolak</h2>
      <p className="mt-2 text-[var(--color-text-secondary)]">Anda tidak memiliki izin untuk melihat halaman pengaturan bisnis ini.</p>
     </div>
    }
   >
   <PageHeader
    variant="hero"
    title="Atur Cara Kerja Bisnis Anda"
    description="Halaman ini menjadi sumber data utama (source of truth) untuk form publik, order admin, kalender, dan ketersediaan slot bisnis."
    badge={
     <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
      <Settings className="h-3.5 w-3.5 animate-spin-slow text-[var(--color-accent)]" />
      Pengaturan Operasional
     </span>
    }
    action={
     <div className="flex flex-wrap gap-2.5 xl:shrink-0">
      <Badge tone="info" className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs font-bold">
       Mode: {form.mode === "BOOKING_SERVICE" ? "Booking Jasa" : "Request Order"}
      </Badge>
      <Badge tone={usesResources ? "warning" : "success"} className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs font-bold">
       {usesResources ? `${form.resourceLabel || "Unit"} Aktif` : "Tanpa Unit Khusus"}
      </Badge>
     </div>
    }
   />

   {/* Tabs Navigation */}
   {canWriteSettings && (
    <div className="flex border-b border-[var(--color-border)] gap-2 animate-fade-up">
     <button
      type="button"
      onClick={() => setActiveTab("operational")}
      className={cn(
       "px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 focus:outline-none",
       activeTab === "operational"
        ? "border-[var(--color-primary)] text-[var(--color-primary)] font-extrabold"
        : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
      )}
     >
      Operasional Bisnis
     </button>
     {hasPermission("team:view") && (
      <button
       type="button"
       onClick={() => setActiveTab("team")}
       className={cn(
        "px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 focus:outline-none",
        activeTab === "team"
         ? "border-[var(--color-primary)] text-[var(--color-primary)] font-extrabold"
         : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
       )}
      >
       Manajemen Tim
      </button>
     )}
    </div>
   )}

   {activeTab === "operational" && (
    <>
     <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] animate-fade-up-delay-1">
    {/* Left Column: Profil Bisnis */}
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
     <div className="space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
       <div>
        <h2 className="text-lg font-bold text-[var(--color-text)]">Profil Bisnis</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Informasi dasar bisnis yang akan tampil pada halaman publik pelanggan.</p>
       </div>
       <Sparkles className="h-5 w-5 text-[var(--color-primary)] animate-pulse" />
      </div>

      {/* Premium Logo Uploader */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 relative overflow-hidden transition-all duration-300 hover:border-[var(--color-border-strong)]">
       <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden ">
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
         <span className="text-[10px] font-bold text-[var(--color-text-muted)] select-none uppercase tracking-wider">No Logo</span>
        )}
       </div>
       
       <div className="space-y-2 z-10 flex-1">
        <h3 className="text-sm font-bold text-[var(--color-text)]">Logo Bisnis</h3>
        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">Format JPG, PNG, atau WEBP. Direkomendasikan rasio persegi 1:1.</p>
        
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
             // TODO(Backend): Replace this base64 compression with direct upload to Supabase Storage.
             // The uploader should return a public URL instead of a large base64 string to avoid DB bloat.
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
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Bisnis</span>
        <Input value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
        {errors.name ? <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.name}</p> : null}
       </label>
       <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nomor WhatsApp</span>
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
         <p className="mt-1.5 text-[11px] text-[var(--color-text-secondary)]">Nomor bawaan dari saat pendaftaran. Bisa diubah jika nomor operasional bisnis berbeda.</p>
        )}
       </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
       <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Mode Bisnis</span>
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
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Kategori Bisnis</span>
        <Input value={form.niche} onChange={(e) => updateForm("niche", e.target.value)} placeholder="Contoh: Warnet, Barbershop, Rental PS, Futsal..." />
       </label>
      </div>

      <label className="block">
       <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Deskripsi Singkat Bisnis</span>
       <Textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} rows={3} />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
       <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Alamat Fisik</span>
        <Input value={form.address} onChange={(event) => updateForm("address", event.target.value)} />
       </label>
       <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Jam Operasional</span>
        <div className="flex items-center gap-2">
         <datalist id="time-options">
          {Array.from({ length: 25 }, (_, i) => <option key={i} value={`${String(i).padStart(2, '0')}:00`} />)}
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
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Zona Waktu</span>
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
       <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Instruksi Pembayaran / Detail Rekening</span>
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

    {/* Right Column: Cara Kerja Bisnis */}
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
     <div className="space-y-5 p-5">
      <div>
       <h2 className="text-lg font-bold text-[var(--color-text)]">Cara Kerja Bisnis</h2>
       <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Tentukan bagaimana customer memilih jadwal, unit slot, atau cukup request order.</p>
      </div>

      <label className="block">
       <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tipe Usaha</span>
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

      {form.mode !== "BOOKING_SERVICE" && (
       <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-xs text-[var(--color-text-secondary)] leading-relaxed ">
        📌 <strong>Mode Request Order:</strong> Customer tidak perlu memilih tanggal dan jam. Form publik akan fokus mengumpulkan detail order/request kebutuhan dari customer.
       </div>
      )}

      {form.mode === "BOOKING_SERVICE" && form.operationalModel === "APPOINTMENT" ? (
       <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 text-xs text-[var(--color-text-secondary)] leading-relaxed ">
         📌 <strong>Model Janji Temu (Appointment):</strong> Sangat cocok untuk salon, barber, terapis, klinik, studio foto, dan jasa yang memerlukan reservasi waktu global tanpa alokasi unit tertentu.
        </div>
        <label className="block">
         <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Kapasitas Booking Bersamaan</span>
         <Input
          type="number"
          min={1}
          value={form.bookingCapacity}
          onChange={(event) => updateForm("bookingCapacity", event.target.value)}
         />
         <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">Jumlah pelanggan maksimal yang bisa dilayani di jam yang sama (misal jumlah kursi barber/staf terapis aktif).</p>
         {errors.bookingCapacity ? (
          <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.bookingCapacity}</p>
         ) : null}
        </label>
       </div>
      ) : null}

      {usesResources ? (
       <div className="rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] px-4 py-4 text-xs text-[var(--color-warning-text)] leading-relaxed ">
        ⚠️ <strong>Model Pilihan Tim & Unit:</strong> Customer publik memesan jadwal secara terpusat. Sistem otomatis memvalidasi sisa staf/unit yang tersedia, lalu admin dapat mengalokasikan unit spesifik melalui panel pesanan.
       </div>
      ) : null}
     </div>
    </div>
   </section>

   {/* SECTION 4: UNIT / SLOT RESOURCES CONFIG */}
   {usesResources ? (
    <section className="animate-fade-up">
     <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
      <div className="space-y-5 p-5">
       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
         <h2 className="text-lg font-bold text-[var(--color-text)]">Pengaturan Staf & Fasilitas</h2>
         <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          Dipakai untuk mengelola daftar staf/karyawan, meja restoran, lapangan olahraga, kamar sewa, atau ruangan studio.
         </p>
        </div>
        <Badge tone="info" className="w-fit">{form.resources.filter((resource) => resource.isActive).length} Unit Aktif</Badge>
       </div>

       <div className="grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
        <label className="block">
         <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Label Penamaan (Staf, Ruangan, Meja, Lapangan)</span>
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
         {errors.resourceLabel ? <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.resourceLabel}</p> : null}
         
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
         <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Jumlah Unit / Karyawan</span>
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
         {errors.resourceCount ? <p className="mt-1 text-[10px] font-bold text-[var(--color-danger)]">{errors.resourceCount}</p> : null}
        </label>
       </div>

       {/* Units List */}
       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {form.resources.map((resource, index) => {
         const isReferenced = referencedResourceIds.has(resource.id);

         return (
          <div key={resource.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 hover:border-[var(--color-border-strong)] transition">
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
             <Badge tone={resource.isActive ? "success" : "neutral"} className="text-[9px] uppercase tracking-wider font-extrabold">
              {resource.isActive ? "Aktif" : "Nonaktif"}
             </Badge>
             {isReferenced ? (
              <Badge tone="warning" className="text-[9px] uppercase tracking-wider font-extrabold">Dipakai Order</Badge>
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
   ) : null}

   {/* SECTION 4.5: CATALOG CONFIG */}
   <section className="animate-fade-up">
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
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
       <Badge tone="info" className="w-fit">{form.services.length} Item</Badge>
      </div>

      <div className="space-y-4">
       {form.services.map((service) => (
        <div key={service.id} className="relative flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 hover:border-[var(--color-border-strong)] transition">
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
           <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama</span>
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
           <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">Harga (Label)</span>
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
          <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">Deskripsi</span>
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
           <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">Durasi (Jam)</span>
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
               item.id === service.id ? { ...item, durationMinutes: (parseInt(event.target.value, 10) || 0) * 60 || undefined } : item
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
   <section className="animate-fade-up">
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
     <div className="space-y-4 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
       <div>
        <h2 className="text-base font-bold text-[var(--color-text)]">Konfirmasi Penyimpanan</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
         Perubahan pengaturan ini langsung memengaruhi form pemesanan pelanggan, dashboard, dan ketersediaan slot kalender secara realtime.
        </p>
       </div>
       {business.operationalModel === "RESOURCE_BOOKING" && form.operationalModel === "APPOINTMENT" ? (
        <Badge tone="warning" className="font-extrabold text-[9px] uppercase tracking-wider">Perpindahan Model Operasional</Badge>
       ) : null}
      </div>

      {business.operationalModel === "RESOURCE_BOOKING" && form.operationalModel === "APPOINTMENT" ? (
       <div className="rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-4 text-xs text-[var(--color-warning-text)] leading-relaxed flex items-start gap-3 ">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
         Unit/slot yang sudah ada sebelumnya tidak akan dihapus. Riwayat pemesanan lama tetap tersimpan dengan baik, namun pemesanan baru yang masuk setelah ini hanya akan dialokasikan ke jadwal global tanpa penugasan unit tertentu.
        </p>
       </div>
      ) : null}

      <div className="pt-2">
       <Button type="button" isLoading={isSaving} onClick={() => void handleSave()} className="font-bold text-sm px-6 py-2.5 rounded-xl">
        Simpan Semua Pengaturan
       </Button>
      </div>
     </div>
    </div>
   </section>
   </>
   )}

   {activeTab === "team" && hasPermission("team:view") && (
    <div className="animate-fade-up space-y-6">
     <TeamList
      members={teamMembers}
      onEdit={(member) => {
       setEditingMember(member);
       setIsEditOpen(true);
      }}
      onOpenInvite={() => setIsInviteOpen(true)}
      showActions={hasPermission("team:manage")}
     />
    </div>
   )}

   <InviteMemberSheet
    isOpen={isInviteOpen}
    onClose={() => setIsInviteOpen(false)}
    onInvited={() => {
     refetchTeam();
     toast.success("Undangan dibuat", "Link undangan berhasil dibuat. Kirimkan ke karyawan via WhatsApp.");
    }}
    businessName={business.name}
   />

   <EditMemberSheet
    isOpen={isEditOpen}
    onClose={() => setIsEditOpen(false)}
    member={editingMember}
    onUpdate={async (memberId, updates) => {
     try {
      await teamService.updateMember(memberId, updates);
      refetchTeam();
      toast.success("Perubahan disimpan", "Data anggota tim berhasil diperbarui.");
     } catch (e) {
      const error = e as Error;
      toast.error("Gagal menyimpan", error.message || "Terjadi kesalahan.");
      throw error;
     }
    }}
    onDelete={async (memberId) => {
     try {
      await teamService.deleteMember(memberId);
      refetchTeam();
      toast.success("Karyawan dihapus", "Anggota tim berhasil dikeluarkan.");
     } catch (e) {
      const error = e as Error;
      toast.error("Gagal menghapus", error.message || "Terjadi kesalahan.");
      throw error;
     }
    }}
   />
   </RoleGate>
  </main>
 );
}
