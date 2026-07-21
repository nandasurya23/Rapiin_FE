"use client";

import { useMemo, useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  History,
  Database,
  Server,
  ShieldAlert,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/components/ui/toast-provider";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { formatDateTime } from "@/lib/format";
import { getDaysUntilExpiry } from "@/lib/subscription";
import { useAppData } from "@/components/providers/app-data-provider";
import { useCustomers } from "@/hooks/use-customers";
import { useOrders } from "@/hooks/use-orders";
import { getCustomerUsage } from "@/lib/subscription";
import type { PlanCode } from "@/types/subscription";

export function PlanPage() {
  const toast = useToast();
  const {
    subscriptionForCurrentBusiness,
    system,
    backupRecords,
    upgradeRequests,
    createBackup,
    requestUpgrade,
    business,
  } = useAppData();

  const { customers } = useCustomers();
  const { orders } = useOrders();
  const currentBusinessUsage = getCustomerUsage({ business: business!, subscriptions: subscriptionForCurrentBusiness ? [subscriptionForCurrentBusiness] : [], customers });
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

  function exportToCsv(headers: string[], rows: string[][], filename: string) {
    try {
      const csvContent = "\uFEFF" + [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
        ...rows.map(row => row.map(val => `"${(val || "").replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File laporan Excel (CSV) berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh file laporan");
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

  const planDetails: Record<PlanCode, { price: string; subtitle: string; icon: React.ComponentType<{ className?: string }>; accentColor: string; isPopular?: boolean }> = {
    FREE_TRIAL: {
      price: "Gratis",
      subtitle: "Uji coba fitur dasar",
      icon: Clock,
      accentColor: "text-slate-400 border-slate-500/20 bg-slate-500/5",
    },
    PRO: {
      price: "Rp 49.000",
      subtitle: "Untuk UMKM berkembang",
      icon: Zap,
      accentColor: "text-[var(--color-accent)] border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5",
      isPopular: true,
    },
    PREMIUM: {
      price: "Rp 149.000",
      subtitle: "Fitur penuh & skala besar",
      icon: Sparkles,
      accentColor: "text-sky-400 border-sky-500/20 bg-sky-500/5",
    },
  };

  return (
    <main className="page-enter space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* SECTION 1: HERO HEADER & STATS */}
      <section className="space-y-6">
        <PageHeader
          variant="hero"
          title="Kelola Langganan & Keamanan Data"
          description="Pantau masa trial, kapasitas customer, status backup database lokal, dan kirim permintaan upgrade secara instan tanpa hambatan."
          badge={
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Plan & Backup System
            </div>
          }
          action={
            <div className="flex flex-wrap items-center gap-2.5 lg:mt-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-gold-500)]/15 text-[var(--color-gold-300)] border border-[var(--color-gold-500)]/30 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest">
                {PLAN_LABELS[subscriptionForCurrentBusiness.planCode]}
              </span>
              {subscriptionForCurrentBusiness.planCode !== "FREE_TRIAL" && (
                <span className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest border ${
                  subscriptionForCurrentBusiness.hasCompletedRequiredBackup 
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}>
                  {subscriptionForCurrentBusiness.hasCompletedRequiredBackup ? "Backup Optimal" : "Backup Wajib"}
                </span>
              )}
            </div>
          }
        />

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <SummaryStat
              label="Status Plan"
              value={subscriptionForCurrentBusiness.status.replace("_", " ")}
              icon={Server}
              description="Status server langganan"
            />
            <SummaryStat
              label="Sisa Masa Trial"
              value={daysLeft !== null ? `${Math.max(daysLeft, 0)} Hari` : "-"}
              icon={Clock}
              description={daysLeft !== null && daysLeft <= 5 ? "Segera lakukan upgrade" : "Masa percobaan aktif"}
            />
            <SummaryStat
              label="Kuota Pelanggan"
              value={`${currentBusinessUsage.used} / ${currentBusinessUsage.limit}`}
              icon={Users}
              description="Jumlah kontak terdaftar"
            />
            {subscriptionForCurrentBusiness.planCode !== "FREE_TRIAL" && (
              <SummaryStat
                label="Backup Terakhir"
                value={subscriptionForCurrentBusiness.lastBackupAt ? formatDateTime(subscriptionForCurrentBusiness.lastBackupAt) : "Belum ada"}
                icon={History}
                description="Cadangan database lokal"
              />
            )}
          </div>
      </section>

      {/* SECTION 2: 3-COLUMN PRICING GRID */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Pilih Upgrade Plan</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Upgrade dilakukan dengan persetujuan manual oleh Super Admin untuk kenyamanan Anda.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {system.planCatalog.map((plan) => {
            const isSelected = selectedPlan === plan.code;
            const isCurrent = subscriptionForCurrentBusiness.planCode === plan.code;
            const details = planDetails[plan.code];
            const Icon = details.icon;
            
            // Border state transitions
            let cardBorder = "border-[var(--color-border)]";
            if (isCurrent) {
              cardBorder = "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/20";
            } else if (isSelected) {
              cardBorder = "border-[var(--color-accent)] shadow-[0_0_15px_rgba(218,159,78,0.18)] ring-1 ring-[var(--color-accent)]/30";
            }

            return (
              <div
                key={plan.code}
                onClick={() => {
                  if (plan.code !== "FREE_TRIAL" && plan.code !== "PREMIUM") {
                    setSelectedPlan(plan.code);
                  }
                }}
                className={`group relative flex flex-col justify-between rounded-3xl border bg-[var(--color-surface)] p-6 transition-all duration-300 hover:shadow-lg ${
                  plan.code === "PREMIUM" ? "opacity-65 cursor-not-allowed" : "cursor-pointer"
                } ${cardBorder} ${
                  !isCurrent && plan.code !== "FREE_TRIAL" && plan.code !== "PREMIUM" ? "hover:-translate-y-1" : ""
                }`}
              >
                {/* Popular Badge */}
                {details.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[#AF752E] px-4 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white  border border-amber-300/20">
                    Terpopuler
                  </span>
                )}

                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${details.accentColor}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-3 text-lg font-bold text-[var(--color-text)]">{plan.label}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{details.subtitle}</p>
                    </div>
                    {isCurrent && (
                      <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        Plan Aktif
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-2xl font-black tracking-tight text-[var(--color-text)]">{details.price}</span>
                    {plan.code !== "FREE_TRIAL" && (
                      <span className="text-xs text-[var(--color-text-secondary)]">/ bulan</span>
                    )}
                  </div>

                  <div className="my-5 border-t border-[var(--color-border)]/60" />

                  {/* Limit Info */}
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold text-[var(--color-text)]">
                    <Users className="h-4 w-4 text-[var(--color-primary)]" />
                    <span>Maks. {plan.customerLimit.toLocaleString("id-ID")} Pelanggan</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="mt-8">
                  {plan.code === "PREMIUM" ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl border border-sky-500/20 bg-sky-500/5 py-2.5 text-xs font-bold text-sky-400 cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  ) : plan.code === "FREE_TRIAL" ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-2.5 text-xs font-bold text-[var(--color-text-muted)] cursor-not-allowed"
                    >
                      Masa Percobaan
                    </button>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 py-2.5 text-xs font-bold text-emerald-700 cursor-not-allowed"
                    >
                      Plan Aktif Saat Ini
                    </button>
                  ) : isSelected ? (
                    pendingRequest?.toPlan === plan.code ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-xl border border-amber-200 bg-amber-50/80 py-2.5 text-xs font-bold text-amber-700 cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Clock className="h-3.5 w-3.5 animate-pulse" />
                        Menunggu Review
                      </button>
                    ) : (
                      <Button
                        type="button"
                        className="w-full py-2.5 text-xs font-bold rounded-xl"
                        isLoading={loadingAction === "upgrade"}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleRequestUpgrade();
                        }}
                      >
                        Kirim Request Upgrade
                      </Button>
                    )
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 text-xs font-bold text-[var(--color-text)] transition hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]"
                    >
                      Pilih Plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade alert details */}
        {pendingRequest && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs sm:text-sm text-amber-800 animate-pulse">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase tracking-wider text-[10px] block mb-1">Permintaan upgrade tertunda</span>
              Permintaan upgrade ke plan <span className="font-bold">{PLAN_LABELS[pendingRequest.toPlan]}</span> masih menunggu persetujuan Super Admin. Harap tunggu hingga direview.
            </div>
          </div>
        )}
      </section>

      {subscriptionForCurrentBusiness.planCode !== "FREE_TRIAL" && (
        <section className="grid gap-6 xl:grid-cols-12">
          {/* Left Side: Backup Status Controller (cols-5) */}
          <div className="xl:col-span-5 flex flex-col">
            <div className="flex-1 flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="p-6 flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-[var(--color-text)]">Pencadangan Data</h2>
                    <Server className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Lakukan backup secara berkala untuk mengamankan seluruh data transaksi, katalog, dan pelanggan Anda ke dalam database snapshot lokal.
                  </p>

                  {/* Status Indicator Panel */}
                  <div className={`rounded-2xl border p-4 flex gap-4 items-start ${
                    subscriptionForCurrentBusiness.hasCompletedRequiredBackup
                      ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                      : "bg-amber-50/50 border-amber-100 text-amber-800"
                  }`}>
                    <span className={`flex h-2 w-2 shrink-0 rounded-full mt-1.5 ${
                      subscriptionForCurrentBusiness.hasCompletedRequiredBackup ? "bg-emerald-500 animate-ping" : "bg-amber-500 animate-pulse"
                    }`} />
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider">
                        {subscriptionForCurrentBusiness.hasCompletedRequiredBackup ? "Keamanan Data: Optimal" : "Tindakan Diperlukan"}
                      </h4>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        {subscriptionForCurrentBusiness.hasCompletedRequiredBackup
                          ? "Bisnis Anda memiliki data backup yang valid. Lakukan backup secara berkala setelah melakukan pembaruan besar."
                          : "Akun Anda belum memiliki data backup. Buat snapshot sekarang agar data tidak hilang ketika cache browser dibersihkan."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] transition-all duration-300"
                    isLoading={loadingAction === "backup"}
                    onClick={() => void handleCreateBackup()}
                  >
                    <ShieldCheck className="h-4.5 w-4.5" />
                    Cadangkan Database Sekarang
                  </Button>

                  <div className="border-t border-[var(--color-border)]/60 pt-4 space-y-3">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Ekspor Laporan ke Excel</span>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] transition-all"
                        onClick={() => {
                          const headers = ["ID Pelanggan", "Nama", "Nomor WhatsApp", "Status", "Catatan", "Tanggal Terdaftar"];
                          const rows = customers.map((c) => [
                            c.id,
                            c.name,
                            c.whatsappNumber,
                            c.status,
                            c.notes || "",
                            formatDateTime(c.createdAt),
                          ]);
                          exportToCsv(headers, rows, `laporan-pelanggan-${new Date().toISOString().slice(0, 10)}.csv`);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Ekspor Kontak Pelanggan (Excel)
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] transition-all"
                        onClick={() => {
                          const headers = [
                            "ID Order",
                            "Nama Pelanggan",
                            "Nomor WhatsApp",
                            "Layanan / Produk",
                            "Tanggal Jadwal",
                            "Jam Jadwal",
                            "Durasi (Menit)",
                            "Total Harga",
                            "DP Masuk",
                            "Status Pembayaran",
                            "Status Pesanan",
                            "Catatan",
                          ];
                          const rows = orders.map((o) => [
                            o.id,
                            o.customerName,
                            o.whatsappNumber,
                            o.title,
                            o.scheduledDate || "-",
                            o.scheduledTime || "-",
                            String(o.bookingDurationMinutes || 0),
                            String(o.totalAmount || 0),
                            String(o.dpAmount || 0),
                            o.paymentStatus,
                            o.status,
                            o.notes || "",
                          ]);
                          exportToCsv(headers, rows, `laporan-pemesanan-${new Date().toISOString().slice(0, 10)}.csv`);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Ekspor Riwayat Pemesanan (Excel)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Snapshot History Logs (cols-7) */}
          <div className="xl:col-span-7 flex flex-col">
            <div className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text)]">Riwayat Snapshot</h2>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Menampilkan hingga 5 cadangan snapshot lokal terakhir</p>
                  </div>
                  <Database className="h-5 w-5 text-[var(--color-primary)]" />
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 no-scrollbar">
                  {businessBackups.length ? (
                    businessBackups.map((backup) => (
                      <div
                        key={backup.id}
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-surface)] text-[var(--color-primary)] transition group-hover:scale-105">
                            <Database className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text)]">{backup.summary}</p>
                            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                              {formatDateTime(backup.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-lg bg-[var(--color-primary-surface)] text-[var(--color-primary)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-[var(--color-info-border)]">
                          {backup.type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] py-12 px-4 text-center text-sm text-[var(--color-text-secondary)]">
                      <Database className="h-8 w-8 text-slate-300 mb-2.5" />
                      <p className="font-semibold text-slate-400">Belum Ada Cadangan</p>
                      <p className="text-xs text-slate-400 max-w-[240px] mt-1">Buat snapshot pertama Anda untuk mengamankan data bisnis.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function SummaryStat({
  label,
  value,
  icon: Icon,
  description
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-4 transition-all duration-300 hover:border-[var(--color-border-strong)] hover: group">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-extrabold tracking-wider text-[var(--color-text-muted)] uppercase">{label}</p>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary-surface)] text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2.5 text-lg font-black tracking-tight text-[var(--color-text)]">{value}</p>
      {description && <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">{description}</p>}
      <div className="absolute -right-6 -bottom-6 h-12 w-12 rounded-full bg-[var(--color-border)]/20 group-hover:scale-150 transition-transform duration-500" />
    </div>
  );
}

