"use client";

import { useState, useTransition } from "react";
import {
 CalendarClock,
 ChevronRight,
 TrendingUp,
 AlertCircle,
 CheckCircle2,
 Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { LinkButton } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardCalendar } from "@/features/dashboard/dashboard-calendar";
import { getDashboardSummary, toDateKey } from "@/lib/domain";
import { cn } from "@/lib/cn";
import { useAppData } from "@/components/providers/app-data-provider";
import { useToast } from "@/components/ui/toast-provider";
import { useOrders } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
import { useMessageTemplates } from "@/hooks/use-message-templates";
import { useDashboardActions } from "@/hooks/use-dashboard-actions";
import { ActionItemCard } from "@/features/dashboard/components/action-item-card";
import { SkeletonCard } from "@/components/shared/loading";

export function DashboardPage() {
 const toast = useToast();
 const { business, currentUser, subscriptionForCurrentBusiness } = useAppData();
 const { orders, updateOrder } = useOrders();
 const { customers, updateCustomer, currentBusinessUsage } = useCustomers();
 const { messageTemplates } = useMessageTemplates();

 const isNearCustomerLimit = currentBusinessUsage 
  && currentBusinessUsage.used >= currentBusinessUsage.limit - 5;
 const { todayOrders, unpaidOrders, revenue } = getDashboardSummary(orders, customers);
 const today = toDateKey(new Date());
 const [selectedDate, setSelectedDate] = useState(today);
 const [isPendingTransition, startTransition] = useTransition();
 const [isTransitioning, setIsTransitioning] = useState(false);

 const filteredActionItems = useDashboardActions({
  orders,
  customers,
  selectedDate,
  business,
  messageTemplates,
 });

 async function handleMarkOrderPaid(orderId: string, type: "DP" | "FULL") {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  try {
   const nextPaymentStatus = type === "DP" ? "DP_PAID" : "PAID";
   const nextStatus =
    order.mode === "BOOKING_SERVICE" && type === "DP" && order.status === "WAITING_DP"
     ? "CONFIRMED"
     : order.status;

   await updateOrder(orderId, {
    status: nextStatus,
    paymentStatus: nextPaymentStatus,
   });
   toast.success("Status pembayaran berhasil diperbarui!");
  } catch (err) {
   toast.error("Gagal memperbarui status pembayaran", err instanceof Error ? err.message : "");
  }
 }

 async function handleMarkOrderDone(orderId: string) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  try {
   await updateOrder(order.id, {
    status: "SELESAI",
   });
   toast.success("Order telah diselesaikan dan dirapikan!");
  } catch (err) {
   toast.error("Gagal mengubah status", err instanceof Error ? err.message : "");
  }
 }

 async function handleMarkCustomerDone(customerId: string) {
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) return;

  try {
   await updateCustomer(customerId, {
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

 function handleDateSelect(date: string) {
  setIsTransitioning(true);
  startTransition(() => {
   setSelectedDate(date);
   setTimeout(() => setIsTransitioning(false), 200);
  });
 }

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
   {isNearCustomerLimit && (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4.5 text-xs sm:text-sm text-[var(--color-text)] flex items-start gap-3.5 shadow-sm animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
     <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
     <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" aria-hidden="true" />
     <div className="flex-1 space-y-1">
      <p className="font-bold flex items-center gap-2">
       <span>Batas Kapasitas Pelanggan Hampir Penuh!</span>
       <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">
        {currentBusinessUsage.used} / {currentBusinessUsage.limit} Customer
       </span>
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs">
       Kontak customer terdaftar untuk paket <strong>{subscriptionForCurrentBusiness?.planCode === "FREE_TRIAL" ? "Free Trial" : "Pro"}</strong> Anda tersisa <strong>{currentBusinessUsage.limit - currentBusinessUsage.used}</strong> slot lagi. 
       Segera ajukan upgrade plan Anda agar pendaftaran pelanggan baru dan transaksi tidak terhambat.
      </p>
      <div className="pt-2">
       <LinkButton href={ROUTES.plan(business.slug)} size="sm" variant="accent" className="border-none font-bold text-xs px-4">
        Upgrade Plan Sekarang &rarr;
       </LinkButton>
      </div>
     </div>
    </div>
   )}

   {/* ── WELCOME HERO BANNER ─────────────────────────── */}
   <PageHeader
    variant="default"
    className="px-0 bg-transparent border-none sm:px-0 py-0 pb-2"
    title={`Selamat Datang, ${currentUser?.name ?? business.ownerName}`}
    description="Pantau performa, pesanan, dan kelancaran operasional bisnis Anda hari ini."
    badge={
     <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-surface)] border border-[var(--color-primary)]/20 px-3 py-1 text-xs font-semibold text-[var(--color-primary)] mb-1">
      <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
      <span>{business.name}</span>
     </div>
    }
   />

   {/* ── PROACTIVE BUSINESS INSIGHT ───────────────────── */}
   {filteredActionItems.length > 0 && (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-primary)]/20 bg-gradient-to-r from-[var(--color-primary-surface)] to-[var(--color-surface)] p-4 text-xs sm:text-sm text-[var(--color-text)] flex items-start gap-4 shadow-sm">
     <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-primary)]" />
     <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
      <Sparkles className="h-4 w-4" aria-hidden="true" />
     </div>
     <div className="flex-1 space-y-1">
      <p className="font-bold text-[var(--color-primary)] text-sm">
       Rekomendasi Bisnis Hari Ini
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
       Ada <strong className="text-[var(--color-text)]">{filteredActionItems.length} tindakan penting</strong> yang perlu di-follow up (tagihan/pembayaran). Mengingatkan pelanggan tepat waktu dapat meningkatkan kelancaran kas.
      </p>
     </div>
    </div>
   )}

   {/* ── STANDALONE METRICS GRID ──────────────────────── */}
   <section className="grid gap-4 sm:grid-cols-3 animate-fade-up-delay-1">
    {stats.map((stat) => {
     const Icon = stat.icon;
     return (
      <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md p-5 transition-all hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)]">
       {/* Background accent glow */}
       <div className={cn(
        "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40",
        stat.tone === "info" ? "bg-[var(--color-primary)]" : stat.tone === "warning" ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"
       )} />
       
       <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
         <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{stat.label}</p>
         <p className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight whitespace-nowrap overflow-x-auto no-scrollbar">{stat.value}</p>
        </div>
        <div className={cn(
         "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-sm",
         stat.tone === "info" ? "bg-[var(--color-primary-surface)] text-[var(--color-primary)] border-[var(--color-primary)]/20" : 
         stat.tone === "warning" ? "bg-[var(--color-warning-surface)] text-[var(--color-warning)] border-[var(--color-warning)]/20" : 
         "bg-[var(--color-success-surface)] text-[var(--color-success)] border-[var(--color-success)]/20"
        )}>
         <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
       </div>
      </div>
     );
    })}
   </section>

   {/* ── CALENDAR ──────────────────────────────────── */}
   {business.mode === "BOOKING_SERVICE" && (
    <DashboardCalendar
     business={business}
     orders={orders}
     selectedDate={selectedDate}
     onDateSelect={handleDateSelect}
    />
   )}

   {/* ── ACTION ITEMS ──────────────────────────────── */}
   <section className="animate-fade-up-delay-2">
    <div className="space-y-4">
     <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-3">
      <div>
       <h2 className="text-lg font-bold text-[var(--color-text)]">Perlu Diurus</h2>
       <p className="text-sm text-[var(--color-text-secondary)]">Aksi penting dalam jangkauan cepat.</p>
      </div>
      {filteredActionItems.length > 0 && !isTransitioning && !isPendingTransition && (
       <span className="inline-flex items-center rounded-full bg-[var(--color-surface-elevated)] px-2.5 py-1 text-xs font-semibold">
        {filteredActionItems.length} Mendadak
       </span>
      )}
     </div>

     {(isTransitioning || isPendingTransition) ? (
      <div className="space-y-3 animate-in fade-in duration-200">
        <SkeletonCard />
        <SkeletonCard />
      </div>
     ) : (
      <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs [&>*:first-child]:rounded-t-[calc(1rem-1px)] [&>*:last-child]:rounded-b-[calc(1rem-1px)] animate-in fade-in duration-300">
       {filteredActionItems.length ? (
        filteredActionItems.map((item) => (
         <ActionItemCard
          key={item.id}
          item={item}
          businessSlug={business.slug}
          onCopyMessage={handleCopyMessage}
          onMarkOrderPaid={handleMarkOrderPaid}
          onMarkOrderDone={handleMarkOrderDone}
          onMarkCustomerDone={handleMarkCustomerDone}
         />
        ))
       ) : (
        <div className="py-8">
         <EmptyState
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          title="Semua beres hari ini"
          description="Belum ada order, booking, atau follow-up untuk tanggal yang dipilih."
          size="sm"
         />
        </div>
       )}
      </div>
     )}
    </div>
   </section>

   {/* ── QUICK LINKS ───────────────────────────────── */}
   <section className="animate-fade-up-delay-3 flex flex-wrap gap-2">
    <LinkButton href={ROUTES.orders(business.slug)} variant="secondary" size="sm" className="font-bold border-[var(--color-border)]">
     Lihat Semua Order
     <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </LinkButton>
    <LinkButton href={ROUTES.reports(business.slug)} variant="secondary" size="sm" className="font-bold border-[var(--color-border)]">
     Lihat Laporan
     <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </LinkButton>
   </section>
  </main>
 );
}
