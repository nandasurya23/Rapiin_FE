"use client";

import { useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/routes";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { createPublicWhatsAppMessage } from "@/features/public-business/utils/whatsapp-builder";
import {
  getPublicCatalog,
  isBusinessSlugMatch,
  isTimeRequired,
} from "@/lib/public-business";
import type { Business, BusinessResource } from "@/types/business";
import { usePublicOrderForm } from "../hooks/use-public-order-form";
import { PublicOrderReceipt } from "./public-order-receipt";
import { TempPaymentProofUpload } from "./temp-payment-proof-upload";
import { formatCurrency } from "@/lib/format";

export function ResourceBookingForm({
  slug,
  initialBusiness,
  onDateChange,
  onAvailabilityChange,
}: {
  slug: string;
  initialBusiness?: Business | null;
  onDateChange?: (date: string) => void;
  onAvailabilityChange?: (availability: Record<string, string[]>) => void;
}) {
  const {
    business,
    loading,
    form,
    submitted,
    setSubmitted,
    error,
    isSubmitting,
    slotHint,
    updateField,
    handleSelectCatalogItem,
    handleSubmit,
    totalSteps,
    currentStep,
    canGoNext,
    handleNextStep,
    handlePrevStep,
    isResourceBooking,
    availableTimes,
    insufficientTimes,
    passedTimes,
    availableResourcesByTime,
    loadingAvailability,
    totalAmount,
  } = usePublicOrderForm(slug, initialBusiness);

  useEffect(() => {
    if (onDateChange) {
      onDateChange(form.scheduledDate);
    }
  }, [form.scheduledDate, onDateChange]);

  useEffect(() => {
    if (onAvailabilityChange && !loadingAvailability) {
      onAvailabilityChange(availableResourcesByTime);
    }
  }, [availableResourcesByTime, loadingAvailability, onAvailabilityChange]);

  const waMessage = useMemo(
    () => (business ? createPublicWhatsAppMessage(business, form) : ""),
    [business, form]
  );
  const waLink = useMemo(
    () => (business ? buildWhatsAppUrl(business.whatsappNumber, waMessage) : ""),
    [business, waMessage]
  );

  const isResourceAvailableForDate = (resourceId: string) => {
    if (!form.scheduledDate) return true; 
    if (Object.keys(availableResourcesByTime).length === 0 && !loadingAvailability) return false;
    return Object.values(availableResourcesByTime).some(arr => arr.includes(resourceId));
  };

  // 1D Fix: slot list derived solely from API response — no client-side recalculation
  // This ensures FE and BE are always in sync (no mismatch risk)
  const derivedSlotTimes = useMemo(() => {
    const all = new Set([...availableTimes, ...insufficientTimes, ...passedTimes]);
    // Sort chronologically
    return Array.from(all).sort();
  }, [availableTimes, insufficientTimes, passedTimes]);

  if (loading || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </main>
    );
  }

  const isMatch = isBusinessSlugMatch(business, slug);
  const catalog = getPublicCatalog(business);

  if (!isMatch) {
    return (
      <main className="page-enter mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <div className="w-full">
          <div className="space-y-4 p-6 text-center">
            <Badge tone="danger">Link tidak ditemukan</Badge>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)]">
                Form publik belum cocok
              </h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Slug yang dibuka tidak sesuai dengan bisnis yang terdaftar di sistem.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <LinkButton href={ROUTES.publicBusiness(business.slug)}>
                Buka Halaman Bisnis
              </LinkButton>
              <LinkButton href="/dashboard" variant="secondary">
                Kembali ke App
              </LinkButton>
            </div>
          </div>
        </div>
      </main>
    );
  }



  if (submitted) {
    return (
      <PublicOrderReceipt
        business={business}
        form={form}
        waLink={waLink}
        onReset={() => setSubmitted(false)}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Form Order Publik */}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <input
          type="text"
          name="botField"
          value={form.botField || ""}
          onChange={(e) => updateField("botField", e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-xl p-8 sm:p-10 space-y-6 shadow-xl shadow-black/5">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 mb-6">
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              Form Pemesanan
            </h2>
            <div className="flex gap-1">
               {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className={`h-1.5 w-6 rounded-full ${i + 1 <= currentStep ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
               ))}
            </div>
          </div>

          {/* STEP 1: LAYANAN / PRODUK */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               {business.mode === "BOOKING_SERVICE" && (
                 <>
                   {catalog.length > 0 && (
                     <label className="block">
                       <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Pilih Layanan</span>
                       <Select
                         value={form.serviceId || (form.service ? "CUSTOM" : "")}
                         onValueChange={(val) => {
                           if (val === "CUSTOM") {
                             updateField("serviceId", "");
                             updateField("service", "");
                           } else {
                             handleSelectCatalogItem(val);
                           }
                         }}
                         options={[
                           ...catalog.map((c) => ({
                             value: c.id,
                             label: `${c.name} ${c.priceLabel ? `(${c.priceLabel})` : ""}`,
                           })),
                           { value: "CUSTOM", label: "Layanan Custom / Lainnya" }
                         ]}
                       />
                     </label>
                   )}
                   {(!form.serviceId || !catalog.find(c => c.id === form.serviceId)) && (
                     <div className="grid gap-4 md:grid-cols-2">
                       <label className="block">
                         <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Layanan *</span>
                         <Input
                           name="service"
                           value={form.service || ""}
                           onChange={(e) => updateField("service", e.target.value)}
                           placeholder="Contoh: Layanan Konsultasi"
                           required
                         />
                       </label>
                       {isResourceBooking && (
                         <label className="block">
                           <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Durasi (Jam) *</span>
                           <Input
                             name="bookingDurationMinutes"
                             type="number"
                             min="0.5"
                             step="0.5"
                             value={form.bookingDurationMinutes ? String(Number(form.bookingDurationMinutes) / 60) : ""}
                             onChange={(e) => {
                               const val = Number(e.target.value);
                               if (val > 0) updateField("bookingDurationMinutes", String(val * 60));
                               else updateField("bookingDurationMinutes", "");
                             }}
                             placeholder="Contoh: 3"
                             required
                           />
                         </label>
                       )}
                     </div>
                   )}
                 </>
               )}


               {business.mode === "PRODUCT_ORDER" && (
                 <>
                   {catalog.length > 0 && (
                     <label className="block">
                       <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Pilih Produk</span>
                       <Select
                         value={form.serviceId || ""}
                         onValueChange={(val) => handleSelectCatalogItem(val)}
                         options={catalog.map((c) => ({
                           value: c.id,
                           label: `${c.name} ${c.priceLabel ? `(${c.priceLabel})` : ""}`,
                         }))}
                       />
                     </label>
                   )}
                 </>
               )}

               {business.mode === "CUSTOM_REQUEST" && (
                 <label className="block">
                   <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Detail Request / Kebutuhan *</span>
                   <Textarea
                     name="requestDetail"
                     value={form.requestDetail || ""}
                     onChange={(e) => updateField("requestDetail", e.target.value)}
                     placeholder="Jelaskan kebutuhan atau spesifikasi khusus..."
                     rows={3}
                     required
                   />
                 </label>
               )}
            </div>
          )}

          {/* 2A: Staff preference — opsional, hanya untuk APPOINTMENT mode dengan staf aktif */}
          {currentStep === 1 && !isResourceBooking && business.mode === "BOOKING_SERVICE" &&
            (business.resources?.filter((r: BusinessResource) => r.isActive).length ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]/50 space-y-3 animate-in fade-in duration-300">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Preferensi Staf (Opsional)
                </span>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Pilih kapster/terapis yang diinginkan. Jika tidak memilih, siapapun yang tersedia akan melayani Anda.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateField("staffPreferenceName", "")}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    !form.staffPreferenceName
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50"
                  }`}
                >
                  Siapapun
                </button>
                {business.resources
                  ?.filter((r: BusinessResource) => r.isActive)
                  .map((r: BusinessResource) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => updateField("staffPreferenceName", r.name)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        form.staffPreferenceName === r.name
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                          : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5"
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
              </div>
              {form.staffPreferenceName && (
                <p className="text-xs text-[var(--color-text-muted)] italic">
                  ✓ Preferensi: <span className="font-bold not-italic text-[var(--color-text)]">{form.staffPreferenceName}</span>
                  {" "}— tidak wajib, pemilik bisnis akan berusaha memenuhi preferensi ini.
                </p>
              )}
            </div>
          )}

          {/* STEP 3 (Resource Booking) or STEP 2 (Other Modes): DATE & TIME / QTY */}
          {((isResourceBooking && currentStep === 3) || (!isResourceBooking && currentStep === 2)) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               {business.mode === "BOOKING_SERVICE" && (
                 <>
                   {!isResourceBooking && (
                     <label className="block">
                       <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal Booking *</span>
                       <DatePicker
                         value={form.scheduledDate || ""}
                         onValueChange={(val) => {
                           updateField("scheduledDate", val);
                           setTimeout(() => {
                             window.scrollBy({ top: 300, behavior: "smooth" });
                           }, 100);
                         }}
                       />
                     </label>
                   )}
                   
                   {form.scheduledDate && isTimeRequired(business) && (
                     <div className="space-y-3 mt-4 pt-4 border-t border-[var(--color-border)]/50">
                       <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Pilih Jam yang Tersedia</span>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                          {derivedSlotTimes.length === 0 && !loadingAvailability ? (
                            <p className="col-span-full text-xs text-[var(--color-text-secondary)] py-4">
                              {form.scheduledDate ? "Tidak ada slot tersedia di tanggal ini." : "Pilih tanggal untuk melihat slot tersedia."}
                            </p>
                          ) : (
                          derivedSlotTimes.map((time) => {
                           const isPassed = passedTimes.includes(time);
                           const isAvailable = isResourceBooking && form.resourceId && form.resourceId !== "ANY"
                             ? !!availableResourcesByTime[time]?.includes(form.resourceId)
                             : availableTimes.includes(time);
                           const isInsufficient = insufficientTimes.includes(time);
                           const isBooked = !isAvailable && !isInsufficient && !isPassed;
                           const isSelected = form.scheduledTime === time;

                           return (
                             <button
                               key={time}
                               type="button"
                               onClick={() => {
                                 if (isAvailable && !loadingAvailability) updateField("scheduledTime", time);
                               }}
                               disabled={!isAvailable || loadingAvailability}
                               className={`px-3 py-3.5 rounded-xl border text-center transition-all ${
                                 loadingAvailability
                                   ? "bg-gray-100 border-gray-200 text-gray-300 opacity-50 cursor-not-allowed animate-pulse"
                                   : isPassed
                                   ? "bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed opacity-60 line-through"
                                   : isInsufficient
                                   ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-80"
                                   : isBooked
                                   ? "bg-[var(--color-danger-surface)] border-[var(--color-danger-border)] text-[var(--color-danger)] cursor-not-allowed line-through opacity-80"
                                   : isSelected
                                   ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md scale-105 font-bold"
                                   : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 active:scale-95 text-[var(--color-text)] font-semibold"
                               }`}
                               title={loadingAvailability ? "Mengecek..." : isPassed ? "Waktu sudah berlalu" : isInsufficient ? "Durasi pesanan melewati jam tutup operasional" : isBooked ? "Sudah dipesan / Penuh" : "Tersedia"}
                             >
                               <span className="text-sm md:text-base">{time}</span>
                             </button>
                           );
                         })
                         )}
                        </div>
                       
                       <div className="flex flex-wrap items-center gap-4 mt-4 mb-2">
                         <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                           <div className="h-3 w-3 rounded-full bg-[var(--color-primary)]" /> Dipilih
                         </div>
                         <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                           <div className="h-3 w-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]" /> Tersedia
                         </div>
                         <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                           <div className="h-3 w-3 rounded-full bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] relative after:content-[''] after:absolute after:w-full after:h-[1px] after:bg-[var(--color-danger)] after:top-1/2 after:-translate-y-1/2" /> Sudah Dipesan
                         </div>
                         <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                           <div className="h-3 w-3 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]" /> Tidak Cukup / Lewat
                         </div>
                       </div>
                       {slotHint && (
                         <div className="rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] p-3 text-xs text-[var(--color-text-secondary)] leading-relaxed mt-4">
                           💡 {slotHint}
                         </div>
                       )}
                     </div>
                   )}
                 </>
               )}

               {business.mode === "PRODUCT_ORDER" && (
                 <div className="grid gap-4 md:grid-cols-2">
                   <label className="block">
                     <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Jumlah Pesanan</span>
                     <Input
                       type="number"
                       min={1}
                       value={form.quantity || "1"}
                       onChange={(e) => updateField("quantity", e.target.value)}
                     />
                   </label>
                   <label className="block">
                     <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Metode Pengiriman / Pengambilan</span>
                     <Select
                       value={form.deliveryMethod || ""}
                       onValueChange={(val) => updateField("deliveryMethod", val)}
                       options={[
                         { value: "AMBIL_SENDIRI", label: "Ambil di Toko / Lokasi" },
                         { value: "DIKIRIM", label: "Kirim via Kurir" },
                       ]}
                     />
                   </label>
                 </div>
               )}

               {business.mode === "CUSTOM_REQUEST" && (
                 <div className="grid gap-4 md:grid-cols-2">
                   <label className="block">
                     <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Target Tanggal Selesai (Deadline)</span>
                     <DatePicker
                       value={form.deadline || ""}
                       onValueChange={(val) => updateField("deadline", val)}
                     />
                   </label>
                   <label className="block">
                     <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Perkiraan Budget (Opsional)</span>
                     <Input
                       name="budget"
                       value={form.budget || ""}
                       onChange={(e) => updateField("budget", e.target.value)}
                       placeholder="Contoh: Rp 500.000"
                     />
                   </label>
                 </div>
               )}
            </div>
          )}

          {isResourceBooking && currentStep === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <label className="block">
                 <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Tanggal Booking *</span>
                 <DatePicker
                   value={form.scheduledDate || ""}
                   onValueChange={(val) => updateField("scheduledDate", val)}
                 />
               </label>
               
               <label className="block">
                 <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Pilih Unit / Staf</span>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                     <button
                        type="button"
                        onClick={() => updateField("resourceId", "ANY")}
                        className={`px-3 py-3 rounded-xl border text-center transition-all ${form.resourceId === "ANY"
                           ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md font-bold scale-105"
                           : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50 text-[var(--color-text)] font-semibold"
                        }`}
                     >
                        <span className="text-sm">Bebas / Siapapun</span>
                     </button>
                     {business.resources?.filter(r => r.isActive).map(r => {
                        const isSelected = form.resourceId === r.id;
                        const isAvailable = isResourceAvailableForDate(r.id);
                        
                        return (
                           <button
                              key={r.id}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => {
                                if (isAvailable) updateField("resourceId", r.id);
                              }}
                              title={isAvailable ? "Pilih Unit" : "Full Booked di Tanggal Ini"}
                              className={`px-3 py-3 rounded-xl border text-center transition-all ${
                                 !isAvailable
                                   ? "bg-[var(--color-danger-surface)] border-[var(--color-danger-border)] text-[var(--color-danger)] cursor-not-allowed opacity-80 line-through"
                                   : isSelected
                                   ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md font-bold scale-105"
                                   : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50 text-[var(--color-text)] font-semibold hover:bg-[var(--color-primary)]/5"
                              }`}
                           >
                              <span className="text-sm">{r.name}</span>
                              {!isAvailable && <span className="block text-[10px] text-[var(--color-danger)] font-bold mt-1">Penuh</span>}
                           </button>
                        );
                     })}
                  </div>
                </label>
             </div>
          )}

          {/* STEP 3/4: USER DATA */}
          {currentStep === totalSteps && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="grid gap-4 md:grid-cols-2">
                 <label className="block">
                   <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Lengkap *</span>
                   <Input
                     name="name"
                     value={form.name || ""}
                     onChange={(e) => updateField("name", e.target.value)}
                     placeholder="Masukkan nama Anda"
                     required
                   />
                 </label>
                 <label className="block">
                   <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nomor WhatsApp *</span>
                   <Input
                     name="whatsappNumber"
                     value={form.whatsappNumber || ""}
                     onChange={(e) => updateField("whatsappNumber", e.target.value)}
                     placeholder="Contoh: 08123456789"
                     required
                   />
                 </label>
               </div>
               <label className="block">
                 <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Catatan Tambahan (Opsional)</span>
                 <Textarea
                   name="notes"
                   value={form.notes || ""}
                   onChange={(e) => updateField("notes", e.target.value)}
                   placeholder="Catatan khusus untuk pengelola bisnis..."
                   rows={2}
                 />
               </label>

               {error && (
                 <div className="rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] p-3 text-xs text-[var(--color-danger)] font-bold">
                   ⚠️ {error}
                 </div>
               )}
               
               {business.paymentTiming === "PAYMENT_ON_BOOKING" && business.mode !== "CUSTOM_REQUEST" && (
                 <div className="mt-6 border-t border-[var(--color-border)]/50 pt-6">
                   {totalAmount > 0 ? (
                     <div className="mb-4 bg-[var(--color-surface-elevated)] p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
                       <span className="text-sm font-bold text-[var(--color-text)]">Total Tagihan:</span>
                       <span className="text-lg font-black text-[var(--color-primary)]">{formatCurrency(totalAmount)}</span>
                     </div>
                   ) : (
                     <div className="mb-4 bg-[var(--color-surface-elevated)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col">
                       <span className="text-sm font-bold text-[var(--color-text)] mb-1">Total Tagihan Belum Ditentukan</span>
                       <span className="text-xs text-[var(--color-text-secondary)]">Silakan unggah bukti transfer DP atau hubungi admin untuk nominal pastinya.</span>
                     </div>
                   )}
                   
                   <TempPaymentProofUpload
                     businessSlug={business.slug}
                     onUploadSuccess={(url, hash) => {
                       updateField("tempProofUrl", url);
                       updateField("tempProofHash", hash);
                     }}
                     onClear={() => {
                       updateField("tempProofUrl", "");
                       updateField("tempProofHash", "");
                     }}
                   />
                 </div>
               )}
             </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center gap-4 pt-6 mt-4 border-t border-[var(--color-border)]">
             {currentStep > 1 && (
                <Button type="button" variant="secondary" onClick={handlePrevStep} className="flex-1 h-12 font-bold text-base rounded-xl">
                   Kembali
                </Button>
             )}
             
             {currentStep < totalSteps ? (
                <Button 
                   type="button" 
                   onClick={handleNextStep} 
                   className="flex-1 h-12 font-bold text-base rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-lg shadow-[var(--color-primary)]/20 hover:-translate-y-0.5 transition-all"
                   disabled={!canGoNext}
                >
                   Lanjut ke Tahap {currentStep + 1}
                </Button>
             ) : (
                <Button
                   type="submit"
                   className="flex-1 h-12 font-black text-base rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-lg shadow-[var(--color-primary)]/20 hover:-translate-y-0.5 transition-all"
                   isLoading={isSubmitting}
                   disabled={(business.paymentTiming === "PAYMENT_ON_BOOKING" && business.mode !== "CUSTOM_REQUEST" && !form.tempProofUrl)}
                >
                   {business.paymentTiming === "PAYMENT_ON_BOOKING" && business.mode !== "CUSTOM_REQUEST" && !form.tempProofUrl 
                      ? "Unggah Bukti Dahulu" 
                      : "Kirim Pemesanan"}
                </Button>
             )}
          </div>
        </div>
      </form>
    </div>
  );
}
