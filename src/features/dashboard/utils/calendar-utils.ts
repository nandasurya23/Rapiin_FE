import type { OrderStatus, PaymentStatus } from "@/types/order";

export const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const weekdayShortLabels = ["S", "S", "R", "K", "J", "S", "M"];


export function getTimelineCardClasses(status: OrderStatus, paymentStatus: PaymentStatus): string {
  if (status === "BATAL") {
    return "bg-[var(--color-danger-surface)] border-[var(--color-danger)] border text-[var(--color-danger)] line-through opacity-70";
  }
  if (status === "SELESAI") {
    return "bg-[var(--color-surface-inset)] border-[var(--color-border-strong)] border text-[var(--color-text-secondary)] opacity-90";
  }
  if (status === "CONFIRMED" || paymentStatus === "PAID") {
    return "bg-[var(--color-success-surface)] border-[var(--color-success)] border-2 text-[var(--color-success-text)] shadow-sm font-extrabold";
  }
  if (status === "WAITING_DP" || paymentStatus === "DP_PAID") {
    return "bg-[var(--color-warning-surface)] border-[var(--color-warning)] border-2 text-[var(--color-warning-text)] shadow-sm font-extrabold";
  }
  return "bg-[var(--color-primary-surface)] border-[var(--color-primary)] border-2 text-[var(--color-primary)] shadow-sm font-extrabold ring-2 ring-[var(--color-primary)]/20";
}

export function getTimelineStatusLabel(status: OrderStatus): string {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Konfirmasi",
    SELESAI: "Selesai",
    BATAL: "Batal",
    WAITING_DP: "Tunggu DP",
  };
  return labels[status] ?? status;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getMonthCells(referenceDate: Date): Date[] {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const startWeekday = (monthStart.getDay() + 6) % 7;
  const firstCellDate = new Date(monthStart);
  firstCellDate.setDate(monthStart.getDate() - startWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(firstCellDate);
    cellDate.setDate(firstCellDate.getDate() + index);
    return cellDate;
  });
}
