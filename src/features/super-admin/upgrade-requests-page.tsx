"use client";

import { CheckCircle2, XCircle, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { formatDateTime } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { useAppData } from "@/components/providers/app-data-provider";

export function SuperAdminUpgradeRequestsPage() {
  const toast = useToast();
  const { upgradeRequests, approveUpgrade, rejectUpgrade, business, auth } = useAppData();

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* HERO HEADER */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                <ArrowUpCircle className="h-3.5 w-3.5" />
                Approval Plan
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Request Upgrade yang Masuk
              </h1>
              <p className="max-w-xl text-sm text-white/70 leading-relaxed">
                Review request upgrade dari owner dan aktifkan plan secara manual untuk MVP ini.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 xl:shrink-0">
              <div className="rounded-2xl bg-white/10 border border-white/[0.12] px-5 py-3 flex flex-col">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">Total Request</p>
                <p className="text-2xl font-black text-white mt-0.5">{upgradeRequests.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REQUEST LIST */}
      <section className="space-y-4 animate-fade-up-delay-1">
        {upgradeRequests.length ? (
          upgradeRequests.map((request) => {
            const requester = auth.users.find((user) => user.id === request.requestedByUserId);
            const isPending = request.status === "PENDING";
            const isApproved = request.status === "APPROVED";

            return (
              <Card key={request.id} className="border-[var(--color-border)] shadow-none overflow-hidden">
                <div className={`h-1 w-full ${isApproved ? "bg-emerald-500" : isPending ? "bg-amber-400" : "bg-slate-400"}`} />
                <CardBody className="space-y-5 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          tone={isPending ? "warning" : isApproved ? "success" : "neutral"}
                          className="font-extrabold text-[9px] uppercase tracking-wider"
                        >
                          {request.status}
                        </Badge>
                        <Badge tone="info" className="font-extrabold text-[9px] uppercase tracking-wider">
                          {PLAN_LABELS[request.fromPlan]} → {PLAN_LABELS[request.toPlan]}
                        </Badge>
                      </div>
                      <h2 className="text-lg font-extrabold text-[var(--color-text)]">{business.name}</h2>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Owner: <span className="font-semibold">{requester?.name ?? "-"}</span> • {requester?.email ?? "-"} • {requester?.phoneNumber ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 space-y-1 xl:shrink-0 xl:min-w-[200px]">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Info Request</p>
                      <p className="text-xs text-[var(--color-text)]">Dikirim: <span className="font-semibold">{formatDateTime(request.requestedAt)}</span></p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Catatan: {request.paymentNote ?? "-"}</p>
                    </div>
                  </div>

                  {request.adminNote ? (
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                      <span className="font-extrabold text-[var(--color-text)]">Catatan Admin:</span> {request.adminNote}
                    </div>
                  ) : null}

                  {isPending ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        className="h-10 rounded-xl text-xs font-bold"
                        onClick={() => {
                          approveUpgrade(request.id, `Plan ${PLAN_LABELS[request.toPlan]} disetujui.`);
                          toast.success("Upgrade disetujui");
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Setujui Upgrade
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={() => {
                          rejectUpgrade(request.id, "Belum bisa diproses. Silakan hubungi admin.");
                          toast.info("Upgrade ditolak");
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                        Tolak
                      </Button>
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            );
          })
        ) : (
          <Card className="border-[var(--color-border)] shadow-none">
            <CardBody className="p-10 text-center">
              <ArrowUpCircle className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Belum ada request upgrade yang masuk.</p>
            </CardBody>
          </Card>
        )}
      </section>
    </main>
  );
}
