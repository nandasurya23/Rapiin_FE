"use client";

import { useState } from "react";
import { CircleDot, ExternalLink, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PaymentStatusBadge, OrderStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import {
  DEFAULT_BOOKING_DURATION_MINUTES,
  getResourceBookingAvailability,
  getResourceBookingDetailsForDate,
  getBookingSlotsForDate
} from "@/lib/booking";
import { getValidStatusOptions, PAYMENT_STATUS_LABELS } from "@/lib/constants/orders";
import type { Business } from "@/types/business";
import type { Invoice } from "@/types/invoice";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { ClosedDaySection } from "./closed-day-section";

type CalendarDetailContentProps = {
  business: Business;
  selectedDate: string;
  selectedDateLabel: string;
  selectedDateCount: number;
  isResourceMode: boolean;
  selectedResourceAvailability: ReturnType<typeof getResourceBookingAvailability>;
  hasFullSlot: boolean;
  hasHoldSlot: boolean;
  visibleResourceDetails: ReturnType<typeof getResourceBookingDetailsForDate>;
  hiddenResourceCount: number;
  selectedSlotSummaries: ReturnType<typeof getBookingSlotsForDate>;
  unassignedSelectedOrders: Order[];
  visibleSelectedOrders: Order[];
  hiddenSelectedOrderCount: number;
  getDraftStatus: (order: Order) => OrderStatus;
  getDraftPaymentStatus: (order: Order) => PaymentStatus;
  onDraftStatusChange: (orderId: string, status: OrderStatus) => void;
  onDraftPaymentChange: (orderId: string, status: PaymentStatus) => void;
  onSaveOrder: (order: Order) => Promise<void>;
  onQuickAction: (
    order: Order,
    patch: Partial<{
      status: OrderStatus;
      paymentStatus: PaymentStatus;
    }>
  ) => Promise<void>;
  invoiceByOrderId: Record<string, Invoice>;
  creatingInvoiceOrderId: string | null;
  onCreateInvoice: (order: Order) => Promise<void>;
  onOpenInvoice: (invoiceCode: string) => void;
  savingOrderId: string | null;
  onToggleClosedDate: (date: string, reason?: string, endDate?: string) => void;
  viewMode: "MONTH" | "DAY_TIMELINE";
  onSwitchToDayView: () => void;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
    hourCycle: "h23",
  }).format(parsedDate);
}

export function CalendarDetailContent({
  business,
  selectedDate,
  selectedDateLabel,
  selectedDateCount,
  isResourceMode,
  selectedResourceAvailability,
  hasFullSlot,
  hasHoldSlot,
  visibleResourceDetails,
  hiddenResourceCount,
  selectedSlotSummaries,
  unassignedSelectedOrders,
  visibleSelectedOrders,
  hiddenSelectedOrderCount,
  getDraftStatus,
  getDraftPaymentStatus,
  onDraftStatusChange,
  onDraftPaymentChange,
  onSaveOrder,
  onQuickAction,
  invoiceByOrderId,
  creatingInvoiceOrderId,
  onCreateInvoice,
  onOpenInvoice,
  savingOrderId,
  onToggleClosedDate,
  viewMode,
  onSwitchToDayView,
}: CalendarDetailContentProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <ClosedDaySection
        selectedDate={selectedDate}
        closedReason={business.closedDates?.[selectedDate]}
        onToggle={(reason, endDate) => onToggleClosedDate(selectedDate, reason, endDate)}
      />

      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Tanggal dipilih</p>
        <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{selectedDateLabel}</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {selectedDateCount ? `${selectedDateCount} order / booking ditemukan` : "Belum ada order / booking pada tanggal ini."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <Badge tone={selectedDateCount <= 0 ? "neutral" : isResourceMode ? selectedResourceAvailability.isFull ? "danger" : selectedResourceAvailability.hasHold ? "warning" : "success" : hasFullSlot ? "danger" : hasHoldSlot ? "warning" : "success"}>
            {selectedDateCount <= 0
              ? "Kosong"
              : isResourceMode
                ? selectedResourceAvailability.isFull
                  ? "Semua unit penuh"
                  : selectedResourceAvailability.hasHold
                    ? "Ada unit ditahan"
                    : `${selectedResourceAvailability.availableResourceCount} unit kosong`
                : hasFullSlot
                  ? "Full"
                  : hasHoldSlot
                    ? "Hold"
                    : `${selectedDateCount} booking`}
          </Badge>
          <Badge tone="neutral">{selectedDate} </Badge>

          {viewMode === "MONTH" && selectedDateCount > 0 ? (
            <button
              type="button"
              onClick={onSwitchToDayView}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-extrabold text-[var(--color-primary)] hover:underline"
            >
              Lihat Timeline Hari Ini →
            </button>
          ) : null}
        </div>
        {business.mode === "BOOKING_SERVICE" && (isResourceMode ? selectedResourceAvailability.hasHold : hasHoldSlot) ? (
          <p className="mt-3 text-xs text-[var(--color-warning-text)]">Ada booking pending DP. Slot akan kembali terbuka setelah hold aktif berakhir.</p>
        ) : null}
      </div>

      {viewMode === "DAY_TIMELINE" && business.mode === "BOOKING_SERVICE" && (
        <>
          {isResourceMode ? (
            <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Unit / slot</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Detail ketersediaan per {business.resourceLabel?.toLowerCase() ?? "unit"} untuk tanggal ini.
                </p>
              </div>
              <div className="space-y-2">
                {visibleResourceDetails.map((resource) => (
                  <div key={resource.resourceId} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">{resource.resourceName}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          {!resource.isActive
                            ? "Sedang dinonaktifkan"
                            : resource.bookings.length
                              ? `${resource.bookings.length} booking pada tanggal ini`
                              : "Belum ada booking pada tanggal ini"}
                        </p>
                      </div>
                      <Badge tone={resource.statusTone}>{resource.statusLabel}</Badge>
                    </div>
                    {resource.earliestHoldExpiresAt ? (
                      <p className="mt-2 text-xs text-[var(--color-warning-text)]">
                        Hold aktif sampai {formatDateTime(resource.earliestHoldExpiresAt.toISOString())}
                      </p>
                    ) : null}
                    {resource.bookings.length ? (
                      <div className="mt-3 space-y-2">
                        {resource.bookings.map((order) => (
                          <div key={order.id} className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-inset)] px-3 py-2 text-xs">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[var(--color-text)]">{order.customerName}</p>
                              <p className="text-[var(--color-text-muted)]">
                                {order.scheduledTime ?? "-"} • {order.bookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES} menit
                              </p>
                            </div>
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {hiddenResourceCount > 0 ? (
                  <div className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface-inset)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                    +{hiddenResourceCount} unit lain disembunyikan dulu supaya detail tetap ringkas.
                  </div>
                ) : null}
              </div>
            </div>
          ) : selectedSlotSummaries.length ? (
            <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Slot jam</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Maksimal {business.bookingCapacity ?? 2} booking untuk slot yang overlap.</p>
              </div>
              <div className="space-y-2">
                {selectedSlotSummaries.map((slot) => (
                  <div key={slot.time} className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{slot.time}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        {slot.count} booking overlap • {slot.holdCount} hold aktif
                      </p>
                    </div>
                    <Badge tone={slot.isFull ? "danger" : slot.holdCount > 0 ? "warning" : "success"}>
                      {slot.isFull ? "Full" : slot.holdCount > 0 ? `Hold ${slot.holdCount}` : "Tersedia"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      {isResourceMode && unassignedSelectedOrders.length ? (
        <div className="space-y-2 rounded-md border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] px-4 py-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Booking belum ditetapkan ke unit</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Ini booking lama yang belum punya {business.resourceLabel?.toLowerCase() ?? "unit"}. Edit dari halaman order supaya availability lebih akurat.
            </p>
          </div>
          {unassignedSelectedOrders.map((order) => (
            <div key={order.id} className="rounded-md border border-[var(--color-warning-border)] bg-[var(--color-surface-inset)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
              <p className="font-medium text-[var(--color-text)]">{order.customerName}</p>
              <p>{order.scheduledTime ?? "-"} • {order.title}</p>
            </div>
          ))}
        </div>
      ) : null}

      {visibleSelectedOrders.length ? (
        <div className="space-y-3">
          {visibleSelectedOrders.map((order) => {
            const linkedInvoice = invoiceByOrderId[order.id];

            if (viewMode === "MONTH") {
              return (
                <div key={order.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm hover:border-[var(--color-border-strong)] transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--color-primary)]">{order.scheduledTime ?? "Jadwal bebas"}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">• {order.bookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES}m</span>
                      </div>
                      <p className="font-extrabold text-sm text-[var(--color-text)] truncate">{order.customerName}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium truncate">{order.title}</p>
                      {order.resourceNameSnapshot && (
                        <Badge tone="info" className="text-[9px] py-0.5 px-1.5">{order.resourceNameSnapshot}</Badge>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-[var(--color-border)]/40">
                    <WhatsAppButton
                      phoneNumber={order.whatsappNumber}
                      message={`Halo ${order.customerName}, saya follow-up untuk ${order.title}.`}
                      label="Hubungi WA"
                      className="text-[11px] h-8 px-3"
                    />
                    {linkedInvoice ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenInvoice(linkedInvoice.invoiceCode)}
                        className="text-[11px] h-8"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Nota
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        isLoading={creatingInvoiceOrderId === order.id}
                        onClick={() => void onCreateInvoice(order)}
                        className="text-[11px] h-8"
                      >
                        <ReceiptText className="h-3 w-3" />
                        Buat Nota
                      </Button>
                    )}
                  </div>
                </div>
              );
            }

            const isEditing = expandedOrderId === order.id;

            return (
              <div key={order.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-sm hover:border-[var(--color-border-strong)] transition space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--color-primary)]">{order.scheduledTime ?? "Jadwal bebas"}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">• {order.bookingDurationMinutes ?? DEFAULT_BOOKING_DURATION_MINUTES}m</span>
                    </div>
                    <p className="font-extrabold text-sm text-[var(--color-text)] truncate">{order.customerName}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] font-medium truncate">{order.title}</p>
                    {order.resourceNameSnapshot && (
                      <Badge tone="info" className="text-[9px] py-0.5 px-1.5">{order.resourceNameSnapshot}</Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)]/40">
                  <WhatsAppButton
                    phoneNumber={order.whatsappNumber}
                    message={`Halo ${order.customerName}, saya follow-up untuk ${order.title}.`}
                    label="Hubungi WA"
                    className="text-[11px] h-8 px-3"
                  />
                  {linkedInvoice ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenInvoice(linkedInvoice.invoiceCode)}
                      className="text-[11px] h-8"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Nota
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={creatingInvoiceOrderId === order.id}
                      onClick={() => void onCreateInvoice(order)}
                      className="text-[11px] h-8"
                    >
                      <ReceiptText className="h-3 w-3" />
                      Buat Nota
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isEditing ? null : order.id)}
                    className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[11px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition"
                  >
                    {isEditing ? "Tutup Edit" : "Ubah Status"}
                  </button>
                </div>

                {isEditing && (
                  <div className="mt-3 space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs">
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-[var(--color-border)]/40">
                      {order.paymentStatus === "UNPAID" && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          isLoading={savingOrderId === order.id}
                          onClick={() => void onQuickAction(order, { paymentStatus: "DP_PAID" })}
                          className="h-7 text-[10px]"
                        >
                          Tandai Sudah DP
                        </Button>
                      )}
                      {order.paymentStatus !== "PAID" && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          isLoading={savingOrderId === order.id}
                          onClick={() => void onQuickAction(order, { paymentStatus: "PAID" })}
                          className="h-7 text-[10px]"
                        >
                          Tandai Lunas
                        </Button>
                      )}
                      {order.status !== "SELESAI" && order.status !== "BATAL" && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          isLoading={savingOrderId === order.id}
                          onClick={() => void onQuickAction(order, { status: "SELESAI" })}
                          className="h-7 text-[10px]"
                        >
                          Tandai Selesai
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status Order</span>
                        <Select
                           value={getDraftStatus(order)}
                           onValueChange={(value) => onDraftStatusChange(order.id, value as OrderStatus)}
                           options={getValidStatusOptions(order.status, order.mode)}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status Bayar</span>
                        <Select
                          value={getDraftPaymentStatus(order)}
                          onValueChange={(value) => onDraftPaymentChange(order.id, value as PaymentStatus)}
                          options={Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
                            value,
                            label,
                          }))}
                        />
                      </label>
                    </div>

                    <Button
                      type="button"
                      isLoading={savingOrderId === order.id}
                      onClick={() => {
                        void onSaveOrder(order);
                        setExpandedOrderId(null);
                      }}
                      className="w-full h-8 text-[11px] font-bold"
                    >
                      Simpan Perubahan
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {hiddenSelectedOrderCount > 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-secondary)]">
              +{hiddenSelectedOrderCount} order lain disembunyikan dulu. Lihat halaman order untuk detail penuh.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-secondary)]">
          Tidak ada detail untuk tanggal ini.
        </div>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm text-[var(--color-text-secondary)]">
        <div className="flex items-start gap-3">
          <CircleDot className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
          <p>Kalender ini dipakai admin buat cek jadwal harian dengan cepat. Klik tanggal lain untuk buka detailnya.</p>
        </div>
      </div>
    </div>
  );
}
