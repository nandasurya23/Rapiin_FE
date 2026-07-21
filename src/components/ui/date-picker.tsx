"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

type DatePickerProps = {
 value: string;
 onValueChange: (value: string) => void;
 placeholder?: string;
 disabled?: boolean;
 className?: string;
 disabledDates?: string[];
};

const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function toDateValue(date: Date) {
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, "0");
 const day = String(date.getDate()).padStart(2, "0");
 return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
 const [year, month, day] = value.split("-").map(Number);
 return new Date(year, month - 1, day);
}

function startOfMonth(date: Date) {
 return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
 return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDay(a: Date, b: Date) {
 return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthCells(viewDate: Date) {
 const monthStart = startOfMonth(viewDate);
 const startWeekday = (monthStart.getDay() + 6) % 7;
 const firstCellDate = new Date(monthStart);
 firstCellDate.setDate(monthStart.getDate() - startWeekday);

 return Array.from({ length: 42 }, (_, index) => {
  const cellDate = new Date(firstCellDate);
  cellDate.setDate(firstCellDate.getDate() + index);
  return cellDate;
 });
}

export function DatePicker({
 value,
 onValueChange,
 placeholder = "Pilih tanggal",
 disabled,
 className,
 disabledDates,
}: DatePickerProps) {
 const [open, setOpen] = useState(false);
 const [viewDate, setViewDate] = useState(value ? parseDateValue(value) : new Date());
 const rootRef = useRef<HTMLDivElement>(null);
 const menuId = useId();

 const selectedDate = useMemo(() => (value ? parseDateValue(value) : null), [value]);
 const today = useMemo(() => new Date(), []);
 const monthLabel = useMemo(
  () =>
   new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
   }).format(viewDate),
  [viewDate]
 );
 const monthCells = useMemo(() => getMonthCells(viewDate), [viewDate]);

 useEffect(() => {
  if (value) {
   setViewDate(parseDateValue(value));
  }
 }, [value]);

 useEffect(() => {
  function handlePointerDown(event: MouseEvent | TouchEvent) {
   if (!rootRef.current) {
    return;
   }

   if (!rootRef.current.contains(event.target as Node)) {
    setOpen(false);
   }
  }

  function handleEscape(event: KeyboardEvent) {
   if (event.key === "Escape") {
    setOpen(false);
   }
  }

  document.addEventListener("mousedown", handlePointerDown);
  document.addEventListener("touchstart", handlePointerDown);
  document.addEventListener("keydown", handleEscape);

  return () => {
   document.removeEventListener("mousedown", handlePointerDown);
   document.removeEventListener("touchstart", handlePointerDown);
   document.removeEventListener("keydown", handleEscape);
  };
 }, []);

 return (
  <div ref={rootRef} className={cn("relative w-full", className)}>
   <button
    type="button"
    disabled={disabled}
    aria-haspopup="dialog"
    aria-expanded={open}
    aria-controls={menuId}
    onClick={() => {
     if (!disabled) {
      setOpen((current) => !current);
     }
    }}
    className={cn(
     "flex h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-left text-sm text-[var(--color-text)] outline-none transition-all duration-[var(--transition-fast)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--state-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
     className
    )}
   >
    <span className={cn("min-w-0 flex-1 truncate", value ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]")}>
     {value ? formatDate(value) : placeholder}
    </span>
    <CalendarDays className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
   </button>

   {open ? (
    <div
     id={menuId}
     role="dialog"
     aria-label="Date picker"
     className="absolute left-0 right-0 z-50 mt-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 "
    >
     <div className="flex items-center justify-between gap-2">
      <button
       type="button"
       onClick={() => setViewDate((current) => addMonths(current, -1))}
       className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]"
       aria-label="Bulan sebelumnya"
      >
       <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="text-sm font-semibold text-[var(--color-text)]">{monthLabel}</div>
      <button
       type="button"
       onClick={() => setViewDate((current) => addMonths(current, 1))}
       className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]"
       aria-label="Bulan berikutnya"
      >
       <ChevronRight className="h-4 w-4" />
      </button>
     </div>

     <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--color-text-muted)]">
      {weekdayLabels.map((label) => (
       <div key={label} className="py-1">
        {label}
       </div>
      ))}
     </div>

     <div className="mt-2 grid grid-cols-7 gap-1">
      {monthCells.map((date) => {
       const dateVal = toDateValue(date);
       const isCurrentMonth = date.getMonth() === viewDate.getMonth();
       const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
       const isToday = isSameDay(date, today);
       const isDisabledDate = disabledDates?.includes(dateVal);

       return (
        <button
         key={dateVal}
         type="button"
         disabled={isDisabledDate}
         onClick={() => {
          onValueChange(dateVal);
          setOpen(false);
         }}
         className={cn(
          "flex h-10 items-center justify-center rounded-[var(--radius-md)] text-sm transition-all duration-[var(--transition-fast)]",
          !isDisabledDate && (isCurrentMonth ? "text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]" : "text-[var(--color-text-muted)] opacity-40"),
          isSelected && "bg-[var(--color-primary)] font-semibold text-white hover:bg-[var(--color-primary-hover)]",
          isToday && !isSelected && "border border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] font-semibold",
          isDisabledDate && "bg-red-50 text-red-500 border border-red-100 line-through cursor-not-allowed font-medium"
         )}
        >
         {date.getDate()}
        </button>
       );
      })}
     </div>

     <div className="mt-4 flex items-center justify-between gap-2">
      <button
       type="button"
       onClick={() => onValueChange(toDateValue(new Date()))}
       className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
      >
       Pilih hari ini
      </button>
      <button
       type="button"
       onClick={() => setOpen(false)}
       className="text-sm font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
      >
       Tutup
      </button>
     </div>
    </div>
   ) : null}
  </div>
 );
}
