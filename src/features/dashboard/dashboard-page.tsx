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
import { ROUTES } from "@/lib/routes";
import { CustomerStatusBadge, OrderStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardCalendar } from "@/features/dashboard/dashboard-calendar";
import { getDashboardSummary, toDateKey } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";
import { renderTemplate } from "@/lib/messages";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/cn";
import { useOrders } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
import { useMessageTemplates } from "@/hooks/use-message-templates";


export function DashboardPage() {
 const toast = useToast();
 const { business, currentUser, subscriptionForCurrentBusiness } = useAppData();
 const { orders, updateOrder } = useOrders({ enablePolling: true });
 const { customers, updateCustomer, currentBusinessUsage } = useCustomers({ enablePolling: true });
 const { messageTemplates } = useMessageTemplates();

 const isNearCustomerLimit = currentBusinessUsage 
  && currentBusinessUsage.used >= currentBusinessUsage.limit - 5;
 const { todayOrders, unpaidOrders, revenue } = getDashboardSummary(orders, customers);
 const today = toDateKey(new Date());
 const [selectedDate, setSelectedDate] = useState(today);
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
    const askDate = new Date(new Date(order.updatedAt || order.createdAt).getTime() + 24 * 60 * 60 * 1000);
    return toDateKey(askDate) === selectedDate;
   })
   .map((order) => ({
    type: "order" as const,
    id: order.id,
    title: order.customerName,
    reason: "Minta ulasan (Order selesai)",
    status: order.status,
    due: formatDateTime(order.updatedAt || order.createdAt),
    phone: order.whatsappNumber,
    message: getMessageFromTemplate(
     "REVIEW",
     { customer_name: order.customerName, order_title: order.title },
     `Terima kasih ya ${order.customerName}, order ${order.title} sudah selesai. Jika berkenan, mohon ulasannya ya!`
    ),
   }));

  const items = [];
  items.push(...unpaidItems);
  items.push(...staleItems);
  items.push(...reviewItems);
  return items.slice(0, 6);
 }, [orders, customers, selectedDate, business, messageTemplates]);

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
   {isNearCustomerLimit && (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4.5 text-xs sm:text-sm text-[var(--color-text)] flex items-start gap-3.5 shadow-sm animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
     <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
     <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
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
    className="px-0 bg-transparent border-none sm:px-0 py-0"
    title={`Selamat Datang Kembali, ${currentUser?.name ?? business.ownerName}`}
    description="Berikut adalah rangkuman aktivitas operasional, penagihan, dan tugas penting bisnis Anda hari ini."
    badge={
     <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-surface)] border border-[var(--color-primary)]/20 px-3 py-1 text-xs font-semibold text-[var(--color-primary)] mb-1">
      <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
      <span>{business.name}</span>
     </div>
    }
   />

   {/* ── PROACTIVE BUSINESS INSIGHT ───────────────────── */}
   <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-surface)] p-4 text-xs sm:text-sm text-[var(--color-text)] flex items-start gap-3.5 shadow-xs">
    <Sparkles className="h-5 w-5 shrink-0 text-[var(--color-primary)] mt-0.5" />
    <div className="flex-1 space-y-1">
     <p className="font-bold text-[var(--color-primary)]">
      💡 Ringkasan Rekomendasi Bisnis Hari Ini
     </p>
     <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs">
      {filteredActionItems.length > 0
       ? `Ada ${filteredActionItems.length} tindakan penting yang perlu di-follow up (tagihan/pembayaran). Mengingatkan pelanggan tepat waktu dapat meningkatkan kelancaran kas hingga 80%.`
       : "Semua tagihan dan jadwal hari ini sudah rapi. Bagikan link booking ke calon pelanggan untuk menambah pesanan!"}
     </p>
    </div>
   </div>

   {/* ── STANDALONE METRICS GRID ──────────────────────── */}
   <section className="grid gap-4 sm:grid-cols-3 animate-fade-up-delay-1">
    {stats.map((stat) => {
     const Icon = stat.icon;
     
     return (
      <div key={stat.label} className="border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] flex items-center justify-between gap-4 p-5">
       <div className="space-y-1 flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{stat.label}</p>
        <p className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight whitespace-nowrap overflow-x-auto no-scrollbar">{stat.value}</p>
       </div>
       <div className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--color-text-muted)]">
        <Icon className="h-5 w-5 opacity-70" />
       </div>
      </div>
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
    <div className="space-y-4">
     <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-3">
      <div>
       <h2 className="text-lg font-bold text-[var(--color-text)]">Perlu Diurus</h2>
       <p className="text-sm text-[var(--color-text-secondary)]">Aksi penting maksimal 2 klik.</p>
      </div>
      {filteredActionItems.length > 0 && (
       <span className="inline-flex items-center rounded-full bg-[var(--color-surface-elevated)] px-2.5 py-1 text-xs font-semibold">
        {filteredActionItems.length} Mendadak
       </span>
      )}
     </div>

     <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
      {filteredActionItems.length ? (
       filteredActionItems.map((item) => {
        return (
         <div
          key={item.id}
          className={cn(
           "flex flex-col gap-3 p-4 sm:p-5 md:flex-row md:items-center md:justify-between transition-colors hover:bg-[var(--color-surface-elevated)]/50"
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
           <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto sm:justify-end">
            <WhatsAppButton
             phoneNumber={item.phone}
             message={item.message}
             label="Hubungi WA"
             className="h-9 px-3 text-xs font-bold rounded-md flex-1 sm:flex-none justify-center"
            />
            <Button
             type="button"
             variant="ghost"
             size="sm"
             onClick={() => void handleCopyMessage(item.message)}
             title="Salin draf pesan WA"
             className="h-9 w-9 p-0 rounded-md flex-none"
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
               className="font-medium border-[var(--color-border)] h-9 px-3 text-xs rounded-md flex-1 sm:flex-none justify-center"
              >
               {item.status === "WAITING_DP" ? "DP Lunas" : "Lunas"}
              </Button>
              {item.status !== "SELESAI" && (
               <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleMarkOrderDone(item.id)}
                title="Tandai order selesai"
                className="font-medium h-9 px-3 text-xs rounded-md flex-1 sm:flex-none justify-center"
               >
                Selesai
               </Button>
              )}
             </>
            )}
            {item.type === "customer" && (
             <>
              <LinkButton href={ROUTES.customers(business.slug)} variant="secondary" size="sm" className="font-bold border-[var(--color-border)] h-9 px-3 text-xs rounded-xl flex-1 sm:flex-none justify-center">
               Detail Customer
              </LinkButton>
              <Button
               type="button"
               variant="secondary"
               size="sm"
               onClick={() => void handleMarkCustomerDone(item.id)}
               title="Tandai follow-up selesai"
               className="font-bold border-[var(--color-border)] h-9 px-3 text-xs rounded-xl flex-1 sm:flex-none justify-center"
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
       <div className="py-8">
        <EmptyState
         icon={<CheckCircle2 className="h-5 w-5" />}
         title="Semua beres hari ini"
         description="Belum ada order, booking, atau follow-up untuk tanggal yang dipilih."
         size="sm"
        />
       </div>
      )}
     </div>
    </div>
   </section>

   {/* ── QUICK LINKS ───────────────────────────────── */}
   <section className="animate-fade-up-delay-3 flex flex-wrap gap-2">
    <LinkButton href={ROUTES.orders(business.slug)} variant="secondary" size="sm" className="font-bold border-[var(--color-border)]">
     Lihat Semua Order
     <ChevronRight className="h-4 w-4" />
    </LinkButton>
    <LinkButton href={ROUTES.reports(business.slug)} variant="secondary" size="sm" className="font-bold border-[var(--color-border)]">
     Lihat Laporan
     <ChevronRight className="h-4 w-4" />
    </LinkButton>
   </section>
  </main>
 );
}
