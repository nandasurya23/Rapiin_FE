"use client";

import { useEffect, useMemo, useState } from "react";
import { ReceiptText, Send, FileSpreadsheet, Plus, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { ROUTES } from "@/lib/routes";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { getEntityById } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";
import { Pagination } from "@/components/ui/pagination";

type InvoiceFilter = "ALL" | "PAID" | "DP_PAID" | "UNPAID" | "REFUNDED" | "CANCELLED";

const invoiceFilterOptions: Array<{ value: InvoiceFilter; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "UNPAID", label: "Belum Bayar" },
  { value: "DP_PAID", label: "Sudah DP" },
  { value: "PAID", label: "Lunas" },
  { value: "REFUNDED", label: "Refund" },
  { value: "CANCELLED", label: "Batal" },
];

const INVOICE_PAGE_SIZE = 6;

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function InvoicesPage() {
  const toast = useToast();
  const { business, orders, invoices, createInvoiceFromOrder } = useAppData();
  const [filter, setFilter] = useState<InvoiceFilter>("ALL");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id ?? "");
  const [selectedOrderId, setSelectedOrderId] = useState(
    orders.find((order) => order.status === "SELESAI")?.id ?? orders[0]?.id ?? ""
  );
  const [notes, setNotes] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredInvoices = useMemo(
    () => invoices.filter((invoice) => filter === "ALL" || invoice.paymentStatus === filter),
    [filter, invoices]
  );
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / INVOICE_PAGE_SIZE));
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * INVOICE_PAGE_SIZE;
    return filteredInvoices.slice(startIndex, startIndex + INVOICE_PAGE_SIZE);
  }, [currentPage, filteredInvoices]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!filteredInvoices.length) {
      return;
    }

    const selectedStillVisible = filteredInvoices.some((invoice) => invoice.id === selectedInvoiceId);
    if (!selectedStillVisible) {
      setSelectedInvoiceId(filteredInvoices[0].id);
    }
  }, [filteredInvoices, selectedInvoiceId]);

  const selectedInvoice = filteredInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? filteredInvoices[0] ?? invoices[0];
  const selectedOrder = getEntityById(orders, selectedOrderId) ?? orders[0];
  const selectedOrderLink = selectedInvoice ? ROUTES.invoice(selectedInvoice.invoiceCode) : ROUTES.invoices;

  async function createFromOrder() {
    if (!selectedOrder) {
      return;
    }

    setLoadingAction("create-invoice");
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const nextInvoice = createInvoiceFromOrder(selectedOrder.id, notes);
      if (!nextInvoice) {
        return;
      }
      setSelectedInvoiceId(nextInvoice.id);
      toast.success("Nota berhasil dibuat", "Preview nota langsung siap dibagikan.");
      setNotes("");
    } finally {
      setLoadingAction(null);
    }
  }

  const selectedInvoiceOrder = selectedInvoice ? getEntityById(orders, selectedInvoice.orderId) : undefined;

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Nota</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
                  Nota sederhana, rapi, dan siap dibagikan
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Buat nota dari order, cek preview, lalu kirim ke customer lewat WhatsApp tanpa proses yang ribet.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={ROUTES.orders}>
                  <Plus className="h-4 w-4" />
                  Buat dari Order
                </LinkButton>
                <LinkButton href={selectedInvoice ? ROUTES.invoice(selectedInvoice.invoiceCode) : ROUTES.invoices} variant="secondary">
                  <ExternalLink className="h-4 w-4" />
                  Lihat Nota Publik
                </LinkButton>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4 text-sm text-text-secondary">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">Ringkasan nota</p>
                    <p className="mt-1">Data mock ini sudah cukup untuk flow create, preview, dan kirim nota di MVP.</p>
                  </div>
                  <ReceiptText className="h-5 w-5 text-brand-700" />
                </div>
                <div className="mt-4 rounded-xl border border-border/70 bg-surface px-4 py-4">
                  <p className="font-medium text-text-primary">Status kerja</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    PDF dan download masih placeholder. Nanti bisa diganti ke export nyata tanpa rombak layout utama.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Total invoice</p>
                  <p className="mt-1 text-2xl font-semibold text-text-primary">{invoices.length}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Invoice lunas</p>
                  <p className="mt-1 text-2xl font-semibold text-text-primary">
                    {invoices.filter((invoice) => invoice.paymentStatus === "PAID").length}
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">List invoice</h2>
                <p className="text-sm text-text-secondary">Filter, lihat detail, dan kirim via WhatsApp.</p>
              </div>
              <Badge tone="info">{filteredInvoices.length} item</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {invoiceFilterOptions.map((option) => {
                const active = filter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                      active ? "border-brand-500 bg-brand-50 text-brand-800" : "border-border bg-surface text-text-secondary hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {paginatedInvoices.map((invoice) => {
                const active = selectedInvoice?.id === invoice.id;

                return (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                    className={`w-full rounded-xl border border-border/80 bg-surface px-4 py-4 text-left transition ${
                      active ? "border-brand-500 bg-brand-50" : "border-border bg-surface hover:bg-muted"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-text-primary">{invoice.invoiceCode}</p>
                        <p className="mt-1 text-sm text-text-secondary">{invoice.customerName}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PaymentStatusBadge status={invoice.paymentStatus} />
                        <Badge tone="neutral">{formatCurrency(invoice.totalAmount)}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                      <span>{formatDate(invoice.createdAt)}</span>
                      <span>{invoice.notes ?? "-"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              pageSize={INVOICE_PAGE_SIZE}
              totalItems={filteredInvoices.length}
              onPageChange={setCurrentPage}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Preview invoice</h2>
              <p className="text-sm text-text-secondary">Tampilan ringkas yang siap dibagikan ke customer.</p>
            </div>

            {selectedInvoice ? (
              <>
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{business.name}</p>
                      <h3 className="mt-1 text-xl font-semibold text-text-primary">{selectedInvoice.invoiceCode}</h3>
                      <p className="mt-1 text-sm text-text-secondary">Tanggal dibuat: {formatDateTime(selectedInvoice.createdAt)}</p>
                    </div>
                    <Badge tone="info">{selectedInvoice.paymentStatus}</Badge>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                      <p className="text-xs text-text-muted">Customer</p>
                      <p className="mt-1 font-medium text-text-primary">{selectedInvoice.customerName}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                      <p className="text-xs text-text-muted">Total</p>
                      <p className="mt-1 font-medium text-text-primary">{formatCurrency(selectedInvoice.totalAmount)}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                      <p className="text-xs text-text-muted">Order terkait</p>
                      <p className="mt-1 font-medium text-text-primary">{selectedInvoiceOrder?.title ?? "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                      <p className="text-xs text-text-muted">Status bayar</p>
                      <p className="mt-1 font-medium text-text-primary">{selectedInvoice.paymentStatus}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-border/70 bg-surface px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-text-primary">Rincian</p>
                      <Badge tone="neutral">1 item</Badge>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium text-text-primary">{selectedInvoiceOrder?.title ?? "Nota layanan"}</p>
                        <p className="mt-1 text-text-secondary">Item utama dari order yang dipilih.</p>
                      </div>
                      <p className="font-medium text-text-primary">{formatCurrency(selectedInvoice.totalAmount)}</p>
                    </div>
                    <div className="mt-4 border-t border-border/80 pt-4 text-sm text-text-secondary">
                      <p>Catatan: {selectedInvoice.notes ?? "-"}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <WhatsAppButton
                      phoneNumber={selectedInvoiceOrder?.whatsappNumber ?? business.whatsappNumber}
                      message={`Halo ${selectedInvoice.customerName}, ini nota untuk ${selectedInvoice.invoiceCode}.`}
                      label="Kirim WA"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      isLoading={loadingAction === "copy-invoice-code"}
                      onClick={async () => {
                        setLoadingAction("copy-invoice-code");
                        try {
                          await copyToClipboard(selectedInvoice.invoiceCode);
                          toast.success("Kode invoice disalin");
                        } finally {
                          setLoadingAction(null);
                        }
                      }}
                    >
                      <Send className="h-4 w-4" />
                      Salin Kode
                    </Button>
                    <LinkButton href={ROUTES.invoice(selectedInvoice.invoiceCode)} variant="secondary">
                      <FileText className="h-4 w-4" />
                      Buka Publik
                    </LinkButton>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">Buat nota dari order</h3>
                      <p className="text-sm text-text-secondary">Pilih order lalu simpan sebagai nota baru.</p>
                    </div>
                    <Badge tone="success">{orders.filter((order) => order.status === "SELESAI").length} selesai</Badge>
                  </div>
                  <Select
                    value={selectedOrderId}
                    onValueChange={setSelectedOrderId}
                    options={orders.map((order) => ({
                      value: order.id,
                      label: `${order.customerName} - ${order.title}`,
                    }))}
                  />
                  <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Catatan tambahan nota" />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" isLoading={loadingAction === "create-invoice"} onClick={() => void createFromOrder()}>
                      <FileSpreadsheet className="h-4 w-4" />
                      Buat Nota
                    </Button>
                    <LinkButton href={selectedOrderLink} variant="secondary">
                      <ExternalLink className="h-4 w-4" />
                      Preview Route
                    </LinkButton>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-5 text-sm text-text-secondary">
                Belum ada invoice yang bisa dipreview.
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
