"use client";

import { useEffect, useMemo, useState, memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  User,
  CalendarDays
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getResourceBookingDetailsForDate,
  getBookingSlotsForDate,
  getResourceBookingAvailability,
} from "@/lib/booking";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { useInvoices } from "@/hooks/use-invoices";
import { useOrders } from "@/hooks/use-orders";
import type { Business } from "@/types/business";
import type { Invoice } from "@/types/invoice";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { CalendarDetailContent } from "./components/calendar-detail-content";
import { getDatesInRange } from "./components/closed-day-section";

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



function getTimelineCardClasses(status: OrderStatus, paymentStatus: PaymentStatus) {
  if (status === "BATAL") {
    return "bg-[var(--color-danger-surface)] border-[var(--color-danger)] border text-[var(--color-danger)] line-through opacity-70";
  }
  if (status === "SELESAI") {
    return "bg-[var(--color-surface-inset)] border-[var(--color-border-strong)] border text-[var(--color-text-secondary)] opacity-90";
  }
  if (status === "CONFIRMED" || paymentStatus === "PAID") {
    return "bg-[var(--color-success-surface)] border-[var(--color-success)] border-2 text-[var(--color-success-text)] shadow-sm font-extrabold";
  }
  if (status === "WAITING_DP" || paymentStatus === "DP_PAID") {
    return "bg-[var(--color-warning-surface)] border-[var(--color-warning)] border-2 text-[var(--color-warning-text)] shadow-sm font-extrabold";
  }
  return "bg-[var(--color-primary-surface)] border-[var(--color-primary)] border-2 text-[var(--color-primary)] shadow-sm font-extrabold ring-2 ring-[var(--color-primary)]/20";
}

function getTimelineStatusLabel(status: OrderStatus): string {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Konfirmasi",
    SELESAI: "Selesai",
    BATAL: "Batal",
    WAITING_DP: "Tunggu DP",
  };
  return labels[status] ?? status;
}

export const DashboardCalendar = memo(function DashboardCalendar({ business, orders, selectedDate, onDateSelect }: DashboardCalendarProps) {
  const toast = useToast();
  const { updateBusiness } = useAppData();
  const { updateOrder, deleteOrder } = useOrders();
  const { invoices, createInvoiceFromOrder } = useInvoices();
  const todayKey = toDateKey(new Date());

  function handleToggleClosedDate(date: string, reason?: string, endDate?: string) {
    const closedDates = { ...(business.closedDates || {}) };
    if (closedDates[date] && !reason) {
      delete closedDates[date];
      toast.info("Toko dibuka kembali", `Operasional tanggal ${formatDate(date)} kembali dibuka.`);
    } else {
      if (!reason?.trim()) {
        toast.error("Gagal mengatur libur", "Alasan libur wajib diisi.");
        return;
      }
      if (endDate && endDate !== date) {
        const dates = getDatesInRange(date, endDate);
        dates.forEach((d) => {
          closedDates[d] = reason.trim();
        });
        toast.success("Hari libur disimpan", `Toko tutup dari ${formatDate(date)} s.d ${formatDate(endDate)} karena: ${reason}`);
      } else {
        closedDates[date] = reason.trim();
        toast.success("Hari libur disimpan", `Toko tutup tanggal ${formatDate(date)} karena: ${reason}`);
      }
    }
    updateBusiness({ closedDates });
  }
  const [viewDate, setViewDate] = useState(parseDateKey(todayKey));
  const [viewMode, setViewMode] = useState<"MONTH" | "DAY_TIMELINE">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return "DAY_TIMELINE";
    }
    return "MONTH";
  });
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
  const selectedSlotSummaries = useMemo(() => getBookingSlotsForDate(selectedOrders, selectedDate, null, new Date(), business.bookingCapacity), [selectedOrders, selectedDate, business.bookingCapacity]);
  const selectedResourceDetails = useMemo(
    () => getResourceBookingDetailsForDate(selectedOrders, business.resources ?? [], selectedDate),
    [business.resources, selectedOrders, selectedDate]
  );
  const selectedResourceAvailability = useMemo(
    () => getResourceBookingAvailability(selectedOrders, business.resources ?? [], selectedDate, "00:00", 24 * 60),
    [business.resources, selectedOrders, selectedDate]
  );
  const hasFullSlot = selectedSlotSummaries.some((slot) => slot.isFull);
  const hasHoldSlot = selectedSlotSummaries.some((slot) => slot.holdCount > 0);
  const isResourceMode = business.operationalModel === "RESOURCE_BOOKING" && business.usesResources;
  const unassignedSelectedOrders = useMemo(
    () =>
      selectedOrders
        .filter((order) => !order.resourceId && order.status !== "SELESAI")
        .sort((left, right) => (left.scheduledTime ?? "23:59").localeCompare(right.scheduledTime ?? "23:59")),
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
  const activeSelectedOrdersForDetail = useMemo(() => {
    return selectedOrders
      .filter((o) => o.status !== "SELESAI")
      .sort((a, b) => (a.scheduledTime || "23:59").localeCompare(b.scheduledTime || "23:59"));
  }, [selectedOrders]);

  const visibleSelectedOrders = activeSelectedOrdersForDetail.slice(0, 3);
  const hiddenSelectedOrderCount = Math.max(activeSelectedOrdersForDetail.length - visibleSelectedOrders.length, 0);

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

      await updateOrder(order.id, {
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        scheduledDate: order.scheduledDate,
        scheduledTime: order.scheduledTime,
        bookingDurationMinutes: order.bookingDurationMinutes,
        bookingHoldExpiresAt: order.bookingHoldExpiresAt,
        resourceId: order.resourceId,
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

  async function onDeleteOrder(orderId: string) {
    if (confirm("Apakah Anda yakin ingin menghapus / membatalkan booking ini secara permanen?")) {
      setSavingOrderId(orderId);
      try {
        await deleteOrder(orderId);
        toast.success("Order berhasil dihapus", "Jadwal dan unit kini telah dibebaskan.");
      } catch (error) {
        toast.error("Gagal menghapus order", error instanceof Error ? error.message : "Terjadi kesalahan.");
      } finally {
        setSavingOrderId(null);
      }
    }
  }

  async function onCreateInvoice(order: Order) {
    setCreatingInvoiceOrderId(order.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      const existingInvoice = invoiceByOrderId[order.id];
      let invoice: typeof existingInvoice | null = existingInvoice ?? null;
      if (!invoice) {
        try {
          invoice = await createInvoiceFromOrder(order.id, "Nota dibuat cepat dari kalender dashboard.");
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

    if (business.mode !== "BOOKING_SERVICE") {
      return `${count} order`;
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

    if (business.mode !== "BOOKING_SERVICE") {
      return String(count);
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

    if (business.mode !== "BOOKING_SERVICE") {
      return "success" as const;
    }

    if (fullSlotAvailable) {
      return "danger" as const;
    }

    if (holdSlotAvailable) {
      return "warning" as const;
    }

    return "success" as const;
  }

  function goToPrevious() {
    if (viewMode === "MONTH") {
      setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    } else {
      const current = parseDateKey(selectedDate);
      current.setDate(current.getDate() - 1);
      const nextKey = toDateKey(current);
      onDateSelect(nextKey);
      setViewDate(current);
    }
  }

  function goToNext() {
    if (viewMode === "MONTH") {
      setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
    } else {
      const current = parseDateKey(selectedDate);
      current.setDate(current.getDate() + 1);
      const nextKey = toDateKey(current);
      onDateSelect(nextKey);
      setViewDate(current);
    }
  }

  const activeResources = useMemo(() => (business.resources ?? []).filter((resource) => resource.isActive), [business.resources]);

  const timelineColumns = useMemo(() => {
    const list = [...activeResources];
    const hasUnassigned = selectedOrders.some((o) => !o.resourceId || o.resourceId === "ANY");
    if (hasUnassigned) {
      list.push({
        id: "ANY",
        name: "Umum",
        isActive: true,
      });
    }
    return list;
  }, [activeResources, selectedOrders]);

  const [startHour, endHour] = useMemo(() => {
    if (!business.openingHours) return [7, 21];
    const [startStr, endStr] = business.openingHours.split(" - ");
    const s = parseInt(startStr?.split(":")[0], 10);
    const e = parseInt(endStr?.split(":")[0], 10);
    return [Number.isNaN(s) ? 7 : s, Number.isNaN(e) ? 21 : e];
  }, [business.openingHours]);

  const startOffsetMinutes = startHour * 60;

  const positionedOrders = useMemo(() => {
    const sorted = [...selectedOrders].sort((a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || ""));
    return sorted.map((order) => {
      const [h, m] = (order.scheduledTime || "08:00").split(":").map(Number);
      const start = h * 60 + m;
      const end = start + (order.bookingDurationMinutes || 60);

      const overlaps = sorted.filter((other) => {
        if (other.id === order.id) return false;
        const [oh, om] = (other.scheduledTime || "08:00").split(":").map(Number);
        const ostart = oh * 60 + om;
        const oend = ostart + (other.bookingDurationMinutes || 60);
        return start < oend && end > ostart;
      });

      const hasOverlap = overlaps.length > 0;
      const positionIdx = overlaps.findIndex((o) => o.id < order.id) > -1 ? 1 : 0;

      return {
        order,
        top: ((start - startOffsetMinutes) * 64) / 60,
        height: ((order.bookingDurationMinutes || 60) * 64) / 60,
        leftClass: hasOverlap ? (positionIdx === 0 ? "left-1 w-[47%]" : "left-[51%] w-[47%]") : "left-1 right-1",
      };
    });
  }, [selectedOrders, startOffsetMinutes]);

  const hoursLength = Math.max(1, endHour - startHour + 1);
  const hours = Array.from({ length: hoursLength }, (_, i) => i + startHour);

  return (
    <>
      <section className="animate-fade-up-delay-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-none sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex rounded-[var(--radius-md)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] border border-[var(--color-info-border)] px-3 py-1 text-xs font-medium">Kalender Jadwal</div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Pantau booking dan order secara real-time</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Lihat jadwal harian timeline atau bulanan.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-[var(--color-surface-elevated)] p-1 border border-[var(--color-border)] shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("MONTH")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-bold transition-all",
                  viewMode === "MONTH"
                    ? "bg-[var(--color-primary)] text-white shadow-sm font-black"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-semibold"
                )}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setViewMode("DAY_TIMELINE")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-bold transition-all",
                  viewMode === "DAY_TIMELINE"
                    ? "bg-[var(--color-primary)] text-white shadow-sm font-black"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-semibold"
                )}
              >
                <span className="md:hidden">Daftar</span>
                <span className="hidden md:inline">Timeline Harian</span>
              </button>
            </div>

            <Badge tone="neutral">{viewMode === "MONTH" ? monthLabel : formatDate(selectedDate)}</Badge>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 sm:p-5">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" size="sm" className="min-w-0 px-2.5 sm:w-auto sm:px-3" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            <div className="min-w-0 px-2 text-center text-sm font-semibold text-[var(--color-text)]">
              {viewMode === "MONTH" ? monthLabel : formatDate(selectedDate)}
            </div>
            <Button type="button" variant="secondary" size="sm" className="min-w-0 px-2.5 sm:w-auto sm:px-3" onClick={goToNext}>
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {viewMode === "MONTH" ? (
            <>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-[var(--color-text-muted)] sm:text-[11px]">
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
                  const cellOrders = orders.filter((o) => o.scheduledDate === dateKey);
                  const dateSlotSummaries = getBookingSlotsForDate(cellOrders, dateKey, null, new Date(), business.bookingCapacity);
                  const dateResourceAvailability = getResourceBookingAvailability(cellOrders, business.resources ?? [], dateKey, "00:00", 24 * 60);
                  const dateHasFullSlot = isResourceMode ? dateResourceAvailability.isFull : dateSlotSummaries.some((slot) => slot.isFull);
                  const dateHasHoldSlot = isResourceMode ? dateResourceAvailability.hasHold : dateSlotSummaries.some((slot) => slot.holdCount > 0);

                  const isClosed = Boolean(business.closedDates?.[dateKey]);
                  const closedReason = business.closedDates?.[dateKey] || "";

                  const badgeLabel = isClosed ? `TUTUP: ${closedReason}` : getDayBadgeLabel(count, dateHasFullSlot, dateHasHoldSlot);
                  const compactBadgeLabel = isClosed ? "TUTUP" : getDayBadgeCompactLabel(count, dateHasFullSlot, dateHasHoldSlot);
                  const badgeTone = isClosed ? ("danger" as const) : getDayBadgeTone(count, dateHasFullSlot, dateHasHoldSlot);

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => {
                        onDateSelect(dateKey);
                        setIsDetailOpen(true);
                      }}
                      className={cn(
                        "relative flex h-11 flex-col items-center justify-center rounded-md border px-0.5 text-sm transition-colors duration-200 sm:h-14 sm:px-1 md:h-16",
                        !isSelected && (
                          isClosed
                            ? "border-red-200 bg-red-50 text-red-700 font-semibold"
                            : (isCurrentMonth ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" : "border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]/40")
                        ),
                        isToday && !isSelected && "border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] font-semibold",
                        isSelected && "border-transparent bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]"
                      )}
                    >
                      <span className="text-[10px] font-medium sm:text-xs md:text-sm">{date.getDate()}</span>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full border px-1 py-0.5 text-[7px] font-semibold uppercase tracking-wide sm:mt-1 sm:min-w-0 sm:px-1.5 sm:text-[9px]",
                          badgeTone === "neutral" && !isSelected && "border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]",
                          badgeTone === "success" && !isSelected && "border-[var(--color-success-border)] bg-[var(--color-success-surface)] text-[var(--color-success)]",
                          badgeTone === "danger" && !isSelected && "border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
                          badgeTone === "warning" && !isSelected && "border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] text-[var(--color-warning-text)]",
                          isSelected && "border-white/20 bg-white/20 text-white"
                        )}
                      >
                        <span className="sm:hidden">{compactBadgeLabel}</span>
                        <span className="hidden sm:inline">{badgeLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid gap-2 text-xs text-[var(--color-text-secondary)] sm:flex sm:flex-wrap sm:gap-2 border-t border-[var(--color-border)]/45 pt-3.5">
                <div className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                  Ada booking / order
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-primary-surface)]" />
                  Hari ini
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-surface-inset)]" />
                  Tanggal terpilih
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4 border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)] overflow-hidden">
              {/* Day Header Info */}
              <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="font-bold text-xs text-[var(--color-text)]">
                    Jadwal Hari Ini: {formatDate(selectedDate)}
                  </span>
                </div>
                {business.closedDates?.[selectedDate] && (
                  <Badge tone="danger">TUTUP: {business.closedDates[selectedDate]}</Badge>
                )}
              </div>

              {/* Mobile Daily List View */}
              <div className="block md:hidden p-4 space-y-3">
                {selectedOrders.length > 0 ? (
                  selectedOrders.map((order) => {
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          onDateSelect(selectedDate);
                          setIsDetailOpen(true);
                        }}
                        className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] p-4 shadow-sm bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[var(--color-primary)]">{order.scheduledTime ?? "Jadwal bebas"}</span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">• {order.bookingDurationMinutes ?? 60}m</span>
                            </div>
                            <p className="font-extrabold text-sm text-[var(--color-text)] truncate">{order.customerName}</p>
                            <p className="text-xs text-[var(--color-text-secondary)] font-medium truncate">{order.title}</p>
                            {order.resourceNameSnapshot && (
                              <Badge tone="info" className="text-[9px] py-0.5 px-1.5">{order.resourceNameSnapshot}</Badge>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge tone={order.status === "SELESAI" ? "neutral" : order.status === "BATAL" ? "danger" : "success"} className="text-[9px] uppercase tracking-wider font-extrabold">
                              {order.status}
                            </Badge>
                            <Badge tone={order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "DP_PAID" ? "info" : "warning"} className="text-[9px] uppercase tracking-wider font-extrabold">
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] p-8 text-center space-y-2 bg-[var(--color-surface)]">
                    <p className="font-bold text-sm text-[var(--color-text)]">Tidak Ada Jadwal</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Belum ada booking atau order terdaftar untuk tanggal ini.</p>
                  </div>
                )}
              </div>

              {/* Desktop/Tablet G-Cal Timeline View */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-[600px] select-none">
                  {isResourceMode && timelineColumns.length > 0 ? (
                    // ── RESOURCE TIMELINE VIEW (G-CAL STYLE) ──
                    <div className="relative">
                      {/* Column titles */}
                      <div className="grid border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] font-bold text-xs text-[var(--color-text-secondary)] text-center divide-x divide-[var(--color-border)]/40" style={{ gridTemplateColumns: `80px repeat(${timelineColumns.length}, minmax(180px, 1fr))` }}>
                        <div className="py-2.5">Waktu</div>
                        {timelineColumns.map((res) => (
                          <div key={res.id} className="py-2.5 truncate">{res.name}</div>
                        ))}
                      </div>

                      {/* Hour rows and content grid */}
                      <div className="relative flex" style={{ height: "960px" }}>
                        {/* Time labels axis */}
                        <div className="w-[80px] shrink-0 bg-[var(--color-surface-elevated)] border-r border-[var(--color-border)]/60 flex flex-col z-10">
                          {hours.map((h) => (
                            <div key={h} className="h-16 text-[11px] font-bold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]/60 flex items-start justify-center pt-1.5 font-mono">
                              {String(h).padStart(2, "0")}:00
                            </div>
                          ))}
                        </div>

                        {/* Resource columns content */}
                        <div className="flex-1 grid divide-x divide-[var(--color-border)]/40 relative" style={{ gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(180px, 1fr))` }}>
                          {timelineColumns.map((res) => {
                            const resOrders = selectedOrders.filter((o) => {
                              if (res.id === "ANY") {
                                return !o.resourceId || o.resourceId === "ANY";
                              }
                              return o.resourceId === res.id;
                            });
                            return (
                              <div key={res.id} className="relative h-full">
                                {/* Grid backgrounds */}
                                {hours.map((h, idx) => (
                                  <div
                                    key={h}
                                    onClick={() => {
                                      toast.info("Pembuatan Order", `Ketik "booking di ${res.name} jam ${h}" di Asisten Pintar (Cmd+K) untuk input cepat!`);
                                    }}
                                    className="absolute left-0 right-0 border-b border-[var(--color-border)]/60 hover:bg-[var(--color-primary-surface)]/20 cursor-pointer transition-colors"
                                    style={{ top: `${idx * 64}px`, height: "64px" }}
                                  >
                                    <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-[var(--color-border)]/30" />
                                  </div>
                                ))}

                                {/* Order block cards */}
                                {resOrders.map((order) => {
                                  const [hStr, mStr] = (order.scheduledTime || "08:00").split(":");
                                  const h = Number(hStr || 8);
                                  const m = Number(mStr || 0);
                                  const startOffset = h * 60 + m - startOffsetMinutes;
                                  const top = (startOffset * 64) / 60;
                                  const height = ((order.bookingDurationMinutes || 60) * 64) / 60;

                                  return (
                                    <button
                                      key={order.id}
                                      type="button"
                                      onClick={() => {
                                        onDateSelect(selectedDate);
                                        setIsDetailOpen(true);
                                      }}
                                      className={cn(
                                        "absolute left-1.5 right-1.5 rounded-xl border p-2 text-left flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition duration-200 z-10",
                                        getTimelineCardClasses(order.status, order.paymentStatus)
                                      )}
                                      style={{ top: `${top}px`, height: `${height}px` }}
                                    >
                                      <div className="min-w-0 w-full space-y-1">
                                        <div className="flex items-center justify-between gap-1 w-full">
                                          <div className="flex items-center gap-1 min-w-0">
                                            <User className="h-3 w-3 shrink-0 opacity-70" />
                                            <p className="font-extrabold text-[10px] truncate leading-none">{order.customerName}</p>
                                          </div>
                                          <span className="text-[7px] font-black uppercase shrink-0 tracking-wider px-1 py-0.5 rounded bg-black/5">
                                            {getTimelineStatusLabel(order.status)}
                                          </span>
                                        </div>
                                        <p className="text-[9px] font-semibold truncate opacity-90">{order.title}</p>
                                      </div>
                                      <div className="flex justify-between items-center text-[8px] font-bold opacity-60 font-mono">
                                        <span>{order.scheduledTime}</span>
                                        <span>{order.bookingDurationMinutes}m</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // ── STANDARD TIMELINE VIEW (G-CAL STYLE) ──
                    <div className="relative">
                      {/* Column titles */}
                      <div className="grid border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] font-bold text-xs text-[var(--color-text-secondary)] text-center divide-x divide-[var(--color-border)]/40 grid-cols-[80px_1fr]">
                        <div className="py-2.5">Waktu</div>
                        <div className="py-2.5">Slot Pemesanan & Overlap</div>
                      </div>

                      {/* Hour rows and content grid */}
                      <div className="relative flex" style={{ height: "960px" }}>
                        {/* Time labels axis */}
                        <div className="w-[80px] shrink-0 bg-[var(--color-surface-elevated)] border-r border-[var(--color-border)]/60 flex flex-col z-10">
                          {hours.map((h) => (
                            <div key={h} className="h-16 text-[11px] font-bold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]/60 flex items-start justify-center pt-1.5 font-mono">
                              {String(h).padStart(2, "0")}:00
                            </div>
                          ))}
                        </div>

                        {/* Content area */}
                        <div className="flex-1 relative h-full">
                          {/* Grid backgrounds */}
                          {hours.map((h, idx) => (
                            <div
                              key={h}
                              onClick={() => {
                                toast.info("Pembuatan Order", `Ketik "booking jam ${h}" di Asisten Pintar (Cmd+K) untuk input cepat!`);
                              }}
                              className="absolute left-0 right-0 border-b border-[var(--color-border)]/60 hover:bg-[var(--color-primary-surface)]/20 cursor-pointer transition-colors"
                              style={{ top: `${idx * 64}px`, height: "64px" }}
                            >
                              <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-[var(--color-border)]/30" />
                            </div>
                          ))}

                          {/* Order blocks */}
                          {positionedOrders.map(({ order, top, height, leftClass }) => (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => {
                                onDateSelect(selectedDate);
                                setIsDetailOpen(true);
                              }}
                              className={cn(
                                "absolute rounded-xl border p-2 text-left flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition duration-200 z-10",
                                leftClass,
                                getTimelineCardClasses(order.status, order.paymentStatus)
                              )}
                              style={{ top: `${top}px`, height: `${height}px` }}
                            >
                              <div className="min-w-0 w-full space-y-1">
                                <div className="flex items-center justify-between gap-1 w-full">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <User className="h-3 w-3 shrink-0 opacity-70" />
                                    <p className="font-extrabold text-[10px] truncate leading-none">{order.customerName}</p>
                                  </div>
                                  <span className="text-[7px] font-black uppercase shrink-0 tracking-wider px-1 py-0.5 rounded bg-black/5">
                                    {getTimelineStatusLabel(order.status)}
                                  </span>
                                </div>
                                <p className="text-[9px] font-semibold truncate opacity-90">{order.title}</p>
                              </div>
                              <div className="flex justify-between items-center text-[8px] font-bold opacity-60 font-mono">
                                <span>{order.scheduledTime}</span>
                                <span>{order.bookingDurationMinutes}m</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {isDetailOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[var(--color-navy-900)]/50 backdrop-blur-[2px] p-0 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Detail kalender"
        >
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setIsDetailOpen(false)} aria-label="Tutup detail kalender" />
          <div className="relative z-10 max-h-[88vh] w-full overflow-hidden rounded-t-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)] sm:max-w-3xl sm:rounded-[var(--radius-xl)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <div className="inline-flex rounded-[var(--radius-md)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] border border-[var(--color-info-border)] px-3 py-1 text-xs font-medium">Detail Tanggal</div>
                <h3 className="mt-3 text-xl font-semibold text-[var(--color-text)]">{selectedDateLabel}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Ringkasan booking, slot, dan status pada tanggal yang dipilih.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-inset)] hover:text-[var(--color-text)]"
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
                onDeleteOrder={onDeleteOrder}
                invoiceByOrderId={invoiceByOrderId}
                creatingInvoiceOrderId={creatingInvoiceOrderId}
                onCreateInvoice={onCreateInvoice}
                onOpenInvoice={onOpenInvoice}
                savingOrderId={savingOrderId}
                onToggleClosedDate={handleToggleClosedDate}
                viewMode={viewMode}
                onSwitchToDayView={() => {
                  setViewMode("DAY_TIMELINE");
                  setIsDetailOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
});
