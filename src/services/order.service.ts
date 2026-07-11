import type { Mapper } from "./mapper";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import type { BusinessMode } from "@/types/business";
import type { CustomerStatus } from "@/types/customer";
import { apiFetch } from "@/lib/api-client";
import { logServiceError } from "./utils";

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

export class ApiOrderService implements OrderService {
  private mapper = new OrderMapper();

  async getOrders(businessId: string): Promise<Order[]> {
    try {
      const response = await apiFetch<OrderDTO[]>("/api/orders?limit=100");
      return response.map((item) => this.mapper.toDomain(item));
    } catch (err) {
      logServiceError("Failed to fetch orders", err);
      return [];
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const orders = await this.getOrders("");
      return orders.find((o) => o.id === id) || null;
    } catch (err) {
      logServiceError("Failed to fetch order by ID", err);
      return null;
    }
  }

  async createOrder(payload: Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "customerId">): Promise<Order> {
    try {
      const response = await apiFetch<OrderDTO>("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rapiin-storage-sync"));
      }
      return this.mapper.toDomain(response);
    } catch (err) {
      logServiceError("Failed to create order", err);
      throw err;
    }
  }

  async updateOrder(id: string, payload: Partial<Omit<OrderDTO, "id" | "createdAt" | "updatedAt">>): Promise<Order | null> {
    try {
      // If it is just a status update, use the status transition endpoint to enforce rules
      const keys = Object.keys(payload);
      if (keys.length === 1 && payload.status) {
        const response = await apiFetch<OrderDTO>(`/api/orders/${id}/status`, {
          method: "PUT",
          body: JSON.stringify({ status: payload.status }),
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("rapiin-storage-sync"));
        }
        return this.mapper.toDomain(response);
      }

      // Otherwise, call the generic update endpoint
      const response = await apiFetch<OrderDTO>(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rapiin-storage-sync"));
      }
      return this.mapper.toDomain(response);
    } catch (err) {
      logServiceError("Failed to update order", err);
      return null;
    }
  }

  async deleteOrder(id: string): Promise<void> {
    try {
      await apiFetch(`/api/orders/${id}`, {
        method: "DELETE",
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rapiin-storage-sync"));
      }
    } catch (err) {
      logServiceError("Failed to delete order", err);
    }
  }
}
