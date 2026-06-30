"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  ChevronRight,
  Copy,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { ROUTES } from "@/lib/routes";
import { CustomerStatusBadge, OrderStatusBadge } from "@/components/shared/status-badge";
import { ORDER_STATUS_BY_MODE } from "@/lib/constants/orders";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardCalendar } from "@/features/dashboard/dashboard-calendar";
import { getDashboardSummary, toDateKey } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";
import { renderTemplate } from "@/lib/messages";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/cn";

type TaskFilter = "ALL" | "BILLING" | "FOLLOW_UP" | "REVIEW";

const taskFilterOptions: Array<{ value: TaskFilter; label: string }> = [
  { value: "ALL", label: "Semua Tugas" },
  { value: "BILLING", label: "Tagihan & DP" },
  { value: "FOLLOW_UP", label: "Follow-Up" },
  { value: "REVIEW", label: "Minta Ulasan" },
];

export function DashboardPage() {
  const toast = useToast();
  const { business, orders, customers, currentUser, messageTemplates, updateOrder, updateCustomer, currentOrderUsage } = useAppData();
  const { todayOrders, unpaidOrders, revenue } = getDashboardSummary(orders, customers);
  const today = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("ALL");
  const actionSectionRef = useRef<HTMLElement | null>(null);
  const previousSelectedDateRef = useRef(selectedDate);

  async function handleMarkOrderPaid(orderId: string, type: "DP" | "FULL") {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      const nextPaymentStatus = type === "DP" ? "DP_PAID" : "PAID";
      const nextStatus =
        order.mode === "BOOKING_SERVICE" && type === "DP" && order.status === "WAITING_DP"
          ? "CONFIRMED"
          : order.status;

      updateOrder(orderId, {
        customerName: order.customerName,
        whatsappNumber: order.whatsappNumber,
        title: order.title,
        mode: order.mode,
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        scheduledDate: order.scheduledDate || undefined,
        scheduledTime: order.scheduledTime || undefined,
        bookingDurationMinutes: order.bookingDurationMinutes || undefined,
        resourceId: order.resourceId || undefined,
        resourceNameSnapshot: order.resourceNameSnapshot || undefined,
        totalAmount: order.totalAmount || undefined,
        dpAmount: order.dpAmount || undefined,
        notes: order.notes || undefined,
      });
      toast.success("Status pembayaran berhasil diperbarui!");
    } catch (err) {
      toast.error("Gagal memperbarui status pembayaran", err instanceof Error ? err.message : "");
    }
  }

  async function handleShiftStatus(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

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

  async function handleMarkCustomerDone(customerId: string) {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    try {
      updateCustomer(customerId, {
        name: customer.name,
        whatsappNumber: customer.whatsappNumber,
        status: "DONE",
        source: customer.source || undefined,
        notes: customer.notes || undefined,
        lastInteractionAt: new Date().toISOString(),
        lastOrderSummary: customer.lastOrderSummary || undefined,
      });
      toast.success(`Customer ${customer.name} ditandai selesai di-follow up!`);
    } catch (err) {
      toast.error("Gagal mengupdate status customer", err instanceof Error ? err.message : "");
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

  const filteredActionItems = useMemo(() => {
    function getMessageFromTemplate(
      category: string,
      customValues: Record<string, string>,
      defaultText: string
    ) {
      const template =
        messageTemplates.find(
          (item) => item.category === category && item.businessId === business.id
        ) ?? messageTemplates.find((item) => item.category === category);

      if (!template) return defaultText;

      const values = { business_name: business.name, ...customValues };
      return renderTemplate(template.content, values) || defaultText;
    }

    const unpaidItems = orders
      .filter(
        (order) =>
          (order.scheduledDate === selectedDate ||
            (!order.scheduledDate &&
              toDateKey(new Date(order.createdAt)) === selectedDate)) &&
          order.paymentStatus !== "PAID" &&
          order.status !== "BATAL"
      )
      .map((order) => {
        const isWaitingDp = order.status === "WAITING_DP";
        const message = getMessageFromTemplate(
          "PEMBAYARAN",
          {
            customer_name: order.customerName,
            order_title: order.title,
            dp_amount: order.dpAmount ? formatCurrency(order.dpAmount) : "0",
            total_amount: order.totalAmount ? formatCurrency(order.totalAmount) : "0",
          },
          isWaitingDp
            ? `Halo ${order.customerName}, mau ingatkan untuk DP ${order.title} sebesar ${formatCurrency(order.dpAmount ?? 0)} ya.`
            : `Halo ${order.customerName}, mau ingatkan untuk pelunasan ${order.title} sebesar ${formatCurrency(order.totalAmount ?? 0)} ya.`
        );
        return {
          type: "order" as const,
          id: order.id,
          title: order.customerName,
          reason: isWaitingDp ? "Menunggu DP (Booking)" : "Tagihan belum lunas",
          status: order.status,
          due: order.scheduledDate
            ? `${formatDate(order.scheduledDate)}${order.scheduledTime ? ` · ${order.scheduledTime}` : ""}`
            : formatDateTime(order.createdAt),
          phone: order.whatsappNumber,
          message,
        };
      });

    const staleItems = customers
      .filter((customer) => {
        if (customer.status !== "NEED_FOLLOW_UP" && customer.status !== "NEW") return false;
        const lastDateStr = customer.lastInteractionAt ?? customer.createdAt;
        const staleDate = new Date(new Date(lastDateStr).getTime() + 24 * 60 * 60 * 1000);
        return toDateKey(staleDate) === selectedDate;
      })
      .map((customer) => ({
        type: "customer" as const,
        id: customer.id,
        title: customer.name,
        reason: "Calon customer didiamkan > 24 jam",
        status: customer.status,
        due: customer.lastInteractionAt
          ? formatDateTime(customer.lastInteractionAt)
          : formatDateTime(customer.createdAt),
        phone: customer.whatsappNumber,
        message: getMessageFromTemplate(
          "FOLLOW_UP",
          {
            customer_name: customer.name,
            order_title: customer.lastOrderSummary || "order",
          },
          `Halo ${customer.name}, saya follow-up lagi ya untuk rencana ${customer.lastOrderSummary || "order"}.`
        ),
      }));

    const reviewItems = orders
      .filter((order) => {
        if (order.status !== "SELESAI") return false;
        const askDate = new Date(new Date(order.updatedAt).getTime() + 24 * 60 * 60 * 1000);
        return toDateKey(askDate) === selectedDate;
      })
      .map((order) => ({
        type: "order" as const,
        id: order.id,
        title: order.customerName,
        reason: "Minta ulasan (Order selesai)",
        status: order.status,
        due: formatDateTime(order.updatedAt),
        phone: order.whatsappNumber,
        message: getMessageFromTemplate(
          "REVIEW",
          { customer_name: order.customerName, order_title: order.title },
          `Terima kasih ya ${order.customerName}, order ${order.title} sudah selesai. Jika berkenan, mohon ulasannya ya!`
        ),
      }));

    const items = [];
    if (activeFilter === "ALL" || activeFilter === "BILLING") items.push(...unpaidItems);
    if (activeFilter === "ALL" || activeFilter === "FOLLOW_UP") items.push(...staleItems);
    if (activeFilter === "ALL" || activeFilter === "REVIEW") items.push(...reviewItems);
    return items.slice(0, 4);
  }, [orders, customers, selectedDate, business, messageTemplates, activeFilter]);

  useEffect(() => {
    if (previousSelectedDateRef.current !== selectedDate) {
      actionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      previousSelectedDateRef.current = selectedDate;
    }
  }, [selectedDate]);

  // Stats data
  const stats = [
    {
      label: "Order Hari Ini",
      value: String(todayOrders.length),
      icon: CalendarClock,
      tone: "info" as const,
    },
    {
      label: "Belum Bayar",
      value: String(unpaidOrders.length),
      icon: AlertCircle,
      tone: "warning" as const,
    },
    {
      label: "Omzet",
      value: formatCurrency(revenue),
      icon: TrendingUp,
      tone: "success" as const,
    },
  ];

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">

      {/* ── WELCOME HERO BANNER ─────────────────────────── */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white">
          {/* Background decorative glows */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-accent)] opacity-15 blur-3xl animate-pulse" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-30 blur-3xl" />
          
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            {/* Left: greeting */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
                <Sparkles className="h-3 w-3 animate-pulse" />
                {formatDate(today)}
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Selamat Datang Kembali, {currentUser?.name ?? business.ownerName}
              </h1>
              <p className="max-w-xl text-sm text-white/70">
                Berikut adalah rangkuman aktivitas operasional, penagihan, dan tugas penting bisnis Anda hari ini.
              </p>
              
              <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-white/[0.06] p-4.5 border border-white/[0.08] backdrop-blur-md max-w-sm">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white/80">📈 Kuota Pemesanan Berjalan</span>
                  <span className="text-[var(--color-gold-300)]">{currentOrderUsage.used} / {currentOrderUsage.limit} Booking</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div 
                    className="absolute bottom-0 left-0 top-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-300"
                    style={{ width: `${Math.min(100, (currentOrderUsage.used / currentOrderUsage.limit) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/50">
                  Kuota diperbarui otomatis pada {formatDate(currentOrderUsage.expiresAt)}.
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap gap-2.5 xl:shrink-0">
              <LinkButton href={ROUTES.orders} size="sm" className="shadow-sm">
                Tambah Order
              </LinkButton>
              <LinkButton href={ROUTES.customers} variant="secondary" size="sm" className="bg-white/10 text-white border-white/[0.15] hover:bg-white/20">
                Tambah Customer
              </LinkButton>
              <LinkButton href={ROUTES.messages} variant="secondary" size="sm" className="bg-white/10 text-white border-white/[0.15] hover:bg-white/20">
                Pesan Cepat
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* ── STANDALONE METRICS GRID ──────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-3 animate-fade-up-delay-1">
        {stats.map((stat) => {
          const Icon = stat.icon;
          
          // Custom color mappings based on tone
          let iconBg = "";
          let borderHover = "";
          let accentBg = "";
          if (stat.tone === "info") {
            iconBg = "bg-blue-50/80 text-[var(--color-info)] border-blue-100";
            borderHover = "hover:border-blue-500/30 hover:shadow-[0_0_12px_rgba(55,88,145,0.08)]";
            accentBg = "bg-gradient-to-tr from-blue-50/10 to-transparent";
          } else if (stat.tone === "warning") {
            iconBg = "bg-amber-50/80 text-[var(--color-warning)] border-amber-100";
            borderHover = "hover:border-amber-500/30 hover:shadow-[0_0_12px_rgba(218,159,78,0.08)]";
            accentBg = "bg-gradient-to-tr from-amber-50/10 to-transparent";
          } else if (stat.tone === "success") {
            iconBg = "bg-emerald-50/80 text-[var(--color-success)] border-emerald-100";
            borderHover = "hover:border-emerald-500/30 hover:shadow-[0_0_12px_rgba(30,122,82,0.08)]";
            accentBg = "bg-gradient-to-tr from-emerald-50/10 to-transparent";
          }

          return (
            <Card key={stat.label} className={cn("transition-all duration-300 hover:-translate-y-0.5 border-[var(--color-border)]", borderHover)}>
              <CardBody className={cn("p-5 flex items-center justify-between gap-4 relative overflow-hidden", accentBg)}>
                <div className="space-y-1.5 z-10 flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{stat.label}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--color-text)] tracking-tight whitespace-nowrap overflow-x-auto no-scrollbar">{stat.value}</p>
                </div>
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border z-10 shadow-sm", iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="absolute -right-6 -bottom-6 h-12 w-12 rounded-full bg-slate-500/[0.01] pointer-events-none animate-pulse" />
              </CardBody>
            </Card>
          );
        })}
      </section>

      {/* ── CALENDAR ──────────────────────────────────── */}
      <DashboardCalendar
        business={business}
        orders={orders}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* ── ACTION ITEMS ──────────────────────────────── */}
      <section ref={actionSectionRef} className="animate-fade-up-delay-2 scroll-mt-20">
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">Perlu Diurus</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  Aksi penting maksimal 2 klik — fokus ke tugas yang paling mendesak hari ini.
                </p>
              </div>
              {filteredActionItems.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {filteredActionItems.length} Mendadak
                </span>
              )}
            </div>

            {/* Filter chips */}
            <FilterChipGroup
              options={taskFilterOptions}
              value={activeFilter}
              onChange={setActiveFilter}
              size="sm"
            />

            {/* Items list */}
            <div className="space-y-3">
              {filteredActionItems.length ? (
                filteredActionItems.map((item) => {
                  // Categorized left border stripes
                  let leftBorder = "border-l-4 border-l-slate-300";
                  if (item.reason.toLowerCase().includes("pembayaran") || item.reason.toLowerCase().includes("tagihan") || item.reason.toLowerCase().includes("dp")) {
                    leftBorder = "border-l-4 border-l-amber-500";
                  } else if (item.reason.toLowerCase().includes("ulasan") || item.reason.toLowerCase().includes("selesai")) {
                    leftBorder = "border-l-4 border-l-emerald-500";
                  } else if (item.reason.toLowerCase().includes("didiamkan") || item.reason.toLowerCase().includes("follow")) {
                    leftBorder = "border-l-4 border-l-blue-500";
                  }

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex flex-col gap-4 rounded-2xl",
                        "border border-[var(--color-border)]",
                        "bg-[var(--color-surface)] px-5 py-4",
                        "transition-all duration-[var(--transition-fast)]",
                        "hover:border-[var(--color-border-strong)] hover:shadow-sm",
                        "md:flex-row md:items-center md:justify-between",
                        leftBorder
                      )}
                    >
                      {/* Info */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-sm text-[var(--color-text)]">{item.title}</p>
                          {item.type === "order" ? (
                            <OrderStatusBadge status={item.status} />
                          ) : (
                            <CustomerStatusBadge status={item.status} />
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] font-medium">{item.reason}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">
                          Jatuh tempo: {item.due}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 shrink-0 items-center">
                        <WhatsAppButton
                          phoneNumber={item.phone}
                          message={item.message}
                          label="Hubungi via WA"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleCopyMessage(item.message)}
                          title="Salin draf pesan WA"
                          className="h-9 px-3 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {item.type === "order" && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const isWaitingDp = item.status === "WAITING_DP";
                                void handleMarkOrderPaid(item.id, isWaitingDp ? "DP" : "FULL");
                              }}
                              className="h-9 px-3.5 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold"
                            >
                              {item.status === "WAITING_DP" ? "DP Lunas" : "Bayar Lunas"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => void handleShiftStatus(item.id)}
                              title="Pindahkan status ke tahap berikutnya"
                              className="h-9 px-3.5 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold"
                            >
                              Geser Status
                            </Button>
                          </>
                        )}
                        {item.type === "customer" && (
                          <>
                            <LinkButton href={ROUTES.customers} variant="secondary" size="sm" className="h-9 px-3.5 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold">
                              Detail Customer
                            </LinkButton>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => void handleMarkCustomerDone(item.id)}
                              title="Tandai follow-up selesai"
                              className="h-9 px-3.5 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold"
                            >
                              Tandai Beres
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Semua beres hari ini"
                  description="Belum ada order, booking, atau follow-up untuk tanggal yang dipilih."
                  size="sm"
                />
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      {/* ── QUICK LINKS ───────────────────────────────── */}
      <section className="animate-fade-up-delay-3 flex flex-wrap gap-2">
        <LinkButton href={ROUTES.orders} variant="secondary" size="sm" className="border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] rounded-xl font-bold">
          Lihat Semua Order
          <ChevronRight className="h-4 w-4" />
        </LinkButton>
        <LinkButton href={ROUTES.reports} variant="secondary" size="sm" className="border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] rounded-xl font-bold">
          Lihat Laporan
          <ChevronRight className="h-4 w-4" />
        </LinkButton>
      </section>
    </main>
  );
}
