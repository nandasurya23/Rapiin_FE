"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CalendarDays, PhoneCall, Sparkles, Loader2, Clock, ShoppingBag, ArrowRight, Monitor } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PublicOrderForm } from "./public-order-form";
import { Badge } from "@/components/ui/badge";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
 getPublicCatalog,
 getPublicFormTitle,
 getPublicPageSubtitle,
} from "@/lib/public-business";
import { ROUTES } from "@/lib/routes";
import { apiFetch } from "@/lib/api-client";
import type { Business, BusinessResource } from "@/types/business";
import type { Order } from "@/types/order";

 export function PublicBusinessPage({ slug, initialBusiness }: { slug: string; initialBusiness?: Business | null }) {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(initialBusiness || null);
  const [loading, setLoading] = useState(!initialBusiness);
  const [now, setNow] = useState(new Date());
  const [formDate, setFormDate] = useState<string>("");
  const [formAvailability, setFormAvailability] = useState<Record<string, string[]> | null>(null);

 useEffect(() => {
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
  
  if (!initialBusiness) {
    load();
  }
  
  // Polling every 30 seconds to update live unit statuses
  const interval = setInterval(load, 30000);
  return () => clearInterval(interval);
 }, [slug, initialBusiness]);

 useEffect(() => {
   const timer = setInterval(() => setNow(new Date()), 60000);
   return () => clearInterval(timer);
 }, []);

 const catalog = useMemo(() => business ? getPublicCatalog(business) : [], [business]);
 
  const liveUnitStatuses = useMemo(() => {
    if (!business || business.operationalModel !== "RESOURCE_BOOKING") return [];
    
    const resources = business.resources || [];
    const orders = business.orders || [];
    
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: business.timezone || "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = formatter.format(now);
    
    const targetDate = formDate || todayStr;
    const isTargetingToday = targetDate === todayStr;

    return resources.map((res: BusinessResource) => {
      let inUse = false;
      let bookedToday = false;
      let isFullyBooked = false;

      if (isTargetingToday) {
         // Today's logic
         orders.forEach((order: Partial<Order>) => {
           if (order.resourceId !== res.id && order.resourceId !== "ANY") return;
           if (!order.scheduledDate || !order.scheduledTime) return;
           
           const startStr = `${order.scheduledDate}T${order.scheduledTime}:00`;
           const startTime = new Date(startStr);
           if (isNaN(startTime.getTime())) return;
           
           const endTime = new Date(startTime.getTime() + ((order.bookingDurationMinutes || 60) * 60000));
           
           if (now >= startTime && now <= endTime) {
             inUse = true;
           } else if (startTime > now && order.scheduledDate === todayStr) {
             bookedToday = true;
           }
         });
         
         if (formDate === todayStr && formAvailability) {
            isFullyBooked = Object.keys(formAvailability).length > 0 && !Object.values(formAvailability).some(arr => arr.includes(res.id));
         }
      } else {
         // Future/Past Date
         if (formAvailability) {
            isFullyBooked = Object.keys(formAvailability).length === 0 || (Object.keys(formAvailability).length > 0 && !Object.values(formAvailability).some(arr => arr.includes(res.id)));
            if (!isFullyBooked) {
               const dayOrders = orders.filter((o: Partial<Order>) => (o.resourceId === res.id || o.resourceId === "ANY") && o.scheduledDate === targetDate);
               if (dayOrders.length > 0) {
                 bookedToday = true;
               }
            }
         }
      }
      
      return {
        ...res,
        inUse,
        bookedToday,
        isFullyBooked
      };
    });
  }, [business, now, formDate, formAvailability]);

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
  <main className="page-enter mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-10 space-y-8 pb-32">
   {/* ── SECTION 1: HERO HEADER (PREMIUM DARK NAVY) ── */}
   <section className="animate-fade-up">
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-xl shadow-lg p-6 sm:p-8 md:p-10">
     {/* Decorative gradients */}
          
     <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
       {business.logoUrl ? (
        <div className="relative h-24 w-24 shrink-0 rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5">
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
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-2xl font-black text-[var(--color-text)]">
         {business.name.slice(0, 2).toUpperCase()}
        </div>
       )}

       <div className="space-y-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-elevated)] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] border border-[var(--color-border)]">
         <Sparkles className="h-3 w-3 text-[var(--color-text-muted)]" />
         {business.niche.replace(/_/g, " ")}
        </span>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-[var(--color-text)]">
         {business.name}
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm text-[var(--color-text)]/70 leading-relaxed font-medium">
         {getPublicPageSubtitle(business)}
        </p>
        {business.description && (
         <p className="max-w-2xl text-xs sm:text-sm text-[var(--color-text)]/60 pt-1">{business.description}</p>
        )}
       </div>
      </div>

      <div className="flex flex-wrap gap-3 md:shrink-0 pt-2 md:pt-0">
       <LinkButton 
        href="#order"
        variant="accent"
        className="font-extrabold"
       >
        <CalendarDays className="h-4 w-4" />
        {getPublicFormTitle(business)}
       </LinkButton>
       <LinkButton 
        href={waLink} 
        variant="secondary" 
        className="bg-white/10 text-[var(--color-text)] hover:bg-white/20 border-white/10 font-bold hover:text-[var(--color-text)]"
       >
        <PhoneCall className="h-4 w-4" />
        Chat WhatsApp
       </LinkButton>
      </div>
     </div>

     <div className="my-6 border-t border-[var(--color-border)]" />

     {/* Quick Details Badges Grid */}
     <div className="relative grid gap-3 grid-cols-1 sm:grid-cols-2">
      <div className="rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-4 py-3 space-y-0.5">
       <p className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-wider">Jam Operasional</p>
       <p className="text-xs font-black text-[var(--color-text)]/95 truncate" title={business.openingHours ?? undefined}>{business.openingHours ?? "-"}</p>
      </div>
      <div className="rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-4 py-3 space-y-0.5">
       <p className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-wider">Alamat Fisik</p>
       <p className="text-xs font-black text-[var(--color-text)]/95 truncate" title={business.address ?? undefined}>{business.address ?? "-"}</p>
      </div>
     </div>
    </div>
   </section>

    {/* ── SECTION 2: CATALOG & ACTIONS LAYOUT ── */}
    <section className="flex flex-col gap-12 animate-fade-up-delay-1">
     {/* Live Unit Status (If Resource Booking) */}
     {liveUnitStatuses.length > 0 && (
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-md shadow-lg shadow-black/5 overflow-hidden">
       <div className="bg-[var(--color-surface-elevated)] px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="font-black text-[var(--color-text)] flex items-center gap-2">
         <Monitor className="h-5 w-5 text-[var(--color-primary)]" />
         {formDate && formDate !== new Intl.DateTimeFormat("en-CA", { timeZone: business.timezone || "Asia/Jakarta" }).format(now) ? `Status Unit ${formDate}` : "Status Unit Hari Ini"}
         <span className="text-xs font-normal text-[var(--color-text-secondary)] ml-1">(Real-time)</span>
        </h3>
        <Badge tone="neutral" className="text-[10px] animate-pulse">
         Live
        </Badge>
       </div>
       <div className="p-6">
        <div className="flex flex-wrap gap-4">
         {liveUnitStatuses.map((unit: BusinessResource & { inUse: boolean; bookedToday: boolean; isFullyBooked: boolean; }) => {
          let bgClass = 'bg-[var(--color-success-surface)] border-[var(--color-success-border)] text-[var(--color-success)]';
          let dotClass = 'bg-[var(--color-success)]';
          let labelText = 'Kosong';
          
          if (unit.isFullyBooked) {
            bgClass = 'bg-[var(--color-danger-surface)] border-[var(--color-danger-border)] text-[var(--color-danger)] line-through opacity-80';
            dotClass = 'bg-[var(--color-danger)]';
            labelText = 'Penuh';
          } else if (unit.inUse) {
            bgClass = 'bg-[var(--color-danger-surface)] border-[var(--color-danger-border)] text-[var(--color-danger-hover)]';
            dotClass = 'bg-[var(--color-danger-hover)]';
            labelText = 'Terpakai';
          } else if (unit.bookedToday) {
            bgClass = 'bg-[var(--color-warning-surface)] border-[var(--color-warning-border)] text-[var(--color-warning)]';
            dotClass = 'bg-[var(--color-warning)]';
            labelText = 'Booked';
          }

          return (
            <div key={unit.id} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${bgClass} font-bold text-sm transition-all hover:scale-105`}>
             <div className={`h-2.5 w-2.5 rounded-full ${dotClass} ${unit.inUse ? 'animate-pulse' : ''}`} />
             <span>{unit.name}</span>
             <span className="text-xs font-medium opacity-70 ml-1">({labelText})</span>
            </div>
          );
         })}
        </div>
       </div>
      </div>
     )}

     {/* Top: Services list */}
     <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-xl shadow-lg shadow-black/5">
      <div className="p-8 sm:p-10 space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-border)]/50 pb-4 gap-4">
         <div className="space-y-1">
          <h2 className="text-2xl font-black text-[var(--color-text)] flex items-center gap-2">
           <ShoppingBag className="h-6 w-6 text-[var(--color-primary)]" />
           Daftar Layanan & Produk
          </h2>
         <p className="text-sm text-[var(--color-text-secondary)]">Pilih menu di bawah ini untuk mengisi formulir pemesanan langsung.</p>
        </div>
        <Badge tone="neutral" className="font-extrabold text-sm px-3 py-1 self-start sm:self-auto">{catalog.length} Pilihan</Badge>
       </div>

       <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.length > 0 ? (
         catalog.map((item) => (
          <button
           key={item.id}
           type="button"
           onClick={() => {
             router.push(`?item=${encodeURIComponent(item.id)}#order`, { scroll: true });
           }}
           className="group relative flex flex-col justify-between gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-md p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-elevated)] text-left overflow-hidden"
          >
           {/* Decorative hover gradient */}
           <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
           
           <div className="relative flex items-start justify-between gap-4 w-full">
            <div className="space-y-2">
             <p className="font-black text-lg text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
              {item.name}
             </p>
             {item.description && (
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">{item.description}</p>
             )}
            </div>
             {item.priceLabel && (
              <Badge tone="info" className="font-black text-sm shrink-0 bg-[var(--color-primary-surface)] text-[var(--color-primary)] px-3 py-1 border border-[var(--color-primary)]/20">
               {item.priceLabel}
              </Badge>
             )}
           </div>

           <div className="relative flex items-center justify-between w-full pt-4 mt-2 border-t border-[var(--color-border)]/60">
            {item.durationMinutes ? (
             <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-1 rounded-md">
              <Clock className="h-4 w-4" />
              {item.durationMinutes} menit
             </span>
            ) : (
             <span />
            )}
            <span className="text-sm font-black text-[var(--color-primary)] inline-flex items-center gap-1 group-hover:translate-x-1.5 transition-transform bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg">
             Pilih & Pesan
             <ArrowRight className="h-4 w-4" />
            </span>
           </div>
          </button>
         ))
        ) : (
         <div className="col-span-full rounded-3xl border-2 border-dashed border-[var(--color-border)] p-12 text-center space-y-6 bg-[var(--color-surface-elevated)]/50">
          <div className="space-y-3 max-w-md mx-auto">
           <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-4">
             <ShoppingBag className="h-6 w-6 text-[var(--color-text-muted)]" />
           </div>
           <p className="font-black text-xl text-[var(--color-text)]">Belum Ada Daftar Layanan</p>
           <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
            Daftar layanan atau katalog produk belum dikonfigurasikan. Anda tetap dapat langsung melakukan pemesanan melalui formulir online di bawah.
           </p>
          </div>
          <LinkButton href="#order" className="mx-auto inline-flex h-12 px-8 font-black text-base rounded-xl">
           Isi Formulir Manual
          </LinkButton>
         </div>
        )}
       </div>
      </div>
     </div>

     {/* Bottom: Order Form */}
     <div className="mx-auto w-full max-w-4xl" id="order">
      <div className="mb-8 space-y-2 text-center">
         <h2 className="text-3xl font-black text-[var(--color-text)]">{getPublicFormTitle(business)}</h2>
         <p className="text-base text-[var(--color-text-secondary)]">Silakan lengkapi formulir di bawah ini dengan data yang benar.</p>
      </div>
      <section className="scroll-mt-8 animate-fade-up-delay-2">
       <PublicOrderForm 
         slug={business.slug} 
         initialBusiness={business} 
         onDateChange={setFormDate}
         onAvailabilityChange={setFormAvailability}
       />
      </section>
     </div>
    </section>

   {/* Powered By Rapiin Footer */}
   {/* <div className="mt-12 flex justify-center pb-8 animate-fade-in">
    <a href="/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-85 transition-opacity">
     <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Powered by</span>
     <Image src="/images/rapiin.png" alt="Rapiin" width={80} height={24} className="h-5 w-auto object-contain grayscale hover:grayscale-0 transition-all" />
    </a>
   </div> */}
  </main>
 );
}
