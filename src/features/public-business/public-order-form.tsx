"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Card, CardBody } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import {
  BOOKING_HOLD_MINUTES,
  DEFAULT_BOOKING_DURATION_MINUTES,
  getBookingAvailability,
  getResourceBookingAvailability,
  getResourceBookingDetailsForDate,
  getResourceAvailabilityForSelection,
  isBookingSlotFull,
} from "@/lib/booking";
import { formatLongDate } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  getPublicCatalog,
  inferCatalogDurationMinutes,
  getPublicFormFields,
  isBusinessSlugMatch,
} from "@/lib/public-business";
import type { Business, BusinessMode } from "@/types/business";
import { useAppData } from "@/components/providers/app-data-provider";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";

type FormState = Record<string, string>;

const initialStateByMode: Record<BusinessMode, FormState> = {
  BOOKING_SERVICE: {
    name: "",
    whatsappNumber: "",
    service: "",
    scheduledDate: "",
    scheduledTime: "",
    bookingDurationMinutes: "60",
    resourceId: "",
    notes: "",
    botField: "",
  },
  PRODUCT_ORDER: {
    name: "",
    whatsappNumber: "",
    product: "",
    quantity: "1",
    deliveryMethod: "",
    notes: "",
    botField: "",
  },
  CUSTOM_REQUEST: {
    name: "",
    whatsappNumber: "",
    requestDetail: "",
    deadline: "",
    budget: "",
    notes: "",
    botField: "",
  },
};

function fieldValueFromState(state: FormState, name: string) {
  return state[name] ?? "";
}

function requiredFieldsForBusiness(business: Business) {
  return getPublicFormFields(business).filter((field) => field.required).map((field) => field.name);
}

function formatHoldReleaseTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(parsedDate);
}

function getCatalogFieldName(mode: BusinessMode) {
  if (mode === "BOOKING_SERVICE") {
    return "service";
  }

  if (mode === "PRODUCT_ORDER") {
    return "product";
  }

  return "requestDetail";
}

function createPublicWhatsAppMessage(business: Business, form: FormState) {
  const lines = [`Halo ${business.name}, saya mau lanjut ${business.mode === "BOOKING_SERVICE" ? "booking" : business.mode === "PRODUCT_ORDER" ? "order" : "request"}.`];

  if (form.name) {
    lines.push(`Nama: ${form.name}`);
  }

  if (form.service) {
    lines.push(`Layanan: ${form.service}`);
  }

  if (form.product) {
    lines.push(`Produk: ${form.product}`);
  }

  if (form.quantity) {
    lines.push(`Jumlah: ${form.quantity}`);
  }

  if (form.scheduledDate) {
    lines.push(`Tanggal: ${formatLongDate(form.scheduledDate)}`);
  }

  if (form.scheduledTime) {
    lines.push(`Jam: ${form.scheduledTime}`);
  }

  if (form.resourceId && business.resources) {
    const resource = business.resources.find((r) => r.id === form.resourceId);
    if (resource) {
      lines.push(`${business.resourceLabel || "Unit"}: ${resource.name}`);
    }
  }

  if (form.bookingDurationMinutes) {
    lines.push(`Durasi: ${form.bookingDurationMinutes} menit`);
  }

  if (form.deliveryMethod) {
    lines.push(`Ambil / antar: ${form.deliveryMethod}`);
  }

  if (form.deadline) {
    lines.push(`Deadline: ${formatLongDate(form.deadline)}`);
  }

  if (form.budget) {
    lines.push(`Budget: ${form.budget}`);
  }

  if (form.requestDetail) {
    lines.push(`Detail request: ${form.requestDetail}`);
  }

  if (form.notes) {
    lines.push(`Catatan: ${form.notes}`);
  }

  if (business.paymentInstructions) {
    lines.push(`\nMetode Pembayaran / Transfer:\n${business.paymentInstructions}`);
  }

  return lines.join("\n");
}

function applyCatalogSelectionToForm(mode: BusinessMode, current: FormState, itemName: string, durationMinutes?: number | null, priceLabel?: string) {
  const next = {
    ...current,
    [getCatalogFieldName(mode)]: itemName,
  };

  if (mode === "BOOKING_SERVICE" && durationMinutes && durationMinutes > 0) {
    next.bookingDurationMinutes = String(durationMinutes);
  }

  if (priceLabel) {
    next.budget = priceLabel;
  }

  return next;
}

function clearCatalogSelectionFromForm(mode: BusinessMode, current: FormState, defaultBookingDurationMinutes: number) {
  const next = {
    ...current,
    [getCatalogFieldName(mode)]: "",
  };

  if (mode === "BOOKING_SERVICE") {
    next.bookingDurationMinutes = String(defaultBookingDurationMinutes);
  }

  return next;
}

export function PublicOrderForm({ slug }: { slug: string }) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const { business, hydrated, orders, submitPublicOrder, canCreateOrder } = useAppData();
  const defaultBookingDuration = business.defaultBookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES;
  const [form, setForm] = useState<FormState>(initialStateByMode[business.mode]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let initialForm: FormState = {
      ...initialStateByMode[business.mode],
      bookingDurationMinutes: String(defaultBookingDuration),
    };

    let step = 1;
    const catalogList = getPublicCatalog(business);
    const preSelectedItemId = searchParams.get("item");

    if (preSelectedItemId) {
      const item = catalogList.find((i) => i.id === preSelectedItemId);
      if (item) {
        initialForm = applyCatalogSelectionToForm(business.mode, initialForm, item.name, inferCatalogDurationMinutes(item), item.priceLabel);
        step = 2;
      }
    } else if (catalogList.length === 1 && business.mode !== "CUSTOM_REQUEST") {
      const item = catalogList[0];
      initialForm = applyCatalogSelectionToForm(business.mode, initialForm, item.name, inferCatalogDurationMinutes(item), item.priceLabel);
      step = 2;
    }

    setForm(initialForm);
    setSubmitted(false);
    setError("");
    setCurrentStep(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.mode, defaultBookingDuration, hydrated]);

  const isMatch = isBusinessSlugMatch(business, slug);
  const catalog = getPublicCatalog(business);
  const bookingDurationMinutes = useMemo(() => {
    const parsedDuration = Number(form.bookingDurationMinutes);

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return DEFAULT_BOOKING_DURATION_MINUTES;
    }

    return parsedDuration;
  }, [form.bookingDurationMinutes]);
  const bookingAvailability = useMemo(
    () => getBookingAvailability(orders, form.scheduledDate, form.scheduledTime, bookingDurationMinutes, undefined, undefined, business.bookingCapacity),
    [bookingDurationMinutes, form.scheduledDate, form.scheduledTime, orders, business.bookingCapacity]
  );
  const resourceBookingAvailability = useMemo(
    () =>
      getResourceBookingAvailability(
        orders,
        business.resources ?? [],
        form.scheduledDate,
        form.scheduledTime,
        bookingDurationMinutes
      ),
    [bookingDurationMinutes, business.resources, form.scheduledDate, form.scheduledTime, orders]
  );
  const specificResourceAvailability = useMemo(() => {
    if (!form.resourceId || form.resourceId === "ANY") return null;
    return getResourceAvailabilityForSelection(orders, form.resourceId, form.scheduledDate, form.scheduledTime, bookingDurationMinutes);
  }, [form.resourceId, form.scheduledDate, form.scheduledTime, bookingDurationMinutes, orders]);

  const activeAvailability = form.resourceId && form.resourceId !== "ANY"
    ? specificResourceAvailability!
    : business.operationalModel === "RESOURCE_BOOKING" ? resourceBookingAvailability : bookingAvailability;

  const resourceDetailsForDate = useMemo(() => {
    if (business.operationalModel !== "RESOURCE_BOOKING" || !form.scheduledDate) return [];
    return getResourceBookingDetailsForDate(orders, business.resources ?? [], form.scheduledDate);
  }, [business.operationalModel, business.resources, form.scheduledDate, orders]);

  const slotHint = useMemo(() => {
    if (business.mode !== "BOOKING_SERVICE") {
      return "";
    }

    if (!form.scheduledDate || !form.scheduledTime) {
      return `Silakan tentukan tanggal dan jam. Pemesanan tanpa Uang Muka (DP) akan disimpan selama ${BOOKING_HOLD_MINUTES} menit sebelum otomatis dibatalkan.`;
    }

    if (activeAvailability.isFull) {
      if (activeAvailability.hasHold) {
        return activeAvailability.earliestHoldExpiresAt
          ? `Jadwal sementara menunggu konfirmasi pembayaran DP. Akan terbuka kembali jika pembayaran belum selesai pada pukul ${formatHoldReleaseTime(activeAvailability.earliestHoldExpiresAt.toISOString())}.`
          : "Jadwal sementara menunggu konfirmasi pembayaran DP.";
      }

      return business.operationalModel === "RESOURCE_BOOKING"
        ? "Semua tim/staf kami penuh di jam ini. Silakan pilih jam atau hari lain."
        : "Kapasitas penuh. Silakan pilih jam atau hari lain.";
    }

    if (activeAvailability.count <= 0) {
      return `Jadwal ini tersedia! Pemesanan tanpa Uang Muka (DP) akan disimpan selama ${BOOKING_HOLD_MINUTES} menit.`;
    }

    if (activeAvailability.hasHold) {
      return activeAvailability.earliestHoldExpiresAt
        ? `Jadwal sementara menunggu konfirmasi pembayaran DP. Akan terbuka kembali jika pembayaran belum selesai pada pukul ${formatHoldReleaseTime(activeAvailability.earliestHoldExpiresAt.toISOString())}.`
        : "Jadwal sementara menunggu konfirmasi pembayaran DP.";
    }

    return activeAvailability.remaining === 1 ? "Sisa 1 jadwal tersedia" : `Sisa ${activeAvailability.remaining} jadwal tersedia`;
  }, [activeAvailability.count, activeAvailability.earliestHoldExpiresAt, activeAvailability.hasHold, activeAvailability.isFull, activeAvailability.remaining, business.mode, business.operationalModel, form.scheduledDate, form.scheduledTime]);

  const waMessage = useMemo(() => createPublicWhatsAppMessage(business, form), [business, form]);
  const waLink = useMemo(
    () => buildWhatsAppUrl(business.whatsappNumber, waMessage),
    [business.whatsappNumber, waMessage]
  );


  function updateField(name: string, value: string) {
    setError("");
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit() {
    if (form.botField) {
      // Honeypot triggered, silently succeed
      setSubmitted(true);
      toast.success("Form berhasil dikirim", "Admin akan lanjut menghubungi lewat WhatsApp.");
      return;
    }

    const missing = requiredFieldsForBusiness(business).find((field) => !fieldValueFromState(form, field).trim());

    if (missing) {
      setError("Lengkapi semua field wajib dulu.");
      setSubmitted(false);
      return;
    }

    if (form.scheduledDate && business.closedDates?.[form.scheduledDate]) {
      setError(`Toko sedang tutup/libur pada tanggal terpilih karena: "${business.closedDates[form.scheduledDate]}". Silakan pilih tanggal lain.`);
      setSubmitted(false);
      return;
    }

    if (!isValidPhoneNumber(form.whatsappNumber)) {
      setError("Nomor WhatsApp belum valid. Gunakan 9-15 digit angka.");
      setSubmitted(false);
      return;
    }

    if (
      business.mode === "BOOKING_SERVICE" &&
      business.operationalModel === "RESOURCE_BOOKING" &&
      !form.resourceId
    ) {
      setError(`Silakan pilih ${business.resourceLabel || "Unit"} terlebih dahulu.`);
      setSubmitted(false);
      return;
    }

    if (
      business.mode === "BOOKING_SERVICE" &&
      (business.operationalModel === "RESOURCE_BOOKING"
        ? activeAvailability.isFull
        : isBookingSlotFull(orders, form.scheduledDate, form.scheduledTime, bookingDurationMinutes, undefined, undefined, business.bookingCapacity))
    ) {
      setError("Jadwal di jam ini sudah terisi penuh, silakan pilih jam atau hari lain.");
      setSubmitted(false);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      try {
        submitPublicOrder({
          payload: {
            ...form,
            whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
          },
        });
        setSubmitted(true);
        toast.success("Form berhasil dikirim", "Admin akan lanjut menghubungi lewat WhatsApp.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Form belum bisa dikirim.");
        setSubmitted(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const timeCandidates = useMemo(() => {
    let startHour = 8;
    let endHour = 21;

    if (business.openingHours) {
      const parts = business.openingHours.split("-").map(p => p.trim());
      if (parts.length === 2) {
        const sPart = parseInt(parts[0].split(":")[0], 10);
        const ePart = parseInt(parts[1].split(":")[0], 10);
        if (!isNaN(sPart)) startHour = sPart;
        if (!isNaN(ePart)) endHour = ePart;
      }
    }

    const candidates: string[] = [];
    for (let i = startHour; i <= endHour; i++) {
      candidates.push(`${String(i).padStart(2, "0")}:00`);
    }
    return candidates;
  }, [business.openingHours]);

  const fullyBookedDates = useMemo(() => {
    if (business.mode !== "BOOKING_SERVICE") return [];
    
    const fullDates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      if (business.closedDates?.[dateStr]) continue;

      let isDateFull = true;
      for (const time of timeCandidates) {
        let isTimeFull = false;
        if (business.operationalModel === "RESOURCE_BOOKING") {
          const avail = getResourceBookingAvailability(orders, business.resources ?? [], dateStr, time, bookingDurationMinutes);
          isTimeFull = avail.isFull;
        } else {
          const avail = getBookingAvailability(orders, dateStr, time, bookingDurationMinutes, undefined, undefined, business.bookingCapacity);
          isTimeFull = avail.isFull;
        }

        if (!isTimeFull) {
          isDateFull = false;
          break;
        }
      }

      if (isDateFull) {
        fullDates.push(dateStr);
      }
    }
    return fullDates;
  }, [business.mode, business.closedDates, business.operationalModel, business.resources, business.bookingCapacity, orders, bookingDurationMinutes, timeCandidates]);

  const disabledDates = useMemo(() => {
    return [...Object.keys(business.closedDates || {}), ...fullyBookedDates];
  }, [business.closedDates, fullyBookedDates]);

  const getCandidateAvailability = (time: string) => {
    if (business.operationalModel === "RESOURCE_BOOKING") {
      if (form.resourceId && form.resourceId !== "ANY") {
        return getResourceAvailabilityForSelection(orders, form.resourceId, form.scheduledDate, time, bookingDurationMinutes);
      }
      return getResourceBookingAvailability(
        orders,
        business.resources ?? [],
        form.scheduledDate,
        time,
        bookingDurationMinutes
      );
    } else {
      return getBookingAvailability(orders, form.scheduledDate, time, bookingDurationMinutes, undefined, undefined, business.bookingCapacity);
    }
  };

  let steps = [
    { num: 1, label: business.mode === "BOOKING_SERVICE" ? "Pilih Layanan" : business.mode === "PRODUCT_ORDER" ? "Pilih Produk" : "Detail Request" },
    { num: 2, label: business.mode === "BOOKING_SERVICE" ? "Tentukan Jadwal" : business.mode === "PRODUCT_ORDER" ? "Pengiriman" : "Data Kontak" },
    ...(business.mode !== "CUSTOM_REQUEST" ? [{ num: 3, label: "Data Kontak" }] : [])
  ];

  if (catalog.length === 1 && business.mode !== "CUSTOM_REQUEST") {
    steps = steps.filter((s) => s.num !== 1);
  }

  if (!isMatch) {
    return (
      <main className="page-enter mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <Card className="w-full">
          <CardBody className="space-y-4 p-6">
            <Badge tone="danger">Link tidak ditemukan</Badge>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)]">Form publik belum cocok</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Slug yang dibuka tidak sesuai dengan bisnis aktif di mock data saat ini.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton href={ROUTES.publicBusiness(business.slug)}>Buka Halaman Bisnis</LinkButton>
              <LinkButton href={ROUTES.dashboard} variant="secondary">
                Kembali ke App
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main className="page-enter mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {submitted ? (
        // ── SUCCESS SCREEN ──
        <div className="max-w-xl mx-auto mt-10">
          <Card className="border-[var(--color-border)] shadow-[var(--shadow-lg)]">
            <CardBody className="p-6 sm:p-8 space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-[var(--color-text)]">Pemesanan Terkirim!</h1>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Terima kasih, data Anda sudah masuk ke sistem kami. Admin akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-left text-sm space-y-3.5 shadow-inner">
                <p className="font-extrabold text-xs uppercase tracking-wider text-[var(--color-text-secondary)] border-b border-[var(--color-border)]/40 pb-2">
                  Ringkasan Pemesanan
                </p>
                <div className="space-y-2">
                  {form.service || form.product ? (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--color-text-secondary)]">{business.mode === "BOOKING_SERVICE" ? "Layanan" : "Produk"}:</span>
                      <span className="font-extrabold text-[var(--color-text)]">{form.service || form.product}</span>
                    </div>
                  ) : null}
                  {form.scheduledDate ? (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--color-text-secondary)]">Tanggal &amp; Waktu:</span>
                      <span className="font-extrabold text-[var(--color-text)]">{formatLongDate(form.scheduledDate)} {form.scheduledTime ? `pada ${form.scheduledTime}` : ""}</span>
                    </div>
                  ) : null}
                  {form.name ? (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--color-text-secondary)]">Pelanggan:</span>
                      <span className="font-bold text-[var(--color-text)]">{form.name} ({form.whatsappNumber})</span>
                    </div>
                  ) : null}
                  {form.notes ? (
                    <div className="text-xs pt-1 border-t border-[var(--color-border)]/20">
                      <p className="text-[var(--color-text-secondary)]">Catatan:</p>
                      <p className="font-medium text-[var(--color-text)] mt-0.5">{form.notes}</p>
                    </div>
                  ) : null}
                  {business.paymentInstructions ? (
                    <div className="pt-2 border-t border-[var(--color-border)]/20 text-xs">
                      <p className="text-[var(--color-text-secondary)] font-bold mb-1">Metode Pembayaran / Transfer:</p>
                      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 font-mono font-bold text-[var(--color-text)] whitespace-pre-wrap leading-relaxed select-all">
                        {business.paymentInstructions}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Instruksi Lanjutan Penting */}
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 text-xs text-left text-amber-800 space-y-2 leading-relaxed">
                <p className="font-extrabold uppercase tracking-wider text-[10px] text-amber-700 flex items-center gap-1">
                  💡 Langkah Penting Selanjutnya:
                </p>
                <ul className="list-decimal list-inside space-y-1.5 text-slate-700 font-medium">
                  <li>
                    Klik tombol <span className="font-bold text-amber-900">&quot;Kirim Bukti via WhatsApp&quot;</span> untuk mengirim konfirmasi pemesanan otomatis ke kami.
                  </li>
                  {business.paymentInstructions ? (
                    <li>
                      Lakukan transfer sesuai rekening di atas, lalu <span className="font-bold text-amber-900">lampirkan bukti transfer</span> di chat agar pesanan Anda segera disetujui.
                    </li>
                  ) : (
                    <li>Tunggu konfirmasi/balasan dari kami setelah pesan WhatsApp terkirim.</li>
                  )}
                </ul>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 pt-2">
                <LinkButton href={ROUTES.publicBusiness(business.slug)} variant="secondary" className="w-full justify-center rounded-xl font-bold py-3">
                  Kembali ke Toko
                </LinkButton>
                <LinkButton href={waLink} className="w-full justify-center rounded-xl font-bold py-3">
                  Kirim Bukti via WhatsApp
                </LinkButton>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        // ── FORM STEPS SCREEN ──
        <div className="space-y-6">
          {/* Header Business Info Card */}
          <Card className="border-[var(--color-border)] shadow-[var(--shadow-md)] overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[var(--color-primary)] via-indigo-500 to-purple-500" />
            <CardBody className="p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {business.logoUrl ? (
                    <Image
                      src={business.logoUrl}
                      alt={business.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-2xl object-contain border border-[var(--color-border)] bg-white p-1"
                      unoptimized
                    />
                  ) : null}
                  <div>
                    <h1 className="text-xl font-black text-[var(--color-text)]">{business.name}</h1>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>📍 {business.address}</span>
                      <span className="text-[var(--color-border)] hidden sm:inline">•</span>
                      <span>🕒 {business.openingHours}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <LinkButton href={ROUTES.publicBusiness(business.slug)} variant="secondary" className="rounded-xl text-xs py-2 px-3">
                    Lihat Toko
                  </LinkButton>
                  <LinkButton href={waLink} className="rounded-xl text-xs py-2 px-3">
                    Chat WA
                  </LinkButton>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Form Wizard Step Card */}
          <Card className="border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <CardBody className="p-5 sm:p-6">
              {/* Steps Progress Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6 border-b border-[var(--color-border)]/40 pb-5">
                {steps.map((s, idx) => (
                  <div key={s.num} className="flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-black transition",
                      currentStep === s.num
                        ? "bg-[var(--color-primary)] text-white shadow-sm"
                        : currentStep > s.num
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                    )}>
                      {idx + 1}
                    </div>
                    <span className={cn(
                      "text-xs font-bold transition",
                      currentStep === s.num ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
                    )}>
                      {s.label}
                    </span>
                    {idx < steps.length - 1 && <span className="text-[var(--color-border)] text-xs mx-1">➔</span>}
                  </div>
                ))}
              </div>

              {/* Step Forms */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {business.mode === "CUSTOM_REQUEST" ? (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-bold text-[var(--color-text)]">Detail Permintaan</h2>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Tulis secara lengkap detail request kustom Anda.</p>
                      </div>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Ceritakan Kebutuhan Anda <span className="text-red-500">*</span></span>
                        <Textarea
                          value={form.requestDetail || ""}
                          onChange={(e) => updateField("requestDetail", e.target.value)}
                          placeholder="Jelaskan jenis kustom request, warna, atau instruksi pengerjaan..."
                          rows={5}
                        />
                      </label>
                      <label className="block pt-2">
                        <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Target Deadline (Opsional)</span>
                        <DatePicker
                          value={form.deadline || ""}
                          onValueChange={(val) => updateField("deadline", val)}
                          placeholder="Pilih tanggal deadline"
                        />
                      </label>
                      
                      {/* Honeypot field (hidden from real users) */}
                      <div className="hidden" aria-hidden="true">
                        <label htmlFor="botField">Leave this field empty</label>
                        <input
                          type="text"
                          id="botField"
                          name="botField"
                          value={form.botField || ""}
                          onChange={(e) => updateField("botField", e.target.value)}
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </div>

                      <div className="mt-6 pt-4 border-t border-[var(--color-border)]/40 flex justify-end">
                        <Button
                          type="button"
                          disabled={!form.requestDetail?.trim()}
                          onClick={() => setCurrentStep(2)}
                          className="w-full sm:w-auto font-bold rounded-xl"
                        >
                          Lanjut ke Kontak
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-bold text-[var(--color-text)]">
                          Pilih {business.mode === "BOOKING_SERVICE" ? "Layanan" : "Produk"}
                        </h2>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          Pilih salah satu menu di bawah untuk melanjutkan pemesanan.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {catalog.map((item) => {
                          const catalogField = getCatalogFieldName(business.mode);
                          const isSelected = fieldValueFromState(form, catalogField) === item.name;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                const nextForm = isSelected
                                  ? clearCatalogSelectionFromForm(business.mode, form, defaultBookingDuration)
                                  : applyCatalogSelectionToForm(
                                      business.mode,
                                      form,
                                      item.name,
                                      inferCatalogDurationMinutes(item),
                                      item.priceLabel
                                    );
                                setError("");
                                setForm(nextForm);
                                setTimeout(() => setCurrentStep(2), 250);
                              }}
                              className={cn(
                                "rounded-2xl border p-4 text-left transition flex flex-col justify-between h-32 hover:scale-[1.01] active:scale-[0.99] shadow-sm",
                                isSelected
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]"
                                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)]"
                              )}
                            >
                              <div className="min-w-0">
                                <p className="font-extrabold text-[var(--color-text)] text-sm leading-tight truncate">{item.name}</p>
                                <p className="mt-1.5 text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                                  {item.description || "Layanan/produk premium dari kami."}
                                </p>
                              </div>
                              <div className="mt-2 flex justify-between items-center w-full">
                                <span className="text-xs font-black text-[var(--color-primary)]">
                                  {item.priceLabel || "Harga by chat"}
                                </span>
                                {isSelected && (
                                  <Badge tone="success" className="font-black text-[9px] uppercase tracking-wider">Dipilih</Badge>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 pt-4 border-t border-[var(--color-border)]/40 flex justify-end">
                        <Button
                          type="button"
                          disabled={!fieldValueFromState(form, getCatalogFieldName(business.mode))}
                          onClick={() => setCurrentStep(2)}
                          className="w-full sm:w-auto font-bold rounded-xl"
                        >
                          Lanjut
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  {business.mode === "BOOKING_SERVICE" ? (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-bold text-[var(--color-text)]">Pilih Tanggal &amp; Jam</h2>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          Jadwal kosong terdeteksi secara otomatis.
                          {business.timezone && <span className="font-bold text-[var(--color-primary)] ml-1">Zona waktu: {business.timezone}</span>}
                        </p>
                      </div>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Pilih Tanggal <span className="text-red-500">*</span></span>
                        <DatePicker
                          value={form.scheduledDate || ""}
                          onValueChange={(val) => {
                            updateField("scheduledDate", val);
                            updateField("scheduledTime", "");
                          }}
                          disabledDates={disabledDates}
                        />
                        {form.scheduledDate && business.closedDates?.[form.scheduledDate] && (
                          <p className="mt-2 text-xs font-semibold text-[var(--color-danger-text)] bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] rounded-xl px-3 py-2 animate-pulse">
                            ⚠️ Operasional tutup / libur pada tanggal ini karena: &quot;{business.closedDates[form.scheduledDate]}&quot;. Silakan pilih tanggal lain.
                          </p>
                        )}
                      </label>

                      {form.scheduledDate && !business.closedDates?.[form.scheduledDate] && (
                        <div className="space-y-4 pt-2">
                          {business.operationalModel === "RESOURCE_BOOKING" && resourceDetailsForDate.length > 0 && (
                            <div className="space-y-3">
                              <span className="block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Pilih {business.resourceLabel || "Unit"} <span className="text-red-500">*</span></span>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!resourceBookingAvailability.isFull) {
                                      updateField("resourceId", "ANY");
                                      updateField("scheduledTime", "");
                                    }
                                  }}
                                  className={cn(
                                    "p-3 rounded-xl border text-left transition-all flex justify-between items-center",
                                    resourceBookingAvailability.isFull
                                      ? "bg-red-500/5 border-red-500/10 text-red-500/40 cursor-not-allowed"
                                      : form.resourceId === "ANY"
                                        ? "bg-[var(--color-primary)] text-white border-transparent shadow-md scale-[1.02]"
                                        : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] hover:scale-[1.01] active:scale-[0.99] text-[var(--color-text)]"
                                  )}
                                  disabled={resourceBookingAvailability.isFull}
                                >
                                  <div>
                                    <div className="font-bold text-sm">Bebas / Pilihkan Untuk Saya</div>
                                    <div className={cn("text-[10px] mt-0.5", form.resourceId === "ANY" ? "text-white/80" : "text-[var(--color-text-secondary)]")}>
                                      Sistem akan memilih {business.resourceLabel || "unit"} yang kosong
                                    </div>
                                  </div>
                                </button>
                                {resourceDetailsForDate.map((res) => {
                                  const isSelected = form.resourceId === res.resourceId;
                                  const isFull = res.isFull;

                                  return (
                                    <button
                                      key={res.resourceId}
                                      type="button"
                                      onClick={() => {
                                        if (!isFull) {
                                          updateField("resourceId", res.resourceId);
                                          updateField("scheduledTime", "");
                                        }
                                      }}
                                      className={cn(
                                        "p-3 rounded-xl border text-left transition-all flex justify-between items-center",
                                        isFull
                                          ? "bg-red-500/5 border-red-500/10 text-red-500/40 cursor-not-allowed"
                                          : isSelected
                                            ? "bg-[var(--color-primary)] text-white border-transparent shadow-md scale-[1.02]"
                                            : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] hover:scale-[1.01] active:scale-[0.99] text-[var(--color-text)]"
                                      )}
                                      disabled={isFull}
                                    >
                                      <div>
                                        <span className="text-sm font-bold block">{res.resourceName}</span>
                                        <span className={cn(
                                          "text-[10px] tracking-wide uppercase font-extrabold mt-0.5 block",
                                          isFull ? "text-red-500/60" : isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                                        )}>
                                          {isFull ? "Semua Jadwal Penuh" : res.hasHold ? "Tersedia Sebagian" : "Tersedia"}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {(business.operationalModel !== "RESOURCE_BOOKING" || form.resourceId) && (
                            <div className="space-y-3 pt-2">
                              <span className="block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Pilih Jam yang Tersedia <span className="text-red-500">*</span></span>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                            {timeCandidates.map((time) => {
                              const avail = getCandidateAvailability(time);
                              const isSelected = form.scheduledTime === time;
                              const isFull = avail.isFull;

                              return (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => {
                                    if (!isFull) {
                                      updateField("scheduledTime", time);
                                    }
                                  }}
                                  className={cn(
                                    "py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5",
                                    isFull
                                      ? "bg-red-500/5 border-red-500/10 text-red-500/40 cursor-not-allowed"
                                      : isSelected
                                        ? "bg-[var(--color-primary)] text-white border-transparent shadow-md scale-[1.02]"
                                        : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] hover:scale-[1.01] active:scale-[0.99] text-[var(--color-text)]"
                                  )}
                                  disabled={isFull}
                                >
                                  <span className="text-xs font-bold">{time}</span>
                                  <span className={cn(
                                    "text-[8px] tracking-wide uppercase font-extrabold",
                                    isFull ? "text-red-500/60" : isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                                  )}>
                                    {isFull ? "Penuh" : avail.hasHold ? "Ditahan" : "Tersedia"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Alternative Warnings / Overlap details */}
                          {form.scheduledTime && (
                            <div className="pt-2">
                              <p className={`text-xs ${activeAvailability.isFull ? "text-[var(--color-danger)]" : activeAvailability.hasHold ? "text-[var(--color-warning-text)]" : "text-[var(--color-text-muted)]"}`}>
                                {slotHint}
                              </p>
                            </div>
                          )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-6 pt-4 border-t border-[var(--color-border)]/40 flex justify-between gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setCurrentStep(1)}
                          className="font-bold rounded-xl"
                        >
                          Kembali
                        </Button>
                        <Button
                          type="button"
                          disabled={!form.scheduledDate || !form.scheduledTime || Boolean(business.closedDates?.[form.scheduledDate]) || (business.operationalModel === "RESOURCE_BOOKING" && !form.resourceId)}
                          onClick={() => setCurrentStep(3)}
                          className="font-bold rounded-xl"
                        >
                          Lanjut
                        </Button>
                      </div>
                    </div>
                  ) : business.mode === "PRODUCT_ORDER" ? (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-bold text-[var(--color-text)]">Jumlah &amp; Pengiriman</h2>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Tentukan kuantitas pesanan produk Anda.</p>
                      </div>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Jumlah Unit <span className="text-red-500">*</span></span>
                        <Input
                          type="number"
                          min={1}
                          value={form.quantity || "1"}
                          onChange={(e) => updateField("quantity", e.target.value)}
                          placeholder="1"
                        />
                      </label>
                      <label className="block pt-2">
                        <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Metode Pengiriman</span>
                        <Select
                          value={form.deliveryMethod || "Ambil Sendiri"}
                          onValueChange={(val) => updateField("deliveryMethod", val)}
                          options={[
                            { value: "Ambil Sendiri", label: "Ambil Sendiri ke Toko" },
                            { value: "Kirim Kurir", label: "Kirim via Kurir Ekspedisi" }
                          ]}
                          placeholder="Pilih metode"
                        />
                      </label>

                      <div className="mt-6 pt-4 border-t border-[var(--color-border)]/40 flex justify-between gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setCurrentStep(1)}
                          className="font-bold rounded-xl"
                        >
                          Kembali
                        </Button>
                        <Button
                          type="button"
                          disabled={!form.quantity || Number(form.quantity) < 1}
                          onClick={() => setCurrentStep(3)}
                          className="font-bold rounded-xl"
                        >
                          Lanjut
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // CUSTOM REQUEST step 2 is Data Kontak
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-base font-bold text-[var(--color-text)]">Informasi Kontak Anda</h2>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Kami akan menghubungi Anda ke WhatsApp nomor ini.</p>
                      </div>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Nama Lengkap <span className="text-red-500">*</span></span>
                        <Input
                          value={form.name || ""}
                          onChange={(e) => updateField("name", e.target.value)}
                          placeholder="Nama lengkap Anda"
                        />
                      </label>
                      <label className="block pt-2">
                        <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Nomor WhatsApp <span className="text-red-500">*</span></span>
                        <Input
                          type="tel"
                          value={form.whatsappNumber || ""}
                          onChange={(e) => updateField("whatsappNumber", e.target.value)}
                          placeholder="08123456789"
                        />
                      </label>

                      {error ? <p className="text-xs font-bold text-[var(--color-danger)]">{error}</p> : null}

                      <div className="mt-6 pt-4 border-t border-[var(--color-border)]/40 flex justify-between gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setCurrentStep(1)}
                          className="font-bold rounded-xl"
                        >
                          Kembali
                        </Button>
                        <Button
                          type="button"
                          isLoading={isSubmitting}
                          disabled={!form.name?.trim() || !form.whatsappNumber?.trim() || !canCreateOrder}
                          onClick={() => void handleSubmit()}
                          className="font-bold rounded-xl"
                        >
                          Kirim Permintaan
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && business.mode !== "CUSTOM_REQUEST" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-text)]">Informasi Kontak &amp; Kirim</h2>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Isi data kontak Anda dan kirim pesanan.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Nama Lengkap <span className="text-red-500">*</span></span>
                      <Input
                        value={form.name || ""}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Nama lengkap Anda"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Nomor WhatsApp <span className="text-red-500">*</span></span>
                      <Input
                        type="tel"
                        value={form.whatsappNumber || ""}
                        onChange={(e) => updateField("whatsappNumber", e.target.value)}
                        placeholder="08123456789"
                      />
                    </label>
                  </div>

                  <label className="block pt-2">
                    <span className="mb-2 block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Catatan Tambahan (Opsional)</span>
                    <Textarea
                      value={form.notes || ""}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="Tulis catatan jika ada permintaan khusus..."
                      rows={3}
                    />
                  </label>

                  {/* Summary before submit */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-sm space-y-2">
                    <p className="font-extrabold text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]/30 pb-1.5">
                      Tinjauan Pemesanan
                    </p>
                    <div className="space-y-1.5 text-xs text-[var(--color-text)]">
                      <p className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Item:</span>
                        <span className="font-bold">{form.service || form.product}</span>
                      </p>
                      {business.mode === "BOOKING_SERVICE" ? (
                        <p className="flex justify-between">
                          <span className="text-[var(--color-text-secondary)]">Jadwal:</span>
                          <span className="font-bold">{formatLongDate(form.scheduledDate)} jam {form.scheduledTime}</span>
                        </p>
                      ) : (
                        <p className="flex justify-between">
                          <span className="text-[var(--color-text-secondary)]">Jumlah &amp; Kirim:</span>
                          <span className="font-bold">{form.quantity} unit ({form.deliveryMethod})</span>
                        </p>
                      )}
                      
                      {business.paymentInstructions && (
                        <div className="mt-3 pt-3 border-t border-[var(--color-border)]/40 space-y-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Informasi Rekening / Pembayaran:</p>
                          <p className="font-bold text-xs text-[var(--color-text)] whitespace-pre-wrap">{business.paymentInstructions}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Honeypot field (hidden from real users) */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="botField-main">Leave this field empty</label>
                    <input
                      type="text"
                      id="botField-main"
                      name="botField-main"
                      value={form.botField || ""}
                      onChange={(e) => updateField("botField", e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {error ? <p className="text-xs font-bold text-[var(--color-danger)]">{error}</p> : null}

                  <div className="mt-6 pt-4 border-t border-[var(--color-border)]/40 flex justify-between gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setCurrentStep(2)}
                      className="font-bold rounded-xl"
                    >
                      Kembali
                    </Button>
                    <Button
                      type="button"
                      isLoading={isSubmitting}
                      disabled={!form.name?.trim() || !form.whatsappNumber?.trim() || !canCreateOrder}
                      onClick={() => void handleSubmit()}
                      className="font-bold rounded-xl"
                    >
                      Konfirmasi &amp; Kirim
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </main>
  );
}
