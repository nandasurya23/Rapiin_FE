"use client";

import { useMemo } from "react";
import Image from "next/image";
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
import type { Business } from "@/types/business";
import { usePublicOrderForm } from "./hooks/use-public-order-form";
import { PublicOrderReceipt } from "./components/public-order-receipt";

export function PublicOrderForm({
  slug,
  initialBusiness,
}: {
  slug: string;
  initialBusiness?: Business | null;
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
  } = usePublicOrderForm(slug, initialBusiness);

  const waMessage = useMemo(
    () => (business ? createPublicWhatsAppMessage(business, form) : ""),
    [business, form]
  );
  const waLink = useMemo(
    () => (business ? buildWhatsAppUrl(business.whatsappNumber, waMessage) : ""),
    [business, waMessage]
  );

  const timeCandidates = useMemo(() => {
    let startHour = 8;
    let endHour = 21;

    if (business?.openingHours) {
      const parts = business.openingHours.split("-").map((p) => p.trim());
      if (parts.length === 2) {
        const sPart = parseInt(parts[0].split(":")[0], 10);
        const ePart = parseInt(parts[1].split(":")[0], 10);
        if (!isNaN(sPart)) startHour = sPart;
        if (!isNaN(ePart)) endHour = ePart;
      }
    }

    const candidates: string[] = [];
    for (let i = startHour; i <= endHour; i++) {
      candidates.push(`${String(i).padStart(2, "0")}:00`);
      if (i < endHour) {
        candidates.push(`${String(i).padStart(2, "0")}:30`);
      }
    }
    return candidates;
  }, [business?.openingHours]);

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
          <div className="space-y-4 p-6">
            <Badge tone="danger">Link tidak ditemukan</Badge>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)]">
                Form publik belum cocok
              </h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Slug yang dibuka tidak sesuai dengan bisnis yang terdaftar di sistem.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
    <main className="page-enter mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header Bisnis */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 border-b border-[var(--color-border)] pb-6">
        {business.logoUrl ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <Image
              src={business.logoUrl}
              alt={business.name}
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">{business.name}</h1>
          {business.description ? (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{business.description}</p>
          ) : null}
        </div>
      </div>

      {/* Form Order Publik */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {/* Honeypot Spam Protection Field */}
        <input
          type="text"
          name="botField"
          value={form.botField || ""}
          onChange={(e) => updateField("botField", e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Input Fields Container */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3">
            Form Pemesanan
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Nama Lengkap *
              </span>
              <Input
                name="name"
                value={form.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Masukkan nama Anda"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Nomor WhatsApp *
              </span>
              <Input
                name="whatsappNumber"
                value={form.whatsappNumber || ""}
                onChange={(e) => updateField("whatsappNumber", e.target.value)}
                placeholder="Contoh: 08123456789"
                required
              />
            </label>
          </div>

          {business.mode === "BOOKING_SERVICE" && (
            <>
              {catalog.length > 0 && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Pilih Layanan
                  </span>
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

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Tanggal Booking *
                  </span>
                  <DatePicker
                    value={form.scheduledDate || ""}
                    onValueChange={(val) => updateField("scheduledDate", val)}
                  />
                </label>

                {isTimeRequired(business) && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Jam Booking *
                    </span>
                    <Select
                      value={form.scheduledTime || ""}
                      onValueChange={(val) => updateField("scheduledTime", val)}
                      options={timeCandidates.map((t) => ({ value: t, label: t }))}
                    />
                  </label>
                )}
              </div>

              {slotHint ? (
                <div className="rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] p-3 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  💡 {slotHint}
                </div>
              ) : null}
            </>
          )}

          {business.mode === "PRODUCT_ORDER" && (
            <>
              {catalog.length > 0 && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Pilih Produk
                  </span>
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

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Jumlah Pesanan
                  </span>
                  <Input
                    type="number"
                    min={1}
                    value={form.quantity || "1"}
                    onChange={(e) => updateField("quantity", e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Metode Pengiriman / Pengambilan
                  </span>
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
            </>
          )}

          {business.mode === "CUSTOM_REQUEST" && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Detail Request / Kebutuhan *
                </span>
                <Textarea
                  name="requestDetail"
                  value={form.requestDetail || ""}
                  onChange={(e) => updateField("requestDetail", e.target.value)}
                  placeholder="Jelaskan kebutuhan atau spesifikasi khusus..."
                  rows={3}
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Target Tanggal Selesai (Deadline)
                  </span>
                  <DatePicker
                    value={form.deadline || ""}
                    onValueChange={(val) => updateField("deadline", val)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Perkiraan Budget (Opsional)
                  </span>
                  <Input
                    name="budget"
                    value={form.budget || ""}
                    onChange={(e) => updateField("budget", e.target.value)}
                    placeholder="Contoh: Rp 500.000"
                  />
                </label>
              </div>
            </>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Catatan Tambahan (Opsional)
            </span>
            <Textarea
              name="notes"
              value={form.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Catatan khusus untuk pengelola bisnis..."
              rows={2}
            />
          </label>

          {error ? (
            <div className="rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] p-3 text-xs text-[var(--color-danger)] font-bold">
              ⚠️ {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full h-11 font-extrabold text-sm rounded-xl"
            isLoading={isSubmitting}
          >
            Kirim Pemesanan
          </Button>
        </div>
      </form>
    </main>
  );
}
