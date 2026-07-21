import { useState } from "react";
import { Calendar, Clock, Copy, PencilLine, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/lib/format";
import { DEFAULT_BOOKING_DURATION_MINUTES, getBookingHoldExpiresAt, isBookingHoldActive } from "@/lib/booking";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import type { Order, OrderStatus } from "@/types/order";
import type { StatusTone } from "@/types/common";
import { getValidStatusOptions } from "@/lib/constants/orders";

// Helpers for CRM Initials Avatar and gradients
export function getInitials(name: string) {
 const parts = name.trim().split(/\s+/);
 if (parts.length === 0 || !parts[0]) return "?";
 if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
 return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarGradient(name: string) {
 const code = name.charCodeAt(0) % 4;
 if (code === 0) return "from-blue-400 to-indigo-600";
 if (code === 1) return "from-emerald-400 to-teal-600";
 if (code === 2) return "from-amber-400 to-orange-600";
 return "from-pink-400 to-rose-600";
}

function formatDateTime(value?: string | null) {
 if (!value) return "";
 const parsedDate = new Date(value);
 if (Number.isNaN(parsedDate.getTime())) return "";
 return new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  hour12: false,
  hourCycle: "h23",
 }).format(parsedDate);
}

interface OrderBoardProps {
 orders: Order[];
 statusOptions: { value: OrderStatus; label: string; tone?: StatusTone }[];
 onUpdateStatus: (order: Order, nextStatus: OrderStatus) => void;
 onEdit: (order: Order) => void;
 getWhatsAppConfig: (order: Order) => { label: string; message: string };
}

export function OrderBoard({
 orders,
 statusOptions,
 onUpdateStatus,
 onEdit,
 getWhatsAppConfig,
}: OrderBoardProps) {
 const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
 const toast = useToast();

 async function handleCopyMessage(message: string) {
  try {
   await navigator.clipboard.writeText(message);
   toast.success("Draf WhatsApp berhasil disalin!");
  } catch {
   toast.error("Gagal menyalin draf pesan.");
  }
 }

 return (
  <section className="space-y-4">
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
      const laneOrders = orders.filter((order) => {
       if (option.value === "WAITING_DP" || option.value === "ORDER_BARU" || option.value === "REQUEST_MASUK") {
        return order.status === option.value || order.status === "INQUIRY";
       }
       return order.status === option.value;
      });
      const isValidDropTarget = draggedOrder && (
       draggedOrder.status === option.value || 
       getValidStatusOptions(draggedOrder.status, draggedOrder.mode).some(opt => opt.value === option.value)
      );

      return (
       <div key={option.value} className="w-[320px] shrink-0 bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border)] flex flex-col justify-between p-3">
        <div className="flex items-center justify-between gap-2 pb-3 mb-2 px-1">
         <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text)]">{option.label}</p>
         <Badge tone={option.tone} className="text-[9px] uppercase tracking-wider font-extrabold">{laneOrders.length}</Badge>
        </div>

        <div
         onDragOver={(e) => {
          if (isValidDropTarget) {
           e.preventDefault();
          }
         }}
         onDrop={(e) => {
          e.preventDefault();
          if (draggedOrder && isValidDropTarget && draggedOrder.status !== option.value) {
           onUpdateStatus(draggedOrder, option.value);
          }
          setDraggedOrder(null);
         }}
         className={cn(
          "flex-1 min-h-[400px] rounded-xl transition-all duration-200",
          "flex flex-col gap-3",
          isValidDropTarget && "border-2 border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary)]/[0.02]",
          draggedOrder && !isValidDropTarget && "opacity-40"
         )}
        >
         {laneOrders.length ? (
          laneOrders.map((order) => {
           const waConfig = getWhatsAppConfig(order);
           
           let statusIndicator = "bg-stone-300";
           if (order.paymentStatus === "PAID") {
            statusIndicator = "bg-emerald-500";
           } else if (order.paymentStatus === "DP_PAID") {
            statusIndicator = "bg-blue-500";
           } else if (order.paymentStatus === "UNPAID") {
            statusIndicator = "bg-rose-500";
           }

           const isDraggable = order.status !== "SELESAI" && order.status !== "BATAL";

           return (
            <div
             key={order.id}
             draggable={isDraggable}
             onDragStart={(e) => {
              setDraggedOrder(order);
              e.dataTransfer.setData("orderId", order.id);
             }}
             onDragEnd={() => {
              setDraggedOrder(null);
             }}
             className={cn(
              "p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl transition-all duration-300 relative shadow-sm hover:shadow hover:border-[var(--color-border-strong)]",
              isDraggable ? "cursor-grab active:cursor-grabbing" : "opacity-90 cursor-default"
             )}
            >
             {/* <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-full", statusIndicator)} /> */}
             <div className="flex items-start gap-3">
              <div className={cn(
               "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-[10px] font-black select-none border border-white/20",
               getAvatarGradient(order.customerName)
              )}>
               {getInitials(order.customerName)}
              </div>
              <div className="min-w-0 flex-1">
               <p className="truncate font-bold text-sm text-[var(--color-text)] tracking-tight">{order.customerName}</p>
               <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] truncate font-semibold">{order.title}</p>
              </div>
             </div>

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
               onClick={() => onEdit(order)}
              >
               <PencilLine className="h-4 w-4" />
               Ubah
              </Button>
              <select
               value={order.status}
               onChange={(e) => onUpdateStatus(order, e.target.value as OrderStatus)}
               className={cn(
                "h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[11px] font-bold text-[var(--color-text)] outline-none hover:border-[var(--color-border-strong)] transition-colors cursor-pointer"
               )}
              >
               {getValidStatusOptions(order.status, order.mode).map((opt) => (
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
 );
}
