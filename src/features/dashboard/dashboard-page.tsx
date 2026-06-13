"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/routes";
import { CustomerStatusBadge, OrderStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { CUSTOMER_STATUS_LABELS } from "@/lib/constants/customer";
import { DashboardCalendar } from "@/features/dashboard/dashboard-calendar";
import { getDashboardSummary, toDateKey } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";

export function DashboardPage() {
  const { business, orders, customers, currentUser } = useAppData();
  const { todayOrders, unpaidOrders, followUps, revenue } = getDashboardSummary(orders, customers);
  const today = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const actionSectionRef = useRef<HTMLElement | null>(null);
  const previousSelectedDateRef = useRef(selectedDate);

  const actionItems = [
    ...todayOrders
      .filter((order) => order.paymentStatus !== "PAID" && order.status !== "BATAL")
      .slice(0, 2)
      .map((order) => ({
        type: "order" as const,
        id: order.id,
        title: order.customerName,
        reason: order.paymentStatus === "UNPAID" ? "Belum bayar" : "Perlu dicek ulang",
        status: order.status,
        dueDate: order.scheduledDate ?? "",
        due: order.scheduledDate ? `${formatDate(order.scheduledDate)}${order.scheduledTime ? ` • ${order.scheduledTime}` : ""}` : "-",
        phone: order.whatsappNumber,
        message: `Halo ${order.customerName}, saya follow-up untuk ${order.title}.`,
      })),
    ...followUps.slice(0, 2).map((customer) => ({
      type: "customer" as const,
      id: customer.id,
      title: customer.name,
      reason: CUSTOMER_STATUS_LABELS[customer.status],
      status: customer.status,
      dueDate: customer.lastInteractionAt ? toDateKey(new Date(customer.lastInteractionAt)) : "",
      due: customer.lastInteractionAt ? formatDateTime(customer.lastInteractionAt) : "-",
      phone: customer.whatsappNumber,
      message: `Halo ${customer.name}, saya follow-up ya.`,
    })),
  ].slice(0, 4);

  const filteredActionItems = actionItems.filter((item) => item.dueDate === selectedDate);

  useEffect(() => {
    if (previousSelectedDateRef.current !== selectedDate) {
      actionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      previousSelectedDateRef.current = selectedDate;
    }
  }, [selectedDate]);

  const compactStats = [
    { label: "Order hari ini", value: String(todayOrders.length), tone: "info" as const },
    { label: "Belum bayar", value: String(unpaidOrders.length), tone: "warning" as const },
    { label: "Omzet", value: formatCurrency(revenue), tone: "success" as const },
  ];

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="animate-fade-up">
        <Card className="border-border/80 shadow-soft">
          <CardBody className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  {formatDate(today)}
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
                  Selamat datang, {currentUser?.name ?? business.ownerName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Ini yang perlu diurus hari ini. Fokus ke follow-up, pembayaran, jadwal, dan order yang harus selesai.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row xl:items-stretch">
                <LinkButton href={ROUTES.orders} className="justify-center sm:min-w-[200px]">
                  Tambah Order
                </LinkButton>
                <LinkButton href={ROUTES.customers} variant="secondary" className="justify-center sm:min-w-[200px]">
                  Tambah Customer
                </LinkButton>
                <LinkButton href={ROUTES.messages} variant="secondary" className="justify-center sm:min-w-[200px]">
                  Pesan Cepat
                </LinkButton>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <DashboardCalendar business={business} orders={orders} selectedDate={selectedDate} onDateSelect={setSelectedDate} />

      <section className="animate-fade-up-delay-2">
        <div className="grid gap-3 sm:grid-cols-3">
          {compactStats.map((item) => (
            <div key={item.label} className="rounded-lg border border-border/70 bg-surface px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-muted">{item.label}</p>
                <Badge tone={item.tone}>{item.value}</Badge>
              </div>
              <p className="mt-2 text-lg font-semibold text-text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={actionSectionRef} className="animate-fade-up-delay-3 scroll-mt-24">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Perlu Diurus</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Aksi penting maksimal 2 klik. Fokus ke yang paling mendesak dulu.
                </p>
              </div>
              <Badge tone="warning">{filteredActionItems.length} item</Badge>
            </div>

            <div className="space-y-3">
              {filteredActionItems.length ? (
                filteredActionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-xl border border-border/80 bg-surface px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-text-primary">{item.title}</p>
                        {item.type === "order" ? (
                          <OrderStatusBadge status={item.status} />
                        ) : (
                          <CustomerStatusBadge status={item.status} />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">{item.reason}</p>
                      <p className="mt-1 text-xs text-text-muted">Jatuh tempo: {item.due}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <WhatsAppButton phoneNumber={item.phone} message={item.message} label="Follow-Up WA" />
                      <LinkButton href={ROUTES.orders} variant="secondary">
                        Ubah Status
                      </LinkButton>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 p-5 text-sm text-text-secondary">
                  Belum ada order, booking, atau follow-up untuk tanggal ini.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="animate-fade-up-delay-3">
        <div className="flex flex-wrap gap-2">
          <LinkButton href={ROUTES.orders} variant="secondary">
            Lihat Semua Order
          </LinkButton>
          <LinkButton href={ROUTES.reports} variant="secondary">
            Lihat Laporan
          </LinkButton>
        </div>
      </section>
    </main>
  );
}
