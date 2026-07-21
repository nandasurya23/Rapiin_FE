"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { useAppData } from "@/components/providers/app-data-provider";
import { ROUTES } from "@/lib/routes";

export default function AssistantPage() {
  const router = useRouter();
  const {
    business,
    subscriptionForCurrentBusiness
  } = useAppData();

  const planCode = subscriptionForCurrentBusiness?.planCode || "FREE_TRIAL";

  useEffect(() => {
    if (planCode !== "PREMIUM") {
      router.replace(ROUTES.dashboard(business.slug));
    }
  }, [planCode, router, business.slug]);

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <PageHeader
        variant="hero"
        title="Rapiin Input Helper Console"
        description="Operasionalkan bisnis Anda secara cepat menggunakan pencocokan kata kunci kalimat offline. Tambah order, ubah status pembayaran, terbitkan nota, atau tambah customer dalam hitungan detik secara lokal."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)] animate-pulse" />
            Asisten Pintar Perintah
          </span>
        }
        action={
          <div className="flex flex-wrap gap-2.5 xl:shrink-0">
            <LinkButton href={ROUTES.dashboard(business.slug)} variant="accent" className="shadow-sm">
              Ke Dashboard
            </LinkButton>
          </div>
        }
      />

      <section className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-2xl mx-auto">
        <div className="w-full border-amber-500/20 bg-gradient-to-b from-[var(--color-surface-elevated)] to-[var(--color-surface)] shadow-sm overflow-hidden relative">
          {/* Accent glow top */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />
          
          <div className="p-8 sm:p-12 space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
                Coming Soon
              </h2>
              <p className="text-sm font-semibold text-amber-500 uppercase tracking-widest">
                Premium Plan Exclusive
              </p>
            </div>
            
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Fitur <strong>Asisten Pintar (Assistant Manager)</strong> sedang dalam tahap pengembangan dan akan segera hadir secara eksklusif untuk pengguna paket <strong>Premium</strong>. 
              Gunakan fitur ini nantinya untuk mempercepat input data pelanggan, booking, dan invoice hanya dengan satu baris perintah teks.
            </p>
            
            <div className="border-t border-[var(--color-border)]/60 pt-6">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-surface-elevated)] px-4 py-2 border border-[var(--color-border)]">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">Sedang disempurnakan oleh tim Rapiin</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
