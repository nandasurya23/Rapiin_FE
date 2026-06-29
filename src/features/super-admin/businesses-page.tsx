"use client";

import Link from "next/link";
import { BarChart3, Building2, ShieldAlert, Store } from "lucide-react";
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
      {/* HERO HEADER */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-300">
                <ShieldAlert className="h-3.5 w-3.5" />
                Super Admin Panel
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Daftar Bisnis & Status Trial
              </h1>
              <p className="max-w-xl text-sm text-white/70 leading-relaxed">
                Review trial, backup, limit customer, dan aksi manual approval dari satu panel terpusat.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 xl:shrink-0">
              <div className="rounded-2xl bg-white/10 border border-white/[0.12] px-5 py-3 flex flex-col">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">Total Bisnis</p>
                <p className="text-2xl font-black text-white mt-0.5">{businessDirectory.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS LIST */}
      <section className="space-y-4 animate-fade-up-delay-1">
        {businessDirectory.map((entry) => {
          const daysLeft = getDaysUntilExpiry(entry.subscription);
          const isSuspended = entry.subscription?.status === "SUSPENDED";

          return (
            <Card key={entry.business.id} className="border-[var(--color-border)] shadow-none overflow-hidden">
              <div className={`h-1 w-full ${isSuspended ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-blue-500"}`} />
              <CardBody className="space-y-5 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="neutral" className="font-extrabold text-[9px] uppercase tracking-wider">
                        {PLAN_LABELS[entry.subscription?.planCode ?? "FREE_TRIAL"]}
                      </Badge>
                      <Badge tone={entry.subscription?.hasCompletedRequiredBackup ? "success" : "warning"} className="font-extrabold text-[9px] uppercase tracking-wider">
                        {entry.subscription?.hasCompletedRequiredBackup ? "✓ Sudah Backup" : "⚠ Belum Backup"}
                      </Badge>
                      <Badge
                        tone={isSuspended ? "danger" : entry.subscription?.status === "PENDING_UPGRADE_APPROVAL" ? "warning" : "info"}
                        className="font-extrabold text-[9px] uppercase tracking-wider"
                      >
                        {entry.subscription?.status ?? "-"}
                      </Badge>
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-[var(--color-text)] flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[var(--color-primary)]" />
                        {entry.business.name}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        Owner: <span className="font-semibold">{entry.owner?.name ?? "-"}</span> • {entry.owner?.email ?? "-"} • {entry.owner?.phoneNumber ?? "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={ROUTES.superAdminBusinessDetail(entry.business.id)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-colors"
                    >
                      <Store className="h-4 w-4" />
                      Detail
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-10 rounded-xl text-xs font-bold border-[var(--color-border)]"
                      onClick={() => {
                        extendTrial(entry.business.id, 7);
                        toast.success("Trial diperpanjang", "Tambahan 7 hari sudah diterapkan.");
                      }}
                    >
                      +7 Hari
                    </Button>
                    {isSuspended ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 rounded-xl text-xs font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => {
                          reactivateBusiness(entry.business.id);
                          toast.success("Bisnis diaktifkan kembali");
                        }}
                      >
                        Aktifkan Lagi
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
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

                <div className="grid gap-3 md:grid-cols-5">
                  <Stat label="Customer" value={`${entry.customerCount}/${entry.subscription?.customerLimit ?? 0}`} />
                  <Stat label="Trial Berakhir" value={entry.subscription ? formatDateTime(entry.subscription.expiresAt) : "-"} />
                  <Stat label="Sisa Hari" value={daysLeft !== null ? `${Math.max(daysLeft, 0)} hari` : "-"} highlight={daysLeft !== null && daysLeft <= 3} />
                  <Stat label="Backup Terakhir" value={entry.latestBackup ? formatDateTime(entry.latestBackup.createdAt) : "Belum ada"} />
                  <Stat label="Jumlah Backup" value={`${entry.backupCount}`} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </section>
    </main>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${highlight ? "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30" : "border-[var(--color-border)] bg-[var(--color-surface-elevated)]"}`}>
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-0.5 text-sm font-extrabold ${highlight ? "text-rose-600 dark:text-rose-400" : "text-[var(--color-text)]"}`}>{value}</p>
    </div>
  );
}
