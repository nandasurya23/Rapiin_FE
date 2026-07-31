/* eslint-disable @typescript-eslint/no-explicit-any */

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { weekdayShortLabels, weekdayLabels, toDateKey } from "../utils/calendar-utils";
import { Badge } from "@/components/ui/badge";
import { getBookingSlotsForDate } from "@/lib/booking";

export function CalendarMonthView({
  business,
  monthLabel,
  monthCells,
  selectedDate,
  onDateSelect,
  orderCountByDate,
  goToPrevious,
  goToNext,
  getDayBadgeLabel,
  getDayBadgeCompactLabel,
  getDayBadgeTone,
  viewDate,
  orders,
  isResourceMode,
  setIsDetailOpen
}: any) {
  const todayKey = toDateKey(new Date());
  return (
    <>
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
        {monthCells.map((date: Date, index: number) => {
         const dateKey = toDateKey(date);
         const isCurrentMonth = date.getMonth() === viewDate.getMonth();
         const isSelected = selectedDate === dateKey;
         const isToday = dateKey === todayKey;
         const count = orderCountByDate[dateKey] ?? 0;
         const cellOrders = orders.filter((o: any) => o.scheduledDate === dateKey);
         const dateSlotSummaries = getBookingSlotsForDate(cellOrders, dateKey, null, new Date(), business.bookingCapacity);
         const dateHasFullSlot = isResourceMode ? false : dateSlotSummaries.some((slot: any) => slot.isFull);

         const isClosed = Boolean(business.closedDates?.[dateKey]);
         const closedReason = business.closedDates?.[dateKey] || "";

         const badgeLabel = isClosed ? `TUTUP: ${closedReason}` : getDayBadgeLabel(count, dateHasFullSlot);
         const compactBadgeLabel = isClosed ? "TUTUP" : getDayBadgeCompactLabel(count, dateHasFullSlot);
         const badgeTone = isClosed ? ("danger" as const) : getDayBadgeTone(count, dateHasFullSlot);

         return (
           <button
           key={dateKey}
           type="button"
           onClick={() => {
            onDateSelect(dateKey);
            setIsDetailOpen(true);
           }}
           className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border px-1 transition-all duration-200 h-12 sm:h-16 md:h-20",
            !isSelected && (
             isClosed
              ? "border-red-200 bg-red-50 text-red-700 font-semibold"
              : (isCurrentMonth ? "border-transparent bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]" : "border-transparent bg-transparent text-[var(--color-text-muted)]/40")
            ),
            isToday && !isSelected && "border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] font-bold",
            isSelected && "border-transparent bg-[var(--color-primary)] text-white shadow-[var(--shadow-md)] scale-[1.05]"
           )}
          >
           <span className="text-xs sm:text-sm font-semibold">{date.getDate()}</span>
           
           {/* Minimalist Indicators */}
           <div className="absolute bottom-1.5 sm:bottom-2.5 left-0 right-0 flex justify-center items-center gap-0.5 sm:gap-1">
             {isClosed ? (
               <span className={cn("h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full", isSelected ? "bg-white" : "bg-red-500")} />
             ) : count > 0 ? (
               // Dot indicators up to 3
               Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                 <span 
                   key={i} 
                   className={cn(
                     "h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full",
                     isSelected ? "bg-white" : dateHasFullSlot ? "bg-[var(--color-danger)]" : "bg-[var(--color-primary)]"
                   )} 
                 />
               ))
             ) : null}
             {count > 3 && !isClosed && (
               <span className={cn("text-[7px] sm:text-[9px] font-bold leading-none -ml-0.5", isSelected ? "text-white" : "text-[var(--color-text-muted)]")}>
                 +
               </span>
             )}
           </div>
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

    </>
  );
}
