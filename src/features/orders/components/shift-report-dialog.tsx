import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { Lock, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { apiFetch } from "@/lib/api-client";

interface ShiftReportDialogProps {
 isOpen: boolean;
 onClose: () => void;
 onSuccess: () => void;
}

export function ShiftReportDialog({ isOpen, onClose, onSuccess }: ShiftReportDialogProps) {
 const [isLoading, setIsLoading] = useState(false);
 const [report, setReport] = useState<{ cashTotal: number; nonCashTotal: number; total: number } | null>(null);
 const [isConfirming, setIsConfirming] = useState(false);
 const toast = useToast();

 // Fetch report when opened
 useState(() => {
  if (isOpen && !report) {
   apiFetch("/api/orders/shift-report")
    .then((res: unknown) => setReport((res as { data: { cashTotal: number; nonCashTotal: number; total: number } }).data))
    .catch((err: unknown) => toast.error("Gagal memuat laporan shift", err instanceof Error ? err.message : String(err)));
  }
 });

 const handleCloseShift = async () => {
  setIsLoading(true);
  try {
   const res = await apiFetch("/api/orders/close-shift", { method: "POST" }) as { data: { count: number } };
   toast.success(`Shift berhasil ditutup! ${res.data.count} pesanan telah dikunci.`);
   onSuccess();
   onClose();
  } catch (err: unknown) {
   toast.error("Gagal menutup shift", err instanceof Error ? err.message : String(err));
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <Dialog open={isOpen} onOpenChange={onClose}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <DialogTitle className="flex items-center gap-2">
      <FileText className="h-5 w-5 text-[var(--color-primary)]" />
      Laporan Shift Kasir (Anti-Bocor)
     </DialogTitle>
     <DialogDescription className="mt-2">
      Laporan penerimaan hari ini. Klik <strong>Tutup Shift</strong> untuk mengunci semua transaksi LUNAS agar tidak bisa diubah atau dibatalkan oleh kasir.
     </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
     <div className="grid gap-3">
      <div className="flex justify-between items-center p-3 rounded-xl border bg-[var(--color-surface-elevated)]">
       <span className="text-sm font-bold text-[var(--color-text-secondary)]">Tunai (Cash)</span>
       <span className="text-lg font-black text-emerald-600">Rp {formatCurrency(report?.cashTotal ?? 0)}</span>
      </div>
      <div className="flex justify-between items-center p-3 rounded-xl border bg-[var(--color-surface-elevated)]">
       <span className="text-sm font-bold text-[var(--color-text-secondary)]">Non-Tunai (QRIS/Trf)</span>
       <span className="text-lg font-black text-blue-600">Rp {formatCurrency(report?.nonCashTotal ?? 0)}</span>
      </div>
      <div className="flex justify-between items-center p-4 rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/5 mt-2">
       <span className="text-sm font-bold text-[var(--color-primary)]">Total Penerimaan</span>
       <span className="text-2xl font-black text-[var(--color-primary)]">Rp {formatCurrency(report?.total ?? 0)}</span>
      </div>
     </div>

     {!isConfirming ? (
      <Button 
       type="button" 
       onClick={() => setIsConfirming(true)} 
       className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2 mt-4"
       disabled={!report || report.total === 0}
      >
       <Lock className="h-4 w-4" />
       Tutup Shift & Kunci Transaksi
      </Button>
     ) : (
      <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 space-y-3 animate-in fade-in zoom-in-95">
       <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-sm text-red-900 leading-tight">
         <strong>Perhatian:</strong> Setelah shift ditutup, seluruh transaksi LUNAS akan digembok permanen dan tidak dapat diedit atau dibatalkan sepihak.
        </div>
       </div>
       <div className="flex gap-2">
        <Button variant="secondary" className="flex-1 bg-white" onClick={() => setIsConfirming(false)}>Batal</Button>
        <Button 
         className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" 
         onClick={handleCloseShift}
         isLoading={isLoading}
        >
         Ya, Kunci Sekarang
        </Button>
       </div>
      </div>
     )}
    </div>
   </DialogContent>
  </Dialog>
 );
}
