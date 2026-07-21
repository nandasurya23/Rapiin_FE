"use client";

import { ClipboardCopy, Link2, QrCode, Share2, ExternalLink, PhoneCall, MapPinned, Sparkles, Clock, Phone, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/lib/routes";
import { buildWhatsAppShareUrl } from "@/lib/whatsapp";
import { getPublicCatalog, getPublicPageSubtitle, getPublicPageTitle } from "@/lib/public-business";
import { formatPhoneNumber } from "@/lib/format";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";

async function copyToClipboard(text: string) {
 await navigator.clipboard.writeText(text);
}

export function BusinessLinkPage() {
 const toast = useToast();
 const { business } = useAppData();
 const [linkType, setLinkType] = useState<"FORM" | "PROFILE">("FORM");
 const [publicUrl, setPublicUrl] = useState(ROUTES.publicBusinessOrder(business.slug));
 const [loadingAction, setLoadingAction] = useState<string | null>(null);
 const catalog = getPublicCatalog(business);

 const activeUrlPath = linkType === "FORM" 
  ? ROUTES.publicBusinessOrder(business.slug) 
  : ROUTES.publicBusiness(business.slug);

 useEffect(() => {
  setPublicUrl(`${window.location.origin}${activeUrlPath}`);
 }, [business.slug, linkType, activeUrlPath]);

 return (
  <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
   {/* SECTION 1: HERO HEADER */}
   <PageHeader
    variant="hero"
    title="Bagikan Link Bisnis Anda"
    description="Rapiin menyediakan landing page khusus bagi pelanggan Anda untuk melihat list layanan catalog, dan melakukan reservasi booking secara instan."
    badge={
     <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
      <Link2 className="h-3.5 w-3.5 text-[var(--color-accent)]" />
      {linkType === "FORM" ? "Link Form Booking" : "Link Profil Publik"}
     </span>
    }
    action={
     <div className="flex flex-wrap gap-2.5 xl:shrink-0">
      <LinkButton href={publicUrl} variant="accent" className="font-bold ">
       Lihat Halaman Publik
      </LinkButton>
      <Button
       type="button"
       variant="secondary"
       className="bg-white/10 text-white hover:bg-white/20 border-white/10 font-bold hover:text-white"
       isLoading={loadingAction === "copy-link"}
       onClick={async () => {
        setLoadingAction("copy-link");
        try {
         await copyToClipboard(publicUrl);
         toast.success("Link publik disalin");
        } finally {
         setLoadingAction(null);
        }
       }}
      >
       <ClipboardCopy className="h-4 w-4" />
       Salin Link
      </Button>
      <Button
       type="button"
       variant="secondary"
       className="bg-white/10 text-white hover:bg-white/20 border-white/10 font-bold hover:text-white"
       isLoading={loadingAction === "share-wa"}
       onClick={async () => {
        setLoadingAction("share-wa");
        window.open(buildWhatsAppShareUrl(publicUrl), "_blank", "noopener,noreferrer");
        toast.info("Share WhatsApp dibuka", "Link bisnis siap dibagikan ke customer.");
        setLoadingAction(null);
       }}
      >
       <Share2 className="h-4 w-4" />
       Share ke WA
      </Button>
     </div>
    }
   />

   {/* SECTION 2: LINK ACTIVE PREVIEW & CONFIGS */}
   <section className="animate-fade-up-delay-1">
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
     <div className="p-5">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
       {/* Copy URL panel */}
       <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
         <div>
          <p className="font-extrabold text-[var(--color-text)] uppercase tracking-wider text-xs">Link Landing Page Aktif</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Gunakan link di bawah pada bio Instagram, TikTok, atau shortcut pesan WhatsApp.</p>
         </div>
         <Link2 className="h-5 w-5 text-[var(--color-primary)] shrink-0" />
        </div>
        
        <div className="flex rounded-xl bg-[var(--color-surface)] p-1 border border-[var(--color-border)]">
         <button
          type="button"
          onClick={() => setLinkType("FORM")}
          className={cn(
           "flex-1 rounded-lg py-1.5 text-[11px] font-extrabold transition-all",
           linkType === "FORM"
            ? "bg-[var(--color-primary)] text-white "
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          )}
         >
          {business.mode === "BOOKING_SERVICE" 
           ? "Form Booking" 
           : business.mode === "PRODUCT_ORDER" 
           ? "Form Order" 
           : "Form Request"} (/order)
         </button>
         <button
          type="button"
          onClick={() => setLinkType("PROFILE")}
          className={cn(
           "flex-1 rounded-lg py-1.5 text-[11px] font-extrabold transition-all",
           linkType === "PROFILE"
            ? "bg-[var(--color-primary)] text-white "
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          )}
         >
          Profil & Katalog (/b)
         </button>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 relative overflow-hidden">
         <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">URL Halaman</p>
          <p className="mt-1.5 break-all font-mono text-xs text-[var(--color-primary)] font-bold">{publicUrl}</p>
         </div>
         <Button
          type="button"
          variant="secondary"
          className="shrink-0 rounded-lg h-9 border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
          onClick={async () => {
           try {
            await copyToClipboard(publicUrl);
            toast.success("Link publik disalin");
           } catch {
            toast.error("Gagal menyalin link.");
           }
          }}
         >
          <ClipboardCopy className="h-4 w-4 text-[var(--color-text)]" />
         </Button>
        </div>
       </div>

       {/* Mode & Operational summary */}
       <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 flex flex-col justify-between">
         <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Mode Bisnis</p>
          <p className="text-sm font-black text-[var(--color-text)] truncate">{business.mode}</p>
         </div>
         <Badge tone="info" className="font-extrabold uppercase text-[8px] tracking-wider self-start">Active Mode</Badge>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 flex flex-col justify-between">
         <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Niche Kategori</p>
          <p className="text-sm font-black text-[var(--color-text)] truncate">{business.niche}</p>
         </div>
         <Badge tone="neutral" className="font-extrabold uppercase text-[8px] tracking-wider self-start">Operational</Badge>
        </div>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* SECTION 3: MOCKUP MOBILE SCREEN & DETAILS */}
   <section className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr] animate-fade-up-delay-2">
    {/* Left Card: Phone Viewport Preview */}
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
     <div className="space-y-5 p-5">
      <div className="border-b border-[var(--color-border)] pb-3">
       <h2 className="text-lg font-bold text-[var(--color-text)]">Preview Landing Page Publik</h2>
       <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{getPublicPageSubtitle(business)}</p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
       {/* Phone Device Mockup Container */}
       <div className="relative mx-auto w-full max-w-[310px] rounded-[2.5rem] border-[8px] border-slate-900 bg-[var(--color-surface)] shadow-2xl overflow-hidden aspect-[9/16] flex flex-col">
        {/* Device speaker/sensor notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center gap-1.5">
         <span className="h-1 w-12 bg-white/20 rounded-full" />
         <span className="h-2 w-2 bg-white/20 rounded-full" />
        </div>
        
        {/* Viewport Screen Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-8 pb-5 space-y-4 no-scrollbar">
         {/* Banner header inside mobile screen */}
         <div className="text-center space-y-1.5 pb-3 border-b border-[var(--color-border)]/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
           <Sparkles className="h-2.5 w-2.5" />
           Live Mockup
          </span>
          <h4 className="text-sm font-extrabold text-[var(--color-text)] leading-tight">{getPublicPageTitle(business)}</h4>
          <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">{business.description}</p>
         </div>

         {/* Catalog List inside mobile screen */}
         <div className="space-y-2.5">
          {catalog.map((item) => (
           <div key={item.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 text-[11px] leading-relaxed">
            <div className="flex items-start justify-between gap-2">
             <div className="min-w-0">
              <p className="font-bold text-[var(--color-text)] truncate">{item.name}</p>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{item.description}</p>
             </div>
             {item.priceLabel && (
              <Badge tone="neutral" className="text-[9px] py-0.5 px-1.5 font-bold shrink-0">{item.priceLabel}</Badge>
             )}
            </div>
           </div>
          ))}
         </div>
        </div>
        
        {/* Mobile action bar footer inside mockup */}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 flex gap-2">
         <LinkButton href={ROUTES.publicBusiness(business.slug)} variant="secondary" className="flex-1 h-8 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Katalog
         </LinkButton>
         <LinkButton href={ROUTES.publicBusinessOrder(business.slug)} className="flex-1 h-8 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1">
          <QrCode className="h-3 w-3" />
          Order Form
         </LinkButton>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Right Card: Info Bisnis */}
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
     <div className="space-y-5 p-5">
      <div className="border-b border-[var(--color-border)] pb-3">
       <h2 className="text-lg font-bold text-[var(--color-text)]">Informasi Kontak Bisnis</h2>
       <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Kontak operasional yang akan diakses oleh customer.</p>
      </div>

      <div className="grid gap-3 text-sm text-[var(--color-text-secondary)]">
       <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 flex items-center gap-3">
        <Phone className="h-5 w-5 text-[var(--color-primary)] shrink-0" />
        <div>
         <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nomor WhatsApp Bisnis</p>
         <p className="mt-0.5 font-bold text-[var(--color-text)]">{formatPhoneNumber(business.whatsappNumber)}</p>
        </div>
       </div>
       <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 flex items-center gap-3">
        <MapPin className="h-5 w-5 text-[var(--color-primary)] shrink-0" />
        <div className="min-w-0">
         <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Alamat Toko / Studio</p>
         <p className="mt-0.5 font-bold text-[var(--color-text)] truncate">{business.address ?? "-"}</p>
        </div>
       </div>
       <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 flex items-center gap-3">
        <Clock className="h-5 w-5 text-[var(--color-primary)] shrink-0" />
        <div>
         <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Jam Operasional</p>
         <p className="mt-0.5 font-bold text-[var(--color-text)]">{business.openingHours ?? "-"}</p>
        </div>
       </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 pt-2">
       <LinkButton
        href={ROUTES.messages(business.slug)}
        variant="secondary"
        className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-11"
       >
        <PhoneCall className="h-4 w-4" />
        Pesan Cepat WA
       </LinkButton>
       <LinkButton
        href={ROUTES.settings(business.slug)}
        variant="secondary"
        className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-11"
       >
        <MapPinned className="h-4 w-4" />
        Ubah Info Bisnis
       </LinkButton>
      </div>
     </div>
    </div>
   </section>
  </main>
 );
}
