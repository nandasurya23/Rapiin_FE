import { useState } from "react";
import { Calendar, Clock, ReceiptText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/lib/format";
import { DEFAULT_BOOKING_DURATION_MINUTES } from "@/lib/booking";
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



function calculateEndTime(startTime?: string | null, durationMinutes?: number | null) {
 if (!startTime) return "?";
 const [h, m] = startTime.split(":").map(Number);
 const dur = durationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES;
 const total = h * 60 + m + dur;
 const endH = Math.floor(total / 60) % 24;
 const endM = total % 60;
 return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

interface OrderBoardProps {
 orders: Order[];
 statusOptions: { value: OrderStatus; label: string; tone?: StatusTone }[];
 onUpdateStatus: (order: Order, nextStatus: OrderStatus) => void;
 onEdit: (order: Order) => void;
 onDelete?: (order: Order) => void;
 getWhatsAppConfig: (order: Order) => { label: string; message: string };
 isResourceBooking?: boolean;
 businessSlug: string;
}

export function OrderBoard({
 orders,
 statusOptions,
 onUpdateStatus,
 onEdit,
 onDelete,
 getWhatsAppConfig,
 isResourceBooking,
 businessSlug,
}: OrderBoardProps) {
 const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
 const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);




 // Mouse drag-to-scroll support for desktop
 const [isMouseDown, setIsMouseDown] = useState(false);
 const [startX, setStartX] = useState(0);
 const [scrollLeft, setScrollLeft] = useState(0);

 return (
  <section className="space-y-4">
   <div className="flex items-center justify-between gap-3 px-1 border-b border-[var(--color-border)] pb-3">
    <div>
     <h2 className="text-lg font-bold text-[var(--color-text)]">Board Alur Status Pesanan</h2>
     <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Pantau status pesanan masuk. Geser horizontal (drag/scroll) untuk melihat semua kolom.</p>
    </div>
    <Badge tone="neutral" className="font-extrabold">{statusOptions.length} Status Board</Badge>
   </div>

   <div
    className="overflow-x-auto pb-4 pt-1 cursor-grab active:cursor-grabbing select-none focus:outline-none"
    onMouseDown={(e) => {
     // Only trigger horizontal container drag scroll if not dragging a card directly
     if ((e.target as HTMLElement).closest("[draggable='true']")) return;
     setIsMouseDown(true);
     setStartX(e.pageX - e.currentTarget.offsetLeft);
     setScrollLeft(e.currentTarget.scrollLeft);
    }}
    onMouseLeave={() => {
     setIsMouseDown(false);
    }}
    onMouseUp={() => {
     setIsMouseDown(false);
    }}
    onMouseMove={(e) => {
     if (!isMouseDown) return;
     e.preventDefault();
     const x = e.pageX - e.currentTarget.offsetLeft;
     const walk = (x - startX) * 1.5;
     e.currentTarget.scrollLeft = scrollLeft - walk;
    }}
   >
    <div className="flex gap-4 min-w-max pb-2">
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
           e.dataTransfer.dropEffect = "move";
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
          "flex flex-col gap-3 p-1",
          isValidDropTarget && "border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/[0.05]",
          draggedOrder && !isValidDropTarget && "opacity-40"
         )}
        >
         {laneOrders.length ? (
          laneOrders.map((order) => {
           const waConfig = getWhatsAppConfig(order);
           
           const isDraggable = true;

           return (
            <div
             key={order.id}
             draggable={isDraggable}
             onDragStart={(e) => {
              setDraggedOrder(order);
              e.dataTransfer.setData("text/plain", order.id);
              e.dataTransfer.effectAllowed = "move";
             }}
             onDragEnd={() => {
              setDraggedOrder(null);
             }}
             onClick={() => onEdit(order)}
             className={cn(
              "p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl transition-all duration-300 relative shadow-sm hover:shadow hover:border-[var(--color-border-strong)] select-none",
              isDraggable ? "cursor-pointer active:cursor-grabbing" : "opacity-90 cursor-default"
             )}
            >
             {/* <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-full", statusIndicator)} /> */}
             <div className="flex items-start gap-3">
               <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)] text-[var(--color-text)] font-semibold text-xs border border-[var(--color-border)] select-none">
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
               <div className={cn("space-y-1.5 border p-2.5 rounded-xl text-[11px] leading-normal", 
                  isResourceBooking ? "bg-indigo-50/50 border-indigo-100 text-indigo-900" : "bg-[var(--color-surface-elevated)] border-[var(--color-border)]/40 text-[var(--color-text-secondary)]"
               )}>
                 {isResourceBooking ? (
                    <div>
                       {order.resourceNameSnapshot && (
                        <p className="text-sm font-black text-indigo-700 uppercase tracking-wide">
                         {order.resourceNameSnapshot}
                        </p>
                       )}
                       <p className="font-bold flex items-center gap-1.5 text-indigo-800 text-[11px] mt-1">
                        <Clock className="h-3 w-3" />
                        {order.scheduledTime} s/d {calculateEndTime(order.scheduledTime, order.bookingDurationMinutes)}
                       </p>
                    </div>
                 ) : (
                    <>
                     <p className="font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[var(--color-text-muted)]" />
                      Jadwal: {order.bookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES} Menit
                     </p>
                     {order.resourceNameSnapshot && (
                      <p className="text-[10px] font-bold text-[var(--color-text)]">
                       Unit: {order.resourceNameSnapshot}
                      </p>
                     )}
                    </>
                 )}
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

             <div 
              className="mt-4 pt-3.5 border-t border-[var(--color-border)]/40 flex flex-wrap gap-1.5"
              onClick={(e) => e.stopPropagation()}
             >
              <WhatsAppButton
               phoneNumber={order.whatsappNumber}
               message={waConfig.message}
               label={waConfig.label}
              />
              <LinkButton
               href={`${ROUTES.invoices(businessSlug)}?orderId=${order.id}`}
               variant="secondary"
               className="h-9 px-2.5 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold"
              >
               <ReceiptText className="h-4 w-4" />
               Nota
              </LinkButton>
              {onDelete && (
               <Button
                type="button"
                variant="ghost"
                className="h-9 px-2.5 rounded-xl text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] hover:text-[var(--color-danger-hover)] text-xs font-bold"
                onClick={() => setDeletingOrder(order)}
                title="Hapus order"
               >
                <Trash2 className="h-4 w-4" />
               </Button>
              )}
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

   {/* DELETE CONFIRMATION MODAL */}
   {deletingOrder && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeletingOrder(null)} />
     <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-xl space-y-4 animate-fade-in">
      <h3 className="text-lg font-bold text-[var(--color-text)]">Hapus Pesanan?</h3>
      <p className="text-sm text-[var(--color-text-secondary)]">
       Apakah Anda yakin ingin menghapus pesanan &quot;<strong className="text-[var(--color-text)]">{deletingOrder.title}</strong>&quot; untuk <strong className="text-[var(--color-text)]">{deletingOrder.customerName}</strong>? Tindakan ini tidak dapat dibatalkan.
      </p>
      <div className="flex justify-end gap-2.5 pt-2">
       <Button
        type="button"
        variant="secondary"
        onClick={() => setDeletingOrder(null)}
       >
        Batal
       </Button>
       <Button
        type="button"
        variant="danger"
        onClick={() => {
         if (onDelete && deletingOrder) {
          onDelete(deletingOrder);
         }
         setDeletingOrder(null);
        }}
       >
        Ya, Hapus
       </Button>
      </div>
     </div>
    </div>
   )}
  </section>
 );
}
