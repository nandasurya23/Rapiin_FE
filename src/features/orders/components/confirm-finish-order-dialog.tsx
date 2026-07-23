import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

interface ConfirmFinishOrderDialogProps {
 order: Order | null;
 isOpen: boolean;
 onClose: () => void;
 onConfirm: (order: Order, status: OrderStatus, paymentStatus?: PaymentStatus, dpAmount?: number, totalAmount?: number, paymentMethod?: "CASH" | "NON_CASH") => void;
}

export function ConfirmFinishOrderDialog({ order, isOpen, onClose, onConfirm }: ConfirmFinishOrderDialogProps) {
 if (!order) return null;

 return (
  <Dialog open={isOpen} onOpenChange={onClose}>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Selesaikan Pesanan</DialogTitle>
      <DialogDescription className="mt-2">
      Apakah Anda yakin ingin menyelesaikan pesanan untuk <strong className="text-[var(--color-text)]">{order.customerName}</strong>?
      <br /><br />
      Status pelanggan pada menu CRM juga akan otomatis diperbarui menjadi <strong className="text-[var(--color-text)]">Selesai (DONE)</strong>.
      <br /><br />
      <span className="text-emerald-600 font-medium">Sistem akan otomatis mengubah status pembayaran menjadi LUNAS.</span>
     </DialogDescription>
    </DialogHeader>
    <DialogFooter className="mt-6 flex justify-end gap-2">
     <Button variant="secondary" onClick={onClose}>
      Batal
     </Button>
     <div className="flex gap-2">
      <Button 
       className="bg-[var(--color-success)] hover:bg-[var(--color-success)]/90"
       onClick={() => {
        onConfirm(order, "SELESAI", "PAID", order.totalAmount, order.totalAmount, "CASH");
        onClose();
       }}
      >
       Selesai (Tunai)
      </Button>
      <Button 
       className="bg-blue-600 hover:bg-blue-700"
       onClick={() => {
        onConfirm(order, "SELESAI", "PAID", order.totalAmount, order.totalAmount, "NON_CASH");
        onClose();
       }}
      >
       Selesai (QRIS/Trf)
      </Button>
     </div>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
