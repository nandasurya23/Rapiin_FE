import { useState, useMemo, useEffect } from "react";
import { getResourceBookingDetailsForDate, getBookingSlotsForDate } from "@/lib/booking";
import { formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { useInvoices } from "@/hooks/use-invoices";
import { useOrders } from "@/hooks/use-orders";
import type { Business } from "@/types/business";
import type { Invoice } from "@/types/invoice";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { toDateKey, parseDateKey, getMonthCells } from "../utils/calendar-utils";
import { getDatesInRange } from "../components/closed-day-section";
import { ROUTES } from "@/lib/routes";

export type UseCalendarStateProps = {
  business: Business;
  orders: Order[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
};

export function useCalendarState({ business, orders, selectedDate, onDateSelect }: UseCalendarStateProps) {
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
  if (business.operationalModel === "APPOINTMENT") {
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

 const selectedOrders = useMemo(() => (orders || []).filter((order) => order.scheduledDate === selectedDate), [orders, selectedDate]);
 const selectedSlotSummaries = useMemo(() => getBookingSlotsForDate(selectedOrders, selectedDate, null, new Date(), business.bookingCapacity), [selectedOrders, selectedDate, business.bookingCapacity]);
 const selectedResourceDetails = useMemo(
  () => getResourceBookingDetailsForDate(selectedOrders, business.resources ?? [], selectedDate),
  [business.resources, selectedOrders, selectedDate]
 );

 const hasFullSlot = selectedSlotSummaries.some((slot) => slot.isFull);
 const isResourceMode = Boolean(business.usesResources && (business.resources?.length ?? 0) > 0);
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
  } catch (err) {
   toast.error("Gagal memperbarui order", err instanceof Error ? err.message : "Terjadi kesalahan.");
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

 function onOpenInvoice(invoiceId: string) {
  window.open(ROUTES.invoice(invoiceId), "_blank", "noopener,noreferrer");
  toast.info("Nota dibuka", "Preview nota dibuka di tab baru.");
 }

 function getDayBadgeLabel(count: number, fullSlotAvailable: boolean) {
  if (count <= 0) {
   return "Kosong";
  }

  if (business.mode !== "BOOKING_SERVICE") {
   return `${count} order`;
  }

  if (fullSlotAvailable) {
   return "Full";
  }

  return `${count} booking`;
 }

 function getDayBadgeCompactLabel(count: number, fullSlotAvailable: boolean) {
  if (count <= 0) {
   return "0";
  }

  if (business.mode !== "BOOKING_SERVICE") {
   return String(count);
  }

  if (fullSlotAvailable) {
   return "F";
  }

  return String(count);
 }

 function getDayBadgeTone(count: number, fullSlotAvailable: boolean) {
  if (count <= 0) {
   return "neutral" as const;
  }

  if (business.mode !== "BOOKING_SERVICE") {
   return "success" as const;
  }

  if (fullSlotAvailable) {
   return "danger" as const;
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
  const hasUnassigned = selectedOrders.some((o) => o.status !== "SELESAI" && (!o.resourceId || o.resourceId === "ANY"));
  if (hasUnassigned) {
   list.push({
    id: "ANY",
    name: isResourceMode ? "Belum Ditetapkan" : "Umum",
    isActive: true,
   });
  }
  return list;
 }, [activeResources, selectedOrders, isResourceMode]);

 const [startHour, endHour] = useMemo(() => {
  if (!business.openingHours) return [7, 21];
  const [startStr, endStr] = business.openingHours.split("-").map(s => s.trim());
  let s = parseInt(startStr?.split(":")[0], 10);
  let e = parseInt(endStr?.split(":")[0], 10);
  if (Number.isNaN(s)) s = 7;
  if (Number.isNaN(e)) e = 21;
  if (e < s) e += 24;
  return [s, e];
 }, [business.openingHours]);

 const startOffsetMinutes = startHour * 60;

 const positionedOrders = useMemo(() => {
  const activeOrders = selectedOrders.filter((o) => o.status !== "SELESAI");
  const sorted = [...activeOrders].sort((a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || ""));

  return sorted.map((order) => {
   const timeParts = (order.scheduledTime || "08:00").split(":");
   let h = Number(timeParts[0]);
   const m = Number(timeParts[1]);
   if (h < startHour) h += 24;
   const start = h * 60 + m;
   const end = start + (order.bookingDurationMinutes || 60);

   const overlappingGroup = sorted.filter((other) => {
    const otherParts = (other.scheduledTime || "08:00").split(":");
    let oh = Number(otherParts[0]);
    const om = Number(otherParts[1]);
    if (oh < startHour) oh += 24;
    const ostart = oh * 60 + om;
    const oend = ostart + (other.bookingDurationMinutes || 60);
    return start < oend && end > ostart;
   });

   const totalInGroup = Math.max(1, overlappingGroup.length);
   const orderIndexInGroup = overlappingGroup.findIndex((o) => o.id === order.id);

   const displayTotal = Math.min(totalInGroup, 3);
   const widthPercent = 100 / displayTotal;
   // Cap left percent so it doesn't overflow
   const leftPercent = Math.min(orderIndexInGroup, displayTotal - 1) * widthPercent;
   const hasConflict = totalInGroup > (business.bookingCapacity || 1);
   const isHidden = orderIndexInGroup >= displayTotal;
   const isStackIndicator = orderIndexInGroup === displayTotal - 1 && totalInGroup > displayTotal;

   return {
    order,
    hasConflict,
    isHidden,
    isStackIndicator,
    hiddenCount: totalInGroup - displayTotal + 1,
    top: ((start - startOffsetMinutes) * 64) / 60,
    height: Math.max(36, ((order.bookingDurationMinutes || 60) * 64) / 60),
    style: {
     top: `${((start - startOffsetMinutes) * 64) / 60}px`,
     height: `${Math.max(36, ((order.bookingDurationMinutes || 60) * 64) / 60)}px`,
     left: `calc(${leftPercent}% + 4px)`,
     width: `calc(${widthPercent}% - 8px)`,
    },
   };
  });
 }, [selectedOrders, startOffsetMinutes, startHour]);

 const hoursLength = Math.max(1, endHour - startHour + 1);
 const hours = Array.from({ length: hoursLength }, (_, i) => i + startHour);


  return {
    viewDate, setViewDate,
    viewMode, setViewMode,
    isDetailOpen, setIsDetailOpen,
    monthLabel, monthCells,
    orderCountByDate, selectedOrders, selectedSlotSummaries, selectedResourceDetails,
    hasFullSlot, isResourceMode, unassignedSelectedOrders,
    selectedDateLabel, selectedDateCount, invoiceByOrderId,
    visibleResourceDetails, hiddenResourceCount,
    visibleSelectedOrders, hiddenSelectedOrderCount,
    draftStatuses, draftPaymentStatuses,
    savingOrderId, creatingInvoiceOrderId,
    getDraftStatus, getDraftPaymentStatus,
    onDraftStatusChange, onDraftPaymentChange,
    onSaveOrder, onQuickAction, onDeleteOrder,
    onCreateInvoice, onOpenInvoice,
    getDayBadgeLabel, getDayBadgeCompactLabel, getDayBadgeTone,
    goToPrevious, goToNext, handleToggleClosedDate,
    timelineColumns, startHour, endHour, startOffsetMinutes, positionedOrders,
    hoursLength, hours
  };
}
