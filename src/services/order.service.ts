import type { Mapper } from "./mapper";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import type { BusinessMode } from "@/types/business";
import type { CustomerStatus } from "@/types/customer";

// DTO representing the payload structure we expect from/to Backend
export interface OrderDTO {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  whatsappNumber: string;
  title: string;
  mode: BusinessMode;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  bookingDurationMinutes?: number;
  bookingHoldExpiresAt?: string;
  resourceId?: string;
  resourceNameSnapshot?: string;
  totalAmount?: number;
  dpAmount?: number;
  notes?: string;
  lastFollowUpAt?: string;
  customerStatusSnapshot?: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export class OrderMapper implements Mapper<OrderDTO, Order> {
  toDomain(raw: OrderDTO): Order {
    return {
      ...raw,
      // Here we would transform string dates to Date objects if needed by the domain,
      // but for now the domain uses string timestamps as well.
    };
  }

  toDTO(domain: Order): OrderDTO {
    return {
      ...domain,
    };
  }
}

export interface OrderService {
  getOrders(businessId: string): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  createOrder(payload: Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "customerId">): Promise<Order>;
  updateOrder(id: string, payload: Partial<Omit<OrderDTO, "id" | "createdAt" | "updatedAt">>): Promise<Order | null>;
  deleteOrder(id: string): Promise<void>;
}
