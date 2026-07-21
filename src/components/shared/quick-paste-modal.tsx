"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, AlertTriangle, Check, User, ShoppingBag, DollarSign, CalendarRange, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimeSelect } from "@/components/ui/time-select";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { useOrders } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
import { isValidPhoneNumber, normalizePhoneNumber, parseWhatsAppChatText } from "@/lib/validation";
import { ORDER_STATUS_BY_MODE, PAYMENT_STATUS_LABELS } from "@/lib/constants/orders";
import { formatCurrency } from "@/lib/format";
import { parseIndonesianNumber } from "@/lib/number";
import { BOOKING_HOLD_MINUTES } from "@/lib/booking";
import { cn } from "@/lib/cn";
import type { BusinessMode } from "@/types/business";
import type { OrderStatus, PaymentStatus } from "@/types/order";

type QuickPasteModalProps = {
 isOpen: boolean;
 onClose: () => void;
};

export function QuickPasteModal({ isOpen, onClose }: QuickPasteModalProps) {
 const toast = useToast();
 const { business } = useAppData();
 const { customers } = useCustomers();
 const { createOrder, canCreateOrder } = useOrders();

 const [chatText, setChatText] = useState("");
 const [customerName, setCustomerName] = useState("");
 const [whatsappNumber, setWhatsappNumber] = useState("");
 const [orderTitle, setOrderTitle] = useState("");
 const [notes, setNotes] = useState("");
 const [mode, setMode] = useState<BusinessMode>(business.mode);
 const [status, setStatus] = useState<OrderStatus>("INQUIRY");
 const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
 const [totalAmount, setTotalAmount] = useState("");
 const [dpAmount, setDpAmount] = useState("");
 
 // Booking specific states
 const [scheduledDate, setScheduledDate] = useState("");
 const [scheduledTime, setScheduledTime] = useState("");
 const [bookingDurationMinutes, setBookingDurationMinutes] = useState("60");

 const [error, setError] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);

 // Sync default status when mode changes
 useEffect(() => {
  const statusOptions = ORDER_STATUS_BY_MODE[mode];
  if (statusOptions && statusOptions.length > 0) {
   setStatus(statusOptions[0].value);
  }
 }, [mode]);

 // Handle parsing when chatText changes
 function handleChatPasteChange(text: string) {
  setChatText(text);
  const parsed = parseWhatsAppChatText(text);
  
  if (parsed.name) {
   setCustomerName(parsed.name);
  }
  if (parsed.phone) {
   setWhatsappNumber(parsed.phone);
  }
  if (parsed.orderTitle) {
   setOrderTitle(parsed.orderTitle);
  }
  if (parsed.address) {
   setNotes((currentNotes) => {
    const addressText = `Alamat: ${parsed.address}`;
    if (currentNotes.includes(addressText)) return currentNotes;
    return currentNotes ? `${addressText}\n${currentNotes}`.trim() : addressText;
   });
  }
 }

 // Detect duplicate customer by WA
 const existingCustomer = useMemo(() => {
  const normalized = normalizePhoneNumber(whatsappNumber);
  if (!normalized || normalized.length < 9) return null;
  return customers.find(
   (c) => normalizePhoneNumber(c.whatsappNumber) === normalized
  );
 }, [customers, whatsappNumber]);

 // Balance calculation
 const balanceAmount = useMemo(() => {
  const total = parseIndonesianNumber(totalAmount) ?? 0;
  const dp = parseIndonesianNumber(dpAmount) ?? 0;
  return Math.max(0, total - dp);
 }, [totalAmount, dpAmount]);

 async function handleSubmit() {
  if (!customerName.trim() || !whatsappNumber.trim() || !orderTitle.trim()) {
   setError("Lengkapi nama customer, nomor WhatsApp, dan kebutuhan order dulu.");
   return;
  }

  if (!isValidPhoneNumber(whatsappNumber)) {
   setError("Nomor WhatsApp harus 9-15 digit angka.");
   return;
  }

  setError("");
  setIsSubmitting(true);

  try {
   const normalizedTotal = parseIndonesianNumber(totalAmount);
   const normalizedDp = parseIndonesianNumber(dpAmount);
   const nextHoldExpiresAt =
    mode === "BOOKING_SERVICE" && paymentStatus === "UNPAID" && status === "WAITING_DP"
     ? new Date(Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000).toISOString()
     : undefined;

   createOrder({
    customerName: customerName.trim(),
    whatsappNumber: normalizePhoneNumber(whatsappNumber),
    title: orderTitle.trim(),
    mode,
    status,
    paymentStatus,
    scheduledDate: scheduledDate || undefined,
    scheduledTime: scheduledTime || undefined,
    bookingDurationMinutes: mode === "BOOKING_SERVICE" ? Number(bookingDurationMinutes) : undefined,
    bookingHoldExpiresAt: nextHoldExpiresAt,
    totalAmount: normalizedTotal,
    dpAmount: normalizedDp,
    notes: notes.trim() || undefined,
   });

   toast.success("Order berhasil dibuat lewat Input Cepat!");
   handleClose();
  } catch (err) {
   setError(err instanceof Error ? err.message : "Gagal menambahkan order.");
  } finally {
   setIsSubmitting(false);
  }
 }

 const handleClose = useCallback(() => {
  setChatText("");
  setCustomerName("");
  setWhatsappNumber("");
  setOrderTitle("");
  setNotes("");
  setMode(business.mode);
  setTotalAmount("");
  setDpAmount("");
  setScheduledDate("");
  setScheduledTime("");
  setBookingDurationMinutes("60");
  setError("");
  onClose();
 }, [business.mode, onClose]);

 useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
   if (e.key === "Escape" && isOpen) {
    handleClose();
   }
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [isOpen, handleClose]);

 if (!isOpen) return null;

 const modalContent = (
  <div
   className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
   onClick={(e) => {
    if (e.target === e.currentTarget) handleClose();
   }}
  >
   <div
    className={cn(
     "w-full max-w-2xl max-h-[calc(100vh-96px)] sm:max-h-[90vh] overflow-hidden",
     "rounded-2xl",
     "border border-[var(--color-border-strong)]",
     "bg-[var(--color-surface)]",
     "shadow-[var(--shadow-modal)]",
     "animate-scale-in flex flex-col"
    )}
   >
    {/* Header — Premium gradient to signal power feature */}
    <div className="relative flex items-center justify-between bg-gradient-to-r from-[#0c1d3b] to-[#122a57] px-6 py-5 shrink-0 overflow-hidden border-b border-white/[0.06]">
     <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-400/15 blur-2xl pointer-events-none" />
     <div className="flex items-center gap-3 relative">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 shadow-sm">
       <Sparkles className="h-5 w-5 animate-pulse" />
      </div>
      <div>
       <h3 className="text-base font-black text-white tracking-tight">
        Tempel Chat WA — Input Cepat
       </h3>
       <p className="mt-0.5 text-xs text-white/60">
        Deteksi otomatis nama, nomor WhatsApp, dan alamat pelanggan secara instan.
       </p>
      </div>
     </div>
     <button
      type="button"
      onClick={handleClose}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
     >
      <X className="h-4.5 w-4.5" />
     </button>
    </div>

    {/* Body — scrollable area */}
    <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0 no-scrollbar">
     {/* Paste Text Area */}
     <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] p-5 space-y-3 shadow-inner relative">
      <div className="flex items-center justify-between">
       <span className="block text-xs font-black uppercase tracking-wider text-[var(--color-primary)]">
        📋 Paste Chat WhatsApp Pelanggan
       </span>
       <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider animate-pulse">
        <span className="h-1 w-1 rounded-full bg-emerald-500" />
        Deteksi Otomatis Aktif
       </span>
      </div>
      <Textarea
       value={chatText}
       onChange={(e) => handleChatPasteChange(e.target.value)}
       placeholder="Contoh salin chat:&#10;Randy - 08123456789&#10;Kebutuhan: Booking Studio Musik 2 Jam&#10;Alamat kirim: Jl. Sudirman No 12"
       rows={4}
       className="bg-[var(--color-surface)] border-[var(--color-border-strong)] focus:border-indigo-500 focus:ring-indigo-500/25 rounded-xl shadow-sm text-sm"
      />
     </div>

     {/* Compartmentalized Preview Form */}
     <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
       <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Hasil Ekstraksi & Detail Order</span>
      </div>

      {/* Compartment 1: Data Pelanggan */}
      <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-4 bg-[var(--color-surface-elevated)]/30">
       <div className="flex items-center gap-2 text-[var(--color-primary)] border-b border-[var(--color-border)] pb-2">
        <User className="h-4 w-4" />
        <span className="text-xs font-black uppercase tracking-wider">Data Pelanggan</span>
       </div>
       <div className="grid gap-4 md:grid-cols-2">
        <div className="block">
         <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nama Customer</span>
         <Input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nama customer"
          className="bg-[var(--color-surface)]"
         />
        </div>

        <div className="block">
         <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nomor WhatsApp</span>
         <Input
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="08123456789"
          className="bg-[var(--color-surface)]"
         />
         {existingCustomer && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] px-3 py-2 text-xs text-[var(--color-warning-text)] shadow-sm">
           <span>
            ⚠️ Terdaftar: <strong className="font-bold">{existingCustomer.name}</strong>
           </span>
           {customerName !== existingCustomer.name && (
            <button
             type="button"
             onClick={() => setCustomerName(existingCustomer.name)}
             className="font-extrabold underline text-[var(--color-warning)] hover:text-[var(--color-warning-hover)] transition-colors"
            >
             Gunakan Nama
            </button>
           )}
          </div>
         )}
        </div>
       </div>
      </div>

      {/* Compartment 2: Detail Order & Status */}
      <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-4 bg-[var(--color-surface-elevated)]/30">
       <div className="flex items-center gap-2 text-[var(--color-primary)] border-b border-[var(--color-border)] pb-2">
        <ShoppingBag className="h-4 w-4" />
        <span className="text-xs font-black uppercase tracking-wider">Informasi Kebutuhan & Status</span>
       </div>
       <div className="space-y-4">
        <div className="block">
         <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Kebutuhan / Order</span>
         <Input
          value={orderTitle}
          onChange={(e) => setOrderTitle(e.target.value)}
          placeholder="Misal: Studio Musik 2 Jam / Laundry Express"
          className="bg-[var(--color-surface)]"
         />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
         <div className="block">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Tipe Bisnis</span>
          <Select
           value={mode}
           onValueChange={(val) => setMode(val as BusinessMode)}
           options={[
            { value: "BOOKING_SERVICE", label: "Booking Jasa" },
            { value: "PRODUCT_ORDER", label: "Order Produk" },
            { value: "CUSTOM_REQUEST", label: "Request Custom" },
           ]}
          />
         </div>

         <div className="block">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Status Order</span>
          <Select
           value={status}
           onValueChange={(val) => setStatus(val as OrderStatus)}
           options={ORDER_STATUS_BY_MODE[mode].map((opt) => ({
            value: opt.value,
            label: opt.label,
           }))}
          />
         </div>

         <div className="block">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Status Bayar</span>
          <Select
           value={paymentStatus}
           onValueChange={(val) => setPaymentStatus(val as PaymentStatus)}
           options={Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
           }))}
          />
         </div>
        </div>
       </div>
      </div>

      {/* Compartment 3: Harga & Pembayaran */}
      <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-4 bg-[var(--color-surface-elevated)]/30">
       <div className="flex items-center gap-2 text-[var(--color-primary)] border-b border-[var(--color-border)] pb-2">
        <DollarSign className="h-4 w-4" />
        <span className="text-xs font-black uppercase tracking-wider">Rincian Pembayaran</span>
       </div>
       <div className="grid gap-4 sm:grid-cols-3">
        <div className="block">
         <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Total Harga</span>
         <FormattedNumberInput
          value={totalAmount}
          onValueChange={setTotalAmount}
          placeholder="240000"
         />
        </div>

        <div className="block">
         <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">DP / Uang Muka</span>
         <FormattedNumberInput
          value={dpAmount}
          onValueChange={setDpAmount}
          placeholder="100000"
         />
        </div>

        <div className="block">
         <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Sisa Pelunasan</span>
         <div className="flex h-10 items-center justify-end rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm font-extrabold text-[var(--color-text)]">
          {formatCurrency(balanceAmount)}
         </div>
        </div>
       </div>
      </div>

      {/* Compartment 4: Jadwal Booking */}
      {mode === "BOOKING_SERVICE" && (
       <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-4 bg-[var(--color-surface-elevated)]/30">
        <div className="flex items-center gap-2 text-[var(--color-primary)] border-b border-[var(--color-border)] pb-2">
         <CalendarRange className="h-4 w-4" />
         <span className="text-xs font-black uppercase tracking-wider">Jadwal &amp; Alokasi Booking</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
         <div className="block">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Tanggal</span>
          <DatePicker value={scheduledDate} onValueChange={setScheduledDate} />
         </div>

         <div className="block">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Jam</span>
          <TimeSelect value={scheduledTime} onValueChange={setScheduledTime} />
         </div>

         <div className="block">
          <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Durasi (Menit)</span>
          <Input
           type="number"
           min={15}
           step={15}
           value={bookingDurationMinutes}
           onChange={(e) => setBookingDurationMinutes(e.target.value)}
           className="bg-[var(--color-surface)]"
          />
         </div>
        </div>
       </div>
      )}

      {/* Compartment 5: Catatan / Alamat */}
      <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-4 bg-[var(--color-surface-elevated)]/30">
       <div className="flex items-center gap-2 text-[var(--color-primary)] border-b border-[var(--color-border)] pb-2">
        <StickyNote className="h-4 w-4" />
        <span className="text-xs font-black uppercase tracking-wider">Catatan Tambahan &amp; Alamat</span>
       </div>
       <div className="block">
        <Textarea
         value={notes}
         onChange={(e) => setNotes(e.target.value)}
         placeholder="Masukkan instruksi khusus atau alamat pengiriman customer..."
         rows={3}
         className="bg-[var(--color-surface)]"
        />
       </div>
      </div>
     </div>

     {error && (
      <div className="flex gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 shadow-sm animate-shake">
       <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
       <span>{error}</span>
      </div>
     )}
    </div>

    {/* Footer Actions */}
    <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4 shrink-0 bg-[var(--color-surface-elevated)]/50">
     <Button
      type="button"
      variant="secondary"
      className="rounded-xl h-10 px-5 text-xs font-extrabold border-[var(--color-border)] hover:bg-[var(--color-surface)]"
      onClick={handleClose}
     >
      Batal
     </Button>
     <Button
      type="button"
      isLoading={isSubmitting}
      onClick={() => void handleSubmit()}
      disabled={!canCreateOrder}
      className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white h-10 px-5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-[var(--shadow-sm)] hover:scale-[1.01] active:scale-[0.99] transition-all"
     >
      <Check className="h-4 w-4" />
      Simpan Order
     </Button>
    </div>
   </div>
  </div>
 );

 return createPortal(modalContent, document.body);
}
