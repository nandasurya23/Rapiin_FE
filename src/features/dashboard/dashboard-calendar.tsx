"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CircleDot, ExternalLink, ReceiptText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import {
  BOOKING_SLOT_CAPACITY,
  DEFAULT_BOOKING_DURATION_MINUTES,
  getBookingHoldExpiresAt,
  getBookingSlotLabel,
  getBookingSlotTone,
  getResourceBookingDetailsForDate,
  getBookingSlotsForDate,
  getResourceBookingAvailability,
  isBookingHoldActive,
} from "@/lib/booking";
import { ORDER_STATUS_BY_MODE, PAYMENT_STATUS_LABELS } from "@/lib/constants/orders";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import type { Business } from "@/types/business";
import type { Invoice } from "@/types/invoice";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const weekdayShortLabels = ["S", "S", "R", "K", "J", "S", "M"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
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

function getMonthCells(referenceDate: Date) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const startWeekday = (monthStart.getDay() + 6) % 7;
  const firstCellDate = new Date(monthStart);
  firstCellDate.setDate(monthStart.getDate() - startWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(firstCellDate);
    cellDate.setDate(firstCellDate.getDate() + index);
    return cellDate;
  });
}

type DashboardCalendarProps = {
  business: Business;
  orders: Order[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
};

type DetailContentProps = {
  business: Business;
  selectedDate: string;
  selectedDateLabel: string;
  selectedDateCount: number;
  isResourceMode: boolean;
  selectedResourceAvailability: ReturnType<typeof getResourceBookingAvailability>;
  hasFullSlot: boolean;
  hasHoldSlot: boolean;
  visibleResourceDetails: ReturnType<typeof getResourceBookingDetailsForDate>;
  hiddenResourceCount: number;
  selectedSlotSummaries: ReturnType<typeof getBookingSlotsForDate>;
  unassignedSelectedOrders: Order[];
  visibleSelectedOrders: Order[];
  hiddenSelectedOrderCount: number;
  getDraftStatus: (order: Order) => OrderStatus;
  getDraftPaymentStatus: (order: Order) => PaymentStatus;
  onDraftStatusChange: (orderId: string, status: OrderStatus) => void;
  onDraftPaymentChange: (orderId: string, status: PaymentStatus) => void;
  onSaveOrder: (order: Order) => Promise<void>;
  onQuickAction: (
    order: Order,
    patch: Partial<{
      status: OrderStatus;
      paymentStatus: PaymentStatus;
    }>
  ) => Promise<void>;
  invoiceByOrderId: Record<string, Invoice>;
  creatingInvoiceOrderId: string | null;
  onCreateInvoice: (order: Order) => Promise<void>;
  onOpenInvoice: (invoiceCode: string) => void;
  savingOrderId: string | null;
};

function CalendarDetailContent({
  business,
  selectedDate,
  selectedDateLabel,
  selectedDateCount,
  isResourceMode,
  selectedResourceAvailability,
  hasFullSlot,
  hasHoldSlot,
  visibleResourceDetails,
  hiddenResourceCount,
  selectedSlotSummaries,
  unassignedSelectedOrders,
  visibleSelectedOrders,
  hiddenSelectedOrderCount,
  getDraftStatus,
  getDraftPaymentStatus,
  onDraftStatusChange,
  onDraftPaymentChange,
  onSaveOrder,
  onQuickAction,
  invoiceByOrderId,
  creatingInvoiceOrderId,
  onCreateInvoice,
  onOpenInvoice,
  savingOrderId,
}: DetailContentProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-white/90 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Tanggal dipilih</p>
        <p className="mt-1 text-lg font-semibold text-text-primary">{selectedDateLabel}</p>
        <p className="mt-1 text-sm text-text-secondary">
          {selectedDateCount ? `${selectedDateCount} order / booking ditemukan` : "Belum ada order / booking pada tanggal ini."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={selectedDateCount <= 0 ? "neutral" : isResourceMode ? selectedResourceAvailability.isFull ? "danger" : selectedResourceAvailability.hasHold ? "warning" : "success" : hasFullSlot ? "danger" : hasHoldSlot ? "warning" : "success"}>
            {selectedDateCount <= 0
              ? "Kosong"
              : isResourceMode
                ? selectedResourceAvailability.isFull
                  ? "Semua unit penuh"
                  : selectedResourceAvailability.hasHold
                    ? "Ada unit ditahan"
                    : `${selectedResourceAvailability.availableResourceCount} unit kosong`
                : hasFullSlot
                  ? "Full"
                  : hasHoldSlot
                    ? "Hold"
                    : `${selectedDateCount} booking`}
          </Badge>
          <Badge tone="neutral">{selectedDate} </Badge>
        </div>
        {(isResourceMode ? selectedResourceAvailability.hasHold : hasHoldSlot) ? (
          <p className="mt-3 text-xs text-amber-700">Ada booking pending DP. Slot akan kembali terbuka setelah hold aktif berakhir.</p>
        ) : null}
      </div>

      {isResourceMode ? (
        <div className="space-y-3 rounded-xl border border-border/70 bg-white/90 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-text-primary">Unit / slot</p>
            <p className="mt-1 text-xs text-text-muted">
              Detail ketersediaan per {business.resourceLabel?.toLowerCase() ?? "unit"} untuk tanggal ini.
            </p>
          </div>
          <div className="space-y-2">
            {visibleResourceDetails.map((resource) => (
              <div key={resource.resourceId} className="rounded-lg border border-border/70 bg-surface px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{resource.resourceName}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {!resource.isActive
                        ? "Sedang dinonaktifkan"
                        : resource.bookings.length
                          ? `${resource.bookings.length} booking pada tanggal ini`
                          : "Belum ada booking pada tanggal ini"}
                    </p>
                  </div>
                  <Badge tone={resource.statusTone}>{resource.statusLabel}</Badge>
                </div>
                {resource.earliestHoldExpiresAt ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Hold aktif sampai {formatDateTime(resource.earliestHoldExpiresAt.toISOString())}
                  </p>
                ) : null}
                {resource.bookings.length ? (
                  <div className="mt-3 space-y-2">
                    {resource.bookings.map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-white px-3 py-2 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{order.customerName}</p>
                          <p className="text-text-muted">
                            {order.scheduledTime ?? "-"} • {order.bookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES} menit
                          </p>
                        </div>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {hiddenResourceCount > 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 bg-white px-3 py-2 text-xs text-text-secondary">
                +{hiddenResourceCount} unit lain disembunyikan dulu supaya detail tetap ringkas.
              </div>
            ) : null}
          </div>
        </div>
      ) : selectedSlotSummaries.length ? (
        <div className="space-y-3 rounded-xl border border-border/70 bg-white/90 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-text-primary">Slot jam</p>
            <p className="mt-1 text-xs text-text-muted">Maksimal {BOOKING_SLOT_CAPACITY} booking untuk slot yang overlap.</p>
          </div>
          <div className="space-y-2">
            {selectedSlotSummaries.map((slot) => (
              <div key={slot.time} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-surface px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{slot.time}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {slot.count} booking overlap • {slot.holdCount} hold aktif
                  </p>
                </div>
                <Badge tone={slot.isFull ? "danger" : slot.holdCount > 0 ? "warning" : getBookingSlotTone(slot.count)}>
                  {slot.isFull ? "Full" : slot.holdCount > 0 ? `Hold ${slot.holdCount}` : getBookingSlotLabel(slot.count)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isResourceMode && unassignedSelectedOrders.length ? (
        <div className="space-y-2 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-text-primary">Booking belum ditetapkan ke unit</p>
            <p className="mt-1 text-xs text-text-secondary">
              Ini booking lama yang belum punya {business.resourceLabel?.toLowerCase() ?? "unit"}. Edit dari halaman order supaya availability lebih akurat.
            </p>
          </div>
          {unassignedSelectedOrders.map((order) => (
            <div key={order.id} className="rounded-lg border border-amber-100 bg-white px-3 py-2 text-xs text-text-secondary">
              <p className="font-medium text-text-primary">{order.customerName}</p>
              <p>{order.scheduledTime ?? "-"} • {order.title}</p>
            </div>
          ))}
        </div>
      ) : null}

      {visibleSelectedOrders.length ? (
        <div className="space-y-3">
          {visibleSelectedOrders.map((order) => {
            const linkedInvoice = invoiceByOrderId[order.id];

            return (
              <div key={order.id} className="rounded-xl border border-border/70 bg-white/90 px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">{order.customerName}</p>
                  <p className="text-sm text-text-secondary">{order.title}</p>
                </div>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <div className="mt-3 space-y-1 text-xs text-text-muted">
                <div className="flex items-center justify-between gap-2">
                  <span>{order.scheduledTime ?? "Belum ada jam"}</span>
                  <span>{order.status}</span>
                </div>
                {order.mode === "BOOKING_SERVICE" ? (
                  <>
                    <p>{order.bookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES} menit durasi</p>
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
              </div>
              <div className="mt-4 space-y-3 rounded-lg border border-border/60 bg-surface px-3 py-3">
                <div className="flex flex-wrap gap-2">
                  <WhatsAppButton
                    phoneNumber={order.whatsappNumber}
                    message={`Halo ${order.customerName}, saya follow-up untuk ${order.title}.`}
                    label="Follow-Up WA"
                    className="flex-1 min-w-[180px]"
                  />
                  {linkedInvoice ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenInvoice(linkedInvoice.invoiceCode)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Lihat Nota
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={creatingInvoiceOrderId === order.id}
                      onClick={() => void onCreateInvoice(order)}
                    >
                      <ReceiptText className="h-4 w-4" />
                      Buat Nota 1 Klik
                    </Button>
                  )}
                  {order.paymentStatus === "UNPAID" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={savingOrderId === order.id}
                      onClick={() => void onQuickAction(order, { paymentStatus: "DP_PAID" })}
                    >
                      Tandai Sudah DP
                    </Button>
                  ) : null}
                  {order.paymentStatus !== "PAID" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={savingOrderId === order.id}
                      onClick={() => void onQuickAction(order, { paymentStatus: "PAID" })}
                    >
                      Tandai Lunas
                    </Button>
                  ) : null}
                  {order.status !== "SELESAI" && order.status !== "BATAL" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={savingOrderId === order.id}
                      onClick={() => void onQuickAction(order, { status: "SELESAI" })}
                    >
                      Tandai Selesai
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-text-primary">Status</span>
                    <Select
                      value={getDraftStatus(order)}
                      onValueChange={(value) => onDraftStatusChange(order.id, value as OrderStatus)}
                      options={ORDER_STATUS_BY_MODE[order.mode]}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-text-primary">Status bayar</span>
                    <Select
                      value={getDraftPaymentStatus(order)}
                      onValueChange={(value) => onDraftPaymentChange(order.id, value as PaymentStatus)}
                      options={Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                  </label>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={savingOrderId === order.id}
                  onClick={() => void onSaveOrder(order)}
                  className="w-full"
                >
                  Simpan Perubahan
                </Button>
              </div>
              </div>
            );
          })}
          {hiddenSelectedOrderCount > 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-text-secondary">
              +{hiddenSelectedOrderCount} order lain disembunyikan dulu. Lihat halaman order untuk detail penuh.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-text-secondary">
          Tidak ada detail untuk tanggal ini.
        </div>
      )}

      <div className="rounded-xl border border-border/70 bg-surface px-4 py-4 text-sm text-text-secondary">
        <div className="flex items-start gap-3">
          <CircleDot className="mt-0.5 h-4 w-4 text-brand-700" />
          <p>Kalender ini dipakai admin buat cek jadwal harian dengan cepat. Klik tanggal lain untuk buka detailnya.</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardCalendar({ business, orders, selectedDate, onDateSelect }: DashboardCalendarProps) {
  const toast = useToast();
  const { invoices, updateOrder, createInvoiceFromOrder } = useAppData();
  const todayKey = toDateKey(new Date());
  const [viewDate, setViewDate] = useState(parseDateKey(todayKey));
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, OrderStatus>>({});
  const [draftPaymentStatuses, setDraftPaymentStatuses] = useState<Record<string, PaymentStatus>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [creatingInvoiceOrderId, setCreatingInvoiceOrderId] = useState<string | null>(null);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(viewDate),
    [viewDate]
  );
  const monthCells = useMemo(() => getMonthCells(viewDate), [viewDate]);

  const orderCountByDate = useMemo(
    () =>
      orders.reduce<Record<string, number>>((accumulator, order) => {
        if (!order.scheduledDate) {
          return accumulator;
        }

        accumulator[order.scheduledDate] = (accumulator[order.scheduledDate] ?? 0) + 1;
        return accumulator;
      }, {}),
    [orders]
  );

  const selectedOrders = useMemo(() => orders.filter((order) => order.scheduledDate === selectedDate), [orders, selectedDate]);
  const selectedSlotSummaries = useMemo(() => getBookingSlotsForDate(orders, selectedDate), [orders, selectedDate]);
  const selectedResourceDetails = useMemo(
    () => getResourceBookingDetailsForDate(orders, business.resources ?? [], selectedDate),
    [business.resources, orders, selectedDate]
  );
  const selectedResourceAvailability = useMemo(
    () => getResourceBookingAvailability(orders, business.resources ?? [], selectedDate, "00:00", 24 * 60),
    [business.resources, orders, selectedDate]
  );
  const hasFullSlot = selectedSlotSummaries.some((slot) => slot.isFull);
  const hasHoldSlot = selectedSlotSummaries.some((slot) => slot.holdCount > 0);
  const isResourceMode = business.operationalModel === "RESOURCE_BOOKING" && business.usesResources;
  const unassignedSelectedOrders = useMemo(
    () =>
      selectedOrders
        .filter((order) => !order.resourceId)
        .sort((left, right) => (left.scheduledTime ?? "").localeCompare(right.scheduledTime ?? "")),
    [selectedOrders]
  );

  const selectedDateLabel = useMemo(() => formatDate(selectedDate), [selectedDate]);
  const selectedDateCount = orderCountByDate[selectedDate] ?? 0;
  const invoiceByOrderId = useMemo(
    () =>
      invoices.reduce<Record<string, Invoice>>((accumulator, invoice) => {
        accumulator[invoice.orderId] = invoice;
        return accumulator;
      }, {}),
    [invoices]
  );
  const visibleResourceDetails = selectedResourceDetails.slice(0, 3);
  const hiddenResourceCount = Math.max(selectedResourceDetails.length - visibleResourceDetails.length, 0);
  const visibleSelectedOrders = selectedOrders.slice(0, 3);
  const hiddenSelectedOrderCount = Math.max(selectedOrders.length - visibleSelectedOrders.length, 0);

  useEffect(() => {
    setDraftStatuses({});
    setDraftPaymentStatuses({});
  }, [selectedDate]);

  function getDraftStatus(order: Order) {
    return draftStatuses[order.id] ?? order.status;
  }

  function getDraftPaymentStatus(order: Order) {
    return draftPaymentStatuses[order.id] ?? order.paymentStatus;
  }

  function onDraftStatusChange(orderId: string, status: OrderStatus) {
    setDraftStatuses((current) => ({
      ...current,
      [orderId]: status,
    }));
  }

  function onDraftPaymentChange(orderId: string, status: PaymentStatus) {
    setDraftPaymentStatuses((current) => ({
      ...current,
      [orderId]: status,
    }));
  }

  async function onSaveOrder(order: Order) {
    return persistOrder(order);
  }

  async function persistOrder(
    order: Order,
    patch?: Partial<{
      status: OrderStatus;
      paymentStatus: PaymentStatus;
    }>
  ) {
    setSavingOrderId(order.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      const nextStatus = patch?.status ?? getDraftStatus(order);
      const nextPaymentStatus = patch?.paymentStatus ?? getDraftPaymentStatus(order);

      updateOrder(order.id, {
        customerName: order.customerName,
        whatsappNumber: order.whatsappNumber,
        title: order.title,
        mode: order.mode,
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        scheduledDate: order.scheduledDate,
        scheduledTime: order.scheduledTime,
        bookingDurationMinutes: order.bookingDurationMinutes,
        bookingHoldExpiresAt: order.bookingHoldExpiresAt,
        resourceId: order.resourceId,
        resourceNameSnapshot: order.resourceNameSnapshot,
        totalAmount: order.totalAmount,
        dpAmount: order.dpAmount,
        notes: order.notes,
      });

      setDraftStatuses((current) => ({
        ...current,
        [order.id]: nextStatus,
      }));
      setDraftPaymentStatuses((current) => ({
        ...current,
        [order.id]: nextPaymentStatus,
      }));

      toast.success("Order diperbarui", "Status dari modal kalender sudah tersimpan.");
    } finally {
      setSavingOrderId(null);
    }
  }

  async function onQuickAction(
    order: Order,
    patch: Partial<{
      status: OrderStatus;
      paymentStatus: PaymentStatus;
    }>
  ) {
    return persistOrder(order, patch);
  }

  async function onCreateInvoice(order: Order) {
    setCreatingInvoiceOrderId(order.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      const existingInvoice = invoiceByOrderId[order.id];
      let invoice: typeof existingInvoice | null = existingInvoice ?? null;
      if (!invoice) {
        try {
          invoice = createInvoiceFromOrder(order.id, "Nota dibuat cepat dari kalender dashboard.");
        } catch (createError) {
          toast.error("Nota belum bisa dibuat", createError instanceof Error ? createError.message : "Mode baca saja aktif.");
          return;
        }
      }
      if (!invoice) {
        toast.error("Nota gagal dibuat", "Order ini belum bisa diproses jadi nota.");
        return;
      }

      if (existingInvoice) {
        toast.info("Nota sudah ada", "Saya buka nota yang sudah pernah dibuat untuk order ini.");
      } else {
        toast.success("Nota berhasil dibuat", "Admin tidak perlu pindah ke halaman invoice untuk langkah ini.");
      }
    } finally {
      setCreatingInvoiceOrderId(null);
    }
  }

  function onOpenInvoice(invoiceCode: string) {
    window.open(ROUTES.invoice(invoiceCode), "_blank", "noopener,noreferrer");
    toast.info("Nota dibuka", "Preview nota dibuka di tab baru.");
  }

  function getDayBadgeLabel(count: number, fullSlotAvailable: boolean, holdSlotAvailable: boolean) {
    if (count <= 0) {
      return "Kosong";
    }

    if (fullSlotAvailable) {
      return "Full";
    }

    if (holdSlotAvailable) {
      return "Hold";
    }

    return `${count} booking`;
  }

  function getDayBadgeCompactLabel(count: number, fullSlotAvailable: boolean, holdSlotAvailable: boolean) {
    if (count <= 0) {
      return "0";
    }

    if (fullSlotAvailable) {
      return "F";
    }

    if (holdSlotAvailable) {
      return "H";
    }

    return String(count);
  }

  function getDayBadgeTone(count: number, fullSlotAvailable: boolean, holdSlotAvailable: boolean) {
    if (count <= 0) {
      return "neutral" as const;
    }

    if (fullSlotAvailable) {
      return "danger" as const;
    }

    if (holdSlotAvailable) {
      return "warning" as const;
    }

    return "success" as const;
  }

  function goToPreviousMonth() {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  return (
    <>
      <section className="animate-fade-up-delay-2 rounded-2xl border border-border/80 bg-surface p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Kalender Jadwal</div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Pantau booking dan order bulan ini</h2>
              <p className="mt-1 text-sm text-text-secondary">Klik tanggal untuk lihat detail order/booking pada hari itu.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{monthLabel}</Badge>
            <Badge tone="info">
              {
                orders.filter((order) =>
                  order.scheduledDate?.startsWith(`${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`)
                ).length
              }{" "}
              jadwal bulan ini
            </Badge>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border/80 bg-muted/20 p-3 sm:p-5">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" size="sm" className="min-w-0 px-2.5 sm:w-auto sm:px-3" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            <div className="min-w-0 px-2 text-center text-sm font-semibold text-text-primary">{monthLabel}</div>
            <Button type="button" variant="secondary" size="sm" className="min-w-0 px-2.5 sm:w-auto sm:px-3" onClick={goToNextMonth}>
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-text-muted sm:text-[11px]">
            {weekdayLabels.map((label, index) => (
              <div key={`${label}-${index}`} className="py-1">
                <span className="sm:hidden">{weekdayShortLabels[index]}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {monthCells.map((date) => {
              const dateKey = toDateKey(date);
              const isCurrentMonth = date.getMonth() === viewDate.getMonth();
              const isSelected = selectedDate === dateKey;
              const isToday = dateKey === todayKey;
              const count = orderCountByDate[dateKey] ?? 0;
              const dateSlotSummaries = getBookingSlotsForDate(orders, dateKey);
              const dateResourceAvailability = getResourceBookingAvailability(orders, business.resources ?? [], dateKey, "00:00", 24 * 60);
              const dateHasFullSlot = isResourceMode ? dateResourceAvailability.isFull : dateSlotSummaries.some((slot) => slot.isFull);
              const dateHasHoldSlot = isResourceMode ? dateResourceAvailability.hasHold : dateSlotSummaries.some((slot) => slot.holdCount > 0);
              const badgeLabel = getDayBadgeLabel(count, dateHasFullSlot, dateHasHoldSlot);
              const compactBadgeLabel = getDayBadgeCompactLabel(count, dateHasFullSlot, dateHasHoldSlot);
              const badgeTone = getDayBadgeTone(count, dateHasFullSlot, dateHasHoldSlot);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => {
                    onDateSelect(dateKey);
                    setIsDetailOpen(true);
                  }}
                  className={cn(
                    "relative flex h-11 flex-col items-center justify-center rounded-lg border px-0.5 text-sm transition-all duration-200 hover:-translate-y-0.5 sm:h-14 sm:px-1 md:h-16",
                    isCurrentMonth ? "border-border/70 bg-surface text-text-primary" : "border-border/40 bg-muted/20 text-text-muted/60",
                    isToday && !isSelected && "border-brand-300 bg-brand-50 text-brand-800",
                    isSelected && "border-brand-700 !bg-brand-700 !text-white shadow-md ring-2 ring-brand-200/70"
                  )}
                >
                  <span className="text-[10px] font-medium sm:text-xs md:text-sm">{date.getDate()}</span>
                  <span
                    className={cn(
                      "mt-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full border px-1 py-0.5 text-[7px] font-semibold uppercase tracking-wide sm:mt-1 sm:min-w-0 sm:px-1.5 sm:text-[9px]",
                      badgeTone === "neutral" && !isSelected && "border-border/70 bg-white text-text-muted",
                      badgeTone === "success" && !isSelected && "border-green-100 bg-green-50 text-green-700",
                      badgeTone === "danger" && !isSelected && "border-red-100 bg-red-50 text-red-700",
                      badgeTone === "warning" && !isSelected && "border-amber-100 bg-amber-50 text-amber-700",
                      isSelected && "!border-white/25 !bg-white/10 !text-white"
                    )}
                  >
                    <span className="sm:hidden">{compactBadgeLabel}</span>
                    <span className="hidden sm:inline">{badgeLabel}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 text-xs text-text-secondary sm:flex sm:flex-wrap sm:gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-700" />
              Ada booking / order
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border border-brand-200 bg-brand-50" />
              Hari ini
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-700/20" />
              Tanggal terpilih
            </div>
          </div>
        </div>
      </section>

      {isDetailOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Detail kalender"
        >
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setIsDetailOpen(false)} aria-label="Tutup detail kalender" />
          <div className="relative z-10 max-h-[88vh] w-full overflow-hidden rounded-t-3xl border border-border/80 bg-brand-50 shadow-soft sm:max-w-3xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-brand-100 px-5 py-4">
              <div>
                <div className="inline-flex rounded-md bg-white px-3 py-1 text-xs font-medium text-brand-700">Detail Tanggal</div>
                <h3 className="mt-3 text-xl font-semibold text-text-primary">{selectedDateLabel}</h3>
                <p className="mt-1 text-sm text-text-secondary">Ringkasan booking, slot, dan status pada tanggal yang dipilih.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-white text-text-primary transition hover:bg-muted"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(88vh-92px)] overflow-y-auto px-5 py-5">
              <CalendarDetailContent
                business={business}
                selectedDate={selectedDate}
                selectedDateLabel={selectedDateLabel}
                selectedDateCount={selectedDateCount}
                isResourceMode={isResourceMode}
                selectedResourceAvailability={selectedResourceAvailability}
                hasFullSlot={hasFullSlot}
                hasHoldSlot={hasHoldSlot}
                visibleResourceDetails={visibleResourceDetails}
                hiddenResourceCount={hiddenResourceCount}
                selectedSlotSummaries={selectedSlotSummaries}
                unassignedSelectedOrders={unassignedSelectedOrders}
                visibleSelectedOrders={visibleSelectedOrders}
                hiddenSelectedOrderCount={hiddenSelectedOrderCount}
                getDraftStatus={getDraftStatus}
                getDraftPaymentStatus={getDraftPaymentStatus}
                onDraftStatusChange={onDraftStatusChange}
                onDraftPaymentChange={onDraftPaymentChange}
                onSaveOrder={onSaveOrder}
                onQuickAction={onQuickAction}
                invoiceByOrderId={invoiceByOrderId}
                creatingInvoiceOrderId={creatingInvoiceOrderId}
                onCreateInvoice={onCreateInvoice}
                onOpenInvoice={onOpenInvoice}
                savingOrderId={savingOrderId}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
