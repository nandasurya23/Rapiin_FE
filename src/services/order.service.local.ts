import { readAppStorageState, writeAppStorageState, createOrderRecord, createCustomerRecord } from "@/lib/storage-service";
import { normalizePhoneNumber } from "@/lib/validation";
import type { OrderService, OrderDTO } from "./order.service";
import { OrderMapper } from "./order.service";
import type { Order } from "@/types/order";

export class LocalOrderService implements OrderService {
  private mapper = new OrderMapper();

  async getOrders(businessId: string): Promise<Order[]> {
    const state = readAppStorageState();
    return state.orders
      .filter((o) => o.businessId === businessId)
      .map((o) => this.mapper.toDomain(this.mapper.toDTO(o)));
  }

  async getOrderById(id: string): Promise<Order | null> {
    const state = readAppStorageState();
    const order = state.orders.find((o) => o.id === id);
    return order ? this.mapper.toDomain(this.mapper.toDTO(order)) : null;
  }

  async createOrder(payload: Omit<OrderDTO, "id" | "createdAt" | "updatedAt" | "customerId">): Promise<Order> {
    const state = readAppStorageState();
    
    // UPSERT CUSTOMER LOGIC
    const normalizedPhone = normalizePhoneNumber(payload.whatsappNumber);
    let customer = state.customers.find((c) => 
      c.businessId === payload.businessId && normalizePhoneNumber(c.whatsappNumber) === normalizedPhone
    );

    const lastInteractionAt = new Date().toISOString();
    let nextCustomerStatus = customer?.status ?? payload.customerStatusSnapshot ?? "NEW";
    if (payload.status === "DEAL" || payload.status === "SELESAI") {
      nextCustomerStatus = "DEAL";
    }

    if (customer) {
      const updatedCustomer = {
        ...customer,
        name: payload.customerName.trim(),
        status: nextCustomerStatus,
        lastInteractionAt,
        lastOrderSummary: payload.title.trim(),
        updatedAt: lastInteractionAt,
      };
      state.customers = state.customers.map((item) => (item.id === customer!.id ? updatedCustomer : item));
      customer = updatedCustomer;
    } else {
      customer = createCustomerRecord({
        businessId: payload.businessId,
        name: payload.customerName.trim(),
        whatsappNumber: payload.whatsappNumber.trim(),
        status: nextCustomerStatus,
        lastInteractionAt,
        lastOrderSummary: payload.title.trim(),
        source: "Order manual",
      });
      state.customers = [customer, ...state.customers];
    }

    const newOrder = createOrderRecord({
      businessId: payload.businessId,
      customerId: customer.id,
      customerName: payload.customerName,
      whatsappNumber: payload.whatsappNumber,
      title: payload.title,
      mode: payload.mode,
      status: payload.status,
      paymentStatus: payload.paymentStatus,
      scheduledDate: payload.scheduledDate,
      scheduledTime: payload.scheduledTime,
      bookingDurationMinutes: payload.bookingDurationMinutes,
      bookingHoldExpiresAt: payload.bookingHoldExpiresAt,
      resourceId: payload.resourceId,
      resourceNameSnapshot: payload.resourceNameSnapshot,
      totalAmount: payload.totalAmount,
      dpAmount: payload.dpAmount,
      notes: payload.notes,
      customerStatusSnapshot: payload.customerStatusSnapshot,
    });

    state.orders = [newOrder, ...state.orders];
    writeAppStorageState(state);
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return this.mapper.toDomain(this.mapper.toDTO(newOrder));
  }

  async updateOrder(id: string, payload: Partial<Omit<OrderDTO, "id" | "createdAt" | "updatedAt">>): Promise<Order | null> {
    const state = readAppStorageState();
    
    const index = state.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const existing = state.orders[index];
    const updated = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    state.orders[index] = updated;
    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return this.mapper.toDomain(this.mapper.toDTO(updated));
  }

  async deleteOrder(id: string): Promise<void> {
    const state = readAppStorageState();
    state.orders = state.orders.filter((o) => o.id !== id);
    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }
  }
}
