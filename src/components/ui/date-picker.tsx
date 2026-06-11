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

export function DatePicker({ value, onValueChange, placeholder = "Pilih tanggal", disabled, className }: DatePickerProps) {
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
          "flex h-11 w-full items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 text-left text-sm text-text-primary outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", value ? "text-text-primary" : "text-text-muted")}>
          {value ? formatDate(value) : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-text-muted" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-label="Date picker"
          className="absolute left-0 right-0 z-30 mt-2 rounded-lg border border-border bg-surface p-4 shadow-soft"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setViewDate((current) => addMonths(current, -1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition hover:bg-muted"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-text-primary">{monthLabel}</div>
            <button
              type="button"
              onClick={() => setViewDate((current) => addMonths(current, 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition hover:bg-muted"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-muted">
            {weekdayLabels.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {monthCells.map((date) => {
              const isCurrentMonth = date.getMonth() === viewDate.getMonth();
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isToday = isSameDay(date, today);

              return (
                <button
                  key={toDateValue(date)}
                  type="button"
                  onClick={() => {
                    onValueChange(toDateValue(date));
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-lg text-sm transition",
                    isCurrentMonth ? "text-text-primary hover:bg-muted" : "text-text-muted/60",
                    isSelected && "bg-brand-700 font-medium text-white hover:bg-brand-700",
                    isToday && !isSelected && "border border-brand-200 bg-brand-50 text-brand-800"
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
              className="text-sm font-medium text-brand-700 transition hover:text-brand-800"
            >
              Pilih hari ini
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
