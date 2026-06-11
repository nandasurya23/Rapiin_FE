"use client";

import { CalendarDays, CircleDollarSign, Clock3, MessageSquareReply, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/routes";
import { CustomerStatusBadge, OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { CUSTOMER_STATUS_LABELS } from "@/lib/constants/customer";
import { DashboardCalendar } from "@/features/dashboard/dashboard-calendar";
import { getDashboardSummary, toDateKey } from "@/lib/domain";
import type { LucideIcon } from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
      <CardBody className="flex items-start gap-4 p-5">
        <div className="rounded-lg bg-brand-50 p-3 text-brand-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export function DashboardPage() {
  const { business, orders, customers, currentUser } = useAppData();
  const { todayOrders, completedToday, unpaidOrders, followUps, revenue, recentOrders } = getDashboardSummary(orders, customers);
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

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="animate-fade-up">
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
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
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row xl:flex-col xl:items-stretch">
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

            <div className="grid gap-3 lg:grid-cols-[1.12fr_0.88fr]">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4 text-sm text-text-secondary">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">Fokus hari ini</p>
                    <p className="mt-1">Dashboard ini dipakai untuk cek cepat apa yang perlu ditangani dulu, tanpa buka banyak halaman.</p>
                  </div>
                  <ShoppingBag className="h-6 w-6 text-brand-700" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Order baru</p>
                  <p className="mt-1 text-2xl font-semibold text-text-primary">{todayOrders.length}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Follow-up</p>
                  <p className="mt-1 text-2xl font-semibold text-text-primary">{followUps.length}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="animate-fade-up-delay-1 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Order / Booking Baru"
          value={`${todayOrders.length}`}
          description="Masuk hari ini"
          icon={CalendarDays}
        />
        <StatCard
          title="Perlu Follow-Up"
          value={`${followUps.length}`}
          description="Customer yang menunggu"
          icon={MessageSquareReply}
        />
        <StatCard title="Belum Bayar / DP" value={`${unpaidOrders.length}`} description="Perlu dicek" icon={Clock3} />
        <StatCard
          title="Omzet Selesai"
          value={formatCurrency(revenue)}
          description="Dari order yang selesai"
          icon={CircleDollarSign}
        />
      </section>

      <DashboardCalendar business={business} orders={orders} selectedDate={selectedDate} onDateSelect={setSelectedDate} />

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

      <section className="animate-fade-up-delay-3 grid gap-6 2xl:grid-cols-2">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Order Selesai</h2>
                <p className="text-sm text-text-secondary">Ringkasan order yang sudah selesai hari ini.</p>
              </div>
              <Badge tone="success">{completedToday.length} selesai</Badge>
            </div>
            {completedToday.length ? (
              <div className="space-y-3">
                {completedToday.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border/80 bg-surface px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">{order.customerName}</p>
                        <p className="text-sm text-text-secondary">{order.title}</p>
                      </div>
                      <p className="text-sm font-medium text-text-primary">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-text-secondary">
                Belum ada order selesai hari ini.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Recent Orders</h2>
              <p className="text-sm text-text-secondary">Data terbaru yang masuk ke sistem.</p>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-border/80 bg-surface px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-text-primary">{order.customerName}</p>
                      <p className="text-sm text-text-secondary">{order.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-text-secondary">
                    <span>{formatDateTime(order.updatedAt)}</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
