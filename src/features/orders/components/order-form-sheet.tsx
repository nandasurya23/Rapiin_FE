import { useEffect, useMemo, useState } from "react";
import { Sparkles, Clock, Calendar } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { getPublicCatalog, inferCatalogDurationMinutes } from "@/lib/public-business";
import { cn } from "@/lib/cn";

import {
  BOOKING_HOLD_MINUTES,
  DEFAULT_BOOKING_DURATION_MINUTES,
  getBookingAvailability,
  getResourceBookingAvailability,
  getResourceAvailabilityForSelection,
  isBookingSlotFull,
  getResourceBookingDetailsForDate,
} from "@/lib/booking";
import { formatCurrency, formatDate } from "@/lib/format";
import { parseIndonesianNumber } from "@/lib/number";
import { ORDER_STATUS_BY_MODE, PAYMENT_STATUS_LABELS } from "@/lib/constants/orders";
import { isValidPhoneNumber, normalizePhoneNumber, parseWhatsAppChatText } from "@/lib/validation";

import type { BusinessMode } from "@/types/business";
import type { OrderStatus, PaymentStatus } from "@/types/order";

type OrderFormState = {
  customerName: string;
  whatsappNumber: string;
  title: string;
  mode: BusinessMode;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  scheduledDate: string;
  scheduledTime: string;
  bookingDurationMinutes: string;
  resourceId: string;
  totalAmount: string;
  dpAmount: string;
  notes: string;
};
type OrderFormField = keyof OrderFormState;

function createDefaultForm(mode: BusinessMode): OrderFormState {
  return {
    customerName: "",
    whatsappNumber: "",
    title: "",
    mode,
    status: ORDER_STATUS_BY_MODE[mode]?.[0]?.value || "WAITING_DP",
    paymentStatus: "UNPAID",
    scheduledDate: "",
    scheduledTime: "",
    bookingDurationMinutes: "60",
    resourceId: "",
    totalAmount: "",
    dpAmount: "",
    notes: "",
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
    hourCycle: "h23",
  }).format(parsedDate);
}

interface OrderFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
}

export function OrderFormSheet({ isOpen, onClose, editingId }: OrderFormSheetProps) {
  const toast = useToast();
  const { business, orders, createOrder, updateOrder, canCreateOrder, readOnlyReason, customers } = useAppData();
  
  const [form, setForm] = useState<OrderFormState>(createDefaultForm(business.mode));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chatPasteText, setChatPasteText] = useState("");
  const [showPasteChat, setShowPasteChat] = useState(false);

  // Initialize form on open
  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        const order = orders.find((o) => o.id === editingId);
        if (order) {
          setForm({
            customerName: order.customerName,
            whatsappNumber: order.whatsappNumber,
            title: order.title,
            mode: order.mode,
            status: order.status,
            paymentStatus: order.paymentStatus,
            scheduledDate: order.scheduledDate ?? "",
            scheduledTime: order.scheduledTime ?? "",
            bookingDurationMinutes: String(order.bookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES),
            resourceId: order.resourceId ?? "",
            totalAmount: order.totalAmount ? String(order.totalAmount) : "",
            dpAmount: order.dpAmount ? String(order.dpAmount) : "",
            notes: order.notes ?? "",
          });
        }
      } else {
        setForm(createDefaultForm(business.mode));
        setChatPasteText("");
        setShowPasteChat(false);
      }
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen, editingId, orders, business.mode]);

  const isDuplicatePhone = useMemo(() => {
    const normalized = normalizePhoneNumber(form.whatsappNumber);
    if (!normalized || normalized.length < 9) return null;
    return customers.find((c) => normalizePhoneNumber(c.whatsappNumber) === normalized);
  }, [customers, form.whatsappNumber]);

  function handleChatPasteChange(text: string) {
    setChatPasteText(text);
    const parsed = parseWhatsAppChatText(text);
    setForm((current) => ({
      ...current,
      customerName: parsed.name || current.customerName,
      whatsappNumber: parsed.phone || current.whatsappNumber,
      title: parsed.orderTitle || current.title,
      notes: parsed.address ? `Alamat: ${parsed.address}\n${current.notes}`.trim() : current.notes,
    }));
  }

  const customerSuggestions = useMemo(() => {
    if (!form.customerName.trim()) return [];
    const queryStr = form.customerName.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(queryStr) ||
        customer.whatsappNumber.includes(queryStr)
    );
  }, [customers, form.customerName]);

  const statusOptions = ORDER_STATUS_BY_MODE[form.mode];
  const catalogList = getPublicCatalog(business);
  const bookingDurationMinutes = useMemo(() => {
    const parsedDuration = Number(form.bookingDurationMinutes);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) return DEFAULT_BOOKING_DURATION_MINUTES;
    return parsedDuration;
  }, [form.bookingDurationMinutes]);

  const bookingAvailability = useMemo(
    () => getBookingAvailability(orders, form.scheduledDate, form.scheduledTime, bookingDurationMinutes, editingId, undefined, business.bookingCapacity),
    [bookingDurationMinutes, editingId, form.scheduledDate, form.scheduledTime, orders, business.bookingCapacity]
  );
  
  const activeResources = useMemo(() => (business.resources ?? []).filter((resource) => resource.isActive), [business.resources]);
  const isResourceBookingMode = business.mode === "BOOKING_SERVICE" && business.operationalModel === "RESOURCE_BOOKING" && business.usesResources && form.mode === "BOOKING_SERVICE";
  
  const resourceBookingAvailability = useMemo(
    () => getResourceBookingAvailability(orders, business.resources ?? [], form.scheduledDate, form.scheduledTime, bookingDurationMinutes, editingId),
    [bookingDurationMinutes, business.resources, editingId, form.scheduledDate, form.scheduledTime, orders]
  );
  
  const selectedResourceAvailability = useMemo(
    () => form.resourceId && form.resourceId !== "ANY" ? getResourceAvailabilityForSelection(orders, form.resourceId, form.scheduledDate, form.scheduledTime, bookingDurationMinutes, editingId) : null,
    [bookingDurationMinutes, editingId, form.resourceId, form.scheduledDate, form.scheduledTime, orders]
  );
  
  const slotAvailability = isResourceBookingMode ? ((form.resourceId && form.resourceId !== "ANY" && selectedResourceAvailability) ? selectedResourceAvailability : resourceBookingAvailability) : bookingAvailability;

  const resourceDetailsForDate = useMemo(() => {
    if (business.operationalModel !== "RESOURCE_BOOKING" || !form.scheduledDate) return [];
    return getResourceBookingDetailsForDate(orders, business.resources ?? [], form.scheduledDate);
  }, [business.operationalModel, business.resources, form.scheduledDate, orders]);

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
    for (let h = startHour; h <= endHour; h++) {
      candidates.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return candidates;
  }, [business.openingHours]);

  const getCandidateAvailability = (time: string) => {
    if (isResourceBookingMode) {
      if (form.resourceId && form.resourceId !== "ANY") {
        return getResourceAvailabilityForSelection(orders, form.resourceId, form.scheduledDate, time, bookingDurationMinutes, editingId);
      }
      return getResourceBookingAvailability(orders, business.resources ?? [], form.scheduledDate, time, bookingDurationMinutes, editingId);
    } else {
      return getBookingAvailability(orders, form.scheduledDate, time, bookingDurationMinutes, editingId, undefined, business.bookingCapacity);
    }
  };

  const slotHint = useMemo(() => {
    if (!form.scheduledDate || !form.scheduledTime) {
      return isResourceBookingMode
        ? `Pilih tanggal, jam, durasi, lalu tentukan ${business.resourceLabel?.toLowerCase() ?? "unit"} untuk cek bentrok.`
        : `Pilih tanggal, jam, dan durasi untuk cek overlap.`;
    }
    if (slotAvailability.isFull) {
      if (slotAvailability.hasHold) {
        return slotAvailability.earliestHoldExpiresAt
          ? `Slot penuh (ada pending DP). Terbuka pukul ${formatDateTime(slotAvailability.earliestHoldExpiresAt.toISOString())}.`
          : `Slot penuh (ada pending DP).`;
      }
      return isResourceBookingMode
        ? `${business.resourceLabel ?? "Unit"} sudah penuh pada jam tersebut.`
        : "Slot penuh. Maksimal 2 booking overlap.";
    }
    if (slotAvailability.count <= 0) {
      return isResourceBookingMode
        ? `Aman (belum ada booking).`
        : `Aman (belum ada overlap).`;
    }
    if (slotAvailability.hasHold) {
      return `Ada booking pending DP yang overlap.`;
    }
    return isResourceBookingMode
      ? `${slotAvailability.count} booking bentrok di ${business.resourceLabel?.toLowerCase() ?? "unit"} ini.`
      : `${slotAvailability.count}/2 booking overlap.`;
  }, [bookingDurationMinutes, business.resourceLabel, form.scheduledDate, form.scheduledTime, isResourceBookingMode, slotAvailability]);

  function updateFormField<Field extends OrderFormField>(field: Field, value: OrderFormState[Field]) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.customerName.trim() || !form.whatsappNumber.trim() || !form.title.trim()) {
      setError("Lengkapi nama, nomor WhatsApp, dan kebutuhan order dulu.");
      return;
    }
    if (!isValidPhoneNumber(form.whatsappNumber)) {
      setError("Nomor WhatsApp harus 9-15 digit angka.");
      return;
    }
    if (isResourceBookingMode && !form.resourceId) {
      setError(`Pilih ${business.resourceLabel?.toLowerCase() ?? "tim/staf"} dulu.`);
      return;
    }
    if (
      form.scheduledDate &&
      form.scheduledTime &&
      (isResourceBookingMode
        ? slotAvailability.isFull
        : isBookingSlotFull(orders, form.scheduledDate, form.scheduledTime, bookingDurationMinutes, editingId, undefined, business.bookingCapacity))
    ) {
      setError("Jadwal sudah penuh. Pilih jam lain.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const normalizedTotal = parseIndonesianNumber(form.totalAmount);
      const normalizedDp = parseIndonesianNumber(form.dpAmount);
      const nextHoldExpiresAt = form.mode === "BOOKING_SERVICE" && form.paymentStatus === "UNPAID" && form.status === "WAITING_DP"
        ? new Date(Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000).toISOString()
        : undefined;

      if (editingId) {
        updateOrder(editingId, {
          customerName: form.customerName.trim(),
          whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
          title: form.title.trim(),
          mode: form.mode,
          status: form.status,
          paymentStatus: form.paymentStatus,
          scheduledDate: form.scheduledDate || undefined,
          scheduledTime: form.scheduledTime || undefined,
          bookingDurationMinutes: form.mode === "BOOKING_SERVICE" ? bookingDurationMinutes : undefined,
          bookingHoldExpiresAt: nextHoldExpiresAt,
          resourceId: isResourceBookingMode ? form.resourceId || undefined : undefined,
          resourceNameSnapshot: isResourceBookingMode ? activeResources.find((resource) => resource.id === form.resourceId)?.name : undefined,
          totalAmount: normalizedTotal,
          dpAmount: normalizedDp,
          notes: form.notes.trim() || undefined,
        });
        toast.success("Order berhasil diperbarui");
        onClose();
        return;
      }

      createOrder({
        customerName: form.customerName.trim(),
        whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
        title: form.title.trim(),
        mode: form.mode,
        status: form.status,
        paymentStatus: form.paymentStatus,
        scheduledDate: form.scheduledDate || undefined,
        scheduledTime: form.scheduledTime || undefined,
        bookingDurationMinutes: form.mode === "BOOKING_SERVICE" ? bookingDurationMinutes : undefined,
        bookingHoldExpiresAt: nextHoldExpiresAt,
        resourceId: isResourceBookingMode ? form.resourceId || undefined : undefined,
        resourceNameSnapshot: isResourceBookingMode ? activeResources.find((resource) => resource.id === form.resourceId)?.name : undefined,
        totalAmount: normalizedTotal,
        dpAmount: normalizedDp,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Order baru berhasil dibuat");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = editingId ? "Edit Pesanan" : "Tambah Pesanan Baru";
  const desc = "Lengkapi detail pesanan di bawah ini.";

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={title} description={desc} side="right">
      <div className="space-y-6">
        {!editingId && !canCreateOrder ? (
          <div className="rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-3 text-sm font-bold text-[var(--color-warning-text)]">
            ⚠️ {readOnlyReason}
          </div>
        ) : null}

        {/* Auto Parser */}
        {!editingId && (
          <div className="space-y-2">
            {!showPasteChat ? (
              <button 
                type="button" 
                onClick={() => setShowPasteChat(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md h-8 px-3 w-full text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Isi form otomatis dari Chat WA
              </button>
            ) : (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 space-y-3 dark:border-indigo-900/60 dark:bg-indigo-950/20 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    <Sparkles className="h-3 w-3 animate-pulse" /> Auto-fill
                  </span>
                  <button type="button" onClick={() => setShowPasteChat(false)} className="text-xs font-bold text-gray-500 hover:text-indigo-700 transition">Tutup</button>
                </div>
                <Textarea
                  value={chatPasteText}
                  onChange={(event) => handleChatPasteChange(event.target.value)}
                  placeholder="Paste chat WhatsApp di sini..."
                  rows={3}
                  className="bg-white/80 dark:bg-black/20 border-indigo-100 dark:border-indigo-900/50 rounded-xl"
                />
              </div>
            )}
          </div>
        )}

        {/* Customer Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b border-[var(--color-border)] pb-2 text-[var(--color-text)]">Info Pelanggan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Pelanggan</label>
              <Input
                value={form.customerName}
                onChange={(e) => {
                  updateFormField("customerName", e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Nama pelanggan"
                autoComplete="off"
              />
              {showSuggestions && customerSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-1 shadow-xl">
                  {customerSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        updateFormField("customerName", c.name);
                        updateFormField("whatsappNumber", c.whatsappNumber);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-elevated)]"
                    >
                      <span className="font-semibold text-[var(--color-text)]">{c.name}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{c.whatsappNumber}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nomor WhatsApp</label>
              <Input
                value={form.whatsappNumber}
                onChange={(e) => updateFormField("whatsappNumber", e.target.value)}
                placeholder="08123..."
              />
              {isDuplicatePhone && (
                <div className="mt-1.5 rounded-lg bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] px-2 py-1.5 text-[10px] text-[var(--color-warning-text)]">
                  Nomor terdaftar atas: <strong>{isDuplicatePhone.name}</strong>
                  {form.customerName !== isDuplicatePhone.name && (
                    <button
                      type="button"
                      onClick={() => updateFormField("customerName", isDuplicatePhone.name)}
                      className="ml-2 font-bold underline hover:opacity-80"
                    >
                      Gunakan Nama
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b border-[var(--color-border)] pb-2 text-[var(--color-text)]">Detail Order</h3>
          
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Kebutuhan / Item</label>
            {catalogList.length > 0 ? (
              <Select 
                value={form.title} 
                onValueChange={(val) => {
                  updateFormField("title", val);
                  const item = catalogList.find((i) => i.name === val);
                  if (item) {
                    const duration = inferCatalogDurationMinutes(item);
                    if (duration) updateFormField("bookingDurationMinutes", String(duration));
                    
                    const price = parseIndonesianNumber(item.priceLabel ?? "");
                    if (price) updateFormField("totalAmount", String(price));
                  }
                }} 
                options={catalogList.map((i) => ({ value: i.name, label: i.name }))}
                placeholder="Pilih item/layanan"
              />
            ) : (
              <Input value={form.title} onChange={(e) => updateFormField("title", e.target.value)} placeholder="Contoh: Futsal 2 Jam" />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status Pesanan</label>
              <Select value={form.status} onValueChange={(val) => updateFormField("status", val as OrderStatus)} options={statusOptions} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status Pembayaran</label>
              <Select value={form.paymentStatus} onValueChange={(val) => updateFormField("paymentStatus", val as PaymentStatus)} options={Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Total Biaya (Rp)</label>
              <FormattedNumberInput value={form.totalAmount} onValueChange={(val) => updateFormField("totalAmount", val)} placeholder="0" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Uang Muka (Rp)</label>
              <FormattedNumberInput value={form.dpAmount} onValueChange={(val) => updateFormField("dpAmount", val)} placeholder="0" />
            </div>
          </div>
          {((parseIndonesianNumber(form.totalAmount) ?? 0) > 0 || (parseIndonesianNumber(form.dpAmount) ?? 0) > 0) && (
            <p className="text-right text-xs font-bold text-[var(--color-text-secondary)]">
              Sisa Pelunasan: <span className="text-[var(--color-text)]">Rp {formatCurrency(Math.max(0, (parseIndonesianNumber(form.totalAmount) ?? 0) - (parseIndonesianNumber(form.dpAmount) ?? 0)))}</span>
            </p>
          )}
        </div>

        {/* Scheduling */}
        <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--color-text)]">
            {form.mode === "BOOKING_SERVICE" ? <Clock className="h-4 w-4 text-[var(--color-primary)]" /> : <Calendar className="h-4 w-4 text-[var(--color-primary)]" />}
            {form.mode === "BOOKING_SERVICE" ? "Jadwal & Ketersediaan" : "Batas Waktu"}
          </h3>
          
          {form.mode === "BOOKING_SERVICE" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal</label>
                  <DatePicker value={form.scheduledDate} onValueChange={(val) => updateFormField("scheduledDate", val)} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Durasi (Jam)</label>
                  <Input type="number" min={0.5} step={0.5} value={String(Number(form.bookingDurationMinutes) / 60)} onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > 0) {
                      updateFormField("bookingDurationMinutes", String(val * 60));
                    }
                  }} />
                </div>
                              </div>

              {isResourceBookingMode && form.scheduledDate && resourceDetailsForDate.length > 0 && (
                <div className="space-y-3 mt-4 pt-4 border-t border-[var(--color-border)]/50">
                  <span className="block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Pilih {business.resourceLabel || "Unit"}</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!resourceBookingAvailability.isFull) {
                          updateFormField("resourceId", "ANY");
                          updateFormField("scheduledTime", "");
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
                              updateFormField("resourceId", res.resourceId);
                              updateFormField("scheduledTime", "");
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

              {(!isResourceBookingMode || form.resourceId) && form.scheduledDate && (
                <div className="space-y-3 mt-4 pt-4 border-t border-[var(--color-border)]/50">
                  <span className="block text-xs font-bold uppercase text-[var(--color-text-secondary)]">Pilih Jam yang Tersedia</span>
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
                              updateFormField("scheduledTime", time);
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
                            isFull ? "Penuh" : isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                          )}>
                            {isFull ? "Penuh" : avail.hasHold ? "Ditahan" : "Tersedia"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {form.scheduledTime && (
                    <div className="pt-2">
                      <p className={`text-xs ${slotAvailability.isFull ? "text-[var(--color-danger)] font-semibold" : slotAvailability.hasHold ? "text-[var(--color-warning-text)]" : "text-[var(--color-text-muted)]"}`}>
                        {slotHint}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal Batas Pengiriman</label>
              <DatePicker value={form.scheduledDate} onValueChange={(val) => updateFormField("scheduledDate", val)} />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Catatan Keterangan</label>
          <Textarea
            value={form.notes}
            onChange={(e) => updateFormField("notes", e.target.value)}
            placeholder="Catatan alamat, rincian, request khusus..."
            rows={3}
          />
        </div>

        {error && <p className="text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-surface)] p-3 rounded-xl border border-[var(--color-danger-border)]">{error}</p>}
        
        <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3 sticky bottom-0 bg-[var(--color-surface)] pb-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="button"
            isLoading={isSubmitting}
            onClick={() => void handleSubmit()}
            disabled={(!editingId && !canCreateOrder) || isSubmitting}
            className="px-6 font-bold"
          >
            {editingId ? "Simpan Perubahan" : "Simpan Order"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
