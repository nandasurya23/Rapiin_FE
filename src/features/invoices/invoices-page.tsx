"use client";

import { useEffect, useMemo, useState } from "react";
import { ReceiptText, Send, FileSpreadsheet, Plus, ExternalLink, FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatDate } from "@/lib/format";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/lib/routes";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { getEntityById } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";
import { useOrders } from "@/hooks/use-orders";
import { useInvoices } from "@/hooks/use-invoices";
import { Pagination } from "@/components/ui/pagination";
import { InvoiceSheet } from "@/features/invoices/invoice-sheet";
import { cn } from "@/lib/cn";
import { SkeletonCard } from "@/components/shared/loading";

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
 const { business, readOnlyReason } = useAppData();
 const { orders } = useOrders();
 const { invoices, isLoading, createInvoiceFromOrder, canCreateInvoice } = useInvoices();
 const [filter, setFilter] = useState<InvoiceFilter>("ALL");
 const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id ?? "");
 const [selectedOrderId, setSelectedOrderId] = useState(
  orders.find((order) => order.status !== "BATAL" && order.totalAmount !== null && order.totalAmount !== undefined && order.totalAmount > 0)?.id ?? 
  orders.find((order) => order.totalAmount !== null && order.totalAmount !== undefined && order.totalAmount > 0)?.id ?? ""
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
  if (typeof window !== "undefined") {
   const params = new URLSearchParams(window.location.search);
   const orderId = params.get("orderId");
   if (orderId && orders.some((o) => o.id === orderId)) {
    setSelectedOrderId(orderId);
   }
  }
 }, [orders]);

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
 const selectedOrderLink = selectedInvoice ? ROUTES.invoice(selectedInvoice.invoiceCode, selectedInvoice.integritySeal) : ROUTES.invoices(business.slug);

 async function createFromOrder() {
  if (loadingAction === "create-invoice") return;
  if (!selectedOrder) {
   return;
  }

  setLoadingAction("create-invoice");
  try {
   await new Promise((resolve) => setTimeout(resolve, 250));
   try {
    const nextInvoice = await createInvoiceFromOrder(selectedOrder.id, notes);
    if (!nextInvoice) {
     return;
    }
    setSelectedInvoiceId(nextInvoice.id);
    toast.success("Nota berhasil dibuat", "Preview nota langsung siap dibagikan.");
    setNotes("");
   } catch (submitError) {
    toast.error("Nota belum bisa dibuat", submitError instanceof Error ? submitError.message : "Mode baca saja aktif.");
   }
  } finally {
   setLoadingAction(null);
  }
 }

 const selectedInvoiceOrder = selectedInvoice ? getEntityById(orders, selectedInvoice.orderId) : undefined;

 // Helpers for CRM Initials Avatar and gradients
 function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
 }

 function getAvatarGradient(name: string) {
  const code = name.charCodeAt(0) % 4;
  if (code === 0) return "from-blue-400 to-indigo-600";
  if (code === 1) return "from-emerald-400 to-teal-600";
  if (code === 2) return "from-amber-400 to-orange-600";
  return "from-pink-400 to-rose-600";
 }

 return (
  <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
   {/* SECTION 1: HERO HEADER */}
   <PageHeader
    variant="hero"
    title="Nota Rapi & Siap Dibagikan"
    description="Buat invoice tagihan atau tanda terima DP otomatis dari data order, preview tampilan secara langsung, dan kirimkan format link publik ke customer lewat WhatsApp."
    badge={
     <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
      <ReceiptText className="h-3.5 w-3.5 text-[var(--color-accent)]" />
      Manajemen Nota Tagihan
     </span>
    }
    action={
     <div className="flex flex-wrap gap-2.5 xl:shrink-0">
      <LinkButton href={ROUTES.orders(business.slug)} variant="accent" className="font-bold ">
       <Plus className="h-4 w-4" />
       Buat Nota Baru
      </LinkButton>
      <LinkButton
       href={selectedInvoice ? ROUTES.invoice(selectedInvoice.invoiceCode, selectedInvoice.integritySeal) : ROUTES.invoices(business.slug)}
       variant="secondary"
       className="bg-white/10 text-white hover:bg-white/20 border-white/10 font-bold hover:text-white"
      >
       <ExternalLink className="h-4 w-4" />
       Buka Link Publik
      </LinkButton>
     </div>
    }
   />

   {/* SECTION 2: STATS SUMMARY */}
   <section className="animate-fade-up-delay-1">
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
     <div className="p-5">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
       <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 text-sm text-[var(--color-text-secondary)]">
        <div className="flex items-center justify-between gap-3">
         <div>
          <p className="font-extrabold text-[var(--color-text)] uppercase tracking-wider text-xs">Penagihan Tagihan &amp; DP</p>
          <p className="mt-1.5 text-xs leading-relaxed">System Rapiin membuat flow generate, preview, dan sharing invoice tagihan (pembayaran penuh maupun parsial / DP) menjadi sangat praktis.</p>
         </div>
         <ReceiptText className="h-6 w-6 text-[var(--color-primary)] shrink-0" />
        </div>
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
         <span className="font-bold text-[var(--color-text)]">💡 Informasi Nota:</span> PDF download dan cetak kertas struk thermal akan langsung terformat rapi menyesuaikan ukuran layar penerima.
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 flex flex-col justify-between">
         <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Total Invoice</p>
         <p className="mt-2 text-3xl font-black text-[var(--color-text)] tracking-tight">{invoices.length}</p>
         <p className="text-[9px] text-[var(--color-text-muted)] font-medium">Nota terdaftar</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-success-border)] bg-[var(--color-success-surface)] p-5 flex flex-col justify-between">
         <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-success-text)]">Invoice Lunas</p>
         <p className="mt-2 text-3xl font-black text-[var(--color-text)] tracking-tight">
          {invoices.filter((invoice) => invoice.paymentStatus === "PAID").length}
         </p>
         <p className="text-[9px] text-[var(--color-success-text)] font-semibold">Telah selesai</p>
        </div>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* SECTION 3: INVOICES GRID */}
   <section className="grid gap-6 2xl:grid-cols-[0.92fr_1.08fr] animate-fade-up-delay-2">
    {/* Left Card: Invoice List */}
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
     <div className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
       <div>
        <h2 className="text-lg font-bold text-[var(--color-text)]">Daftar Riwayat Invoice</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Filter, pantau status pembayaran, dan bagikan tanda terima.</p>
       </div>
       <Badge tone="info" className="font-extrabold">{filteredInvoices.length} Nota</Badge>
      </div>

      <FilterChipGroup
       options={invoiceFilterOptions}
       value={filter}
       onChange={(v) => setFilter(v as InvoiceFilter)}
       size="sm"
      />

      <div className="space-y-3 pt-1">
       {isLoading ? (
        <>
         <SkeletonCard />
         <SkeletonCard />
        </>
       ) : paginatedInvoices.map((invoice) => {
        const active = selectedInvoice?.id === invoice.id;
        
        // Indicator border stripe based on payment status
        let leftBorderStripe = "border-l-4 border-l-stone-300";
        if (invoice.paymentStatus === "PAID") {
         leftBorderStripe = "border-l-4 border-l-emerald-500";
        } else if (invoice.paymentStatus === "DP_PAID") {
         leftBorderStripe = "border-l-4 border-l-blue-500";
        } else if (invoice.paymentStatus === "UNPAID") {
         leftBorderStripe = "border-l-4 border-l-rose-500";
        }

        return (
         <button
          key={invoice.id}
          type="button"
          onClick={() => setSelectedInvoiceId(invoice.id)}
          className={cn(
           "w-full rounded-2xl border px-4 py-4 text-left transition-all duration-300",
           leftBorderStripe,
           active
            ? "border-[var(--color-primary-border)] bg-[var(--color-primary-surface)] "
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]"
          )}
         >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
           {/* Avatar + Code info */}
           <div className="flex items-center gap-3">
            <div className={cn(
             "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-[10px] font-black shadow-xs select-none border border-white/20",
             getAvatarGradient(invoice.customerName)
            )}>
             {getInitials(invoice.customerName)}
            </div>
            <div>
             <p className="font-extrabold text-sm text-[var(--color-text)] tracking-tight">{invoice.invoiceCode}</p>
             <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">{invoice.customerName}</p>
            </div>
           </div>

           {/* Right metadata */}
           <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <PaymentStatusBadge status={invoice.paymentStatus} />
            <Badge tone="neutral" className="text-[10px] font-bold">{formatCurrency(invoice.totalAmount)}</Badge>
           </div>
          </div>

          <div className="mt-3.5 pt-3.5 border-t border-[var(--color-border)]/40 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-muted)] font-medium">
           <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            Tgl Dibuat: {formatDate(invoice.createdAt)}
           </span>
           <span className="max-w-[200px] truncate">{invoice.notes ?? "-"}</span>
          </div>
         </button>
        );
       })}
      </div>

      <div className="pt-2">
       <Pagination
        currentPage={currentPage}
        pageSize={INVOICE_PAGE_SIZE}
        totalItems={filteredInvoices.length}
        onPageChange={setCurrentPage}
       />
      </div>
     </div>
    </div>

    {/* Right Card: Preview Sheet & Form */}
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
     <div className="space-y-5 p-5">
      <div className="border-b border-[var(--color-border)] pb-3">
       <h2 className="text-lg font-bold text-[var(--color-text)]">Preview Lembar Nota</h2>
       <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Tampilan struk digital interaktif yang akan dikirim ke WhatsApp customer.</p>
      </div>

      {selectedInvoice ? (
       <>
        {/* Paper Receipt Mockup Wrapper */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white dark:bg-[#101725] shadow-sm p-6 relative overflow-hidden">
         <InvoiceSheet business={business} invoice={selectedInvoice} order={selectedInvoiceOrder} compact />
         
         <div className="mt-5 flex flex-wrap gap-2 border-t border-dashed border-[var(--color-border)] pt-5">
          <WhatsAppButton
           phoneNumber={selectedInvoiceOrder?.whatsappNumber ?? business.whatsappNumber}
           message={`Halo ${selectedInvoice.customerName}, ini nota untuk ${selectedInvoice.invoiceCode}. Silakan cek preview nota detail di link berikut: ${typeof window !== "undefined" ? window.location.origin : ""}${ROUTES.invoice(selectedInvoice.invoiceCode, selectedInvoice.integritySeal)}`}
           label="Kirim WA"
          />
          <Button
           type="button"
           variant="secondary"
           className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-10 px-4 flex items-center gap-1.5"
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
          <LinkButton
           href={ROUTES.invoice(selectedInvoice.invoiceCode, selectedInvoice.integritySeal)}
           variant="secondary"
           className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-10 px-4"
          >
           <FileText className="h-4 w-4" />
           Buka Publik
          </LinkButton>
         </div>
        </div>

       </>
      ) : (
       <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)] text-center">
        Belum ada nota yang bisa dipreview. Silakan buat nota baru terlebih dahulu.
       </div>
      )}

      {/* Create Invoice Form Block */}
      <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5">
       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)]/60 pb-3">
        <div>
         <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider">Buat Nota Baru dari Order</h3>
         <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">Pilih order untuk dibuatkan nota tagihan atau tanda terima.</p>
        </div>
        <Badge tone="success" className="font-extrabold uppercase text-[9px] tracking-wider shrink-0">
         {orders.filter((order) => order.status !== "BATAL").length} Order Aktif
        </Badge>
       </div>
       
       <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Pilih Order Pelanggan</span>
        <Select
         value={selectedOrderId}
         onValueChange={setSelectedOrderId}
         options={orders.filter(order => order.status !== "BATAL" && order.totalAmount !== null && order.totalAmount !== undefined && order.totalAmount > 0).map((order) => ({
          value: order.id,
          label: `${order.customerName} - ${order.title} (${formatCurrency(order.totalAmount)})`,
         }))}
        />
       </label>
       
       <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Catatan Tambahan Tagihan / Syarat</span>
        <Textarea
         value={notes}
         onChange={(event) => setNotes(event.target.value)}
         placeholder="Contoh: Pembayaran DP 50% sisanya lunas saat pengambilan barang..."
         rows={2}
        />
       </label>
       
       <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
         type="button"
         isLoading={loadingAction === "create-invoice"}
         onClick={() => void createFromOrder()}
         disabled={!canCreateInvoice || loadingAction === "create-invoice"}
         className="font-bold text-sm px-5 py-2 rounded-xl flex items-center gap-1.5"
        >
         <FileSpreadsheet className="h-4 w-4" />
         Buat Nota
        </Button>
        {!canCreateInvoice ? (
         <p className="text-xs font-bold text-[var(--color-warning-text)] bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] px-3 py-2 rounded-xl">
          ⚠️ {readOnlyReason}
         </p>
        ) : null}
        <LinkButton
         href={selectedOrderLink}
         variant="secondary"
         className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-10 px-4"
        >
         <ExternalLink className="h-4 w-4" />
         Preview Route
        </LinkButton>
       </div>
      </div>
     </div>
    </div>
   </section>
  </main>
 );
}
