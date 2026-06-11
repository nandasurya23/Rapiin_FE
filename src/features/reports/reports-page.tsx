"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, CalendarDays, TrendingUp, UserRoundPlus, WalletCards, Ban, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { LinkButton } from "@/components/ui/button";
import { getReportSummary } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";

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
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Laporan</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
                  Laporan sederhana, bukan dashboard berat
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Lihat total order, selesai, batal, customer baru, omzet, dan tagihan belum beres tanpa chart berlebihan.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={ROUTES.dashboard}>Kembali ke Hari Ini</LinkButton>
                <LinkButton href={ROUTES.orders} variant="secondary">
                  Lihat Order
                </LinkButton>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">Filter periode</p>
                    <p className="mt-1 text-sm text-text-secondary">Pilih hari, minggu, atau bulan sesuai kebutuhan cek cepat.</p>
                  </div>
                  <CalendarDays className="h-5 w-5 text-brand-700" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {periodOptions.map((option) => {
                    const active = period === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPeriod(option.value)}
                        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                          active ? "border-brand-500 bg-brand-50 text-brand-800" : "border-border bg-surface text-text-secondary hover:bg-muted"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Periode aktif</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{periodLabel}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Data mock</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">Siap diganti backend</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Order" value={summary.totalOrders} icon={FileSpreadsheet} />
        <MetricCard title="Order Selesai" value={summary.completedOrders} icon={BadgeCheck} />
        <MetricCard title="Order Batal" value={summary.cancelledOrders} icon={Ban} />
        <MetricCard title="Customer Baru" value={summary.newCustomers} icon={UserRoundPlus} />
        <MetricCard title="Omzet" value={formatCurrency(summary.revenue)} icon={TrendingUp} />
        <MetricCard title="Belum Bayar" value={summary.unpaidCount} icon={WalletCards} />
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1fr_0.96fr]">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Produk / layanan terlaris</h2>
                <p className="text-sm text-text-secondary">Top item sederhana tanpa chart berat.</p>
              </div>
              <Badge tone="info">Top 3</Badge>
            </div>
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div key={item.name} className="rounded-xl border border-border/80 bg-surface px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text-primary">
                        {index + 1}. {item.name}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">{item.count} kali dipilih</p>
                    </div>
                    <Badge tone="neutral">{item.count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Export CSV</h2>
              <p className="text-sm text-text-secondary">Placeholder export yang bisa dipakai untuk laporan sederhana.</p>
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm text-text-secondary">
              <p className="font-medium text-text-primary">Preview CSV</p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap">{exportCsv}</pre>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
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
              <LinkButton href={ROUTES.businessLink} variant="secondary">
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

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: typeof FileSpreadsheet;
}) {
  return (
    <Card>
      <CardBody className="flex items-start gap-4 p-5">
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
