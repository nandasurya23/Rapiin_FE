"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CalendarDays, MessageCircleMore, PhoneCall, ExternalLink, Sparkles } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  getPublicCatalog,
  getPublicFormTitle,
  getPublicPageSubtitle,
  getPublicPageTitle,
  isBusinessSlugMatch,
} from "@/lib/public-business";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function PublicBusinessPage({ slug }: { slug: string }) {
  const toast = useToast();
  const { business } = useAppData();
  const isMatch = isBusinessSlugMatch(business, slug);
  const catalog = getPublicCatalog(business);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const publicOrderLink = useMemo(() => ROUTES.publicBusinessOrder(business.slug), [business.slug]);
  const waLink = useMemo(
    () => buildWhatsAppUrl(business.whatsappNumber, `Halo ${business.name}, saya mau tanya tentang layanan/order.`),
    [business.name, business.whatsappNumber]
  );

  if (!isMatch) {
    return (
      <main className="page-enter mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <Card className="w-full">
          <CardBody className="space-y-4 p-6">
            <Badge tone="danger">Link tidak ditemukan</Badge>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)]">Link bisnis belum cocok</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Slug yang dibuka tidak sesuai dengan bisnis aktif di mock data saat ini.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton href={ROUTES.publicBusiness(business.slug)}>Buka Link yang Benar</LinkButton>
              <LinkButton href={ROUTES.publicBusinessOrder(business.slug)} variant="secondary">
                Buka Form Publik
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main className="page-enter mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card className="border-[var(--color-border)] shadow-[var(--shadow-md)]">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                {business.logoUrl && (
                  <Image
                    src={business.logoUrl}
                    alt={business.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 shrink-0 rounded-2xl object-contain border border-[var(--color-border)] bg-white p-1"
                    unoptimized
                  />
                )}
                <div>
                  <Badge tone="info">Public Profile</Badge>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                    {getPublicPageTitle(business)}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                    {getPublicPageSubtitle(business)}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{business.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={publicOrderLink}>{getPublicFormTitle(business)}</LinkButton>
                <LinkButton href={waLink} variant="secondary">
                  <PhoneCall className="h-4 w-4" />
                  Chat WhatsApp
                </LinkButton>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{business.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Info bisnis yang dilihat customer sebelum booking atau order.</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <p className="text-xs text-[var(--color-text-muted)]">Mode</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{business.mode}</p>
                </div>
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <p className="text-xs text-[var(--color-text-muted)]">Niche</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{business.niche}</p>
                </div>
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <p className="text-xs text-[var(--color-text-muted)]">Alamat</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{business.address ?? "-"}</p>
                </div>
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <p className="text-xs text-[var(--color-text-muted)]">Jam buka</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{business.openingHours ?? "-"}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Layanan / Produk</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Customer tinggal pilih yang paling sesuai.</p>
              </div>
              <Badge tone="neutral">{catalog.length} pilihan</Badge>
            </div>
            <div className="grid gap-3">
              {catalog.map((item) => (
                <a
                  key={item.id}
                  href={`${publicOrderLink}?item=${encodeURIComponent(item.id)}`}
                  className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-[var(--color-primary-surface)]/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">{item.name}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.description}</p>
                      <p className="mt-3 text-xs font-medium text-[var(--color-primary)]">Pilih ini dan isi form</p>
                    </div>
                    {item.priceLabel ? <Badge tone="info">{item.priceLabel}</Badge> : null}
                  </div>
                </a>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Aksi cepat</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">Langsung chat atau buka form order/booking.</p>
            </div>
            <div className="grid gap-3">
              <LinkButton href={publicOrderLink}>
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
              >
                <MessageCircleMore className="h-4 w-4" />
                Salin Link WhatsApp
              </Button>
              <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-secondary)]">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                  <p>Form publik disiapkan untuk input singkat, ramah HP, dan langsung ke success state.</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
