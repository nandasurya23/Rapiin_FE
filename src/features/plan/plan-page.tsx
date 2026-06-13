"use client";

import { useMemo, useState } from "react";
import { CloudUpload, ShieldCheck, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { formatDateTime } from "@/lib/format";
import { getDaysUntilExpiry } from "@/lib/subscription";
import { useAppData } from "@/components/providers/app-data-provider";
import type { PlanCode } from "@/types/subscription";

export function PlanPage() {
  const toast = useToast();
  const {
    subscriptionForCurrentBusiness,
    currentBusinessUsage,
    system,
    backupRecords,
    upgradeRequests,
    createBackup,
    requestUpgrade,
  } = useAppData();
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>("PRO");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const businessBackups = useMemo(() => backupRecords.slice(0, 5), [backupRecords]);
  const pendingRequest = useMemo(
    () => upgradeRequests.find((request) => request.businessId === subscriptionForCurrentBusiness?.businessId && request.status === "PENDING") ?? null,
    [subscriptionForCurrentBusiness?.businessId, upgradeRequests]
  );

  if (!subscriptionForCurrentBusiness) {
    return null;
  }

  const daysLeft = getDaysUntilExpiry(subscriptionForCurrentBusiness);

  async function handleCreateBackup() {
    setLoadingAction("backup");
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      createBackup();
      toast.success("Backup berhasil dibuat", "Snapshot lokal sudah disimpan.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRequestUpgrade() {
    if (pendingRequest) {
      toast.info("Masih menunggu persetujuan", "Request upgrade sebelumnya belum direview super admin.");
      return;
    }

    setLoadingAction("upgrade");
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      requestUpgrade(selectedPlan, `Owner memilih plan ${PLAN_LABELS[selectedPlan]} dari halaman plan.`);
      toast.success("Request upgrade dikirim", "Super admin akan review request plan ini.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Plan & Backup</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">Jaga trial tetap aman dan siap upgrade</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Pantau masa trial, kapasitas customer, status backup, dan kirim permintaan upgrade tanpa pindah ke luar app.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">{PLAN_LABELS[subscriptionForCurrentBusiness.planCode]}</Badge>
                <Badge tone={subscriptionForCurrentBusiness.hasCompletedRequiredBackup ? "success" : "warning"}>
                  {subscriptionForCurrentBusiness.hasCompletedRequiredBackup ? "Backup sudah pernah" : "Backup wajib"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              <SummaryStat label="Status plan" value={subscriptionForCurrentBusiness.status} />
              <SummaryStat label="Sisa trial" value={daysLeft !== null ? `${Math.max(daysLeft, 0)} hari` : "-"} />
              <SummaryStat label="Customer" value={`${currentBusinessUsage.used}/${currentBusinessUsage.limit}`} />
              <SummaryStat
                label="Backup terakhir"
                value={subscriptionForCurrentBusiness.lastBackupAt ? formatDateTime(subscriptionForCurrentBusiness.lastBackupAt) : "Belum ada"}
              />
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardBody className="space-y-5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Pilih plan berikutnya</h2>
                <p className="text-sm text-text-secondary">Free trial akan jadi mode baca saja setelah habis. Upgrade tetap manual approval.</p>
              </div>
              <WalletCards className="h-5 w-5 text-brand-700" />
            </div>

            <div className="space-y-3">
              {system.planCatalog.map((plan) => {
                const active = selectedPlan === plan.code;
                const isCurrent = subscriptionForCurrentBusiness.planCode === plan.code;

                return (
                  <button
                    key={plan.code}
                    type="button"
                    onClick={() => {
                      if (plan.code !== "FREE_TRIAL") {
                        setSelectedPlan(plan.code);
                      }
                    }}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      active ? "border-brand-500 bg-brand-50" : "border-border/80 bg-surface hover:bg-muted"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <p className="text-base font-semibold text-text-primary">{plan.label}</p>
                          {isCurrent ? <Badge tone="success">Plan aktif</Badge> : null}
                        </div>
                        <p className="mt-1 text-sm text-text-secondary">{plan.customerLimit.toLocaleString("id-ID")} customer</p>
                      </div>
                      <Badge tone={plan.requiresManualApproval ? "warning" : "neutral"}>
                        {plan.requiresManualApproval ? "Manual approval" : "Otomatis"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-secondary">
                      {plan.features.map((feature) => (
                        <span key={feature} className="rounded-md border border-border/80 bg-white px-2 py-1">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" isLoading={loadingAction === "upgrade"} onClick={() => void handleRequestUpgrade()} disabled={selectedPlan === "FREE_TRIAL"}>
                Kirim request upgrade
              </Button>
              {pendingRequest ? <Badge tone="warning">Menunggu persetujuan {PLAN_LABELS[pendingRequest.toPlan]}</Badge> : null}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Backup data trial</h2>
                <p className="text-sm text-text-secondary">Minimal 1 backup sebelum trial habis supaya data tetap aman.</p>
              </div>
              <CloudUpload className="h-5 w-5 text-brand-700" />
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-text-primary">Status backup</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {subscriptionForCurrentBusiness.hasCompletedRequiredBackup
                      ? "Bisnis ini sudah pernah backup. Tetap disarankan backup ulang setelah perubahan besar."
                      : "Belum ada backup. Buat snapshot sekarang supaya data trial tidak hanya bergantung pada browser."}
                  </p>
                </div>
                <Button type="button" variant="secondary" isLoading={loadingAction === "backup"} onClick={() => void handleCreateBackup()}>
                  <ShieldCheck className="h-4 w-4" />
                  Backup sekarang
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {businessBackups.length ? (
                businessBackups.map((backup) => (
                  <div key={backup.id} className="rounded-xl border border-border/80 bg-surface px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">{backup.summary}</p>
                        <p className="mt-1 text-sm text-text-secondary">{formatDateTime(backup.createdAt)}</p>
                      </div>
                      <Badge tone="success">{backup.type}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-text-secondary">Belum ada backup yang tersimpan.</div>
              )}
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface px-4 py-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}
