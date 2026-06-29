"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PencilLine, ReceiptText, Search, RotateCcw, ArrowRight, Copy, ClipboardList, Sparkles, Users, Phone, Calendar, MessageSquare, Clock, Plus } from "lucide-react";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { Card, CardBody } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TimeSelect } from "@/components/ui/time-select";
import { Textarea } from "@/components/ui/textarea";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { useToast } from "@/components/ui/toast-provider";
import {
  BOOKING_HOLD_MINUTES,
  DEFAULT_BOOKING_DURATION_MINUTES,
  getBookingAvailability,
  getBookingHoldExpiresAt,
  getResourceAvailabilityForSelection,
  getResourceBookingAvailability,
  isBookingHoldActive,
  isBookingSlotFull,
} from "@/lib/booking";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/lib/format";
import { parseIndonesianNumber } from "@/lib/number";
import { ORDER_STATUS_BY_MODE, PAYMENT_FILTER_OPTIONS, PAYMENT_STATUS_LABELS } from "@/lib/constants/orders";

import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import type { BusinessMode } from "@/types/business";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";
import { isValidPhoneNumber, normalizePhoneNumber, parseWhatsAppChatText } from "@/lib/validation";
import { renderTemplate } from "@/lib/messages";
import { cn } from "@/lib/cn";

type FilterValue = "ALL" | OrderStatus;
type PaymentFilterValue = "ALL" | PaymentStatus;
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
    status: ORDER_STATUS_BY_MODE[mode][0].value,
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
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
    hourCycle: "h23",
  }).format(parsedDate);
}

export function OrderManager() {
  const toast = useToast();
  const { business, hydrated, orders, createOrder, updateOrder, canCreateOrder, readOnlyReason, customers, messageTemplates } = useAppData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterValue>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterValue>("ALL");
  const [mode, setMode] = useState<BusinessMode>(business.mode);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OrderFormState>(createDefaultForm(business.mode));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chatPasteText, setChatPasteText] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  async function handleUpdateOrderStatus(order: Order, nextStatus: OrderStatus) {
    try {
      updateOrder(order.id, {
        customerName: order.customerName,
        whatsappNumber: order.whatsappNumber,
        title: order.title,
        mode: order.mode,
        status: nextStatus,
        paymentStatus: order.paymentStatus,
        scheduledDate: order.scheduledDate || undefined,
        scheduledTime: order.scheduledTime || undefined,
        bookingDurationMinutes: order.bookingDurationMinutes || undefined,
        resourceId: order.resourceId || undefined,
        resourceNameSnapshot: order.resourceNameSnapshot || undefined,
        totalAmount: order.totalAmount || undefined,
        dpAmount: order.dpAmount || undefined,
        notes: order.notes || undefined,
      });
      toast.success("Status order berhasil diperbarui!");
    } catch (err) {
      toast.error("Gagal memperbarui status", err instanceof Error ? err.message : "");
    }
  }

  const isDuplicatePhone = useMemo(() => {
    const normalized = normalizePhoneNumber(form.whatsappNumber);
    if (!normalized || normalized.length < 9) return null;
    return customers.find(
      (c) => normalizePhoneNumber(c.whatsappNumber) === normalized
    );
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
    if (!form.customerName.trim()) {
      return [];
    }
    const queryStr = form.customerName.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(queryStr) ||
        customer.whatsappNumber.includes(queryStr)
    );
  }, [customers, form.customerName]);

  function getWhatsAppButtonConfig(order: Order) {
    let category: string | null = null;
    let label = "Chat WA";

    if (order.status === "WAITING_DP" || order.paymentStatus === "UNPAID" || order.paymentStatus === "DP_PAID") {
      category = "PEMBAYARAN";
      label = "Tagih DP/Bayar";
    } else if (order.status === "CONFIRMED") {
      category = "BOOKING_ORDER";
      label = "Kirim Jadwal";
    } else if (order.status === "SELESAI") {
      category = "REVIEW";
      label = "Minta Review";
    } else {
      category = "FOLLOW_UP";
      label = "Follow-Up WA";
    }

    const template = messageTemplates.find(
      (item) => item.category === category && item.businessId === business.id
    ) ?? messageTemplates.find((item) => item.category === category);

    const defaultMsg = `Halo ${order.customerName}, saya follow-up untuk ${order.title}.`;

    if (!template) {
      return { label, message: defaultMsg };
    }

    const values = {
      customer_name: order.customerName,
      business_name: business.name,
      order_title: order.title,
      scheduled_date: order.scheduledDate ? formatDate(order.scheduledDate) : "",
      scheduled_time: order.scheduledTime ?? "",
      total_amount: order.totalAmount ? formatCurrency(order.totalAmount) : "0",
      dp_amount: order.dpAmount ? formatCurrency(order.dpAmount) : "0",
    };

    const rendered = renderTemplate(template.content, values);
    return { label, message: rendered || defaultMsg };
  }

  useEffect(() => {
    if (!hydrated || editingId) {
      return;
    }

    setMode(business.mode);
    setForm((current) => ({
      ...createDefaultForm(business.mode),
      customerName: current.customerName,
      whatsappNumber: current.whatsappNumber,
      title: current.title,
      scheduledDate: current.scheduledDate,
      scheduledTime: current.scheduledTime,
      bookingDurationMinutes: current.bookingDurationMinutes,
      resourceId: current.resourceId,
      totalAmount: current.totalAmount,
      dpAmount: current.dpAmount,
      notes: current.notes,
    }));
  }, [business.mode, editingId, hydrated]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const name = params.get("name");
      const phone = params.get("phone");
      if (name || phone) {
        setForm((current) => ({
          ...current,
          customerName: name || current.customerName,
          whatsappNumber: phone || current.whatsappNumber,
        }));
      }
    }
  }, []);

  const statusOptions = ORDER_STATUS_BY_MODE[mode];
  const bookingDurationMinutes = useMemo(() => {
    const parsedDuration = Number(form.bookingDurationMinutes);

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return DEFAULT_BOOKING_DURATION_MINUTES;
    }

    return parsedDuration;
  }, [form.bookingDurationMinutes]);
  const bookingAvailability = useMemo(
    () => getBookingAvailability(orders, form.scheduledDate, form.scheduledTime, bookingDurationMinutes, editingId),
    [bookingDurationMinutes, editingId, form.scheduledDate, form.scheduledTime, orders]
  );
  const activeResources = useMemo(() => (business.resources ?? []).filter((resource) => resource.isActive), [business.resources]);
  const isResourceBookingMode =
    business.mode === "BOOKING_SERVICE" && business.operationalModel === "RESOURCE_BOOKING" && business.usesResources && mode === "BOOKING_SERVICE";
  const resourceBookingAvailability = useMemo(
    () =>
      getResourceBookingAvailability(
        orders,
        business.resources ?? [],
        form.scheduledDate,
        form.scheduledTime,
        bookingDurationMinutes,
        editingId
      ),
    [bookingDurationMinutes, business.resources, editingId, form.scheduledDate, form.scheduledTime, orders]
  );
  const selectedResourceAvailability = useMemo(
    () =>
      form.resourceId
        ? getResourceAvailabilityForSelection(
            orders,
            form.resourceId,
            form.scheduledDate,
            form.scheduledTime,
            bookingDurationMinutes,
            editingId
          )
        : null,
    [bookingDurationMinutes, editingId, form.resourceId, form.scheduledDate, form.scheduledTime, orders]
  );
  const slotAvailability = isResourceBookingMode ? selectedResourceAvailability ?? resourceBookingAvailability : bookingAvailability;
  const slotHint = useMemo(() => {
    if (!form.scheduledDate || !form.scheduledTime) {
      return isResourceBookingMode
        ? `Pilih tanggal, jam, durasi, lalu tentukan ${business.resourceLabel?.toLowerCase() ?? "unit"} untuk cek bentrok. Booking tanpa DP ditahan ${BOOKING_HOLD_MINUTES} menit.`
        : `Pilih tanggal, jam, dan durasi untuk cek overlap. Booking tanpa DP ditahan ${BOOKING_HOLD_MINUTES} menit.`;
    }

    if (slotAvailability.isFull) {
      if (slotAvailability.hasHold) {
        return slotAvailability.earliestHoldExpiresAt
          ? `Slot ini penuh karena masih ada booking pending DP. Slot bisa terbuka kembali pukul ${formatDateTime(
              slotAvailability.earliestHoldExpiresAt.toISOString()
            )}.`
          : `Slot ini penuh karena masih ada booking pending DP. Slot bisa terbuka kembali setelah hold ${BOOKING_HOLD_MINUTES} menit habis.`;
      }

      return isResourceBookingMode
        ? `${business.resourceLabel ?? "Unit"} ini sudah penuh pada jam tersebut.`
        : "Slot ini sudah penuh. Maksimal 2 booking yang overlap.";
    }

    if (slotAvailability.count <= 0) {
      return isResourceBookingMode
        ? `Belum ada booking yang bentrok di ${business.resourceLabel?.toLowerCase() ?? "unit"} ini.`
        : `Belum ada booking yang overlap pada durasi ${bookingDurationMinutes} menit ini.`;
    }

    if (slotAvailability.hasHold) {
      return slotAvailability.earliestHoldExpiresAt
        ? `Ada booking pending DP yang overlap. Slot bisa terbuka lagi pukul ${formatDateTime(
            slotAvailability.earliestHoldExpiresAt.toISOString()
          )}.`
        : `Ada booking pending DP yang overlap.`;
    }

    return isResourceBookingMode
      ? `${slotAvailability.count} booking bentrok di ${business.resourceLabel?.toLowerCase() ?? "unit"} ini.`
      : `${slotAvailability.count}/2 booking overlap pada durasi ${bookingDurationMinutes} menit.`;
  }, [
    bookingDurationMinutes,
    business.resourceLabel,
    form.scheduledDate,
    form.scheduledTime,
    isResourceBookingMode,
    slotAvailability,
  ]);

  function updateFormField<Field extends OrderFormField>(field: Field, value: OrderFormState[Field]) {
    setError("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesQuery =
        !query.trim() ||
        order.customerName.toLowerCase().includes(query.toLowerCase()) ||
        order.title.toLowerCase().includes(query.toLowerCase()) ||
        order.whatsappNumber.includes(query);

      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const matchesPayment = paymentFilter === "ALL" || order.paymentStatus === paymentFilter;
      const matchesMode = order.mode === mode;

      return matchesQuery && matchesStatus && matchesPayment && matchesMode;
    });
  }, [mode, orders, paymentFilter, query, statusFilter]);
  const unpaidOrderCount = filteredOrders.filter((order) => order.paymentStatus === "UNPAID" || order.paymentStatus === "DP_PAID").length;
  const activeBookingCount = filteredOrders.filter((order) => order.mode === "BOOKING_SERVICE" && order.status !== "BATAL").length;
  const completedOrderCount = filteredOrders.filter((order) => order.status === "SELESAI").length;

  function resetForm() {
    setEditingId(null);
    setMode(business.mode);
    setForm(createDefaultForm(business.mode));
    setError("");
    setChatPasteText("");
  }

  async function handleShiftStatus(order: Order) {
    const statusOptions = ORDER_STATUS_BY_MODE[order.mode];
    const currentIndex = statusOptions.findIndex((opt) => opt.value === order.status);

    if (currentIndex === -1 || currentIndex === statusOptions.length - 1) {
      toast.error("Order sudah berada di status akhir.");
      return;
    }

    const nextStatusOption = statusOptions[currentIndex + 1];
    const nextStatus = nextStatusOption.value;

    try {
      updateOrder(order.id, {
        customerName: order.customerName,
        whatsappNumber: order.whatsappNumber,
        title: order.title,
        mode: order.mode,
        status: nextStatus,
        paymentStatus: order.paymentStatus,
        scheduledDate: order.scheduledDate || undefined,
        scheduledTime: order.scheduledTime || undefined,
        bookingDurationMinutes: order.bookingDurationMinutes || undefined,
        resourceId: order.resourceId || undefined,
        resourceNameSnapshot: order.resourceNameSnapshot || undefined,
        totalAmount: order.totalAmount || undefined,
        dpAmount: order.dpAmount || undefined,
        notes: order.notes || undefined,
      });
      toast.success(`Status berhasil diubah ke ${nextStatusOption.label}`);
    } catch (err) {
      toast.error("Gagal memindahkan status", err instanceof Error ? err.message : "");
    }
  }

  async function handleCopyMessage(message: string) {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Draf WhatsApp berhasil disalin!");
    } catch {
      toast.error("Gagal menyalin draf pesan.");
    }
  }

  function startEdit(order: Order) {
    setEditingId(order.id);
    setMode(order.mode);
    setError("");
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
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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
      setError(`Pilih ${business.resourceLabel?.toLowerCase() ?? "unit"} dulu supaya slot bisa dicek.`);
      return;
    }

    if (
      form.scheduledDate &&
      form.scheduledTime &&
      (isResourceBookingMode
        ? slotAvailability.isFull
        : isBookingSlotFull(orders, form.scheduledDate, form.scheduledTime, bookingDurationMinutes, editingId))
    ) {
      setError("Slot tanggal dan jam ini sudah penuh. Pilih jam lain.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));

      const normalizedTotal = parseIndonesianNumber(form.totalAmount);
      const normalizedDp = parseIndonesianNumber(form.dpAmount);
      const nextHoldExpiresAt =
        form.mode === "BOOKING_SERVICE" && form.paymentStatus === "UNPAID" && form.status === "WAITING_DP"
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
        resetForm();
        return;
      }

      try {
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
        toast.success("Order berhasil ditambahkan");
        resetForm();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Order belum bisa ditambahkan.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helpers for CRM Initials Avatar and gradients
  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "?";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getAvatarGradient(name: string) {
    const code = name.charCodeAt(0) % 4;
    if (code === 0) return "from-blue-400 to-indigo-600";
    if (code === 1) return "from-emerald-400 to-teal-600";
    if (code === 2) return "from-amber-400 to-orange-600";
    return "from-pink-400 to-rose-600";
  }

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8" id="order-manager">
      {/* SECTION 1: HERO HEADER */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white">
          {/* Background decorative glows */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-accent)] opacity-15 blur-3xl animate-pulse" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-30 blur-3xl" />
          
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            {/* Left */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
                <ClipboardList className="h-3.5 w-3.5 text-[var(--color-accent)] animate-pulse" />
                Manajemen Pesanan
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Daftar Order & Reservasi
              </h1>
              <p className="max-w-xl text-sm text-white/70 leading-relaxed">
                Pantau antrean pesanan masuk, ketersediaan unit slot operasional, status pembayaran uang muka (DP), dan kelola alur kerja dengan mudah.
              </p>
            </div>

            {/* Right: Summary Badge */}
            <div className="flex flex-wrap gap-2.5 xl:shrink-0">
              <Badge tone="info" className="bg-white/10 text-white border-white/20 px-4 py-1.5 text-xs font-bold">
                {filteredOrders.length} Order Aktif
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SEARCH & QUICK CONTROLS */}
      <section className="animate-fade-up-delay-1">
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="space-y-5 p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              {/* Search & Filters */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama customer, detail order, atau nomor WA..."
                    className="pl-9"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Filter Status Bayar</span>
                    <Select
                      value={paymentFilter}
                      onValueChange={(value) => setPaymentFilter(value as PaymentFilterValue)}
                      options={PAYMENT_FILTER_OPTIONS}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Filter Alur Kerja (Lanes)</span>
                    <FilterChipGroup
                      options={[
                        { value: "ALL", label: "Semua Status" },
                        ...statusOptions.map((opt) => ({ value: opt.value, label: opt.label })),
                      ]}
                      value={statusFilter}
                      onChange={(v) => setStatusFilter(v as FilterValue)}
                      size="sm"
                    />
                  </label>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Order Berjalan</p>
                  <p className="mt-1 text-2xl font-black text-[var(--color-text)] tracking-tight">{activeBookingCount}</p>
                  <p className="text-[9px] text-[var(--color-text-muted)] font-medium">Sedang diproses</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-4 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-warning-text)]">Belum Bayar</p>
                  <p className="mt-1 text-2xl font-black text-[var(--color-text)] tracking-tight">{unpaidOrderCount}</p>
                  <p className="text-[9px] text-[var(--color-warning-text)] font-semibold">Perlu penagihan</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-success-border)] bg-[var(--color-success-surface)] p-4 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-success-text)]">Selesai</p>
                  <p className="mt-1 text-2xl font-black text-[var(--color-text)] tracking-tight">{completedOrderCount}</p>
                  <p className="text-[9px] text-[var(--color-success-text)] font-semibold">Ditutup rapi</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* SECTION 3: FORM TAMBAH / EDIT ORDER */}
      <section ref={formRef} className="animate-fade-up-delay-2">
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  {editingId ? "Edit Rincian Pesanan" : "Tambah Pesanan Baru"}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Input order baru secara manual atau gunakan pintasan pengisi otomatis.</p>
                {!editingId && !canCreateOrder ? (
                  <p className="mt-2 text-xs font-bold text-[var(--color-warning-text)] bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] px-3 py-2 rounded-xl">
                    ⚠️ {readOnlyReason}
                  </p>
                ) : null}
              </div>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] active:scale-95 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  Batal Edit
                </button>
              ) : null}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              {/* Left Column Form */}
              <div className="space-y-4">
                {/* Auto Parser */}
                {!editingId && (
                  <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/10 dark:border-indigo-900/60 dark:bg-indigo-950/20 p-4 space-y-2 relative overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                        <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                        Pintasan Pengisi Otomatis
                      </span>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-semibold">Salin & Tempel Chat WhatsApp</p>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      Tempel format rekapan order WhatsApp di bawah. Sistem Rapiin akan membaca Nama, Nomor WA, Kebutuhan, &amp; Alamat otomatis.
                    </p>
                    <Textarea
                      value={chatPasteText}
                      onChange={(event) => handleChatPasteChange(event.target.value)}
                      placeholder="Contoh format tempel:&#10;Nama: Budi Luhur&#10;No HP: 08123456789&#10;Pesanan: Booking Lapangan Futsal 2 Jam&#10;Alamat: Jl. Sudirman No 12"
                      rows={3}
                      className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-xl"
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="block relative">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Pelanggan</span>
                    <Input
                      value={form.customerName}
                      onChange={(event) => {
                        updateFormField("customerName", event.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="Ketik nama pelanggan..."
                      autoComplete="off"
                    />
                    {showSuggestions && customerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-1.5 shadow-[var(--shadow-lg)]">
                        {customerSuggestions.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              updateFormField("customerName", customer.name);
                              updateFormField("whatsappNumber", customer.whatsappNumber);
                              setShowSuggestions(false);
                            }}
                            className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]"
                          >
                            <span className="font-semibold">{customer.name}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{customer.whatsappNumber}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nomor WhatsApp</span>
                    <Input
                      value={form.whatsappNumber}
                      onChange={(event) => updateFormField("whatsappNumber", event.target.value)}
                      placeholder="Contoh: 08123456789"
                    />
                    {isDuplicatePhone && (
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] px-3 py-2 text-xs text-[var(--color-warning-text)]">
                        <span>
                          Nomor terdaftar atas nama: <strong>{isDuplicatePhone.name}</strong>
                        </span>
                        {form.customerName !== isDuplicatePhone.name && (
                          <button
                            type="button"
                            onClick={() => {
                              updateFormField("customerName", isDuplicatePhone.name);
                            }}
                            className="font-bold underline text-[var(--color-warning)] hover:text-[var(--color-warning-hover)]"
                          >
                            Gunakan Nama
                          </button>
                        )}
                      </div>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Detail Order / Kebutuhan</span>
                  <Input value={form.title} onChange={(event) => updateFormField("title", event.target.value)} placeholder="Contoh: Booking Studio Musik Room 1 (2 Jam)" />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status Pesanan</span>
                    <Select
                      value={form.status}
                      onValueChange={(value) => updateFormField("status", value as OrderStatus)}
                      options={statusOptions}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status Pembayaran</span>
                    <Select
                      value={form.paymentStatus}
                      onValueChange={(value) => updateFormField("paymentStatus", value as PaymentStatus)}
                      options={Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Total Biaya (Rp)</span>
                    <FormattedNumberInput
                      value={form.totalAmount}
                      onValueChange={(value) => updateFormField("totalAmount", value)}
                      placeholder="Contoh: 240000"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Uang Muka / DP (Rp)</span>
                    <FormattedNumberInput
                      value={form.dpAmount}
                      onValueChange={(value) => updateFormField("dpAmount", value)}
                      placeholder="Contoh: 100000"
                    />
                  </label>
                </div>

                {((parseIndonesianNumber(form.totalAmount) ?? 0) > 0 || (parseIndonesianNumber(form.dpAmount) ?? 0) > 0) && (
                  <p className="-mt-2 text-right text-xs font-extrabold text-[var(--color-text-secondary)]">
                    Sisa Pelunasan: <span className="text-[var(--color-text)] font-black text-sm">{formatCurrency(Math.max(0, (parseIndonesianNumber(form.totalAmount) ?? 0) - (parseIndonesianNumber(form.dpAmount) ?? 0)))}</span>
                  </p>
                )}
              </div>

              {/* Right Column: Scheduling & Slot */}
              <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 relative overflow-hidden">
                {mode === "BOOKING_SERVICE" ? (
                  <>
                    <div className="border-b border-[var(--color-border)]/60 pb-3">
                      <p className="text-xs uppercase font-extrabold tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-[var(--color-primary)]" />
                        Jadwal &amp; Slot Availability
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        Konfigurasi durasi booking, tanggal, and cek ketersediaan unit agar terhindar dari bentrok.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal</span>
                        <DatePicker
                          value={form.scheduledDate}
                          onValueChange={(value) => updateFormField("scheduledDate", value)}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Jam</span>
                        <TimeSelect
                          value={form.scheduledTime}
                          onValueChange={(value) => updateFormField("scheduledTime", value)}
                          placeholder="Pilih jam"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Durasi (Menit)</span>
                        <Input
                          type="number"
                          min={15}
                          step={15}
                          value={form.bookingDurationMinutes}
                          onChange={(event) => updateFormField("bookingDurationMinutes", event.target.value)}
                          placeholder="60"
                        />
                      </label>
                    </div>

                    {isResourceBookingMode ? (
                      <label className="block pt-1">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Pilih Alokasi {business.resourceLabel ?? "Unit"}</span>
                        <Select
                          value={form.resourceId}
                          onValueChange={(value) => updateFormField("resourceId", value)}
                          options={activeResources.map((resource) => ({
                            value: resource.id,
                            label: resource.name,
                          }))}
                          placeholder={`Pilih ${business.resourceLabel?.toLowerCase() ?? "unit"}`}
                        />
                        <p className="mt-1 text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                          Pelanggan di halaman publik hanya memilih slot kosong. Anda sebagai admin menetapkan unit meja/studio spesifik di sini.
                        </p>
                      </label>
                    ) : null}

                    {/* Availability Indicators */}
                    <div className="pt-2 border-t border-[var(--color-border)]/40 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={slotAvailability.isFull ? "danger" : slotAvailability.hasHold ? "warning" : slotAvailability.count > 0 ? "success" : "neutral"} className="font-extrabold uppercase text-[9px] tracking-wider">
                          {slotAvailability.isFull
                            ? "Slot penuh"
                            : slotAvailability.hasHold
                              ? "Ada hold aktif"
                              : slotAvailability.count > 0
                                ? isResourceBookingMode
                                  ? `${slotAvailability.count} bentrok di unit`
                                  : `${slotAvailability.count} booking overlap`
                                : "Slot Kosong (Aman)"}
                        </Badge>
                        {!slotAvailability.isFull ? (
                          <Badge tone="info" className="font-extrabold uppercase text-[9px] tracking-wider">
                            {isResourceBookingMode ? `Unit Tersisa: ${resourceBookingAvailability.availableResourceCount ?? 0}` : `Sisa Slot Overlap: ${slotAvailability.remaining}`}
                          </Badge>
                        ) : null}
                      </div>

                      <p className={`text-xs font-medium leading-relaxed ${slotAvailability.isFull ? "text-[var(--color-danger)]" : "text-[var(--color-text-secondary)]"}`}>
                        {slotHint}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                        {isResourceBookingMode
                          ? `* Sistem Rapiin mendeteksi ketersediaan per ${business.resourceLabel?.toLowerCase() ?? "unit"} secara realtime.`
                          : "* Pengaturan ketersediaan default mengizinkan maksimal 2 pemesanan bertabrakan (overlap) pada jam yang sama."}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-b border-[var(--color-border)]/60 pb-3">
                      <p className="text-xs uppercase font-extrabold tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                        Batas Waktu Pengiriman
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        Tentukan target tanggal jatuh tempo pengerjaan pesanan atau pengiriman paket order barang.
                      </p>
                    </div>

                    <label className="block pt-1">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal Batas Pengiriman</span>
                      <DatePicker
                        value={form.scheduledDate}
                        onValueChange={(value) => updateFormField("scheduledDate", value)}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Catatan Keterangan Tambahan</span>
              <Textarea
                value={form.notes}
                onChange={(event) => updateFormField("notes", event.target.value)}
                placeholder="Tulis alamat kirim, request khusus pelanggan, atau rincian item..."
                rows={2}
              />
            </label>

            {error ? <p className="text-xs font-bold text-[var(--color-danger)]">{error}</p> : null}

            <div className="pt-2">
              <Button
                type="button"
                isLoading={isSubmitting}
                onClick={() => void handleSubmit()}
                disabled={!editingId && !canCreateOrder}
                className="shadow-sm font-bold text-sm px-6 py-2.5 rounded-xl"
              >
                {editingId ? "Simpan Perubahan" : "Simpan Order"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* SECTION 4: KANBAN STATUS BOARD */}
      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-none animate-fade-up-delay-3 space-y-4">
        <div className="flex items-center justify-between gap-3 px-1 border-b border-[var(--color-border)] pb-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Board Alur Status Pesanan</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Pantau status pesanan masuk dan geser posisi alurnya dengan mudah.</p>
          </div>
          <Badge tone="neutral" className="font-extrabold">{statusOptions.length} Status Board</Badge>
        </div>

        <div className="overflow-x-auto pb-2 no-scrollbar">
          <div className="flex gap-4">
            {statusOptions.map((option) => {
              const laneOrders = filteredOrders.filter((order) => order.status === option.value);

              return (
                <div key={option.value} className="w-[310px] shrink-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2.5 mb-3">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text)]">{option.label}</p>
                    <Badge tone={option.tone} className="text-[9px] uppercase tracking-wider font-extrabold">{laneOrders.length}</Badge>
                  </div>

                  <div className="space-y-3 flex-1 min-h-[400px]">
                    {laneOrders.length ? (
                      laneOrders.map((order) => {
                        const waConfig = getWhatsAppButtonConfig(order);
                        
                        // Left borders based on payment status
                        let leftBorderStripe = "border-l-4 border-l-stone-300";
                        if (order.paymentStatus === "PAID") {
                          leftBorderStripe = "border-l-4 border-l-emerald-500";
                        } else if (order.paymentStatus === "DP_PAID") {
                          leftBorderStripe = "border-l-4 border-l-blue-500";
                        } else if (order.paymentStatus === "UNPAID") {
                          leftBorderStripe = "border-l-4 border-l-rose-500";
                        }

                        return (
                          <div key={order.id} className={cn("rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:shadow transition-all duration-300", leftBorderStripe)}>
                            {/* Card Header: Avatar & Customer info */}
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-[10px] font-black shadow-xs select-none border border-white/20",
                                getAvatarGradient(order.customerName)
                              )}>
                                {getInitials(order.customerName)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-bold text-sm text-[var(--color-text)] tracking-tight">{order.customerName}</p>
                                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] truncate font-semibold">{order.title}</p>
                              </div>
                            </div>

                            {/* Card details */}
                            <div className="mt-3.5 space-y-2 border-t border-[var(--color-border)]/40 pt-3">
                              <p className="text-xs text-[var(--color-text-secondary)] font-medium flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                                {order.scheduledDate ? `${formatDate(order.scheduledDate)} ${order.scheduledTime ?? ""}` : "Belum dijadwalkan"}
                              </p>
                              
                              {order.mode === "BOOKING_SERVICE" && (
                                <div className="space-y-1.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)]/40 p-2.5 rounded-xl text-[11px] leading-normal text-[var(--color-text-secondary)]">
                                  <p className="font-semibold flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-[var(--color-text-muted)]" />
                                    Jadwal: {order.bookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES} Menit
                                  </p>
                                  {order.resourceNameSnapshot && (
                                    <p className="text-[10px] font-bold text-[var(--color-text)]">
                                      Unit: {order.resourceNameSnapshot}
                                    </p>
                                  )}
                                  {isBookingHoldActive(order) ? (
                                    <p className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400">
                                      Hold Expired: {formatDateTime(getBookingHoldExpiresAt(order)?.toISOString() ?? null)}
                                    </p>
                                  ) : order.paymentStatus === "DP_PAID" || order.paymentStatus === "PAID" ? (
                                    <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">Pemesanan Mengunci Slot</p>
                                  ) : null}
                                </div>
                              )}
                              
                              {/* Payment status badge card row */}
                              <div className="pt-1 flex items-center justify-between gap-1.5 flex-wrap">
                                {order.paymentStatus === "UNPAID" ? (
                                  <span className="inline-flex items-center rounded-lg bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-danger)]">
                                    Belum Bayar · {formatCurrency(order.totalAmount ?? 0)}
                                  </span>
                                ) : order.paymentStatus === "DP_PAID" ? (
                                  <span className="inline-flex items-center rounded-lg bg-[var(--color-info-surface)] border border-[var(--color-info-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-info)]">
                                    DP {formatCurrency(order.dpAmount ?? 0)} · Sisa {formatCurrency((order.totalAmount ?? 0) - (order.dpAmount ?? 0))}
                                  </span>
                                ) : order.paymentStatus === "PAID" ? (
                                  <span className="inline-flex items-center rounded-lg bg-[var(--color-success-surface)] border border-[var(--color-success-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
                                    Lunas · {formatCurrency(order.totalAmount ?? 0)}
                                  </span>
                                ) : (
                                  <p className="text-[10px] font-bold text-[var(--color-text-secondary)]">{formatCurrency(order.totalAmount)} · DP {formatCurrency(order.dpAmount)}</p>
                                )}
                                <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">{formatPhoneNumber(order.whatsappNumber)}</span>
                              </div>
                            </div>

                            {/* Card Actions block */}
                            <div className="mt-4 pt-3.5 border-t border-[var(--color-border)]/40 flex flex-wrap gap-1.5">
                              <WhatsAppButton
                                phoneNumber={order.whatsappNumber}
                                message={waConfig.message}
                                label={waConfig.label}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-9 px-2.5 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
                                onClick={() => void handleCopyMessage(waConfig.message)}
                                title="Salin draf pesan WA"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <LinkButton
                                href={`${ROUTES.invoices}?orderId=${order.id}`}
                                variant="secondary"
                                className="h-9 px-2.5 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold"
                              >
                                <ReceiptText className="h-4 w-4" />
                                Nota
                              </LinkButton>
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-9 px-2.5 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold"
                                onClick={() => startEdit(order)}
                              >
                                <PencilLine className="h-4 w-4" />
                                Ubah
                              </Button>
                              <select
                                value={order.status}
                                onChange={(e) => void handleUpdateOrderStatus(order, e.target.value as OrderStatus)}
                                className={cn(
                                  "h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[11px] font-bold text-[var(--color-text)] outline-none hover:border-[var(--color-border-strong)] transition-colors cursor-pointer"
                                )}
                              >
                                {statusOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] py-12 px-4 text-center">
                        <p className="text-xs text-[var(--color-text-muted)] font-medium">Belum ada order di lane ini.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
