/* eslint-disable @typescript-eslint/no-explicit-any */

import { User, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";
import { getTimelineCardClasses, getTimelineStatusLabel } from "../utils/calendar-utils";
import { useToast } from "@/components/ui/toast-provider";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function CalendarTimelineView({
  business,
  selectedDate,
  onDateSelect,
  isResourceMode,
  timelineColumns,
  startHour,
  endHour,
  startOffsetMinutes,
  positionedOrders,
  hoursLength,
  hours,
  goToPrevious,
  goToNext,
  setIsDetailOpen,
  selectedDateLabel,
  selectedOrders
}: any) {
  const toast = useToast();
  return (
    <>
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
         selectedOrders.map((order: any) => {
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
           <div className="grid border-b border-[var(--color-border)]/20 bg-[var(--color-surface-elevated)] font-bold text-xs text-[var(--color-text-secondary)] text-center divide-x divide-[var(--color-border)]/20" style={{ gridTemplateColumns: `80px repeat(${timelineColumns.length}, minmax(180px, 1fr))` }}>
            <div className="py-2.5">Waktu</div>
            {timelineColumns.map((res: any) => (
             <div key={res.id} className={cn("py-2.5 truncate", res.id === "ANY" && "text-[var(--color-warning)] bg-[var(--color-warning-surface)]/30 border-b-2 border-b-[var(--color-warning)]")}>
              {res.name}
             </div>
            ))}
           </div>

           {/* Hour rows and content grid */}
           <div className="relative flex" style={{ height: `${hoursLength * 64}px` }}>
            {/* Time labels axis */}
            <div className="w-[80px] shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)]/20 flex flex-col z-10">
             {hours.map((h: any) => (
              <div key={h} className="h-16 text-[10px] font-bold text-[var(--color-text-muted)] border-b border-[var(--color-border)]/20 flex items-start justify-center pt-1.5 font-mono">
               {String(h % 24).padStart(2, "0")}:00
              </div>
             ))}
            </div>

            {/* Resource columns content */}
            <div className="flex-1 grid divide-x divide-[var(--color-border)]/20 relative" style={{ gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(180px, 1fr))` }}>
             {timelineColumns.map((res: any) => {
              const resOrders = selectedOrders.filter((o: any) => {
               if (o.status === "SELESAI") return false;
               if (res.id === "ANY") {
                return !o.resourceId || o.resourceId === "ANY";
               }
               return o.resourceId === res.id;
              });
              return (
               <div key={res.id} className={cn("relative h-full", res.id === "ANY" ? "bg-[var(--color-warning-surface)]/10" : "bg-[var(--color-surface)]")}>
                {/* Grid backgrounds */}
                {hours.map((h: any, idx: number) => (
                 <div
                  key={h}
                  onClick={() => {
                   toast.info("Pembuatan Order", `Ketik "booking di ${res.name} jam ${String(h % 24).padStart(2, "0")}:00" di Asisten Pintar (Cmd+K) untuk input cepat!`);
                  }}
                  className="absolute left-0 right-0 border-b border-[var(--color-border)]/20 hover:bg-[var(--color-primary-surface)]/20 cursor-pointer transition-colors"
                  style={{ top: `${idx * 64}px`, height: "64px" }}
                 >
                  <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-[var(--color-border)]/10" />
                 </div>
                ))}

                {/* Order block cards */}
                {resOrders.map((order: any) => {
                 const [hStr, mStr] = (order.scheduledTime || "08:00").split(":");
                 let h = Number(hStr || 8);
                 if (h < startHour) h += 24;
                 const m = Number(mStr || 0);
                 const startOffset = h * 60 + m - startOffsetMinutes;
                 const top = (startOffset * 64) / 60;
                 const height = ((order.bookingDurationMinutes || 60) * 64) / 60;
                  const overlappingResOrders = resOrders.filter((other: any) => {
                    const [ohStr, omStr] = (other.scheduledTime || "08:00").split(":");
                    let oh = Number(ohStr || 8);
                    if (oh < startHour) oh += 24;
                    const om = Number(omStr || 0);
                    const oStartOffset = oh * 60 + om - startOffsetMinutes;
                    const oHeight = ((other.bookingDurationMinutes || 60) * 64) / 60;
                    return startOffset < oStartOffset + (other.bookingDurationMinutes || 60) && startOffset + (order.bookingDurationMinutes || 60) > oStartOffset;
                  });
                  const hasConflict = overlappingResOrders.length > 1;

                 return (
                  <button
                   key={order.id}
                   type="button"
                   onClick={() => {
                    onDateSelect(selectedDate);
                    setIsDetailOpen(true);
                   }}
                   className={cn(
                    "absolute left-1.5 right-1.5 rounded-lg border px-2 py-1.5 text-left flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition duration-200 z-10",
                    getTimelineCardClasses(order.status, order.paymentStatus, hasConflict)
                   )}
                   style={{ top: `${top}px`, height: `${height}px` }}
                  >
                   <div className="min-w-0 w-full">
                    <p className="font-bold text-[10px] truncate leading-tight">{order.customerName}</p>
                    <p className="text-[9px] font-medium truncate opacity-80">{order.title}</p>
                   </div>
                    <div className="flex justify-between items-center text-[8px] font-bold opacity-70 font-mono mt-1">
                     <span>{order.scheduledTime}</span>
                     <span className="uppercase text-[7px] tracking-wider px-1 py-0.5 rounded-sm bg-black/5">
                      {getTimelineStatusLabel(order.status)}
                     </span>
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
           <div className="grid border-b border-[var(--color-border)]/20 bg-[var(--color-surface-elevated)] font-bold text-xs text-[var(--color-text-secondary)] text-center divide-x divide-[var(--color-border)]/20 grid-cols-[80px_1fr]">
            <div className="py-2.5">Waktu</div>
            <div className="py-2.5">Slot Pemesanan & Overlap</div>
           </div>

           {/* Hour rows and content grid */}
           <div className="relative flex" style={{ height: `${hoursLength * 64}px` }}>
            {/* Time labels axis */}
            <div className="w-[80px] shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)]/20 flex flex-col z-10">
             {hours.map((h: any) => (
              <div key={h} className="h-16 text-[10px] font-bold text-[var(--color-text-muted)] border-b border-[var(--color-border)]/20 flex items-start justify-center pt-1.5 font-mono">
               {String(h % 24).padStart(2, "0")}:00
              </div>
             ))}
            </div>

            {/* Content area */}
            <div className="flex-1 relative h-full bg-[var(--color-surface)]">
             {/* Grid backgrounds */}
             {hours.map((h: any, idx: number) => (
              <div
               key={h}
               onClick={() => {
                toast.info("Pembuatan Order", `Ketik "booking jam ${String(h % 24).padStart(2, "0")}:00" di Asisten Pintar (Cmd+K) untuk input cepat!`);
               }}
               className="absolute left-0 right-0 border-b border-[var(--color-border)]/20 hover:bg-[var(--color-primary-surface)]/20 cursor-pointer transition-colors"
               style={{ top: `${idx * 64}px`, height: "64px" }}
              >
               <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-[var(--color-border)]/10" />
              </div>
             ))}

             {/* Order blocks */}
             {positionedOrders.map(({ order, style, hasConflict, isHidden, isStackIndicator, hiddenCount }: any) => {
              if (isHidden) return null;
              
              if (isStackIndicator) {
               return (
                <button
                 key={order.id}
                 type="button"
                 onClick={() => {
                  onDateSelect(selectedDate);
                  setIsDetailOpen(true);
                 }}
                 className={cn(
                  "absolute rounded-lg border px-2 py-1.5 text-center flex flex-col items-center justify-center overflow-hidden shadow-xs hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition duration-200 z-10 bg-[var(--color-surface-elevated)] border-dashed border-[var(--color-border-strong)]"
                 )}
                 style={style}
                >
                 <span className="font-extrabold text-[11px] text-[var(--color-text-secondary)]">+{hiddenCount}</span>
                 <span className="font-semibold text-[9px] text-[var(--color-text-muted)]">Booking</span>
                </button>
               );
              }

              return (
               <button
                key={order.id}
                type="button"
                onClick={() => {
                 onDateSelect(selectedDate);
                 setIsDetailOpen(true);
                }}
                className={cn(
                 "absolute rounded-lg border px-2 py-1.5 text-left flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition duration-200 z-10",
                 getTimelineCardClasses(order.status, order.paymentStatus, hasConflict)
                )}
                style={style}
               >
                <div className="min-w-0 w-full">
                 <p className="font-bold text-[10px] truncate leading-tight">{order.customerName}</p>
                 <p className="text-[9px] font-medium truncate opacity-80">{order.title}</p>
                </div>
                 <div className="flex justify-between items-center text-[8px] font-bold opacity-70 font-mono mt-1">
                  <span>{order.scheduledTime}</span>
                  <span className="uppercase text-[7px] tracking-wider px-1 py-0.5 rounded-sm bg-black/5">
                   {getTimelineStatusLabel(order.status)}
                  </span>
                 </div>
                </button>
               );
             })}
            </div>
           </div>
          </div>
          )}
         </div>
        </div>
       </div>
    </>
  );
}
