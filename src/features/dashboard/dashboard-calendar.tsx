"use client";

import { memo } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Business } from "@/types/business";
import type { Order } from "@/types/order";
import { CalendarDetailContent } from "./components/calendar-detail-content";
import { useCalendarState } from "./hooks/use-calendar-state";
import { CalendarMonthView } from "./components/calendar-month-view";
import { CalendarTimelineView } from "./components/calendar-timeline-view";

type DashboardCalendarProps = {
  business: Business;
  orders: Order[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
};

export const DashboardCalendar = memo(function DashboardCalendar(props: DashboardCalendarProps) {
  const state = useCalendarState(props);

  return (
    <>
      <section className="animate-fade-up-delay-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-none sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex rounded-[var(--radius-md)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] border border-[var(--color-info-border)] px-3 py-1 text-xs font-medium">Kalender Jadwal</div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Pantau booking dan order secara real-time</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Lihat jadwal harian timeline atau bulanan.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-[var(--color-surface-elevated)] p-1 border border-[var(--color-border)] shadow-sm">
              <button
                type="button"
                onClick={() => state.setViewMode("MONTH")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-bold transition-all",
                  state.viewMode === "MONTH"
                    ? "bg-[var(--color-primary)] text-white shadow-sm font-black"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-semibold"
                )}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => state.setViewMode("DAY_TIMELINE")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-bold transition-all",
                  state.viewMode === "DAY_TIMELINE"
                    ? "bg-[var(--color-primary)] text-white shadow-sm font-black"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-semibold"
                )}
              >
                <span className="md:hidden">Daftar</span>
                <span className="hidden md:inline">Timeline Harian</span>
              </button>
            </div>

            <Badge tone="neutral">{state.viewMode === "MONTH" ? state.monthLabel : formatDate(props.selectedDate)}</Badge>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 sm:p-5">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" size="sm" className="min-w-0 px-2.5 sm:w-auto sm:px-3" onClick={state.goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            <div className="min-w-0 px-2 text-center text-sm font-semibold text-[var(--color-text)]">
              {state.viewMode === "MONTH" ? state.monthLabel : formatDate(props.selectedDate)}
            </div>
            <Button type="button" variant="secondary" size="sm" className="min-w-0 px-2.5 sm:w-auto sm:px-3" onClick={state.goToNext}>
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {state.viewMode === "MONTH" ? (
            <CalendarMonthView {...state} orders={props.orders} business={props.business} selectedDate={props.selectedDate} onDateSelect={props.onDateSelect} />
          ) : (
            <CalendarTimelineView {...state} business={props.business} selectedDate={props.selectedDate} onDateSelect={props.onDateSelect} selectedDateLabel={state.selectedDateLabel} />
          )}
        </div>
      </section>

      {state.isDetailOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[var(--color-navy-900)]/50 backdrop-blur-[2px] p-0 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Detail kalender"
        >
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => state.setIsDetailOpen(false)} aria-label="Tutup detail kalender" />
          <div className="relative z-10 max-h-[88vh] w-full overflow-hidden rounded-t-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)] sm:max-w-3xl sm:rounded-[var(--radius-xl)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <div className="inline-flex rounded-[var(--radius-md)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] border border-[var(--color-info-border)] px-3 py-1 text-xs font-medium">Detail Tanggal</div>
                <h3 className="mt-3 text-xl font-semibold text-[var(--color-text)]">{state.selectedDateLabel}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Ringkasan booking, slot, dan status pada tanggal yang dipilih.</p>
              </div>
              <button
                type="button"
                onClick={() => state.setIsDetailOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-inset)] hover:text-[var(--color-text)]"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(88vh-92px)] overflow-y-auto px-5 py-5">
              <CalendarDetailContent
                business={props.business}
                selectedDate={props.selectedDate}
                selectedDateLabel={state.selectedDateLabel}
                selectedDateCount={state.selectedDateCount}
                isResourceMode={state.isResourceMode}
                hasFullSlot={state.hasFullSlot}
                visibleResourceDetails={state.visibleResourceDetails}
                hiddenResourceCount={state.hiddenResourceCount}
                selectedSlotSummaries={state.selectedSlotSummaries}
                unassignedSelectedOrders={state.unassignedSelectedOrders}
                visibleSelectedOrders={state.visibleSelectedOrders}
                hiddenSelectedOrderCount={state.hiddenSelectedOrderCount}
                getDraftStatus={state.getDraftStatus}
                getDraftPaymentStatus={state.getDraftPaymentStatus}
                onDraftStatusChange={state.onDraftStatusChange}
                onDraftPaymentChange={state.onDraftPaymentChange}
                onSaveOrder={state.onSaveOrder}
                onQuickAction={state.onQuickAction}
                onDeleteOrder={state.onDeleteOrder}
                invoiceByOrderId={state.invoiceByOrderId}
                creatingInvoiceOrderId={state.creatingInvoiceOrderId}
                onCreateInvoice={state.onCreateInvoice}
                onOpenInvoice={state.onOpenInvoice}
                savingOrderId={state.savingOrderId}
                onToggleClosedDate={state.handleToggleClosedDate}
                viewMode={state.viewMode}
                onSwitchToDayView={() => {
                  state.setViewMode("DAY_TIMELINE");
                  state.setIsDetailOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
});
