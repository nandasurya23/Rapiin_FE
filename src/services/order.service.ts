import type { Mapper } from "./mapper";
import type { Order, OrderStatus, PaymentStatus, Payment } from "@/types/order";
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
  paymentMethod?: "CASH" | "NON_CASH";
  scheduledDate?: string;
  scheduledTime?: string;
  bookingDurationMinutes?: number;
  bookingHoldExpiresAt?: string;
  resourceId?: string;
  resourceNameSnapshot?: string;
  serviceId?: string;
  totalAmount?: number;
  dpAmount?: number;
  items?: { name: string; quantity: number; price?: number }[];
  notes?: string;
  lastFollowUpAt?: string;
  customerStatusSnapshot?: CustomerStatus;
  isLocked?: boolean;
  pointsEarned?: number;
  pointsUsed?: number;
  payments?: Payment[];
  assignedStaffId?: string;
  cancelledByUserId?: string;
  createdByUserId?: string;
  updatedByUserId?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class OrderMapper implements Mapper<OrderDTO, Order> {
  toDomain(raw: OrderDTO): Order {
    return {
      ...raw,
      isLocked: raw.isLocked ?? false,
    };
  }

  toDTO(domain: Order): OrderDTO {
    return domain as unknown as OrderDTO;
  }
}

export interface OrderListFilters {
  // Scope to a booking/appointment date range (YYYY-MM-DD) rather than record-creation time.
  // Use this for calendar/dashboard/timeline views so bookings outside the "most recently
  // created" window aren't silently dropped once a business has more than the page limit.
  scheduledFrom?: string;
  scheduledTo?: string;
  limit?: number;
}

export interface OrderService {
  getOrders(businessId: string, filters?: OrderListFilters): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  createOrder(payload: Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "customerId">): Promise<Order>;
  updateOrder(id: string, payload: Partial<Omit<OrderDTO, "id" | "createdAt" | "updatedAt">>): Promise<Order | null>;
  deleteOrder(id: string): Promise<void>;
}

export class ApiOrderService implements OrderService {
  private mapper = new OrderMapper();

  async getOrders(businessId: string, filters?: OrderListFilters): Promise<Order[]> {
    try {
      // businessId passed for context/logging or if BE supports admin override
      const params = new URLSearchParams({
        limit: String(filters?.limit ?? 100),
        businessId,
      });
      if (filters?.scheduledFrom) params.set("scheduledFrom", filters.scheduledFrom);
      if (filters?.scheduledTo) params.set("scheduledTo", filters.scheduledTo);

      const response = await apiFetch<OrderDTO[]>(`/api/orders?${params.toString()}`);
      return response.map((item) => this.mapper.toDomain(item));
    } catch (err) {
      logServiceError("Failed to fetch orders", err);
      return [];
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const response = await apiFetch<OrderDTO>(`/api/orders/${id}`);
      return this.mapper.toDomain(response);
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

        }
        return this.mapper.toDomain(response);
      }

      // Otherwise, call the generic update endpoint
      const response = await apiFetch<OrderDTO>(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (typeof window !== "undefined") {

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

      }
    } catch (err) {
      logServiceError("Failed to delete order", err);
    }
  }
}
