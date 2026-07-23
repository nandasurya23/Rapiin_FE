import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

interface ConfirmFinishOrderDialogProps {
 order: Order | null;
 isOpen: boolean;
 onClose: () => void;
 onConfirm: (order: Order, status: OrderStatus, paymentStatus?: PaymentStatus, dpAmount?: number, totalAmount?: number) => void;
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
      <Button 
       onClick={() => {
        onConfirm(order, "SELESAI", "PAID", order.totalAmount, order.totalAmount);
        onClose();
       }}
      >
      Ya, Selesaikan
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
