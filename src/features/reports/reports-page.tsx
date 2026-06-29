"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Sparkles
} from "lucide-react";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { LinkButton } from "@/components/ui/button";
import { getReportSummary } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";

type PeriodFilter = "TODAY" | "WEEK" | "MONTH";

const periodOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: "TODAY", label: "Hari ini" },
  { value: "WEEK", label: "Minggu ini" },
  { value: "MONTH", label: "Bulan ini" },
];

const topItems = [
  { name: "Booking Studio 2 Jam", count: 9 },
  { name: "Booking group 4 orang", count: 5 },
  { name: "Sewa motor 1 hari", count: 4 },
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

  const exportCsv = [
    "periode,total_order,selesai,batal,customer_baru,omzet,belum_bayar",
    `${period},${summary.totalOrders},${summary.completedOrders},${summary.cancelledOrders},${summary.newCustomers},${summary.revenue},${summary.unpaidCount}`,
  ].join("\n");

  const periodLabel = periodOptions.find((option) => option.value === period)?.label ?? "Periode";

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* SECTION 1: HERO HEADER */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white">
          {/* Background decorative glows */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-accent)] opacity-15 blur-3xl animate-pulse" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-30 blur-3xl" />
          
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            {/* Left */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Laporan & Statistik
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Rangkuman Kinerja Bisnis
              </h1>
              <p className="max-w-xl text-sm text-white/70 leading-relaxed">
                Analisis perkembangan omzet, status order, dan penambahan pelanggan baru dalam satu halaman ringkas tanpa chart yang rumit.
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap gap-2.5 xl:shrink-0">
              <LinkButton href={ROUTES.dashboard} className="shadow-sm">
                Kembali ke Hari Ini
              </LinkButton>
              <LinkButton href={ROUTES.orders} variant="secondary" className="bg-white/10 text-white border-white/[0.15] hover:bg-white/20">
                Lihat Order
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PERIOD FILTER + COMPACT SUMMARY STATS */}
      <section className="animate-fade-up-delay-1">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Period filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] shrink-0">Periode</p>
            <FilterChipGroup
              options={periodOptions}
              value={period}
              onChange={(v) => setPeriod(v as PeriodFilter)}
              size="sm"
            />
          </div>

          {/* Divider (only visible on sm+) */}
          <div className="hidden sm:block self-stretch w-px bg-[var(--color-border)]" />

          {/* Inline stats row */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 sm:shrink-0">
            <StatPill label="Total Order" value={String(summary.totalOrders)} />
            <StatPill label="Selesai" value={String(summary.completedOrders)} accent="emerald" />
            <StatPill label="Batal" value={String(summary.cancelledOrders)} accent="rose" />
            <StatPill label="Customer Baru" value={String(summary.newCustomers)} accent="blue" />
            <StatPill label="Omzet" value={formatCurrency(summary.revenue)} accent="amber" />
            <StatPill label="Belum Bayar" value={String(summary.unpaidCount)} />
          </div>
        </div>
      </section>

      {/* SECTION 4: LEADERBOARD & EXPORT */}
      <section className="grid gap-6 xl:grid-cols-[1fr_0.96fr] animate-fade-up-delay-2">
        {/* Top Product Leaderboard */}
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">Produk / Layanan Terlaris</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Top item sederhana tanpa visualisasi chart yang rumit.</p>
              </div>
              <Badge tone="info">Top 3</Badge>
            </div>
            
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div
                  key={item.name}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black uppercase tracking-wider text-white",
                      index === 0 && "bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm border border-amber-300/35",
                      index === 1 && "bg-gradient-to-br from-slate-400 to-slate-500 shadow-sm border border-slate-300/35",
                      index === 2 && "bg-gradient-to-br from-[#b0743b] to-[#804f21] shadow-sm border border-amber-800/35"
                    )}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text)]">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.count} kali dipesan</p>
                    </div>
                  </div>
                  <Badge tone="neutral" className="font-extrabold">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* CSV Export Preview & Actions */}
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Export Data CSV</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Salin draf teks CSV untuk diimpor ke aplikasi spreadsheet eksternal.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)]">
                    <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)] whitespace-nowrap">Periode</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)] whitespace-nowrap">Total Order</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)] whitespace-nowrap">Selesai</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)] whitespace-nowrap">Batal</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)] whitespace-nowrap">Cust. Baru</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)] whitespace-nowrap">Omzet</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)] whitespace-nowrap">Belum Bayar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="divide-x divide-[var(--color-border)]/40 hover:bg-[var(--color-surface-elevated)]/40 transition">
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text)] whitespace-nowrap">{periodLabel}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text)] whitespace-nowrap">{summary.totalOrders}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text)] whitespace-nowrap">{summary.completedOrders}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text)] whitespace-nowrap">{summary.cancelledOrders}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text)] whitespace-nowrap">{summary.newCustomers}</td>
                    <td className="px-4 py-3 text-xs font-bold text-[var(--color-text)] whitespace-nowrap">{formatCurrency(summary.revenue)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text)] whitespace-nowrap">{summary.unpaidCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                className="rounded-xl font-bold py-2 px-4 text-xs flex items-center gap-1.5 shadow-sm"
                isLoading={loadingAction === "copy-csv"}
                onClick={async () => {
                  setLoadingAction("copy-csv");
                  try {
                    await copyToClipboard(exportCsv);
                    toast.success("CSV laporan disalin");
                  } finally {
                    setLoadingAction(null);
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Salin CSV
              </Button>
              <LinkButton href={ROUTES.businessLink} variant="secondary" className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold">
                <FileSpreadsheet className="h-4 w-4" />
                Cek Link Bisnis
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "rose" | "blue" | "amber";
}) {
  const valueColor =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "rose"
      ? "text-rose-600 dark:text-rose-400"
      : accent === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : accent === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : "text-[var(--color-text)]";

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
      <p className={`text-sm font-extrabold whitespace-nowrap ${valueColor}`}>{value}</p>
    </div>
  );
}
