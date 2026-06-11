"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilLine, ReceiptText, Search, RotateCcw } from "lucide-react";
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
import { BUSINESS_MODE_OPTIONS } from "@/lib/constants/business";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import type { BusinessMode } from "@/types/business";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";

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
  const { business, hydrated, orders, createOrder, updateOrder } = useAppData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterValue>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterValue>("ALL");
  const [mode, setMode] = useState<BusinessMode>(business.mode);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OrderFormState>(createDefaultForm(business.mode));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
  }

  function handleModeChange(nextMode: BusinessMode) {
    setMode(nextMode);
    setStatusFilter("ALL");
    setError("");
    setForm((current) => ({
      ...current,
      mode: nextMode,
      status: ORDER_STATUS_BY_MODE[nextMode][0].value,
      resourceId: nextMode === "BOOKING_SERVICE" ? current.resourceId : "",
    }));
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
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card>
          <CardBody className="space-y-5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex rounded-md border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-medium tracking-wide text-brand-800">
                  Workflow status
                </div>
                <h1 className="mt-3 text-2xl font-semibold text-text-primary">Order / Booking</h1>
                <p className="mt-1 text-sm text-text-secondary">
                  Catat order, booking, dan request. Lalu geser statusnya sesuai alur kerja hari ini.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">{filteredOrders.length} order</Badge>
                <Badge tone="warning">{unpaidOrderCount} perlu bayar</Badge>
                <Badge tone="success">{completedOrderCount} selesai</Badge>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari customer, order, atau nomor"
                    className="pl-9"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Mode bisnis</span>
                    <Select
                      value={mode}
                      onValueChange={(value) => handleModeChange(value as BusinessMode)}
                      options={BUSINESS_MODE_OPTIONS}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Filter pembayaran</span>
                    <Select
                      value={paymentFilter}
                      onValueChange={(value) => setPaymentFilter(value as PaymentFilterValue)}
                      options={PAYMENT_FILTER_OPTIONS}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                      statusFilter === "ALL" ? "border-brand-500 bg-brand-50 text-brand-800" : "border-border bg-surface text-text-secondary hover:bg-muted"
                    }`}
                  >
                    Semua
                  </button>
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                        statusFilter === option.value
                          ? "border-brand-500 bg-brand-50 text-brand-800"
                          : "border-border bg-surface text-text-secondary hover:bg-muted"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Aktif</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">{activeBookingCount}</p>
                  <p className="mt-1 text-sm text-text-secondary">Booking/order yang masih berjalan.</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Belum Bayar</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">{unpaidOrderCount}</p>
                  <p className="mt-1 text-sm text-text-secondary">Perlu follow-up pembayaran atau DP.</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Selesai</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">{completedOrderCount}</p>
                  <p className="mt-1 text-sm text-text-secondary">Order yang sudah ditutup rapi.</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardBody className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{editingId ? "Edit Order" : "Tambah Order"}</h2>
                <p className="text-sm text-text-secondary">Input cepat, status sesuai mode bisnis.</p>
              </div>
              {editingId ? (
                <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <RotateCcw className="h-4 w-4" />
                  Batal edit
                </button>
              ) : null}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Nama customer</span>
                    <Input value={form.customerName} onChange={(event) => updateFormField("customerName", event.target.value)} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Nomor WhatsApp</span>
                    <Input
                      value={form.whatsappNumber}
                      onChange={(event) => updateFormField("whatsappNumber", event.target.value)}
                      placeholder="08123456789"
                    />
                    <p className="mt-1 text-xs text-text-muted">Nomor dipakai untuk tombol Chat WA dan Follow-Up WA.</p>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-primary">Kebutuhan / order</span>
                  <Input value={form.title} onChange={(event) => updateFormField("title", event.target.value)} />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Status</span>
                    <Select
                      value={form.status}
                      onValueChange={(value) => updateFormField("status", value as OrderStatus)}
                      options={statusOptions}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Status bayar</span>
                    <Select
                      value={form.paymentStatus}
                      onValueChange={(value) => updateFormField("paymentStatus", value as PaymentStatus)}
                      options={Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Total</span>
                    <FormattedNumberInput
                      value={form.totalAmount}
                      onValueChange={(value) => updateFormField("totalAmount", value)}
                      placeholder="240000"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">DP</span>
                    <FormattedNumberInput
                      value={form.dpAmount}
                      onValueChange={(value) => updateFormField("dpAmount", value)}
                      placeholder="100000"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border/80 bg-muted/25 px-4 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Jadwal & Slot</p>
                  <p className="mt-1 text-sm text-text-secondary">Bagian ini dipakai untuk cek bentrok booking dan status hold slot.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Tanggal</span>
                    <DatePicker
                      value={form.scheduledDate}
                      onValueChange={(value) => updateFormField("scheduledDate", value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Jam</span>
                    <TimeSelect
                      value={form.scheduledTime}
                      onValueChange={(value) => updateFormField("scheduledTime", value)}
                      placeholder="Pilih jam"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Durasi booking (menit)</span>
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
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">{business.resourceLabel ?? "Unit"}</span>
                    <Select
                      value={form.resourceId}
                      onValueChange={(value) => updateFormField("resourceId", value)}
                      options={activeResources.map((resource) => ({
                        value: resource.id,
                        label: resource.name,
                      }))}
                      placeholder={`Pilih ${business.resourceLabel?.toLowerCase() ?? "unit"}`}
                    />
                    <p className="mt-1 text-xs text-text-muted">
                      Customer publik tidak pilih unit. Admin tetapkan unitnya di sini.
                    </p>
                  </label>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Badge tone={slotAvailability.isFull ? "danger" : slotAvailability.hasHold ? "warning" : slotAvailability.count > 0 ? "success" : "neutral"}>
                    {slotAvailability.isFull
                      ? "Slot penuh"
                      : slotAvailability.hasHold
                        ? "Ada hold aktif"
                        : slotAvailability.count > 0
                          ? isResourceBookingMode
                            ? `${slotAvailability.count} bentrok di unit`
                            : `${slotAvailability.count} booking overlap`
                          : "Belum ada overlap"}
                  </Badge>
                  {!slotAvailability.isFull ? (
                    <Badge tone="info">
                      {isResourceBookingMode ? `Unit kosong ${resourceBookingAvailability.availableResourceCount ?? 0}` : `Sisa slot ${slotAvailability.remaining}`}
                    </Badge>
                  ) : null}
                </div>
                <p className={`text-sm leading-6 ${slotAvailability.isFull ? "text-status-danger" : "text-text-secondary"}`}>{slotHint}</p>
                <p className="text-xs text-text-muted">
                  {isResourceBookingMode
                    ? `Dipakai untuk cek bentrok per ${business.resourceLabel?.toLowerCase() ?? "unit"} saat admin input booking.`
                    : "Dipakai untuk cek overlap slot studio / warnet secara langsung saat admin input order."}
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-primary">Catatan</span>
              <Textarea
                value={form.notes}
                onChange={(event) => updateFormField("notes", event.target.value)}
                placeholder="Catatan singkat order"
              />
            </label>
            {error ? <p className="text-sm text-status-danger">{error}</p> : null}
            <Button type="button" isLoading={isSubmitting} onClick={() => void handleSubmit()}>
              {editingId ? "Simpan Perubahan" : "Simpan Order"}
            </Button>
          </CardBody>
        </Card>
      </section>

      <section className="rounded-2xl border border-border/80 bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3 px-1 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Board Status</h2>
            <p className="text-sm text-text-secondary">Lihat alur kerja dari Inquiry sampai Selesai.</p>
          </div>
          <Badge tone="neutral">{statusOptions.length} lane</Badge>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-full gap-4">
            {statusOptions.map((option) => {
              const laneOrders = filteredOrders.filter((order) => order.status === option.value);

              return (
                <div key={option.value} className="w-[320px] shrink-0 rounded-xl border border-border/80 bg-muted/20 p-3 sm:w-[340px]">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{option.label}</p>
                      <p className="text-xs text-text-muted">Status {option.label.toLowerCase()}</p>
                    </div>
                    <Badge tone={option.tone}>{laneOrders.length}</Badge>
                  </div>

                  <div className="mt-3 space-y-3">
                    {laneOrders.length ? (
                      laneOrders.map((order) => (
                        <div key={order.id} className="rounded-lg border border-border/80 bg-surface p-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-text-primary">{order.customerName}</p>
                              <p className="mt-1 text-sm text-text-secondary">{order.title}</p>
                            </div>
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </div>

                          <div className="mt-3 space-y-1 text-xs text-text-secondary">
                            <p>{order.scheduledDate ? `${formatDate(order.scheduledDate)} ${order.scheduledTime ?? ""}` : "Belum dijadwalkan"}</p>
                            {order.mode === "BOOKING_SERVICE" ? (
                              <>
                                <p>
                                  Durasi {order.bookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES} menit
                                  {order.paymentStatus === "UNPAID" && order.status === "WAITING_DP" ? " • menunggu DP" : ""}
                                </p>
                                {order.resourceNameSnapshot ? <p>{order.resourceNameSnapshot}</p> : null}
                                {isBookingHoldActive(order) ? (
                                  <p className="text-amber-700">
                                    Hold aktif sampai {formatDateTime(getBookingHoldExpiresAt(order)?.toISOString() ?? null)}
                                  </p>
                                ) : order.paymentStatus === "DP_PAID" || order.paymentStatus === "PAID" ? (
                                  <p className="text-green-700">DP/paid mengunci slot.</p>
                                ) : null}
                              </>
                            ) : null}
                            <p>{formatCurrency(order.totalAmount)} • DP {formatCurrency(order.dpAmount)}</p>
                            <p>{formatPhoneNumber(order.whatsappNumber)}</p>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <WhatsAppButton
                              phoneNumber={order.whatsappNumber}
                              message={`Halo ${order.customerName}, saya follow-up untuk ${order.title}.`}
                              label="WA"
                            />
                            <LinkButton href={ROUTES.invoices} variant="secondary">
                              <ReceiptText className="h-4 w-4" />
                              Nota
                            </LinkButton>
                            <Button type="button" variant="secondary" onClick={() => startEdit(order)}>
                              <PencilLine className="h-4 w-4" />
                              Ubah
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-border/80 bg-surface p-3 text-sm text-text-secondary">
                        Belum ada order di lane ini.
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
