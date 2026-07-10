"use client";

import { useMemo, useState } from "react";
import {
  Download,
  TrendingUp,
  Wallet,
  Users,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { getReportSummary, getOrderReferenceDate, isWithinPeriod } from "@/lib/domain";
import type { ReportPeriod } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";

type PeriodFilter = ReportPeriod;

const periodOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: "TODAY", label: "Hari ini" },
  { value: "WEEK", label: "Minggu ini" },
  { value: "MONTH", label: "Bulan ini" },
];

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function ReportsPage() {
  const toast = useToast();
  const { orders, customers } = useAppData();
  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const summary = useMemo(() => {
    return getReportSummary(orders, customers, period);
  }, [customers, orders, period]);

  const topItems = useMemo(() => {
    const periodOrders = orders.filter((order) => isWithinPeriod(getOrderReferenceDate(order), period, new Date()));
    const counts: Record<string, number> = {};
    periodOrders.forEach(o => {
      if (o.title) {
        counts[o.title] = (counts[o.title] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({name, count}));
  }, [orders, period]);

  const exportCsv = [
    "periode,total_order,selesai,batal,customer_baru,omzet,belum_bayar",
    `${period},${summary.totalOrders},${summary.completedOrders},${summary.cancelledOrders},${summary.newCustomers},${summary.revenue},${summary.unpaidCount}`,
  ].join("\n");

  const periodLabel = periodOptions.find((option) => option.value === period)?.label ?? "Periode";

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* SECTION 1: HEADER & PERIOD FILTER */}
      <PageHeader
        title="Laporan & Statistik"
        description="Ringkasan performa bisnis Anda."
        action={
          <FilterChipGroup
            options={periodOptions}
            value={period}
            onChange={(v) => setPeriod(v as PeriodFilter)}
          />
        }
      />

      {/* SECTION 2: KEY METRICS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up-delay-1">
        {/* Omzet Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] p-5 text-white shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="flex items-center gap-2 text-amber-50">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Omzet</span>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">{formatCurrency(summary.revenue)}</h2>
            <p className="text-xs text-amber-100/80 mt-1 font-medium">{periodLabel}</p>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] p-5 text-white shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="flex items-center gap-2 text-blue-100">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Order</span>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">{summary.totalOrders}</h2>
            <p className="text-xs text-blue-100/80 mt-1 font-medium">Order masuk {periodLabel.toLowerCase()}</p>
          </div>
        </div>

        {/* Customer Baru Card */}
        <div className="rounded-3xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] p-5 shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Users className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Customer Baru</span>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-text)]">{summary.newCustomers}</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">Orang daftar {periodLabel.toLowerCase()}</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: ORDER PERFORMANCE & PRODUCTS */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr] animate-fade-up-delay-2">
        {/* Left: Order Breakdown */}
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="p-5 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Status Booking</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Rincian penyelesaian layanan pada {periodLabel.toLowerCase()}.</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[var(--color-success-surface)] border border-[var(--color-success)]/30 p-4">
                <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] mb-3" />
                <p className="text-[10px] font-extrabold uppercase text-[var(--color-text-muted)]">Selesai</p>
                <p className="text-2xl font-black text-[var(--color-text)] mt-1">{summary.completedOrders}</p>
              </div>
              
              <div className="rounded-2xl bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/30 p-4">
                <XCircle className="h-5 w-5 text-[var(--color-danger)] mb-3" />
                <p className="text-[10px] font-extrabold uppercase text-[var(--color-text-muted)]">Batal</p>
                <p className="text-2xl font-black text-[var(--color-text)] mt-1">{summary.cancelledOrders}</p>
              </div>
              
              <div className="rounded-2xl bg-[var(--color-warning-surface)] border border-[var(--color-warning)]/30 p-4">
                <Clock className="h-5 w-5 text-[var(--color-warning)] mb-3" />
                <p className="text-[10px] font-extrabold uppercase text-[var(--color-text-muted)]">Belum Lunas</p>
                <p className="text-2xl font-black text-[var(--color-text)] mt-1">{summary.unpaidCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Right: Top Products */}
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">Layanan Terlaris</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Top 3 {periodLabel.toLowerCase()}.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {topItems.length > 0 ? topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-inset)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white",
                      index === 0 ? "bg-[var(--color-accent)]" : index === 1 ? "bg-[var(--color-navy-500)]" : "bg-[var(--color-navy-700)]"
                    )}>
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[var(--color-text)] truncate">{item.name}</p>
                      <p className="text-[10px] font-medium text-[var(--color-text-secondary)]">{item.count} order</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-inset)] rounded-2xl border border-dashed border-[var(--color-border)]">
                  Belum ada data untuk periode ini.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      {/* SECTION 4: ACTIONS */}
      <section className="animate-fade-up-delay-3">
        <Card className="border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-primary-surface)]/20 shadow-none">
          <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">Export Data Laporan</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-lg">Unduh rangkuman statistik {periodLabel.toLowerCase()} dalam format CSV untuk diolah lebih lanjut di Microsoft Excel atau Google Sheets.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                type="button"
                className="rounded-xl font-bold py-2.5 px-5 text-sm shadow-sm"
                isLoading={loadingAction === "copy-csv"}
                onClick={async () => {
                  setLoadingAction("copy-csv");
                  try {
                    await copyToClipboard(exportCsv);
                    toast.success("CSV berhasil disalin", "Silakan paste (Ctrl+V) di Excel/Spreadsheet.");
                  } finally {
                    setLoadingAction(null);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Salin CSV
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
