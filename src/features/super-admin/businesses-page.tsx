"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { formatDateTime } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { ROUTES } from "@/lib/routes";
import { getDaysUntilExpiry } from "@/lib/subscription";
import { useAppData } from "@/components/providers/app-data-provider";

export function SuperAdminBusinessesPage() {
  const toast = useToast();
  const { businessDirectory, extendTrial, reactivateBusiness, suspendBusiness } = useAppData();

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Super Admin</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">Daftar bisnis dan status trial</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Review trial, backup, limit customer, dan aksi manual approval dari satu panel.
                </p>
              </div>
              <Badge tone="info">{businessDirectory.length} bisnis</Badge>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        {businessDirectory.map((entry) => {
          const daysLeft = getDaysUntilExpiry(entry.subscription);
          return (
            <Card key={entry.business.id}>
              <CardBody className="space-y-4 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="neutral">{PLAN_LABELS[entry.subscription?.planCode ?? "FREE_TRIAL"]}</Badge>
                      <Badge tone={entry.subscription?.hasCompletedRequiredBackup ? "success" : "warning"}>
                        {entry.subscription?.hasCompletedRequiredBackup ? "Sudah backup" : "Belum backup"}
                      </Badge>
                      <Badge tone={entry.subscription?.status === "SUSPENDED" ? "danger" : entry.subscription?.status === "PENDING_UPGRADE_APPROVAL" ? "warning" : "info"}>
                        {entry.subscription?.status ?? "-"}
                      </Badge>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-text-primary">{entry.business.name}</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        Owner: {entry.owner?.name ?? "-"} • {entry.owner?.email ?? "-"} • {entry.owner?.phoneNumber ?? "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={ROUTES.superAdminBusinessDetail(entry.business.id)} className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-muted">
                      <Store className="h-4 w-4" />
                      Detail bisnis
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        extendTrial(entry.business.id, 7);
                        toast.success("Trial diperpanjang", "Tambahan 7 hari sudah diterapkan.");
                      }}
                    >
                      +7 hari
                    </Button>
                    {entry.subscription?.status === "SUSPENDED" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          reactivateBusiness(entry.business.id);
                          toast.success("Bisnis diaktifkan kembali");
                        }}
                      >
                        Aktifkan lagi
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          suspendBusiness(entry.business.id, "Bisnis disuspend manual dari panel super admin.");
                          toast.info("Bisnis disuspend");
                        }}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <Stat label="Customer" value={`${entry.customerCount}/${entry.subscription?.customerLimit ?? 0}`} />
                  <Stat label="Trial berakhir" value={entry.subscription ? formatDateTime(entry.subscription.expiresAt) : "-"} />
                  <Stat label="Sisa hari" value={daysLeft !== null ? `${Math.max(daysLeft, 0)} hari` : "-"} />
                  <Stat label="Backup terakhir" value={entry.latestBackup ? formatDateTime(entry.latestBackup.createdAt) : "Belum ada"} />
                  <Stat label="Jumlah backup" value={`${entry.backupCount}`} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface px-4 py-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 font-medium text-text-primary">{value}</p>
    </div>
  );
}
