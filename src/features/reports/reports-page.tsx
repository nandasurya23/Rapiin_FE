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
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { getReportSummary, getOrderReferenceDate, isWithinPeriod } from "@/lib/domain";
import type { ReportPeriod } from "@/lib/domain";
import { useOrders } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
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
  const { orders } = useOrders();
  const { customers } = useCustomers();
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
        {/* Omzet */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between h-32 rounded-md">
          <div className="flex items-center gap-2 text-[var(--color-accent)]">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Omzet</span>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-text)]">{formatCurrency(summary.revenue)}</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">{periodLabel}</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between h-32 rounded-md">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Order</span>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-text)]">{summary.totalOrders}</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">Order masuk {periodLabel.toLowerCase()}</p>
          </div>
        </div>

        {/* Customer Baru */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between h-32 rounded-md">
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
        <div className="space-y-5">
          <div className="border-b border-[var(--color-border)] pb-2">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Status Booking</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Rincian penyelesaian layanan pada {periodLabel.toLowerCase()}.</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-[var(--color-success-border)] bg-[var(--color-success-surface)] p-4 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] mb-3" />
              <p className="text-[10px] font-extrabold uppercase text-[var(--color-text-muted)]">Selesai</p>
              <p className="text-2xl font-black text-[var(--color-text)] mt-1">{summary.completedOrders}</p>
            </div>
            
            <div className="border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-4 rounded-md">
              <XCircle className="h-5 w-5 text-[var(--color-danger)] mb-3" />
              <p className="text-[10px] font-extrabold uppercase text-[var(--color-text-muted)]">Batal</p>
              <p className="text-2xl font-black text-[var(--color-text)] mt-1">{summary.cancelledOrders}</p>
            </div>
            
            <div className="border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-4 rounded-md">
              <Clock className="h-5 w-5 text-[var(--color-warning)] mb-3" />
              <p className="text-[10px] font-extrabold uppercase text-[var(--color-text-muted)]">Belum Lunas</p>
              <p className="text-2xl font-black text-[var(--color-text)] mt-1">{summary.unpaidCount}</p>
            </div>
          </div>
        </div>

        {/* Right: Top Products */}
        <div className="space-y-4">
          <div className="border-b border-[var(--color-border)] pb-2">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Layanan Terlaris</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Top 3 {periodLabel.toLowerCase()}.</p>
          </div>
          
          <div className="space-y-3">
            {topItems.length > 0 ? topItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-3 p-3 border-b border-[var(--color-border)] last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center text-xs font-black text-[var(--color-text)]",
                    index === 0 ? "text-[var(--color-accent)]" : index === 1 ? "text-[var(--color-navy-500)]" : "text-[var(--color-navy-700)]"
                  )}>
                    #{index + 1}
                  </span>
                  <div className="truncate">
                    <p className="text-sm font-bold text-[var(--color-text)] truncate">{item.name}</p>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">{item.count} order</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-xs text-[var(--color-text-secondary)]">
                Belum ada data untuk periode ini.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: ACTIONS */}
      <section className="animate-fade-up-delay-3">
        <div className="p-5 border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)]">Export Data Laporan</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-lg">Unduh rangkuman statistik {periodLabel.toLowerCase()} dalam format CSV untuk diolah lebih lanjut di Microsoft Excel atau Google Sheets.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              className="rounded-md font-bold py-2.5 px-5 text-sm"
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
        </div>
      </section>
    </main>
  );
}
