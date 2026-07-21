"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Building2, ShieldAlert, Download, Search, Users, HardDrive, ShieldCheck, ShieldX, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast-provider";
import { formatDateTime } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";
import { ApiAdminService, AdminBusinessRow, AdminUser, SystemMetrics } from "@/services/admin.service";
import type { PlanCode } from "@/types/subscription";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SuperAdminBusinessesPage() {
  const toast = useToast();
  const {
    reactivateBusiness,
    suspendBusiness,
    downloadBusinessBackup,
    deleteBusiness,
  } = useAppData();

  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [pendingUpgradeCount, setPendingUpgradeCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  // Dialog actions state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await ApiAdminService.fetchSystemMetrics();
      if (data) {
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to fetch system metrics", err);
    }
  }, []);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiAdminService.fetchBusinesses(
        currentPage,
        pageSize,
        search,
        planFilter,
        statusFilter
      );
      if (response && response.data) {
        const mapped: AdminBusinessRow[] = (response.data as Array<AdminBusinessRow["business"]> || []).map((b) => ({
          business: b,
          owner: b.users?.find((u: AdminUser) => u.role === "OWNER") ?? null,
          subscription: b.subscriptions?.[0] ?? null,
          customerCount: b._count?.customers ?? 0,
        }));
        setBusinesses(mapped);
        setTotalItems(response.meta?.total ?? 0);
        setActiveCount(response.meta?.activeCount ?? 0);
        setSuspendedCount(response.meta?.suspendedCount ?? 0);
        setPendingUpgradeCount(response.meta?.pendingUpgradeCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch businesses", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, planFilter, statusFilter]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const handleAction = async (actionPromise: Promise<unknown>, successMsg: string) => {
    try {
      await actionPromise;
      toast.success(successMsg);
      await fetchBusinesses();
    } catch (err) {
      console.error(err);
    }
  };

  const planOptions = [
    { value: "", label: "Semua Plan" },
    { value: "FREE_TRIAL", label: "Free Trial" },
    { value: "PREMIUM", label: "Premium" },
    { value: "PRO", label: "Pro" },
  ];

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "ACTIVE", label: "Aktif" },
    { value: "SUSPENDED", label: "Suspend" },
    { value: "PENDING_UPGRADE_APPROVAL", label: "Menunggu Approval" },
  ];

  // Quick statistics loaded from server metadata

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* HEADER TITLE */}
      <PageHeader
        variant="hero"
        title="Manajemen Bisnis"
        description="Kelola data tenant, limitasi subscription, status suspend, dan unduh backup database."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            Control Center
          </span>
        }
      />

      {/* QUICK STATS PANELS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Total Terdaftar</p>
              <p className="text-2xl font-black text-[var(--color-text)] mt-1">{totalItems}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[var(--color-info-surface)] border border-[var(--color-info-border)] flex items-center justify-center text-[var(--color-info-text)]">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Sesi Aktif</p>
              <p className="text-2xl font-black text-[var(--color-success-text)] mt-1">{activeCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[var(--color-success-surface)] border border-[var(--color-success-border)] flex items-center justify-center text-[var(--color-success-text)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Menunggu Approval</p>
              <p className="text-2xl font-black text-[var(--color-warning-text)] mt-1">{pendingUpgradeCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] flex items-center justify-center text-[var(--color-warning-text)]">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Ditangguhkan</p>
              <p className="text-2xl font-black text-[var(--color-danger-text)] mt-1">{suspendedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] flex items-center justify-center text-[var(--color-danger-text)]">
              <ShieldX className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM TELEMETRY */}
      {metrics && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--color-info-surface)] border border-[var(--color-info-border)] flex items-center justify-center text-[var(--color-info-text)]">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Status Server</p>
              <p className="text-sm font-bold text-[var(--color-text)] mt-0.5">
                CPU: {metrics.system.cpuUsagePercent}% | RAM: {metrics.system.memory.usagePercent}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center border",
              metrics.database.healthy 
                ? "bg-[var(--color-success-surface)] border-[var(--color-success-border)] text-[var(--color-success-text)]"
                : "bg-[var(--color-danger-surface)] border-[var(--color-danger-border)] text-[var(--color-danger-text)]"
            )}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Database</p>
              <p className="text-sm font-bold text-[var(--color-text)] mt-0.5">
                {metrics.database.healthy ? `ONLINE (${metrics.database.latencyMs}ms)` : "DISCONNECTED"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] flex items-center justify-center text-[var(--color-warning-text)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Populasi Sistem</p>
              <p className="text-sm font-bold text-[var(--color-text)] mt-0.5">
                Users: {metrics.stats.totalUsers} | Biz: {metrics.stats.totalBusinesses}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* FILTER & SEARCH (z-30 relative to ensure select dropdown displays above the list) */}
      <section className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <Input
            type="text"
            placeholder="Cari nama bisnis, owner, email, whatsapp..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select
            value={planFilter}
            options={planOptions}
            onValueChange={(val) => {
              setPlanFilter(val);
              setCurrentPage(1);
            }}
            placeholder="Pilih Plan"
            className="w-full md:w-[160px]"
            buttonClassName="h-11 rounded-xl bg-[var(--color-surface)] border-[var(--color-border)]"
          />
          <Select
            value={statusFilter}
            options={statusOptions}
            onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            placeholder="Pilih Status"
            className="w-full md:w-[180px]"
            buttonClassName="h-11 rounded-xl bg-[var(--color-surface)] border-[var(--color-border)]"
          />
        </div>
      </section>

      {/* MODERN DATA TABLE (z-10 relative) */}
      <section className="relative z-10 animate-fade-up-delay-1 overflow-hidden border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : businesses.length === 0 ? (
          <EmptyState
            title="Tidak ada data bisnis ditemukan"
            description="Silakan ubah filter pencarian Anda atau tambahkan data baru."
            icon={<Building2 className="h-6 w-6" />}
            size="lg"
            dashed
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <th className="px-5 py-4">Nama Bisnis</th>
                  <th className="px-5 py-4">Kontak Owner</th>
                  <th className="px-5 py-4 text-center">Plan & Status</th>
                  <th className="px-5 py-4">Pelanggan</th>
                  <th className="px-5 py-4">Backup Terakhir</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {businesses.map((entry) => {
                  const isSuspended = entry.subscription?.status === "SUSPENDED";
                  const isPendingApproval = entry.subscription?.status === "PENDING_UPGRADE_APPROVAL";

                  return (
                    <tr key={entry.business.id} className="hover:bg-[var(--state-hover-bg)] transition-colors">
                      {/* BUSINESS NAME */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs uppercase border",
                            isSuspended
                              ? "bg-[var(--color-danger-surface)] text-[var(--color-danger-text)] border-[var(--color-danger-border)]"
                              : "bg-[var(--color-info-surface)] text-[var(--color-info-text)] border-[var(--color-info-border)]"
                          )}>
                            {entry.business.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-extrabold text-[var(--color-text)] text-sm">{entry.business.name}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)]">Slug: {entry.business.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT OWNER */}
                      <td className="px-5 py-4 text-sm">
                        <p className="font-bold text-[var(--color-text)]">{entry.owner?.name ?? "-"}</p>
                        <p className="text-[11px] text-[var(--color-text-secondary)]">{entry.owner?.email ?? "-"}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{entry.owner?.phoneNumber ?? "-"}</p>
                      </td>

                      {/* PLAN & STATUS */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <Badge tone="neutral" className="font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5">
                            {PLAN_LABELS[(entry.subscription?.planCode ?? "FREE_TRIAL") as PlanCode]}
                          </Badge>
                          <Badge
                            tone={isSuspended ? "danger" : isPendingApproval ? "warning" : "success"}
                            className="font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5"
                          >
                            {isSuspended ? "Suspended" : isPendingApproval ? "Approval Pending" : "Aktif"}
                          </Badge>
                        </div>
                      </td>

                      {/* CUSTOMER COUNT */}
                      <td className="px-5 py-4 text-sm">
                        <div className="flex items-center gap-1.5 font-bold text-[var(--color-text)]">
                          <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
                          <span>{entry.customerCount}</span>
                          <span className="text-xs font-normal text-[var(--color-text-muted)]">
                            / {entry.subscription?.customerLimit ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* LAST BACKUP */}
                      <td className="px-5 py-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="h-4 w-4 text-[var(--color-text-muted)]" />
                          <div>
                            <p className="text-xs font-bold text-[var(--color-text)]">
                              {entry.subscription?.lastBackupAt ? formatDateTime(entry.subscription.lastBackupAt) : "Belum ada"}
                            </p>
                            {entry.subscription?.lastBackupAt && (
                              <Badge tone="success" className="text-[8px] font-black uppercase mt-1 px-1.5 py-0">
                                ✓ Terjaga
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <LinkButton
                            href={ROUTES.superAdminBusinessDetail(entry.business.id)}
                            variant="secondary"
                            size="sm"
                            className="h-8 rounded-lg px-2.5 text-[11px] font-bold"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detail
                          </LinkButton>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-bold"
                            onClick={async () => {
                              toast.promise(
                                downloadBusinessBackup(entry.business.id, entry.business.slug).then(() => fetchBusinesses()),
                                {
                                  loading: "Menyiapkan file backup...",
                                  success: "Backup berhasil diunduh!",
                                  error: "Gagal mengunduh backup",
                                }
                              );
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Backup
                          </Button>
                          {isSuspended ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8 gap-1.5 rounded-lg text-[var(--color-success-text)] border-[var(--color-success-border)] bg-[var(--color-success-surface)] hover:bg-[var(--color-success-hover)] hover:text-white px-2.5 text-[11px] font-bold"
                              onClick={() => handleAction(reactivateBusiness(entry.business.id), "Bisnis diaktifkan kembali")}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Aktifkan
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8 gap-1.5 rounded-lg text-[var(--color-warning-text)] border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] hover:bg-[var(--color-warning-hover)] hover:text-white px-2.5 text-[11px] font-bold"
                              onClick={() => handleAction(suspendBusiness(entry.business.id, "Bisnis disuspend manual."), "Bisnis disuspend")}
                            >
                              <ShieldX className="h-3.5 w-3.5" />
                              Suspend
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg text-[var(--color-danger-text)] border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] hover:bg-[var(--color-danger-hover)] hover:text-white px-2.5 text-[11px] font-bold"
                            onClick={async () => {
                              setBusinessToDelete({ id: entry.business.id, name: entry.business.name });
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[var(--color-text)]">Hapus Bisnis Permanen</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Apakah Anda yakin ingin menghapus bisnis <span className="font-semibold text-[var(--color-text)]">&quot;{businessToDelete?.name}&quot;</span> secara permanen? Seluruh data relasi dan akun owner akan ikut terhapus dari database. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={async () => {
                if (businessToDelete) {
                  setDeleteConfirmOpen(false);
                  await handleAction(deleteBusiness(businessToDelete.id), "Bisnis berhasil dihapus");
                }
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

