"use client";

import { useState, useEffect } from "react";
import { CalendarOff, CheckCircle2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
 const dates: string[] = [];
 const start = new Date(startDateStr);
 const end = new Date(endDateStr);

 if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
  return [startDateStr];
 }

 const current = new Date(start);
 let iterations = 0;
 while (current <= end && iterations < 366) {
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const day = String(current.getDate()).padStart(2, "0");
  dates.push(`${year}-${month}-${day}`);
  current.setDate(current.getDate() + 1);
  iterations++;
 }
 return dates;
}

type ClosedDaySectionProps = {
 selectedDate: string;
 closedReason?: string;
 onToggle: (reason?: string, endDate?: string) => void;
};

export function ClosedDaySection({
 selectedDate,
 closedReason,
 onToggle,
}: ClosedDaySectionProps) {
 const [reasonInput, setReasonInput] = useState("");
 const [showInput, setShowInput] = useState(false);
 const [isRange, setIsRange] = useState(false);
 const [endDateInput, setEndDateInput] = useState(selectedDate);

 const isClosed = Boolean(closedReason);

 useEffect(() => {
  setEndDateInput(selectedDate);
 }, [selectedDate]);

 return (
  <div className={cn(
   "rounded-[var(--radius-lg)] border p-4 transition-all",
   isClosed
    ? "border-[var(--color-danger-border)] bg-[var(--color-danger-surface)]"
    : "border-[var(--color-border)] bg-[var(--color-surface)]"
  )}>
   <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
     {isClosed ? (
      <CalendarOff className="h-5 w-5 shrink-0 text-[var(--color-danger)] mt-0.5" />
     ) : (
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
     )}
     <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-[var(--color-text)]">
       {isClosed ? "Operasional Tutup / Libur" : "Operasional Buka Normal"}
      </p>
      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate max-w-[280px] sm:max-w-md" title={closedReason}>
       {isClosed
        ? `Alasan: "${closedReason}"`
        : "Pelanggan bisa melakukan booking/order di tanggal ini."}
      </p>
     </div>
    </div>

    <div className="flex items-center gap-2">
     {isClosed ? (
      <Button
       type="button"
       variant="secondary"
       size="sm"
       onClick={() => onToggle()}
       className="bg-white border-[var(--color-danger-border)] text-[var(--color-danger-text)] hover:bg-[var(--color-danger-surface)]"
      >
       Buka Kembali Toko
      </Button>
     ) : !showInput ? (
      <Button
       type="button"
       variant="secondary"
       size="sm"
       onClick={() => {
        setShowInput(true);
        setReasonInput("");
        setIsRange(false);
        setEndDateInput(selectedDate);
       }}
       className="text-[var(--color-danger)] hover:text-[var(--color-danger-hover)]"
      >
       Setel Libur / Tutup Toko
      </Button>
     ) : null}
    </div>
   </div>

   {showInput && !isClosed && (
    <div className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-3 animate-fade-in">
     <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
       type="checkbox"
       checked={isRange}
       onChange={(e) => {
        setIsRange(e.target.checked);
        if (!e.target.checked) setEndDateInput(selectedDate);
       }}
       className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] h-4 w-4"
      />
      <span className="text-xs font-semibold text-[var(--color-text)]">Setel Rentang Tanggal (Multi-Hari)</span>
     </label>

     {isRange && (
      <div className="grid gap-3 md:grid-cols-2 animate-fade-in">
       <label className="block opacity-60">
        <span className="mb-2 block text-xs font-semibold text-[var(--color-text)]">Mulai Tanggal</span>
        <DatePicker value={selectedDate} onValueChange={() => { }} disabled={true} />
       </label>
       <label className="block">
        <span className="mb-2 block text-xs font-semibold text-[var(--color-text)]">Sampai Tanggal</span>
        <DatePicker
         value={endDateInput}
         onValueChange={(val) => {
          if (new Date(val) >= new Date(selectedDate)) {
           setEndDateInput(val);
          }
         }}
        />
       </label>
      </div>
     )}

     <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[var(--color-text)]">
       Alasan Libur / Tutup Toko <span className="text-[var(--color-danger)]">*</span>
      </span>
      <Input
       value={reasonInput}
       onChange={(e) => setReasonInput(e.target.value)}
       placeholder="Contoh: Libur Idul Fitri, Renovasi Studio, Staf Cuti Bersama"
       className="text-xs"
      />
     </label>
     <div className="flex items-center justify-end gap-2">
      <Button
       type="button"
       variant="secondary"
       size="sm"
       onClick={() => setShowInput(false)}
      >
       Batal
      </Button>
      <Button
       type="button"
       size="sm"
       disabled={!reasonInput.trim() || (isRange && new Date(endDateInput) < new Date(selectedDate))}
       onClick={() => {
        onToggle(reasonInput, isRange ? endDateInput : undefined);
        setShowInput(false);
       }}
      >
       Simpan Libur
      </Button>
     </div>
    </div>
   )}
  </div>
 );
}
