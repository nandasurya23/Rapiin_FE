"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ShieldCheck, ShieldX, ShieldAlert, Building2, User, CreditCard, Trash2, Download, Clock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { formatDateTime } from "@/lib/format";
import { useAppData } from "@/components/providers/app-data-provider";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiAdminService, AdminBusinessDetail, AdminUser } from "@/services/admin.service";
import type { PlanCode } from "@/types/subscription";

export function SuperAdminBusinessDetailPage({ businessId }: { businessId: string }) {
  const toast = useToast();
  const router = useRouter();
  const {
    superAdminLogs,
    suspendBusiness,
    reactivateBusiness,
    downloadBusinessBackup,
    deleteBusiness,
  } = useAppData();

  const [businessDetail, setBusinessDetail] = useState<AdminBusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiAdminService.fetchBusinessDetail(businessId);
      if (response) {
        setBusinessDetail(response);
      } else {
        setError("Bisnis tidak ditemukan.");
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Gagal memuat detail bisnis.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAction = async (actionPromise: Promise<unknown>, successMsg: string) => {
    try {
      await actionPromise;
      toast.success(successMsg);
      await fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </main>
    );
  }

  if (error || !businessDetail) {
    return (
      <main className="page-enter space-y-6 px-4 py-8 text-center sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto py-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">Gagal Memuat Data</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{error || "Data bisnis tidak ditemukan."}</p>
          <Link
            href={ROUTES.superAdminBusinesses}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Daftar Bisnis
          </Link>
        </div>
      </main>
    );
  }

  const business = businessDetail;
  const owner = businessDetail.users?.find((u: AdminUser) => u.role === "OWNER") ?? null;
  const subscription = businessDetail.subscriptions?.[0] ?? null;
  const isSuspended = subscription?.status === "SUSPENDED";
  const customerCount = businessDetail._count?.customers ?? 0;
  const orderCount = businessDetail._count?.orders ?? 0;
  const invoiceCount = businessDetail._count?.invoices ?? 0;

  const logs = superAdminLogs.filter((log) => log.targetBusinessId === businessId).slice(0, 10);

  return (
    <main className="page-enter space-y-8 px-6 py-6 sm:px-8 lg:px-10 max-w-7xl mx-auto">
      {/* HEADER NAV & ACTION */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--color-border)] pb-6">
        <div className="space-y-1">
          <Link
            href={ROUTES.superAdminBusinesses}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Bisnis
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-black text-[var(--color-text)]">{business.name}</h1>
            <Badge tone={isSuspended ? "danger" : "success"} className="font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5">
              {subscription?.status ?? "ACTIVE"}
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">ID: <span className="font-mono">{business.id}</span></p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              toast.promise(
                downloadBusinessBackup(business.id, business.slug),
                {
                  loading: "Menyiapkan file backup...",
                  success: "Backup berhasil diunduh!",
                  error: "Gagal mengunduh backup",
                }
              );
            }}
          >
            <Download className="h-4 w-4" />
            Backup Database
          </Button>
          {isSuspended ? (
            <Button
              type="button"
              variant="secondary"
              className="text-[var(--color-success-text)] border-[var(--color-success-border)] bg-[var(--color-success-surface)] hover:bg-[var(--color-success-hover)] hover:text-white"
              onClick={() => handleAction(reactivateBusiness(business.id), "Bisnis diaktifkan kembali")}
            >
              <ShieldCheck className="h-4 w-4" />
              Aktifkan Sesi
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="text-[var(--color-warning-text)] border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] hover:bg-[var(--color-warning-hover)] hover:text-white"
              onClick={() => handleAction(suspendBusiness(business.id, "Disuspend manual dari halaman detail bisnis."), "Bisnis disuspend")}
            >
              <ShieldX className="h-4 w-4" />
              Suspend Bisnis
            </Button>
          )}
          <Button
            type="button"
            variant="danger"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Hapus Bisnis
          </Button>
        </div>
      </section>

      {/* METRICS ROW */}
      <section className="grid gap-6 grid-cols-2 md:grid-cols-4 border-b border-[var(--color-border)] pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Total Pelanggan</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-[var(--color-text)]">{customerCount}</span>
            <span className="text-xs text-[var(--color-text-muted)]">/ {subscription?.customerLimit ?? 0} limit</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Total Transaksi / Order</p>
          <span className="text-3xl font-black text-[var(--color-text)]">{orderCount}</span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nota Diterbitkan</p>
          <span className="text-3xl font-black text-[var(--color-text)]">{invoiceCount}</span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Backup Terakhir</p>
          <p className="text-sm font-bold text-[var(--color-text)] mt-1.5">
            {subscription?.lastBackupAt ? formatDateTime(subscription.lastBackupAt) : "Belum ada"}
          </p>
        </div>
      </section>

      {/* TWO-COLUMN UNIFIED DASHBOARD LAYOUT */}
      <section className="grid gap-10 lg:grid-cols-3">
        {/* LEFT COLUMN: TENANT & OWNER DETAIL (SPAN 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* PROFILE SECTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Detail Tenant & Registrasi
            </h3>
            <div className="grid gap-y-4 gap-x-6 sm:grid-cols-2 text-sm border-t border-[var(--color-border)] pt-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Nama Bisnis</p>
                <p className="font-bold text-[var(--color-text)] mt-0.5">{business.name}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Slug Link</p>
                <a href={`/b/${business.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--color-primary)] hover:underline mt-0.5">
                  /b/{business.slug}
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Nomor WhatsApp Bisnis</p>
                <p className="font-bold text-[var(--color-text)] mt-0.5">{business.whatsappNumber || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Tanggal Pendaftaran</p>
                <p className="font-bold text-[var(--color-text)] mt-0.5">{formatDateTime(business.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* OWNER ACCOUNT SECTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] flex items-center gap-2">
              <User className="h-4 w-4" />
              Kontak Owner & Sesi Pengguna
            </h3>
            {owner ? (
              <div className="grid gap-y-4 gap-x-6 sm:grid-cols-2 text-sm border-t border-[var(--color-border)] pt-4">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Nama Pengelola</p>
                  <p className="font-bold text-[var(--color-text)] mt-0.5">{owner.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Email Pengelola</p>
                  <p className="font-bold text-[var(--color-text)] mt-0.5">{owner.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">WhatsApp Owner</p>
                  <p className="font-bold text-[var(--color-text)] mt-0.5">{owner.phoneNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Status Sesi Owner</p>
                  <Badge tone={owner.isActive ? "success" : "danger"} className="mt-1 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5">
                    {owner.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--color-text-secondary)] py-4 border-t border-[var(--color-border)]">
                Tidak ada data user owner yang terikat pada tenant ini.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SUBSCRIPTION LIMITS & LOGS (SPAN 1) */}
        <div className="space-y-8 border-t lg:border-t-0 lg:border-l border-[var(--color-border)] pt-8 lg:pt-0 lg:pl-10">
          {/* SUBSCRIPTION CONFIG */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Langganan & Konfigurasi Plan
            </h3>
            {subscription ? (
              <div className="space-y-4 text-sm border-t border-[var(--color-border)] pt-4">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Plan Aktif</span>
                  <span className="font-bold text-[var(--color-text)]">
                    {PLAN_LABELS[(subscription.planCode) as PlanCode]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Limit Pelanggan</span>
                  <span className="font-bold text-[var(--color-text)]">{subscription.customerLimit} data</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Masa Berlaku</span>
                  <span className="font-bold text-[var(--color-text)]">{formatDateTime(subscription.expiresAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Status Billing</span>
                  <span className="font-bold text-[var(--color-text)] uppercase">{subscription.status}</span>
                </div>
                {subscription.readOnlyReason && (
                  <div className="mt-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-400">
                    <p className="font-bold">Alasan Penangguhan:</p>
                    <p className="mt-0.5 leading-relaxed">{subscription.readOnlyReason}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-[var(--color-text-secondary)] py-4 border-t border-[var(--color-border)]">
                Tidak ada subscription konfigurasi.
              </div>
            )}
          </div>

          {/* AUDIT LOG LIST */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Audit Log Super Admin
            </h3>
            <div className="border-t border-[var(--color-border)] pt-4 space-y-3.5">
              {logs.length ? (
                logs.map((log) => (
                  <div key={log.id} className="text-xs space-y-1">
                    <p className="font-bold text-[var(--color-text)]">{log.actionType}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">{formatDateTime(log.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--color-text-secondary)] py-2">
                  Belum ada log aktivitas untuk bisnis ini.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[var(--color-text)]">Hapus Bisnis Permanen</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Apakah Anda yakin ingin menghapus bisnis <span className="font-semibold text-[var(--color-text)]">&quot;{business.name}&quot;</span> secara permanen? Seluruh data relasi dan akun owner akan ikut terhapus dari database. Tindakan ini tidak dapat dibatalkan.
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
                setDeleteConfirmOpen(false);
                await deleteBusiness(business.id);
                toast.success("Bisnis berhasil dihapus");
                router.push(ROUTES.superAdminBusinesses);
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
