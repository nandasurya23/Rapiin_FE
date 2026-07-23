import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { formatCurrency } from "@/lib/format";
import { parseIndonesianNumber } from "@/lib/number";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

interface SmartPaymentDialogProps {
 isOpen: boolean;
 onClose: () => void;
 order: Order | null;
 nextStatus: OrderStatus | null;
 onConfirm: (order: Order, nextStatus: OrderStatus, paymentStatus?: PaymentStatus, dpAmount?: number, totalAmount?: number, paymentMethod?: "CASH" | "NON_CASH") => void;
}

export function SmartPaymentDialog({ isOpen, onClose, order, nextStatus, onConfirm }: SmartPaymentDialogProps) {
 const [totalAmountStr, setTotalAmountStr] = useState("0");
 const [showCustomDp, setShowCustomDp] = useState(false);
 const [customDpStr, setCustomDpStr] = useState("");
 const [error, setError] = useState("");

 useEffect(() => {
  if (isOpen && order) {
   setTotalAmountStr(String(order.totalAmount || 0));
   setCustomDpStr("");
   setShowCustomDp(false);
   setError("");
  }
 }, [isOpen, order]);

 if (!order || !nextStatus) return null;

 const parsedTotal = parseIndonesianNumber(totalAmountStr) || 0;
 const parsedCustomDp = parseIndonesianNumber(customDpStr) || 0;

 const handleLunasCash = () => {
  if (parsedTotal <= 0) {
   setError("Total tagihan harus lebih dari 0.");
   return;
  }
  onConfirm(order, nextStatus, "PAID", parsedTotal, parsedTotal, "CASH");
  onClose();
 };

 const handleLunasNonCash = () => {
  if (parsedTotal <= 0) {
   setError("Total tagihan harus lebih dari 0.");
   return;
  }
  onConfirm(order, nextStatus, "PAID", parsedTotal, parsedTotal, "NON_CASH");
  onClose();
 };

 const handleDp50 = () => {
  if (parsedTotal <= 0) {
   setError("Total tagihan harus lebih dari 0.");
   return;
  }
  const dp50 = Math.floor(parsedTotal / 2);
  onConfirm(order, nextStatus, "DP_PAID", dp50, parsedTotal);
  onClose();
 };

 const handleCustomDpSubmit = () => {
  if (parsedTotal <= 0) {
   setError("Total tagihan harus lebih dari 0.");
   return;
  }
  if (parsedCustomDp <= 0 || parsedCustomDp > parsedTotal) {
   setError("DP harus lebih dari 0 dan tidak boleh melebihi total tagihan.");
   return;
  }
  const status = parsedCustomDp === parsedTotal ? "PAID" : "DP_PAID";
  onConfirm(order, nextStatus, status, parsedCustomDp, parsedTotal);
  onClose();
 };

 const handleSkip = () => {
  if (parsedTotal > 0 && parsedTotal !== order.totalAmount) {
   onConfirm(order, nextStatus, undefined, undefined, parsedTotal);
  } else {
   onConfirm(order, nextStatus);
  }
  onClose();
 };

 return (
  <Dialog open={isOpen} onOpenChange={onClose}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <DialogTitle>Update Pembayaran</DialogTitle>
     <DialogDescription className="mt-2">
      Pesanan <strong className="text-[var(--color-text)]">{order.customerName}</strong> dipindah ke status <strong>{nextStatus}</strong>.<br/>
      Silakan perbarui status pembayaran pelanggan.
     </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
     <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Total Tagihan</label>
      <FormattedNumberInput
       value={totalAmountStr}
       onValueChange={setTotalAmountStr}
       placeholder="Rp 0"
       className={parsedTotal <= 0 ? "border-red-400 bg-red-50/50" : ""}
      />
      {parsedTotal <= 0 && (
       <p className="mt-1 text-[10px] text-red-500 font-semibold">*Masukkan total tagihan terlebih dahulu.</p>
      )}
     </div>

     {error && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}

     {!showCustomDp ? (
      <div className="grid gap-2">
       <div className="grid grid-cols-2 gap-2">
        <Button 
         type="button" 
         onClick={handleLunasCash} 
         disabled={parsedTotal <= 0}
         className="w-full h-12 bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white font-bold flex flex-col items-center justify-center gap-0.5 leading-tight"
        >
         <span>LUNAS (Tunai)</span>
         <span className="text-[10px] font-medium opacity-90">{formatCurrency(parsedTotal)}</span>
        </Button>
        <Button 
         type="button" 
         onClick={handleLunasNonCash} 
         disabled={parsedTotal <= 0}
         className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold flex flex-col items-center justify-center gap-0.5 leading-tight shadow-sm"
        >
         <span>LUNAS (QRIS/Trf)</span>
         <span className="text-[10px] font-medium opacity-90">{formatCurrency(parsedTotal)}</span>
        </Button>
       </div>
       
       <Button 
        type="button" 
        variant="secondary"
        onClick={handleDp50} 
        disabled={parsedTotal <= 0}
        className="w-full justify-between h-12 border-[var(--color-border)] shadow-sm font-bold"
       >
        <span>Sudah DP (50%)</span>
        <span className="text-[var(--color-text-muted)]">{formatCurrency(Math.floor(parsedTotal / 2))}</span>
       </Button>

       <Button 
        type="button" 
        variant="secondary"
        onClick={() => setShowCustomDp(true)} 
        disabled={parsedTotal <= 0}
        className="w-full h-10 border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-elevated)]"
       >
        Input DP Manual...
       </Button>
      </div>
     ) : (
      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 p-3 bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border)]">
       <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nominal DP</label>
        <FormattedNumberInput
         value={customDpStr}
         onValueChange={setCustomDpStr}
         placeholder="Rp 0"
         autoFocus
        />
       </div>
       <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowCustomDp(false)}>Batal</Button>
        <Button type="button" size="sm" onClick={handleCustomDpSubmit} disabled={parsedCustomDp <= 0}>Simpan DP</Button>
       </div>
      </div>
     )}
    </div>

    <DialogFooter className="flex justify-between items-center w-full sm:justify-between border-t border-[var(--color-border)]/50 pt-4 mt-2">
     <Button variant="ghost" onClick={handleSkip} className="text-[var(--color-text-muted)] text-xs h-8 px-2">
      Lewati (Tetap Belum Bayar)
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
