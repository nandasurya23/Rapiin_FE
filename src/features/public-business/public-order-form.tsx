"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, MapPin, PhoneCall, Sparkles } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimeSelect } from "@/components/ui/time-select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import {
  BOOKING_HOLD_MINUTES,
  DEFAULT_BOOKING_DURATION_MINUTES,
  getBookingAvailability,
  getResourceBookingAvailability,
  isBookingSlotFull,
} from "@/lib/booking";
import { ROUTES } from "@/lib/routes";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  getPublicCatalog,
  inferCatalogDurationMinutes,
  getPublicFormFields,
  getPublicFormSubmitLabel,
  getPublicFormTitle,
  getPublicPageSubtitle,
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
    notes: "",
  },
  PRODUCT_ORDER: {
    name: "",
    whatsappNumber: "",
    product: "",
    quantity: "1",
    deliveryMethod: "",
    notes: "",
  },
  CUSTOM_REQUEST: {
    name: "",
    whatsappNumber: "",
    requestDetail: "",
    deadline: "",
    budget: "",
    notes: "",
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
    lines.push(`Tanggal: ${form.scheduledDate}`);
  }

  if (form.scheduledTime) {
    lines.push(`Jam: ${form.scheduledTime}`);
  }

  if (form.bookingDurationMinutes) {
    lines.push(`Durasi: ${form.bookingDurationMinutes} menit`);
  }

  if (form.deliveryMethod) {
    lines.push(`Ambil / antar: ${form.deliveryMethod}`);
  }

  if (form.deadline) {
    lines.push(`Deadline: ${form.deadline}`);
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

  return lines.join("\n");
}

function applyCatalogSelectionToForm(mode: BusinessMode, current: FormState, itemName: string, durationMinutes?: number | null) {
  const next = {
    ...current,
    [getCatalogFieldName(mode)]: itemName,
  };

  if (mode === "BOOKING_SERVICE" && durationMinutes && durationMinutes > 0) {
    next.bookingDurationMinutes = String(durationMinutes);
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
  const { business, hydrated, orders, submitPublicOrder, canCreateOrder, readOnlyReason } = useAppData();
  const defaultBookingDuration = business.defaultBookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES;
  const [form, setForm] = useState<FormState>(initialStateByMode[business.mode]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setForm({
      ...initialStateByMode[business.mode],
      bookingDurationMinutes: String(defaultBookingDuration),
    });
    setSubmitted(false);
    setError("");
  }, [business.mode, defaultBookingDuration, hydrated]);

  const isMatch = isBusinessSlugMatch(business, slug);
  const catalog = getPublicCatalog(business);
  const selectedCatalogItem = useMemo(() => {
    const itemId = searchParams.get("item");

    if (!itemId) {
      return null;
    }

    return catalog.find((item) => item.id === itemId) ?? null;
  }, [catalog, searchParams]);
  const bookingDurationMinutes = useMemo(() => {
    const parsedDuration = Number(form.bookingDurationMinutes);

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return DEFAULT_BOOKING_DURATION_MINUTES;
    }

    return parsedDuration;
  }, [form.bookingDurationMinutes]);
  const bookingAvailability = useMemo(
    () => getBookingAvailability(orders, form.scheduledDate, form.scheduledTime, bookingDurationMinutes),
    [bookingDurationMinutes, form.scheduledDate, form.scheduledTime, orders]
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
  const activeAvailability = business.operationalModel === "RESOURCE_BOOKING" ? resourceBookingAvailability : bookingAvailability;
  const slotHint = useMemo(() => {
    if (business.mode !== "BOOKING_SERVICE") {
      return "";
    }

    if (!form.scheduledDate || !form.scheduledTime) {
      return business.operationalModel === "RESOURCE_BOOKING"
        ? `Pilih tanggal, jam, dan durasi dulu. Admin akan cek unit yang masih kosong. Booking tanpa DP akan ditahan ${BOOKING_HOLD_MINUTES} menit.`
        : `Pilih tanggal, jam, dan durasi dulu. Booking tanpa DP akan ditahan ${BOOKING_HOLD_MINUTES} menit.`;
    }

    if (activeAvailability.isFull) {
      if (activeAvailability.hasHold) {
        return activeAvailability.earliestHoldExpiresAt
          ? `Slot sementara ditahan. Akan terbuka lagi pukul ${formatHoldReleaseTime(activeAvailability.earliestHoldExpiresAt.toISOString())}.`
          : "Slot sementara ditahan. Akan terbuka lagi setelah hold selesai.";
      }

      return business.operationalModel === "RESOURCE_BOOKING"
        ? "Semua unit sedang penuh di jam ini. Silakan pilih jam lain."
        : "Slot penuh. Silakan pilih jam lain.";
    }

    if (activeAvailability.count <= 0) {
      return business.operationalModel === "RESOURCE_BOOKING"
        ? `Masih ada unit yang kosong. Booking tanpa DP akan ditahan ${BOOKING_HOLD_MINUTES} menit.`
        : `Slot masih kosong. Booking tanpa DP akan ditahan ${BOOKING_HOLD_MINUTES} menit.`;
    }

    if (activeAvailability.hasHold) {
      return activeAvailability.earliestHoldExpiresAt
        ? `Slot sementara ditahan. Akan terbuka lagi pukul ${formatHoldReleaseTime(activeAvailability.earliestHoldExpiresAt.toISOString())}.`
        : "Slot sementara ditahan.";
    }

    return activeAvailability.remaining === 1 ? "Slot tersisa 1" : `Slot tersisa ${activeAvailability.remaining}`;
  }, [activeAvailability.count, activeAvailability.earliestHoldExpiresAt, activeAvailability.hasHold, activeAvailability.isFull, activeAvailability.remaining, business.mode, business.operationalModel, form.scheduledDate, form.scheduledTime]);

  const fields = useMemo(() => getPublicFormFields(business), [business]);
  const submitLabel = getPublicFormSubmitLabel(business);
  const hasSelectedBookingService = business.mode === "BOOKING_SERVICE" && Boolean(form.service.trim());
  const waMessage = useMemo(() => createPublicWhatsAppMessage(business, form), [business, form]);
  const waLink = useMemo(
    () => buildWhatsAppUrl(business.whatsappNumber, waMessage),
    [business.whatsappNumber, waMessage]
  );

  useEffect(() => {
    if (!selectedCatalogItem) {
      return;
    }

    const catalogField = getCatalogFieldName(business.mode);
    const inferredDurationMinutes = inferCatalogDurationMinutes(selectedCatalogItem);

    setForm((current) => {
      if (
        (current[catalogField] ?? "") === selectedCatalogItem.name &&
        (business.mode !== "BOOKING_SERVICE" || !inferredDurationMinutes || current.bookingDurationMinutes === String(inferredDurationMinutes))
      ) {
        return current;
      }

      return applyCatalogSelectionToForm(business.mode, current, selectedCatalogItem.name, inferredDurationMinutes);
    });
  }, [business.mode, selectedCatalogItem]);

  if (!isMatch) {
    return (
      <main className="page-enter mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <Card className="w-full">
          <CardBody className="space-y-4 p-6">
            <Badge tone="danger">Link tidak ditemukan</Badge>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">Form publik belum cocok</h1>
              <p className="mt-2 text-sm text-text-secondary">
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

  function updateField(name: string, value: string) {
    setError("");
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit() {
    const missing = requiredFieldsForBusiness(business).find((field) => !fieldValueFromState(form, field).trim());

    if (missing) {
      setError("Lengkapi semua field wajib dulu.");
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
      (business.operationalModel === "RESOURCE_BOOKING"
        ? activeAvailability.isFull
        : isBookingSlotFull(orders, form.scheduledDate, form.scheduledTime, bookingDurationMinutes))
    ) {
      setError("Slot tanggal dan jam ini sudah penuh. Pilih jam lain.");
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

  return (
    <main className="page-enter mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <Badge tone="info">Form Publik</Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
                  {getPublicFormTitle(business)}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  {getPublicPageSubtitle(business)}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
                  Isi form singkat ini. Admin akan lanjut menghubungi lewat WhatsApp.
                </p>
                {!canCreateOrder ? <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-700">{readOnlyReason}</p> : null}
                {selectedCatalogItem ? (
                  <div className="mt-3">
                    <Badge tone="success">Pilihan aktif: {selectedCatalogItem.name}</Badge>
                  </div>
                ) : null}
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row xl:flex-col xl:items-stretch xl:self-start">
                <LinkButton
                  href={ROUTES.publicBusiness(business.slug)}
                  variant="secondary"
                  className="justify-center sm:min-w-[220px]"
                >
                  Lihat Halaman Bisnis
                </LinkButton>
                <LinkButton href={waLink} className="justify-center sm:min-w-[220px]">
                  <PhoneCall className="h-4 w-4" />
                  Chat WhatsApp
                </LinkButton>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">{business.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">Preview singkat layanan dan info dasar yang dilihat customer.</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-brand-700" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {catalog.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const isSelected = fieldValueFromState(form, getCatalogFieldName(business.mode)) === item.name;
                        const nextForm = isSelected
                          ? clearCatalogSelectionFromForm(business.mode, form, defaultBookingDuration)
                          : applyCatalogSelectionToForm(
                              business.mode,
                              form,
                              item.name,
                              inferCatalogDurationMinutes(item)
                            );
                        setError("");
                        setForm(nextForm);
                      }}
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        fieldValueFromState(form, getCatalogFieldName(business.mode)) === item.name
                          ? "border-brand-300 bg-brand-50"
                          : "border-border/70 bg-surface hover:bg-muted"
                      }`}
                      aria-pressed={fieldValueFromState(form, getCatalogFieldName(business.mode)) === item.name}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-text-primary">{item.name}</p>
                          <p className="mt-1 text-xs text-text-muted">{item.priceLabel ?? "Harga fleksibel"}</p>
                        </div>
                        {fieldValueFromState(form, getCatalogFieldName(business.mode)) === item.name ? (
                          <Badge tone="success">Dipilih</Badge>
                        ) : (
                          <span className="text-xs font-medium text-brand-700">Pilih</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface px-4 py-4 text-sm text-text-secondary">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-brand-700" />
                  <p>{business.address}</p>
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-brand-700" />
                  <p>{business.openingHours}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Isi data</h2>
              <p className="text-sm text-text-secondary">Form tetap singkat dan nyaman di HP.</p>
            </div>

            {fields.map((field) => {
              const value = fieldValueFromState(form, field.name);

              return (
                <label key={field.name} className="block">
                  <span className="mb-2 block text-sm font-medium text-text-primary">
                    {field.label}
                    {field.required ? <span className="ml-1 text-status-danger">*</span> : null}
                  </span>
                  {field.type === "date" ? (
                    <DatePicker
                      value={value}
                      onValueChange={(nextValue) => updateField(field.name, nextValue)}
                      placeholder={field.placeholder}
                    />
                  ) : field.name === "budget" ? (
                    <FormattedNumberInput
                      value={value}
                      onValueChange={(nextValue) => updateField(field.name, nextValue)}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "time" ? (
                    <>
                      <TimeSelect
                        value={value}
                        onValueChange={(nextValue) => updateField(field.name, nextValue)}
                        placeholder={field.placeholder}
                      />
                      {field.name === "scheduledTime" && business.mode === "BOOKING_SERVICE" ? (
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge tone={activeAvailability.isFull ? "danger" : activeAvailability.hasHold ? "warning" : activeAvailability.count > 0 ? "success" : "neutral"}>
                              {activeAvailability.isFull ? "Penuh" : activeAvailability.hasHold ? "Ditahan sementara" : activeAvailability.count > 0 ? "Tersedia" : "Kosong"}
                            </Badge>
                            {activeAvailability.count > 0 && !activeAvailability.isFull && !activeAvailability.hasHold ? (
                              <Badge tone="info">Slot tersisa {activeAvailability.remaining}</Badge>
                            ) : null}
                          </div>
                          <p className={`text-xs ${activeAvailability.isFull ? "text-status-danger" : activeAvailability.hasHold ? "text-amber-700" : "text-text-muted"}`}>{slotHint}</p>
                        </div>
                      ) : null}
                    </>
                  ) : field.name === "bookingDurationMinutes" && business.mode === "BOOKING_SERVICE" ? (
                    hasSelectedBookingService ? (
                      <div className="rounded-md border border-border bg-muted/25 px-4 py-3 text-sm text-text-primary">
                        <div className="font-medium">
                          {value ? `${value} menit` : "Pilih layanan dulu"}
                        </div>
                        <p className="mt-1 text-xs text-text-secondary">
                          Durasi otomatis mengikuti layanan yang dipilih.
                        </p>
                      </div>
                    ) : (
                      <>
                        <Input
                          type="number"
                          min={15}
                          step={15}
                          value={value}
                          onChange={(event) => updateField(field.name, event.target.value)}
                          placeholder={field.placeholder}
                        />
                        <p className="mt-1 text-xs text-text-secondary">
                          Kalau belum pilih layanan, durasi bisa diisi manual.
                        </p>
                      </>
                    )
                  ) : field.type === "number" ? (
                    <>
                      <Input
                        type={field.type}
                        value={value}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder}
                      />
                    </>
                  ) : field.name === "notes" || field.name === "requestDetail" ? (
                    <Textarea
                      value={value}
                      onChange={(event) => updateField(field.name, event.target.value)}
                      placeholder={field.placeholder}
                    />
                  ) : field.name === "service" || field.name === "product" ? (
                    <Select
                      value={value}
                      onValueChange={(nextValue) => updateField(field.name, nextValue)}
                      options={catalog.map((item) => ({
                        value: item.name,
                        label: item.name,
                      }))}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <Input
                      value={value}
                      onChange={(event) => updateField(field.name, event.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              );
            })}

            {error ? <p className="text-sm text-status-danger">{error}</p> : null}

            <Button type="button" isLoading={isSubmitting} onClick={() => void handleSubmit()} disabled={!canCreateOrder}>
              {submitLabel}
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Sesudah dikirim</h2>
              <p className="text-sm text-text-secondary">Karena backend belum ada, form menampilkan success state dulu.</p>
            </div>

            {submitted ? (
              <div className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-700" />
                  <div>
                    <p className="font-semibold text-text-primary">Data kamu sudah masuk.</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Admin akan menghubungi kamu lewat WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-surface px-4 py-4 text-sm text-text-secondary">
                  <p className="font-medium text-text-primary">Ringkasan</p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(form).map(([key, value]) =>
                      value ? (
                        <p key={key}>
                          <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>: {value}
                        </p>
                      ) : null
                    )}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <LinkButton href={ROUTES.publicBusiness(business.slug)}>Lihat Halaman</LinkButton>
                  <LinkButton href={waLink} variant="secondary">
                    Chat WhatsApp
                  </LinkButton>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-5 text-sm text-text-secondary">
                Belum ada data terkirim. Isi form lalu klik tombol kirim.
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
