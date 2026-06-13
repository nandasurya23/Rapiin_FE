"use client";

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
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Approval Plan</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">Request upgrade yang masuk</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Review request upgrade dari owner dan aktifkan plan secara manual untuk MVP ini.
                </p>
              </div>
              <Badge tone="info">{upgradeRequests.length} request</Badge>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        {upgradeRequests.length ? (
          upgradeRequests.map((request) => {
            const requester = auth.users.find((user) => user.id === request.requestedByUserId);
            const isPending = request.status === "PENDING";

            return (
              <Card key={request.id}>
                <CardBody className="space-y-4 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={isPending ? "warning" : request.status === "APPROVED" ? "success" : "neutral"}>{request.status}</Badge>
                        <Badge tone="info">
                          {PLAN_LABELS[request.fromPlan]} → {PLAN_LABELS[request.toPlan]}
                        </Badge>
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-text-primary">{business.name}</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        Owner: {requester?.name ?? "-"} • {requester?.email ?? "-"} • {requester?.phoneNumber ?? "-"}
                      </p>
                    </div>
                    <div className="text-sm text-text-secondary">
                      <p>Dikirim: {formatDateTime(request.requestedAt)}</p>
                      <p>Catatan owner: {request.paymentNote ?? "-"}</p>
                    </div>
                  </div>

                  {request.adminNote ? (
                    <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3 text-sm text-text-secondary">
                      Catatan admin: {request.adminNote}
                    </div>
                  ) : null}

                  {isPending ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          approveUpgrade(request.id, `Plan ${PLAN_LABELS[request.toPlan]} disetujui.`);
                          toast.success("Upgrade disetujui");
                        }}
                      >
                        Setujui
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          rejectUpgrade(request.id, "Belum bisa diproses. Silakan hubungi admin.");
                          toast.info("Upgrade ditolak");
                        }}
                      >
                        Tolak
                      </Button>
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardBody className="p-5 text-sm text-text-secondary">Belum ada request upgrade yang masuk.</CardBody>
          </Card>
        )}
      </section>
    </main>
  );
}
