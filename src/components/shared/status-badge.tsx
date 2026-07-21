import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants/orders";
import { CUSTOMER_STATUS_LABELS } from "@/lib/constants/customer";
import type { CustomerStatus } from "@/types/customer";
import type { OrderStatus, PaymentStatus } from "@/types/order";
import type { StatusTone } from "@/types/common";

const ORDER_STATUS_TONES: Record<OrderStatus, StatusTone> = {
 INQUIRY: "info",
 WAITING_DP: "warning",
 CONFIRMED: "success",
 ORDER_BARU: "info",
 DIPROSES: "warning",
 DIKIRIM_DIAMBIL: "info",
 REQUEST_MASUK: "info",
 DIBAHAS: "warning",
 PENAWARAN_DIKIRIM: "info",
 DEAL: "success",
 SELESAI: "success",
 BATAL: "danger",
};

const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
 UNPAID: "warning",
 DP_PAID: "info",
 PAID: "success",
 REFUNDED: "neutral",
 CANCELLED: "danger",
};

const CUSTOMER_STATUS_TONES: Record<CustomerStatus, StatusTone> = {
 NEW: "info",
 NEED_FOLLOW_UP: "warning",
 DEAL: "success",
 DONE: "success",
 CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
 return <Badge tone={ORDER_STATUS_TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
 return <Badge tone={PAYMENT_STATUS_TONES[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
 return <Badge tone={CUSTOMER_STATUS_TONES[status]}>{CUSTOMER_STATUS_LABELS[status]}</Badge>;
}
