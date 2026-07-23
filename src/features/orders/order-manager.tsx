"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, FileText } from "lucide-react";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { useOrders } from "@/hooks/use-orders";
import { useMessageTemplates } from "@/hooks/use-message-templates";
import { PageHeader } from "@/components/shared/page-header";
import { SkeletonCard } from "@/components/shared/loading";

import { ORDER_STATUS_BY_MODE, PAYMENT_FILTER_OPTIONS } from "@/lib/constants/orders";
import { renderTemplate } from "@/lib/messages";
import { formatDate, formatCurrency } from "@/lib/format";
import type { BusinessMode } from "@/types/business";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

import { OrderBoard } from "./components/order-board";
import { OrderFormSheet } from "./components/order-form-sheet";
import { ConfirmFinishOrderDialog } from "./components/confirm-finish-order-dialog";
import { SmartPaymentDialog } from "./components/smart-payment-dialog";
import { ShiftReportDialog } from "./components/shift-report-dialog";

type FilterValue = "ALL" | OrderStatus;
type PaymentFilterValue = "ALL" | PaymentStatus;

export function OrderManager() {
 const toast = useToast();
 const searchParams = useSearchParams();
 const { business, subscriptionForCurrentBusiness } = useAppData();
 const { orders, isLoading, updateOrder, deleteOrder, canCreateOrder } = useOrders();
 const { messageTemplates } = useMessageTemplates();
 
 const [query, setQuery] = useState("");
 const [statusFilter, setStatusFilter] = useState<FilterValue>("ALL");
 const [paymentFilter, setPaymentFilter] = useState<PaymentFilterValue>("ALL");
 const [mode, setMode] = useState<BusinessMode>(business.mode);
 
 const [isFormOpen, setIsFormOpen] = useState(false);
 const [isShiftReportOpen, setIsShiftReportOpen] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);
 const [finishingOrder, setFinishingOrder] = useState<Order | null>(null);
 const [smartPaymentOrder, setSmartPaymentOrder] = useState<{ order: Order; nextStatus: OrderStatus } | null>(null);

 useEffect(() => {
  if (searchParams && searchParams.get("action") === "new-order") {
   setIsFormOpen(true);
  }
 }, [searchParams]);

 const statusOptions = ORDER_STATUS_BY_MODE[mode] ?? ORDER_STATUS_BY_MODE["BOOKING_SERVICE"];

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
 const activeBookingCount = filteredOrders.filter((order) => order.mode === "BOOKING_SERVICE" && order.status !== "BATAL" && order.status !== "SELESAI").length;
 const completedOrderCount = filteredOrders.filter((order) => order.status === "SELESAI").length;

 function onStatusChangeRequest(order: Order, nextStatus: OrderStatus) {
  if (nextStatus === "SELESAI" && order.status !== "SELESAI") {
   setFinishingOrder(order);
  } else if (nextStatus === "CONFIRMED") {
   const isMissingSchedule = !order.scheduledDate || !order.scheduledTime;
   const isMissingResource = business.operationalModel === "RESOURCE_BOOKING" && business.usesResources && (!order.resourceId || order.resourceId === "ANY");
   
   if (isMissingSchedule || isMissingResource) {
    toast.error("Harap lengkapi Jadwal & Unit/PC terlebih dahulu sebelum mengunci jadwal!");
    setEditingId(order.id);
    setIsFormOpen(true);
    return;
   }

   if (order.paymentStatus === "UNPAID" || !order.paymentStatus) {
    setSmartPaymentOrder({ order, nextStatus });
   } else {
    void handleUpdateOrderStatus(order, nextStatus);
   }
  } else if ((nextStatus === "DIPROSES" || nextStatus === "DEAL") && (order.paymentStatus === "UNPAID" || !order.paymentStatus)) {
   setSmartPaymentOrder({ order, nextStatus });
  } else {
   void handleUpdateOrderStatus(order, nextStatus);
  }
 }

 async function handleUpdateOrderStatus(order: Order, nextStatus: OrderStatus, nextPaymentStatus?: PaymentStatus, dpAmount?: number, totalAmount?: number, paymentMethod?: "CASH" | "NON_CASH") {
  try {
   let finalStatus = nextStatus;
   if (nextPaymentStatus === "PAID") {
    finalStatus = "SELESAI";
   }

   const payload: Partial<Order> & { paymentMethod?: "CASH" | "NON_CASH" } = { status: finalStatus };
   if (nextPaymentStatus) payload.paymentStatus = nextPaymentStatus;
   if (dpAmount !== undefined) payload.dpAmount = dpAmount;
   if (totalAmount !== undefined) payload.totalAmount = totalAmount;
   if (paymentMethod !== undefined) payload.paymentMethod = paymentMethod;

   await updateOrder(order.id, payload);
   toast.success(finalStatus === "SELESAI" ? "Pesanan lunas dan diselesaikan!" : "Status order berhasil diperbarui!");
  } catch (err) {
   toast.error("Gagal memperbarui status", err instanceof Error ? err.message : "");
  }
 }

 async function handleDeleteOrder(order: Order) {
  try {
   await deleteOrder(order.id);
   toast.success("Pesanan berhasil dihapus!");
  } catch (err) {
   toast.error("Gagal menghapus pesanan", err instanceof Error ? err.message : "");
  }
 }

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

  const values = {
   customer_name: order.customerName,
   business_name: business.name,
   order_title: order.title,
   scheduled_date: order.scheduledDate ? formatDate(order.scheduledDate) : "",
   scheduled_time: order.scheduledTime ?? "",
   total_amount: order.totalAmount ? formatCurrency(order.totalAmount) : "0",
   dp_amount: order.dpAmount ? formatCurrency(order.dpAmount) : "0",
  };

  let defaultMsg = `Halo ${order.customerName}, saya follow-up untuk ${order.title}.`;
  
  // Smart Defaults (Killer Feature Free Plan)
  if (category === "PEMBAYARAN") {
   if (order.paymentStatus === "UNPAID") {
     defaultMsg = `Halo Kak ${order.customerName},\n\nPesanan "${order.title}" sudah kami terima dengan total tagihan *${values.total_amount}*.\nMohon segera selesaikan pembayaran atau uang muka (DP) agar pesanan dapat segera diproses ya Kak.\n\nTerima kasih, ${business.name}.`;
   } else if (order.paymentStatus === "DP_PAID") {
     defaultMsg = `Halo Kak ${order.customerName},\n\nPembayaran DP sebesar *${values.dp_amount}* untuk pesanan "${order.title}" sudah kami terima.\nSisa tagihan yang perlu dilunasi adalah *${formatCurrency((order.totalAmount ?? 0) - (order.dpAmount ?? 0))}*.\n\nTerima kasih, ${business.name}.`;
   }
  } else if (category === "REVIEW") {
    defaultMsg = `Halo Kak ${order.customerName},\n\nPesanan "${order.title}" sudah SELESAI!\nTerima kasih banyak telah mempercayakan layanan kami. 🙏\n\nJika Kakak berkenan, mohon berikan ulasan singkat mengenai layanan kami ya.\n\nSalam hangat, ${business.name}.`;
  } else if (category === "BOOKING_ORDER") {
    defaultMsg = `Halo Kak ${order.customerName},\n\nJadwal untuk "${order.title}" telah dikonfirmasi pada:\n📅 Tanggal: ${values.scheduled_date}\n⏰ Jam: ${values.scheduled_time}\n\nKami tunggu kedatangannya ya Kak!\n\nTerima kasih, ${business.name}.`;
  } else if (order.status === "DIPROSES") {
    defaultMsg = `Halo Kak ${order.customerName},\n\nSedikit info mengenai pesanan "${order.title}", saat ini sedang dalam status *DIPROSES*.\nKakak bisa melihat perkembangan pesanan (Live Tracker) pada link Nota yang telah kami berikan sebelumnya.\n\nTerima kasih, ${business.name}.`;
  }

  if (!template) {
   return { label, message: defaultMsg };
  }

  const rendered = renderTemplate(template.content, values);
  return { label, message: rendered || defaultMsg };
 }

 function handleEditOrder(order: Order) {
  setEditingId(order.id);
  setMode(order.mode);
  setIsFormOpen(true);
 }

 function handleCreateNew() {
  setEditingId(null);
  setMode(business.mode);
  setIsFormOpen(true);
 }

 return (
  <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8" id="order-manager">
   {/* SECTION 1: HERO HEADER */}
   <PageHeader
    variant="default"
    className="px-0 bg-transparent border-none sm:px-0 py-0"
    title="Daftar Order & Reservasi"
    description="Pantau antrean pesanan masuk, ketersediaan unit slot operasional, status pembayaran uang muka (DP), dan kelola alur kerja dengan mudah."
    action={
     <div className="flex flex-wrap items-center gap-3 xl:shrink-0">
      <span className="text-[var(--color-text-secondary)] px-4 py-1.5 text-sm font-semibold flex items-center">
       {filteredOrders.length} Order Aktif
      </span>
      {subscriptionForCurrentBusiness?.planCode !== "FREE_TRIAL" && (
       <Button
        type="button"
        variant="secondary"
        onClick={() => setIsShiftReportOpen(true)}
        className="shadow-sm font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 hover:text-amber-900 border-amber-200"
       >
        <FileText className="mr-2 h-5 w-5" />
        Tutup Shift
       </Button>
      )}
      <Button
       type="button"
       variant="secondary"
       onClick={handleCreateNew}
       disabled={!canCreateOrder}
       className="shadow-sm font-bold"
      >
       <Plus className="mr-2 h-5 w-5" />
       Tambah Order
      </Button>
     </div>
    }
   />

   <section className="animate-fade-up-delay-1 pb-6 border-b border-[var(--color-border)]">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
     <div className="space-y-4">
      <div className="relative">
       <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
       <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari nama customer, detail order, atau nomor WA..."
        className="pl-9 bg-[var(--color-surface)] border-[var(--color-border)]"
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
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status Pesanan</span>
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

     <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col justify-between rounded-md">
       <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Order Berjalan</p>
       <p className="mt-1 text-2xl font-black text-[var(--color-text)] tracking-tight">{activeBookingCount}</p>
       <p className="text-[9px] text-[var(--color-text-muted)] font-medium">Sedang diproses</p>
      </div>
      <div className="border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-4 flex flex-col justify-between rounded-md">
       <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-warning-text)]">Belum Bayar</p>
       <p className="mt-1 text-2xl font-black text-[var(--color-text)] tracking-tight">{unpaidOrderCount}</p>
       <p className="text-[9px] text-[var(--color-warning-text)] font-semibold">Perlu penagihan</p>
      </div>
      <div className="border border-[var(--color-success-border)] bg-[var(--color-success-surface)] p-4 flex flex-col justify-between rounded-md">
       <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-success-text)]">Selesai</p>
       <p className="mt-1 text-2xl font-black text-[var(--color-success-text)] tracking-tight">{completedOrderCount}</p>
       <p className="text-[9px] text-[var(--color-success-text)] font-semibold">Transaksi beres</p>
      </div>
     </div>
    </div>
   </section>

   {/* SECTION 3: KANBAN BOARD */}
   <section className="animate-fade-up-delay-2">
    {isLoading ? (
     <div className="grid gap-4 md:grid-cols-3">
      <SkeletonCard className="h-64" />
      <SkeletonCard className="h-64" />
      <SkeletonCard className="h-64" />
     </div>
    ) : (
     <OrderBoard
      orders={filteredOrders}
      statusOptions={statusOptions}
      onUpdateStatus={onStatusChangeRequest}
      onEdit={handleEditOrder}
      onDelete={handleDeleteOrder}
      getWhatsAppConfig={getWhatsAppButtonConfig}
      isResourceBooking={business.operationalModel === "RESOURCE_BOOKING"}
      businessSlug={business.slug}
     />
    )}
   </section>

   {/* SECTION 4: SLIDE OVER FORM */}
   <OrderFormSheet
    isOpen={isFormOpen}
    onClose={() => setIsFormOpen(false)}
    editingId={editingId}
   />

   {/* SECTION 5: CONFIRMATION DIALOG */}
   <ConfirmFinishOrderDialog
    isOpen={!!finishingOrder}
    onClose={() => setFinishingOrder(null)}
    order={finishingOrder}
    onConfirm={handleUpdateOrderStatus}
   />

   {/* SECTION 6: SMART PAYMENT DIALOG */}
   <SmartPaymentDialog
    isOpen={!!smartPaymentOrder}
    onClose={() => setSmartPaymentOrder(null)}
    order={smartPaymentOrder?.order ?? null}
    nextStatus={smartPaymentOrder?.nextStatus ?? null}
    onConfirm={handleUpdateOrderStatus}
   />

   {/* SECTION 7: SHIFT REPORT DIALOG */}
   <ShiftReportDialog
    isOpen={isShiftReportOpen}
    onClose={() => setIsShiftReportOpen(false)}
    onSuccess={() => window.location.reload()}
   />
  </main>
 );
}
