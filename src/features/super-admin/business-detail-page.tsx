"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { formatDateTime } from "@/lib/format";
import { useAppData } from "@/components/providers/app-data-provider";

export function SuperAdminBusinessDetailPage({ businessId }: { businessId: string }) {
  const toast = useToast();
  const { businessDirectory, superAdminLogs, extendTrial, suspendBusiness, reactivateBusiness } = useAppData();
  const entry = businessDirectory.find((item) => item.business.id === businessId);

  if (!entry) {
    return (
      <main className="page-enter px-4 py-6 text-sm text-text-secondary sm:px-6 lg:px-8">
        Bisnis tidak ditemukan.
      </main>
    );
  }

  const logs = superAdminLogs.filter((log) => log.targetBusinessId === businessId).slice(0, 10);

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Detail Bisnis</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">{entry.business.name}</h1>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Owner: {entry.owner?.name ?? "-"} • {entry.owner?.email ?? "-"} • {entry.owner?.phoneNumber ?? "-"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">{PLAN_LABELS[entry.subscription?.planCode ?? "FREE_TRIAL"]}</Badge>
                <Badge tone={entry.subscription?.status === "SUSPENDED" ? "danger" : "warning"}>{entry.subscription?.status ?? "-"}</Badge>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <Stat label="Customer" value={`${entry.customerCount}/${entry.subscription?.customerLimit ?? 0}`} />
              <Stat label="Backup terakhir" value={entry.latestBackup ? formatDateTime(entry.latestBackup.createdAt) : "Belum ada"} />
              <Stat label="Trial berakhir" value={entry.subscription ? formatDateTime(entry.subscription.expiresAt) : "-"} />
              <Stat label="Backup count" value={`${entry.backupCount}`} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  extendTrial(entry.business.id, 7);
                  toast.success("Trial diperpanjang 7 hari");
                }}
              >
                Perpanjang 7 hari
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
                    suspendBusiness(entry.business.id, "Disuspend manual dari halaman detail bisnis.");
                    toast.info("Bisnis disuspend");
                  }}
                >
                  Suspend bisnis
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Audit log singkat</h2>
              <p className="text-sm text-text-secondary">Riwayat aksi super admin pada bisnis ini.</p>
            </div>
            <div className="space-y-3">
              {logs.length ? (
                logs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-border/80 bg-surface px-4 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-text-primary">{log.actionType}</p>
                        <p className="mt-1 text-sm text-text-secondary">{formatDateTime(log.createdAt)}</p>
                      </div>
                      <Badge tone="neutral">{Object.keys(log.metadata ?? {}).length} metadata</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-text-secondary">Belum ada log untuk bisnis ini.</div>
              )}
            </div>
          </CardBody>
        </Card>
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
