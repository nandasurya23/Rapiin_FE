"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import {
  BOOKING_HOLD_MINUTES,
  DEFAULT_BOOKING_DURATION_MINUTES,
  getBookingAvailability,
  getResourceBookingAvailability,
  getResourceBookingDetailsForDate,
  getResourceAvailabilityForSelection,
} from "@/lib/booking";
import {
  getPublicCatalog,
  inferCatalogDurationMinutes,
  getPublicFormFields,
  isTimeRequired,
} from "@/lib/public-business";
import type { Business, BusinessMode } from "@/types/business";
import { apiFetch } from "@/lib/api-client";
import { canCreateOrder as checkCanCreateOrder } from "@/lib/subscription";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";

export type FormState = Record<string, string>;

export const initialStateByMode: Record<BusinessMode, FormState> = {
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

export function getCatalogFieldName(mode: BusinessMode) {
  if (mode === "BOOKING_SERVICE") return "service";
  if (mode === "PRODUCT_ORDER") return "product";
  return "requestDetail";
}

export function applyCatalogSelectionToForm(
  mode: BusinessMode,
  current: FormState,
  itemName: string,
  durationMinutes?: number | null,
  priceLabel?: string,
  itemId?: string
) {
  const next = {
    ...current,
    [getCatalogFieldName(mode)]: itemName,
    serviceId: itemId || current.serviceId || "",
  };

  if (mode === "BOOKING_SERVICE" && durationMinutes && durationMinutes > 0) {
    next.bookingDurationMinutes = String(durationMinutes);
  }

  if (priceLabel) {
    next.budget = priceLabel;
  }

  return next;
}

export function clearCatalogSelectionFromForm(
  mode: BusinessMode,
  current: FormState,
  defaultBookingDurationMinutes: number
) {
  const next = {
    ...current,
    [getCatalogFieldName(mode)]: "",
    serviceId: "",
  };

  if (mode === "BOOKING_SERVICE") {
    next.bookingDurationMinutes = String(defaultBookingDurationMinutes);
  }

  return next;
}

export function requiredFieldsForBusiness(business: Business) {
  return getPublicFormFields(business)
    .filter((field: { required?: boolean }) => field.required)
    .map((field: { name: string }) => field.name);
}

export function formatHoldReleaseTime(value?: string | null) {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(parsedDate);
}

export function usePublicOrderForm(slug: string, initialBusiness?: Business | null) {
  const toast = useToast();
  const searchParams = useSearchParams();

  const [business, setBusiness] = useState<Business | null>(initialBusiness || null);
  const [loading, setLoading] = useState(!initialBusiness);

  useEffect(() => {
    if (initialBusiness) return;
    async function load() {
      try {
        const data = await apiFetch<Business>(`/api/public/b/${slug}`);
        setBusiness(data);
      } catch (err) {
        console.error("Failed to load business profile", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, initialBusiness]);

  const orders = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (business?.orders || []) as any[];
  }, [business?.orders]);

  const defaultBookingDuration =
    business?.defaultBookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES;

  const [form, setForm] = useState<FormState>(() => {
    if (business) {
      return {
        ...initialStateByMode[business.mode],
        bookingDurationMinutes: String(
          business.defaultBookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES
        ),
        resourceId: business.operationalModel === "RESOURCE_BOOKING" ? "ANY" : "",
      };
    }
    return initialStateByMode.BOOKING_SERVICE;
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!business) return;

    let initialForm: FormState = {
      ...initialStateByMode[business.mode],
      bookingDurationMinutes: String(defaultBookingDuration),
      resourceId: business.operationalModel === "RESOURCE_BOOKING" ? "ANY" : "",
    };

    let step = 1;
    const catalogList = getPublicCatalog(business);
    const preSelectedItemId = searchParams.get("item");

    if (preSelectedItemId) {
      const item = catalogList.find((i) => i.id === preSelectedItemId);
      if (item) {
        initialForm = applyCatalogSelectionToForm(
          business.mode,
          initialForm,
          item.name,
          inferCatalogDurationMinutes(item),
          item.priceLabel,
          item.id
        );
        step = 2;
      }
    } else if (catalogList.length === 1 && business.mode !== "CUSTOM_REQUEST") {
      const item = catalogList[0];
      initialForm = applyCatalogSelectionToForm(
        business.mode,
        initialForm,
        item.name,
        inferCatalogDurationMinutes(item),
        item.priceLabel,
        item.id
      );
      step = 2;
    }

    setForm(initialForm);
    setSubmitted(false);
    setError("");
    setCurrentStep(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.mode, defaultBookingDuration]);

  const canCreateOrder = useMemo(() => {
    if (!business) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptions = (business as any).subscriptions || [];
    return checkCanCreateOrder({
      business,
      subscriptions,
      orders,
    });
  }, [business, orders]);

  const bookingDurationMinutes = useMemo(() => {
    const parsedDuration = Number(form.bookingDurationMinutes);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return DEFAULT_BOOKING_DURATION_MINUTES;
    }
    return parsedDuration;
  }, [form.bookingDurationMinutes]);

  const bookingAvailability = useMemo(
    () =>
      business
        ? getBookingAvailability(
            orders,
            form.scheduledDate,
            form.scheduledTime,
            bookingDurationMinutes,
            undefined,
            undefined,
            business.bookingCapacity
          )
        : {
            isFull: false,
            count: 0,
            hasHold: false,
            earliestHoldExpiresAt: null,
            remaining: 0,
          },
    [bookingDurationMinutes, form.scheduledDate, form.scheduledTime, orders, business]
  );

  const resourceBookingAvailability = useMemo(
    () =>
      business
        ? getResourceBookingAvailability(
            orders,
            business.resources ?? [],
            form.scheduledDate,
            form.scheduledTime,
            bookingDurationMinutes
          )
        : {
            isFull: false,
            count: 0,
            hasHold: false,
            earliestHoldExpiresAt: null,
            remaining: 0,
          },
    [bookingDurationMinutes, form.scheduledDate, form.scheduledTime, orders, business]
  );

  const specificResourceAvailability = useMemo(() => {
    if (!form.resourceId || form.resourceId === "ANY") return null;
    return getResourceAvailabilityForSelection(
      orders,
      form.resourceId,
      form.scheduledDate,
      form.scheduledTime,
      bookingDurationMinutes
    );
  }, [form.resourceId, form.scheduledDate, form.scheduledTime, bookingDurationMinutes, orders]);

  const activeAvailability =
    form.resourceId && form.resourceId !== "ANY"
      ? specificResourceAvailability!
      : business?.operationalModel === "RESOURCE_BOOKING"
      ? resourceBookingAvailability
      : bookingAvailability;

  const resourceDetailsForDate = useMemo(() => {
    if (!business || business.operationalModel !== "RESOURCE_BOOKING" || !form.scheduledDate)
      return [];
    return getResourceBookingDetailsForDate(orders, business.resources ?? [], form.scheduledDate);
  }, [business, form.scheduledDate, orders]);

  const slotHint = useMemo(() => {
    if (!business || business.mode !== "BOOKING_SERVICE") return "";

    if (!form.scheduledDate || !form.scheduledTime) {
      return `Silakan tentukan tanggal dan jam. Pemesanan tanpa Uang Muka (DP) akan disimpan selama ${BOOKING_HOLD_MINUTES} menit sebelum otomatis dibatalkan.`;
    }

    if (activeAvailability.isFull) {
      if (activeAvailability.hasHold) {
        return activeAvailability.earliestHoldExpiresAt
          ? `Jadwal sementara menunggu konfirmasi pembayaran DP. Akan terbuka kembali jika pembayaran belum selesai pada pukul ${formatHoldReleaseTime(
              activeAvailability.earliestHoldExpiresAt.toISOString()
            )}.`
          : "Jadwal sementara menunggu konfirmasi pembayaran DP.";
      }
      return "Jadwal pada jam ini sudah penuh. Silakan pilih jam lain.";
    }

    if (activeAvailability.remaining > 0) {
      return `Tersisa ${activeAvailability.remaining} slot untuk jam ini.`;
    }

    return `Tersedia untuk dipesan. Pemesanan tanpa DP disimpan ${BOOKING_HOLD_MINUTES} menit.`;
  }, [activeAvailability, business, form.scheduledDate, form.scheduledTime]);

  function updateField(name: string, value: string) {
    setError("");
    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "scheduledDate" && business && isTimeRequired(business)) {
        next.scheduledTime = "";
      }

      if (name === "quantity" && business?.mode === "PRODUCT_ORDER") {
        const parsedQuantity = Math.max(1, Number(value) || 1);
        next.quantity = String(parsedQuantity);
      }

      return next;
    });
  }

  function handleSelectCatalogItem(itemId: string) {
    if (!business) return;
    const catalogList = getPublicCatalog(business);
    const selectedItem = catalogList.find((i) => i.id === itemId);

    if (selectedItem) {
      setForm((current) =>
        applyCatalogSelectionToForm(
          business.mode,
          current,
          selectedItem.name,
          inferCatalogDurationMinutes(selectedItem),
          selectedItem.priceLabel,
          selectedItem.id
        )
      );
      setError("");
      setCurrentStep(2);
    }
  }

  function handleClearCatalogItem() {
    if (!business) return;
    setForm((current) => clearCatalogSelectionFromForm(business.mode, current, defaultBookingDuration));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!business) return;

    if (form.botField) {
      setSubmitted(true);
      return;
    }

    if (!canCreateOrder) {
      const msg = "Maaf, bisnis ini sementara tidak dapat menerima pesanan baru.";
      setError(msg);
      toast.error("Gagal Mengirim", msg);
      return;
    }

    const reqFields = requiredFieldsForBusiness(business);
    const missing = reqFields.filter((field) => !form[field]?.trim());

    if (missing.length > 0) {
      const msg = "Mohon lengkapi semua bidang yang wajib diisi.";
      setError(msg);
      toast.error("Form Belum Lengkap", msg);
      return;
    }

    if (form.whatsappNumber && !isValidPhoneNumber(form.whatsappNumber)) {
      const msg = "Nomor WhatsApp tidak valid. Gunakan format seperti 08123456789.";
      setError(msg);
      toast.error("Format Nomor Salah", msg);
      return;
    }

    if (business.mode === "BOOKING_SERVICE" && activeAvailability.isFull) {
      const msg = "Slot waktu yang dipilih sudah penuh. Silakan pilih jam lain.";
      setError(msg);
      toast.error("Slot Penuh", msg);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const cleanPhone = normalizePhoneNumber(form.whatsappNumber);
      const payload = { ...form, whatsappNumber: cleanPhone };

      await apiFetch<unknown>(`/api/public/b/${business.slug}/submit`, {
        method: "POST",
        body: JSON.stringify({
          mode: business.mode,
          operationalModel: business.operationalModel,
          payload,
        }),
      });

      setSubmitted(true);
      toast.success("Pesanan Terkirim!", "Detail pesanan Anda telah berhasil dicatat.");
    } catch (err) {
      console.error("Error submitting public order:", err);
      const msg = err instanceof Error ? err.message : "Gagal mengirim pesanan. Silakan coba lagi.";
      setError(msg);
      toast.error("Gagal Mengirim", msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    business,
    loading,
    orders,
    form,
    setForm,
    submitted,
    setSubmitted,
    error,
    isSubmitting,
    currentStep,
    setCurrentStep,
    canCreateOrder,
    bookingDurationMinutes,
    bookingAvailability,
    resourceBookingAvailability,
    activeAvailability,
    resourceDetailsForDate,
    slotHint,
    updateField,
    handleSelectCatalogItem,
    handleClearCatalogItem,
    handleSubmit,
  };
}
