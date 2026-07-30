"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
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

export const BOOKING_HOLD_MINUTES = 30; // updated to 30 mins based on new architecture
export const DEFAULT_BOOKING_DURATION_MINUTES = 60;

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
    staffPreferenceName: "", // 2A: Optional staff preference for APPOINTMENT mode
    notes: "",
    botField: "",
    tempProofUrl: "",
    tempProofHash: "",
    totalAmount: "",
  },
  PRODUCT_ORDER: {
    name: "",
    whatsappNumber: "",
    product: "",
    quantity: "1",
    deliveryMethod: "",
    notes: "",
    botField: "",
    tempProofUrl: "",
    tempProofHash: "",
    totalAmount: "",
  },
  CUSTOM_REQUEST: {
    name: "",
    whatsappNumber: "",
    requestDetail: "",
    deadline: "",
    budget: "",
    notes: "",
    botField: "",
    tempProofUrl: "",
    tempProofHash: "",
    totalAmount: "",
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
    } else if (catalogList.length > 0 && business.mode !== "CUSTOM_REQUEST") {
      // Don't auto-select catalog items by default, force user to choose
      step = 1;
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

  const totalAmount = useMemo(() => {
    if (!business) return 0;
    
    if (business.mode === "BOOKING_SERVICE") {
      const selectedItem = getPublicCatalog(business).find(i => i.id === form.serviceId);
      return selectedItem?.price || 0;
    }
    if (business.mode === "PRODUCT_ORDER") {
      const selectedItem = getPublicCatalog(business).find(i => i.id === form.serviceId);
      return (selectedItem?.price || 0) * Math.max(1, Number(form.quantity) || 1);
    }
    return 0;
  }, [business, form.serviceId, form.quantity]);

  useEffect(() => {
    if (totalAmount > 0) {
      updateField("totalAmount", String(totalAmount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount]);

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [insufficientTimes, setInsufficientTimes] = useState<string[]>([]);
  const [passedTimes, setPassedTimes] = useState<string[]>([]);
  const [availableResourcesByTime, setAvailableResourcesByTime] = useState<Record<string, string[]>>({});
  const [isDateClosed, setIsDateClosed] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    if (!business || !form.scheduledDate) {
      setAvailableTimes([]);
      setInsufficientTimes([]);
      setPassedTimes([]);
      setIsDateClosed(false);
      return;
    }

    let isMounted = true;
    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const query = new URLSearchParams({
          date: form.scheduledDate,
        });
        if (form.serviceId) query.append("serviceId", form.serviceId);
        if (bookingDurationMinutes) query.append("duration", String(bookingDurationMinutes));
        query.append("_t", String(Date.now())); // Cache-busting

        const res = await apiFetch<{ isClosed: boolean; availableTimes: string[]; insufficientTimes?: string[]; passedTimes?: string[]; availableResourcesByTime?: Record<string, string[]> }>(
          `/api/public/b/${business.slug}/availability?${query.toString()}`
        );
        if (isMounted) {
          setIsDateClosed(res.isClosed);
          setAvailableTimes(res.availableTimes || []);
          setInsufficientTimes(res.insufficientTimes || []);
          setPassedTimes(res.passedTimes || []);
          setAvailableResourcesByTime(res.availableResourcesByTime || {});
        }
      } catch (err) {
        console.error("Failed to fetch availability", err);
      } finally {
        if (isMounted) setLoadingAvailability(false);
      }
    };

    fetchAvailability();
    return () => { isMounted = false; };
  }, [business, form.scheduledDate, form.serviceId, bookingDurationMinutes]);

  const slotHint = useMemo(() => {
    if (!business || business.mode !== "BOOKING_SERVICE") return "";

    if (!form.scheduledDate) {
      return `Silakan tentukan tanggal untuk melihat ketersediaan. Pemesanan tanpa Uang Muka (DP) akan disimpan selama ${BOOKING_HOLD_MINUTES} menit sebelum otomatis dibatalkan.`;
    }
    if (loadingAvailability) return "Sedang memeriksa jadwal...";
    if (isDateClosed) return "Tanggal ini tutup atau tidak tersedia.";
    if (availableTimes.length === 0 && insufficientTimes.length === 0) return "Jadwal pada hari ini sudah penuh. Silakan pilih tanggal lain.";
    
    let txt = "";
    if (availableTimes.length === 0 && insufficientTimes.length > 0) {
       txt = "Tidak ada jadwal yang tersedia untuk durasi ini. ";
    } else {
       txt = `Tersedia ${availableTimes.length} pilihan jam. `;
    }

    if (insufficientTimes.length > 0) {
      const durHours = bookingDurationMinutes / 60;
      txt += `Beberapa jam ditutup karena durasi layanan (${durHours} jam) melewati jam tutup operasional toko. `;
    }

    if (business?.mode === "BOOKING_SERVICE") {
      txt += `Pemesanan tanpa DP disimpan ${BOOKING_HOLD_MINUTES} menit.`;
    }
    return txt;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAvailability, isDateClosed, availableTimes.length, insufficientTimes.length, business?.mode, bookingDurationMinutes, form.serviceId]);

  function updateField(name: string, value: string) {
    setError("");
    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "scheduledDate" && business && isTimeRequired(business)) {
        next.scheduledTime = "";
      }

      if (name === "resourceId") {
        next.scheduledTime = "";
      }

      if (name === "quantity" && business?.mode === "PRODUCT_ORDER") {
        const parsedQuantity = Math.max(1, Number(value) || 1);
        next.quantity = String(parsedQuantity);
      }

      if (name === "service" || name === "product" || name === "requestDetail" || name === "bookingDurationMinutes") {
        next.serviceId = "";
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

    if (form.name && form.name.trim().length > 0 && form.name.trim().length < 2) {
      const msg = "Nama pelanggan minimal 2 karakter.";
      setError(msg);
      toast.error("Nama Terlalu Pendek", msg);
      return;
    }

    if (form.whatsappNumber && !isValidPhoneNumber(form.whatsappNumber)) {
      const msg = "Nomor WhatsApp tidak valid. Gunakan format seperti 08123456789.";
      setError(msg);
      toast.error("Format Nomor Salah", msg);
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



  const isResourceBooking = business?.mode === "BOOKING_SERVICE" && business?.usesResources;
  const totalSteps = useMemo(() => {
    if (!business) return 1;
    if (business.mode !== "BOOKING_SERVICE") return 2;
    return isResourceBooking ? 4 : 3;
  }, [business, isResourceBooking]);

  const canGoNext = useMemo(() => {
    if (business?.mode !== "BOOKING_SERVICE") {
      if (currentStep === 1) return !!form.serviceId || !!form.requestDetail || !!form.service;
      return true;
    }
    
    // BOOKING_SERVICE mode
    if (currentStep === 1) {
      return !!form.serviceId || !!form.service;
    }
    
    if (isResourceBooking) {
      if (currentStep === 1) return !!form.serviceId || !!form.service;
      if (currentStep === 2) return !!form.scheduledDate && !!form.resourceId;
      if (currentStep === 3) return !!form.scheduledTime;
    } else {
      if (currentStep === 2) return !!form.scheduledDate && !!form.scheduledTime;
    }
    
    return true;
  }, [business, currentStep, form, isResourceBooking]);

  function handleNextStep() {
    if (canGoNext && currentStep < totalSteps) {
      setCurrentStep(s => s + 1);
    }
  }

  function handlePrevStep() {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
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
    totalSteps,
    canGoNext,
    handleNextStep,
    handlePrevStep,
    isResourceBooking,
    canCreateOrder,
    bookingDurationMinutes,
    bookingAvailability: { isFull: isDateClosed, count: 0, hasHold: false, earliestHoldExpiresAt: null, remaining: availableTimes.length },
    activeAvailability: { isFull: isDateClosed, count: 0, hasHold: false, earliestHoldExpiresAt: null, remaining: availableTimes.length },
    resourceDetailsForDate: [],
    resourceBookingAvailability: { isFull: isDateClosed, count: 0, hasHold: false, earliestHoldExpiresAt: null, remaining: availableTimes.length },
    loadingAvailability,
    availableTimes,
    insufficientTimes,
    passedTimes,
    availableResourcesByTime,
    slotHint,
    totalAmount,
    updateField,
    handleSelectCatalogItem,
    handleClearCatalogItem,
    handleSubmit,
  };
}
