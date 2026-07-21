"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast-provider";
import { formatDateTime } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { useAppData } from "@/components/providers/app-data-provider";
import { ApiAdminService, AdminUpgradeRequestRow, AdminUser } from "@/services/admin.service";
import type { PlanCode } from "@/types/subscription";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function SuperAdminUpgradeRequestsPage() {
  const toast = useToast();
  const { approveUpgrade, rejectUpgrade } = useAppData();

  const [requests, setRequests] = useState<AdminUpgradeRequestRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  // Dialog actions state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminUpgradeRequestRow | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiAdminService.fetchUpgradeRequests(currentPage, pageSize);
      if (response && response.data) {
        setRequests(response.data);
        setTotalItems(response.meta?.total ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch upgrade requests", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (actionPromise: Promise<unknown>, successMsg: string) => {
    try {
      await actionPromise;
      toast.success(successMsg);
      await fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const openActionModal = (request: AdminUpgradeRequestRow, type: "APPROVE" | "REJECT") => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNote(
      type === "APPROVE"
        ? `Plan ${PLAN_LABELS[request.toPlan as PlanCode]} disetujui.`
        : "Belum bisa diproses. Silakan hubungi admin."
    );
    setActionModalOpen(true);
  };

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* HERO HEADER */}
      <PageHeader
        variant="hero"
        title="Request Upgrade yang Masuk"
        description="Review request upgrade dari owner dan aktifkan plan secara manual untuk MVP ini."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            <ArrowUpCircle className="h-3.5 w-3.5" />
            Approval Plan
          </span>
        }
        statsCard={
          <div className="rounded-2xl bg-white/10 border border-white/[0.12] px-5 py-3 flex flex-col">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">Total Request</p>
            <p className="text-2xl font-black text-white mt-0.5">{totalItems}</p>
          </div>
        }
      />

      {/* REQUEST LIST */}
      <section className="space-y-4 animate-fade-up-delay-1">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : requests.length ? (
          requests.map((request) => {
            const requester = request.business?.users?.find((user: AdminUser) => user.role === "OWNER" || user.id === request.requestedByUserId);
            const isPending = request.status === "PENDING";
            const isApproved = request.status === "APPROVED";

            return (
              <div key={request.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                <div className={`h-1 w-full ${isApproved ? "bg-emerald-500" : isPending ? "bg-amber-400" : "bg-slate-400"}`} />
                <div className="space-y-5 p-5">
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
                          {PLAN_LABELS[request.fromPlan as PlanCode]} → {PLAN_LABELS[request.toPlan as PlanCode]}
                        </Badge>
                      </div>
                      <h2 className="text-lg font-extrabold text-[var(--color-text)]">{request.business?.name ?? "-"}</h2>
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
                        variant="primary"
                        onClick={() => openActionModal(request, "APPROVE")}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Setujui Upgrade
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => openActionModal(request, "REJECT")}
                      >
                        <XCircle className="h-4 w-4" />
                        Tolak
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="Belum ada request upgrade yang masuk"
            description="Review request upgrade dari owner akan muncul di sini."
            icon={<ArrowUpCircle className="h-6 w-6" />}
            size="lg"
            dashed
          />
        )}
      </section>

      {/* PAGINATION */}
      {!loading && totalItems > pageSize && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ACTION DIALOG */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[var(--color-text)]">
              {actionType === "APPROVE" ? "Setujui Permintaan Upgrade" : "Tolak Permintaan Upgrade"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Berikan catatan admin untuk owner bisnis <span className="font-semibold text-[var(--color-text)]">&quot;{selectedRequest?.business?.name}&quot;</span>:
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              placeholder="Tulis catatan di sini..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="min-h-[100px] rounded-xl text-sm"
            />
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActionModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant={actionType === "APPROVE" ? "primary" : "danger"}
              onClick={async () => {
                if (selectedRequest && actionType) {
                  setActionModalOpen(false);
                  const isApprove = actionType === "APPROVE";
                  const actionPromise = isApprove
                    ? approveUpgrade(selectedRequest.id, adminNote)
                    : rejectUpgrade(selectedRequest.id, adminNote);
                  
                  await handleAction(actionPromise, isApprove ? "Upgrade disetujui" : "Upgrade ditolak");
                }
              }}
            >
              {actionType === "APPROVE" ? "Setujui" : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
