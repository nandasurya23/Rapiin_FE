"use client";

import { useState } from "react";
import { Search, ShieldAlert, ShieldCheck, ShieldOff, UploadCloud, FileSearch } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ApiAdminService } from "@/services/admin.service";
import { ApiInvoiceService } from "@/services/invoice.service";


interface InvoiceCheckerPageProps {
  role: "SUPER_ADMIN" | "OWNER";
}

export function InvoiceCheckerPage({ role }: InvoiceCheckerPageProps) {
  const toast = useToast();
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "auto">("manual");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invoice, setInvoice] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setLoading(true);
    setSearched(true);
    setInvoice(null);
    try {
      let res;
      if (role === "SUPER_ADMIN") {
        res = await ApiAdminService.lookupInvoice(searchCode.trim());
      } else {
        const invoiceService = new ApiInvoiceService();
        res = await invoiceService.lookupInvoice(searchCode.trim());
      }

      if (res && (res.data || res.id)) {
        setInvoice(res.data || res);
        toast.success("Nota berhasil ditemukan.");
      } else {
        toast.error("Nota tidak ditemukan.");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Nota tidak ditemukan atau akses ditolak.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-3.5rem)] lg:h-screen lg:overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[var(--color-background)] pb-24">
      <PageHeader
        title={role === "SUPER_ADMIN" ? "Cek Asli Nota (Super Admin)" : "Cek Asli Nota (Pro)"}
        description="Masukkan kode nota (INV-XXXX) dari screenshot pelanggan untuk mengecek data transaksi asli dari sistem."
      />

      <div className="max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-sm">
        <div className="flex bg-[var(--color-background)] p-1 rounded-lg border border-[var(--color-border)] mb-6 w-fit">
          <button 
            onClick={() => { setActiveTab("manual"); setSearched(false); setInvoice(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "manual" ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"}`}
          >
            Cek Manual
          </button>
          <button 
            onClick={() => { setActiveTab("auto"); setSearched(false); setInvoice(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === "auto" ? "bg-[var(--color-gold-500)]/10 text-[var(--color-gold-500)] shadow-sm" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"}`}
          >
            <FileSearch className="w-4 h-4" />
            Smart Scan (Pro)
          </button>
        </div>

        {activeTab === "manual" ? (
          <form onSubmit={handleSearch} className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">Kode Nota</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Contoh: INV-2026-0001"
                  className="pl-9 h-11 text-base uppercase"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <Button type="submit" className="h-11 px-6" disabled={loading || !searchCode.trim()}>
              {loading ? "Mencari..." : "Cari Nota"}
            </Button>
          </form>
        ) : (
          <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => toast.info("Fitur Smart Scan sedang dalam tahap pengembangan.")}>
            <div className="w-12 h-12 rounded-full bg-[var(--color-gold-500)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-[var(--color-gold-500)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">Upload Bukti Transfer</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4 max-w-[320px]">
              Sistem akan memindai dan mencocokkan nominal dari gambar bukti transfer pelanggan secara otomatis.
            </p>
            <Button variant="primary" type="button" className="bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-600)] text-black">
              Pilih Gambar
            </Button>
          </div>
        )}

        {searched && !loading && !invoice && (
          <div className="mt-8 text-center p-8 bg-red-500/5 rounded-xl border border-red-500/10">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold text-red-500">Nota Tidak Ditemukan</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Kode nota &quot;{searchCode}&quot; tidak ada di database. Hati-hati, ini kemungkinan adalah nota palsu atau hasil editan.
            </p>
          </div>
        )}

        {invoice && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="bg-green-500 p-2 rounded-full text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-green-500">Data Transaksi Asli (Tervalidasi)</h3>
                <p className="text-sm text-green-500/80">
                  Cocokkan data di bawah ini dengan screenshot dari pelanggan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Kode Nota</p>
                <p className="font-mono text-lg font-bold">{invoice.invoiceCode}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Status Pembayaran</p>
                <Badge tone={invoice.paymentStatus === "LUNAS" ? "success" : "warning"}>
                  {invoice.paymentStatus}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Nama Customer</p>
                <p className="font-medium">{invoice.customerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Total Tagihan</p>
                <p className="font-bold text-xl text-[var(--color-gold-500)]">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Tanggal Dibuat</p>
                <p className="text-sm">{formatDateTime(invoice.createdAt)}</p>
              </div>
              {role === "SUPER_ADMIN" && (
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Kode Verifikasi Internal</p>
                  <p className="font-mono text-sm bg-white/5 p-1 px-2 rounded w-fit text-[var(--color-text-secondary)]">
                    {invoice.verificationCode}
                  </p>
                </div>
              )}
            </div>

            {role === "SUPER_ADMIN" && (
              <div className="mt-6 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Integrity Seal (Segel Keamanan)</h4>
                  <ShieldOff className="h-4 w-4 text-[var(--color-text-secondary)] opacity-50" />
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Segel keamanan (SHA-256 HMAC) ini dihasilkan secara otomatis oleh sistem saat nota diterbitkan. 
                  Jika total nominal atau ID diubah oleh pihak ketiga, segel ini tidak akan cocok saat dicek oleh sistem.
                </p>
                <div className="w-full overflow-x-auto bg-[#0a0a0a] rounded-lg p-3">
                  <code className="text-xs text-[var(--color-gold-500)] break-all font-mono">
                    {invoice.integritySeal}
                  </code>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
