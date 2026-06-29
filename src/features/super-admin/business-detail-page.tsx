"use client";
import { ArrowLeft, Activity, Clock, Users, HardDrive, ShieldCheck, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { formatDateTime } from "@/lib/format";
import { useAppData } from "@/components/providers/app-data-provider";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export function SuperAdminBusinessDetailPage({ businessId }: { businessId: string }) {
  const toast = useToast();
  const { businessDirectory, superAdminLogs, extendTrial, suspendBusiness, reactivateBusiness } = useAppData();
  const entry = businessDirectory.find((item) => item.business.id === businessId);

  if (!entry) {
    return (
      <main className="page-enter px-4 py-6 text-sm text-[var(--color-text-secondary)] sm:px-6 lg:px-8">
        Bisnis tidak ditemukan.
      </main>
    );
  }

  const logs = superAdminLogs.filter((log) => log.targetBusinessId === businessId).slice(0, 10);
  const isSuspended = entry.subscription?.status === "SUSPENDED";

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* HERO HEADER */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

          <div className="relative space-y-4">
            <Link
              href={ROUTES.superAdminBusinesses}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Daftar Bisnis
            </Link>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="info" className="bg-white/10 text-white border-white/20 font-extrabold text-[9px] uppercase tracking-wider">
                    {PLAN_LABELS[entry.subscription?.planCode ?? "FREE_TRIAL"]}
                  </Badge>
                  <Badge
                    tone={isSuspended ? "danger" : "warning"}
                    className="bg-white/10 text-white border-white/20 font-extrabold text-[9px] uppercase tracking-wider"
                  >
                    {entry.subscription?.status ?? "-"}
                  </Badge>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                  {entry.business.name}
                </h1>
                <p className="text-sm text-white/60">
                  Owner: <span className="font-semibold text-white/80">{entry.owner?.name ?? "-"}</span> • {entry.owner?.email ?? "-"} • {entry.owner?.phoneNumber ?? "-"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 xl:shrink-0">
                <Button
                  type="button"
                  className="h-10 rounded-xl text-xs font-bold bg-amber-400 text-slate-900 hover:bg-amber-300 border-0"
                  onClick={() => {
                    extendTrial(entry.business.id, 7);
                    toast.success("Trial diperpanjang 7 hari");
                  }}
                >
                  +7 Hari Trial
                </Button>
                {isSuspended ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 rounded-xl text-xs font-bold bg-white/10 text-white border-white/20 hover:bg-white/20"
                    onClick={() => {
                      reactivateBusiness(entry.business.id);
                      toast.success("Bisnis diaktifkan kembali");
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Aktifkan Lagi
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 rounded-xl text-xs font-bold bg-white/10 text-white border-white/20 hover:bg-rose-500/40"
                    onClick={() => {
                      suspendBusiness(entry.business.id, "Disuspend manual dari halaman detail bisnis.");
                      toast.info("Bisnis disuspend");
                    }}
                  >
                    <ShieldX className="h-4 w-4" />
                    Suspend Bisnis
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAT GRID */}
      <section className="grid gap-4 md:grid-cols-4 animate-fade-up-delay-1">
        <Stat icon={<Users className="h-5 w-5" />} label="Customer" value={`${entry.customerCount}/${entry.subscription?.customerLimit ?? 0}`} />
        <Stat icon={<HardDrive className="h-5 w-5" />} label="Backup Terakhir" value={entry.latestBackup ? formatDateTime(entry.latestBackup.createdAt) : "Belum ada"} />
        <Stat icon={<Clock className="h-5 w-5" />} label="Trial Berakhir" value={entry.subscription ? formatDateTime(entry.subscription.expiresAt) : "-"} />
        <Stat icon={<Activity className="h-5 w-5" />} label="Jumlah Backup" value={`${entry.backupCount}`} />
      </section>

      {/* AUDIT LOG */}
      <section className="animate-fade-up-delay-2">
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="space-y-5 p-5">
            <div className="border-b border-[var(--color-border)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-text)]">Audit Log Singkat</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Riwayat aksi super admin pada bisnis ini (10 terbaru).</p>
            </div>
            <div className="space-y-3">
              {logs.length ? (
                logs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-[var(--color-text)]">{log.actionType}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{formatDateTime(log.createdAt)}</p>
                      </div>
                      <Badge tone="neutral" className="font-extrabold text-[9px] uppercase tracking-wider self-start sm:self-center">
                        {Object.keys(log.metadata ?? {}).length} metadata
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-center text-[var(--color-text-secondary)]">
                  Belum ada log untuk bisnis ini.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 flex items-center gap-3">
      <div className="shrink-0 h-10 w-10 rounded-xl bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-0.5 text-sm font-extrabold text-[var(--color-text)] truncate">{value}</p>
      </div>
    </div>
  );
}
