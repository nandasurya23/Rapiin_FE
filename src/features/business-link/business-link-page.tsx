"use client";

import { ClipboardCopy, Link2, QrCode, Share2, ExternalLink, PhoneCall, MapPinned } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { ROUTES } from "@/lib/routes";
import { buildWhatsAppShareUrl } from "@/lib/whatsapp";
import { getPublicCatalog, getPublicPageSubtitle, getPublicPageTitle } from "@/lib/public-business";
import { formatPhoneNumber } from "@/lib/format";
import { useAppData } from "@/components/providers/app-data-provider";

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function BusinessLinkPage() {
  const toast = useToast();
  const { business } = useAppData();
  const [publicUrl, setPublicUrl] = useState(ROUTES.publicBusiness(business.slug));
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const catalog = getPublicCatalog(business);

  useEffect(() => {
    setPublicUrl(`${window.location.origin}${ROUTES.publicBusiness(business.slug)}`);
  }, [business.slug]);

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  Link Bisnis
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">Bagikan link bisnis yang rapi</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Dari sini customer bisa lihat layanan, buka halaman publik, dan isi form sesuai mode bisnis tanpa perlu tanya ulang.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={ROUTES.publicBusiness(business.slug)}>Lihat Halaman Publik</LinkButton>
                <Button
                  type="button"
                  variant="secondary"
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
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">Link aktif</p>
                    <p className="mt-1 text-text-secondary">Public link yang siap dibuka dan dibagikan ke customer.</p>
                  </div>
                  <Link2 className="h-5 w-5 text-brand-700" />
                </div>
                <div className="mt-4 rounded-xl border border-border/70 bg-surface px-4 py-4">
                  <p className="text-xs text-text-muted">URL</p>
                  <p className="mt-1 break-all font-medium text-text-primary">{publicUrl}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Mode</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{business.mode}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Niche</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{business.niche}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Preview halaman publik</h2>
              <p className="text-sm text-text-secondary">{getPublicPageSubtitle(business)}</p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{business.name}</p>
                  <h3 className="mt-1 text-xl font-semibold text-text-primary">{getPublicPageTitle(business)}</h3>
                </div>
                <Badge tone="info">Siap dibagikan</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-text-secondary">{business.description}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {catalog.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/80 bg-surface px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">{item.name}</p>
                        <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
                      </div>
                      {item.priceLabel ? <Badge tone="neutral">{item.priceLabel}</Badge> : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <LinkButton href={ROUTES.publicBusiness(business.slug)} variant="secondary">
                  <ExternalLink className="h-4 w-4" />
                  Buka Halaman
                </LinkButton>
                <LinkButton href={ROUTES.publicBusinessOrder(business.slug)}>
                  <QrCode className="h-4 w-4" />
                  Buka Form
                </LinkButton>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Info bisnis</h2>
              <p className="text-sm text-text-secondary">Yang tampil di halaman publik customer.</p>
            </div>

            <div className="grid gap-3 text-sm text-text-secondary">
              <div className="rounded-xl border border-border/80 bg-surface px-4 py-4">
                <p className="text-xs text-text-muted">Nomor WhatsApp</p>
                <p className="mt-1 font-medium text-text-primary">{formatPhoneNumber(business.whatsappNumber)}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-surface px-4 py-4">
                <p className="text-xs text-text-muted">Alamat</p>
                <p className="mt-1 font-medium text-text-primary">{business.address ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-surface px-4 py-4">
                <p className="text-xs text-text-muted">Jam buka</p>
                <p className="mt-1 font-medium text-text-primary">{business.openingHours ?? "-"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <LinkButton href={ROUTES.messages} variant="secondary">
                <PhoneCall className="h-4 w-4" />
                Pesan Cepat
              </LinkButton>
              <LinkButton href={ROUTES.settings} variant="secondary">
                <MapPinned className="h-4 w-4" />
                Ubah Info Bisnis
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
