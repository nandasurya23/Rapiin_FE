"use client";

import { useState, useMemo } from "react";
import { Plus, Search, ClipboardList } from "lucide-react";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { useOrders } from "@/hooks/use-orders";

import { ORDER_STATUS_BY_MODE, PAYMENT_FILTER_OPTIONS } from "@/lib/constants/orders";
import { renderTemplate } from "@/lib/messages";
import { formatDate, formatCurrency } from "@/lib/format";
import type { BusinessMode } from "@/types/business";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

import { OrderBoard } from "./components/order-board";
import { OrderFormSheet } from "./components/order-form-sheet";
import { ConfirmFinishOrderDialog } from "./components/confirm-finish-order-dialog";

type FilterValue = "ALL" | OrderStatus;
type PaymentFilterValue = "ALL" | PaymentStatus;

export function OrderManager() {
  const toast = useToast();
  const { business, canCreateOrder, messageTemplates } = useAppData();
  const { orders, updateOrder } = useOrders();
  
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterValue>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterValue>("ALL");
  const [mode, setMode] = useState<BusinessMode>(business.mode);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [finishingOrder, setFinishingOrder] = useState<Order | null>(null);

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
    } else {
      void handleUpdateOrderStatus(order, nextStatus);
    }
  }

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
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-accent)] opacity-15 blur-3xl animate-pulse" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-30 blur-3xl" />
          
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
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

            <div className="flex flex-wrap items-center gap-3 xl:shrink-0">
              <Badge tone="info" className="bg-white/10 text-white border-white/20 px-4 py-1.5 text-xs font-bold h-12 flex items-center">
                {filteredOrders.length} Order Aktif
              </Badge>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCreateNew}
                disabled={!canCreateOrder}
                className="h-12 px-6 rounded-2xl font-bold shadow-sm"
              >
                <Plus className="mr-2 h-5 w-5" />
                Tambah Order
              </Button>
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

      {/* SECTION 3: KANBAN BOARD */}
      <section className="animate-fade-up-delay-2">
        <OrderBoard
          orders={filteredOrders}
          statusOptions={statusOptions}
          onUpdateStatus={onStatusChangeRequest}
          onEdit={handleEditOrder}
          getWhatsAppConfig={getWhatsAppButtonConfig}
        />
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
    </main>
  );
}
