"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CalendarDays, MessageCircleMore, PhoneCall, ExternalLink, Sparkles, Loader2, Clock, Info, ShoppingBag, ArrowRight } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  getPublicCatalog,
  getPublicFormTitle,
  getPublicPageSubtitle,
} from "@/lib/public-business";
import { ROUTES } from "@/lib/routes";
import { apiFetch } from "@/lib/api-client";
import type { Business } from "@/types/business";

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function PublicBusinessPage({ slug, initialBusiness }: { slug: string; initialBusiness?: Business | null }) {
  const toast = useToast();
  const [business, setBusiness] = useState<Business | null>(initialBusiness || null);
  const [loading, setLoading] = useState(!initialBusiness);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (initialBusiness) return;
    async function load() {
      try {
        const data = await apiFetch<Business>(`/api/public/b/${slug}`);
        setBusiness(data);
      } catch (err) {
        console.error("Failed to load public business profile", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, initialBusiness]);

  const catalog = useMemo(() => business ? getPublicCatalog(business) : [], [business]);
  
  const publicOrderLink = useMemo(() => business ? ROUTES.publicBusinessOrder(business.slug) : "", [business]);
  const waLink = useMemo(
    () => business ? buildWhatsAppUrl(business.whatsappNumber, `Halo ${business.name}, saya mau tanya tentang layanan/order.`) : "",
    [business]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </main>
    );
  }

  if (!business) {
    return (
      <main className="page-enter mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <div className="w-full">
          <div className="space-y-4 p-6">
            <Badge tone="danger">Bisnis Tidak Ditemukan</Badge>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)]">Link bisnis belum cocok</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Slug yang dibuka tidak sesuai dengan bisnis yang terdaftar di sistem.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-10 space-y-8">
      {/* ── SECTION 1: HERO HEADER (PREMIUM DARK NAVY) ── */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[0_12px_40px_rgba(14,37,84,0.12)] p-6 sm:p-8 md:p-10 text-white">
          {/* Decorative gradients */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-accent)] opacity-10 blur-[80px]" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[var(--color-primary)] opacity-20 blur-[80px]" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              {business.logoUrl ? (
                <div className="relative h-24 w-24 shrink-0 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/95 p-1.5 shadow-xl">
                  <Image
                    src={business.logoUrl}
                    alt={business.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain rounded-xl"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 text-2xl font-black text-[var(--color-accent)]">
                  {business.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-gold-300)] border border-white/10 backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-[var(--color-accent)]" />
                  {business.niche.replace(/_/g, " ")}
                </span>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
                  {business.name}
                </h1>
                <p className="max-w-2xl text-xs sm:text-sm text-white/70 leading-relaxed font-medium">
                  {getPublicPageSubtitle(business)}
                </p>
                {business.description && (
                  <p className="max-w-2xl text-xs sm:text-sm text-white/60 pt-1">{business.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 md:shrink-0 pt-2 md:pt-0">
              <LinkButton 
                href={publicOrderLink} 
                variant="accent"
                className="font-extrabold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 transition-all duration-300"
              >
                <CalendarDays className="h-4 w-4" />
                {getPublicFormTitle(business)}
              </LinkButton>
              <LinkButton 
                href={waLink} 
                variant="secondary" 
                className="bg-white/10 text-white hover:bg-white/20 border-white/10 font-bold hover:text-white"
              >
                <PhoneCall className="h-4 w-4" />
                Chat WhatsApp
              </LinkButton>
            </div>
          </div>

          <div className="my-6 border-t border-white/10" />

          {/* Quick Details Badges Grid */}
          <div className="relative grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 space-y-0.5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Mode Operasional</p>
              <p className="text-xs font-black text-white/95">{business.mode.replace(/_/g, " ")}</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 space-y-0.5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Kategori Bisnis</p>
              <p className="text-xs font-black text-white/95">{business.niche.replace(/_/g, " ")}</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 space-y-0.5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Jam Operasional</p>
              <p className="text-xs font-black text-white/95 truncate" title={business.openingHours ?? undefined}>{business.openingHours ?? "-"}</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 space-y-0.5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Alamat Fisik</p>
              <p className="text-xs font-black text-white/95 truncate" title={business.address ?? undefined}>{business.address ?? "-"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CATALOG & ACTIONS LAYOUT ── */}
      <section className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] animate-fade-up-delay-1">
        {/* Left Column: Services list */}
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-xl font-black text-[var(--color-text)] flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[var(--color-primary)]" />
                  Daftar Layanan & Produk
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">Pilih menu di bawah ini untuk mengisi formulir pemesanan langsung.</p>
              </div>
              <Badge tone="neutral" className="font-extrabold">{catalog.length} Pilihan</Badge>
            </div>

            <div className="grid gap-3">
              {catalog.length > 0 ? (
                catalog.map((item) => (
                  <a
                    key={item.id}
                    href={`${publicOrderLink}?item=${encodeURIComponent(item.id)}`}
                    className="group flex flex-col justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-elevated)] hover:"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-extrabold text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{item.description}</p>
                        )}
                      </div>
                      {item.priceLabel && (
                        <Badge tone="info" className="font-extrabold text-xs shrink-0 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {item.priceLabel}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]/30">
                      {item.durationMinutes ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-text-muted)]">
                          <Clock className="h-3 w-3" />
                          Durasi: {item.durationMinutes} menit
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="text-[10px] font-extrabold text-[var(--color-primary)] inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Pilih & Pesan
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center space-y-4 bg-[var(--color-surface)]">
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <p className="font-extrabold text-base text-[var(--color-text)]">Belum Ada Daftar Layanan/Produk</p>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      Daftar layanan atau katalog produk belum dikonfigurasikan. Anda tetap dapat langsung melakukan pemesanan melalui formulir online kami.
                    </p>
                  </div>
                  <LinkButton href={publicOrderLink} className="mx-auto inline-flex ">
                    Isi Formulir Pemesanan Langsung
                  </LinkButton>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Action Cards */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="p-6 space-y-4">
              <div className="border-b border-[var(--color-border)]/50 pb-3">
                <h2 className="text-lg font-black text-[var(--color-text)]">Aksi Cepat</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">Hubungi admin atau buka formulir pemesanan.</p>
              </div>

              <div className="grid gap-3">
                <LinkButton href={publicOrderLink} className="w-full flex justify-center py-2.5 font-extrabold text-xs ">
                  <ExternalLink className="h-4 w-4" />
                  {getPublicFormTitle(business)}
                </LinkButton>
                
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={loadingAction === "copy-wa-link"}
                  onClick={async () => {
                    setLoadingAction("copy-wa-link");
                    try {
                      await copyToClipboard(waLink);
                      toast.success("Link WhatsApp disalin");
                    } finally {
                      setLoadingAction(null);
                    }
                  }}
                  className="w-full justify-center py-2.5 font-bold text-xs border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
                >
                  <MessageCircleMore className="h-4 w-4" />
                  Salin Link WhatsApp
                </Button>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-xs text-[var(--color-text-secondary)] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Info className="mt-0.5 h-4.5 w-4.5 text-[var(--color-primary)] shrink-0" />
                    <div>
                      <p className="font-bold text-[var(--color-text)]">Konfirmasi WhatsApp</p>
                      <p className="mt-0.5 leading-relaxed text-[11px]">
                        Setiap pemesanan yang diajukan akan dikonfirmasi secara resmi dan otomatis melalui nomor WhatsApp terdaftar kami.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Powered By Rapiin Footer */}
      <div className="mt-12 flex justify-center pb-8 animate-fade-in">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-85 transition-opacity">
          <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Powered by</span>
          <Image src="/images/rapiin.png" alt="Rapiin" width={80} height={24} className="h-5 w-auto object-contain grayscale hover:grayscale-0 transition-all" />
        </a>
      </div>
    </main>
  );
}
