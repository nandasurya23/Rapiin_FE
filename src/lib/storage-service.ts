"use client";

import { mockBusiness, mockCustomers, mockInvoices, mockMessageTemplates, mockOrders } from "@/data/mock";
import type { Business, BusinessMode, OperationalModel } from "@/types/business";
import type { AppStorageState, AuthUser, MessageComposerDraft, PublicSubmission } from "@/types/app-state";
import type { Customer, CustomerStatus } from "@/types/customer";
import type { MessageTemplate } from "@/types/message";
import type { Invoice } from "@/types/invoice";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { createBusinessResources, doesOperationalModelUseResources, getDefaultBusinessConfigForMode, getDefaultOperationalModel } from "@/lib/constants/business";

const STORAGE_KEY = "rapiin-app-storage";

function now() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildId(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${randomPart}`;
}

function createDefaultMessageComposer(messageTemplates: MessageTemplate[], customers: Customer[], orders: Order[]): MessageComposerDraft {
  const followUpTemplate = messageTemplates.find((template) => template.category === "FOLLOW_UP") ?? messageTemplates[0] ?? null;

  return {
    activeCategory: "FOLLOW_UP",
    selectedCustomerId: customers[0]?.id ?? null,
    selectedOrderId: orders[0]?.id ?? null,
    selectedTemplateId: followUpTemplate?.id ?? null,
    drafts: {},
  };
}

export function createInitialAppStorageState(): AppStorageState {
  return {
    version: 1,
    business: clone(mockBusiness),
    customers: clone(mockCustomers),
    orders: clone(mockOrders),
    invoices: clone(mockInvoices),
    messageTemplates: clone(mockMessageTemplates),
    publicSubmissions: [],
    auth: {
      currentUserId: null,
      onboardingCompleted: false,
      users: [],
    },
    ui: {
      messageComposer: createDefaultMessageComposer(mockMessageTemplates, mockCustomers, mockOrders),
    },
  };
}

function normalizeBusinessConfig(business: Business): Business {
  const modeConfig = getDefaultBusinessConfigForMode(business.mode);
  const operationalModel = business.operationalModel ?? getDefaultOperationalModel(business.mode);
  const usesResources = typeof business.usesResources === "boolean" ? business.usesResources : doesOperationalModelUseResources(operationalModel);
  const resourceLabel = usesResources ? business.resourceLabel?.trim() || modeConfig.resourceLabel || "Slot" : undefined;
  const resourceCount =
    usesResources ? Math.max(1, business.resourceCount ?? business.resources?.length ?? modeConfig.resourceCount ?? 1) : undefined;
  const resources =
    usesResources
      ? (business.resources?.length ? business.resources : createBusinessResources(resourceLabel ?? "Slot", resourceCount ?? 1)).map((resource, index) => ({
          id: resource.id || `res_${index + 1}`,
          name: resource.name?.trim() || `${resourceLabel} ${index + 1}`,
          isActive: resource.isActive ?? true,
        }))
      : [];

  return {
    ...business,
    operationalModel,
    usesResources,
    resourceLabel,
    resourceCount: usesResources ? resourceCount : undefined,
    resources,
    defaultBookingDurationMinutes:
      business.defaultBookingDurationMinutes ?? modeConfig.defaultBookingDurationMinutes,
  };
}

export function readAppStorageState() {
  if (typeof window === "undefined") {
    return createInitialAppStorageState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialAppStorageState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppStorageState>;
    const initial = createInitialAppStorageState();

    return {
      ...initial,
      ...parsed,
      business: normalizeBusinessConfig(parsed.business ?? initial.business),
      customers: Array.isArray(parsed.customers) ? parsed.customers : initial.customers,
      orders: Array.isArray(parsed.orders) ? parsed.orders : initial.orders,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : initial.invoices,
      messageTemplates: Array.isArray(parsed.messageTemplates) ? parsed.messageTemplates : initial.messageTemplates,
      publicSubmissions: Array.isArray(parsed.publicSubmissions) ? parsed.publicSubmissions : initial.publicSubmissions,
      auth: {
        ...initial.auth,
        ...(parsed.auth ?? {}),
        users: Array.isArray(parsed.auth?.users) ? parsed.auth.users : initial.auth.users,
      },
      ui: {
        messageComposer: {
          ...initial.ui.messageComposer,
          ...(parsed.ui?.messageComposer ?? {}),
          drafts: parsed.ui?.messageComposer?.drafts ?? initial.ui.messageComposer.drafts,
        },
      },
    } satisfies AppStorageState;
  } catch {
    return createInitialAppStorageState();
  }
}

export function writeAppStorageState(state: AppStorageState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearAppStorageState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function getOrderStatusForMode(mode: BusinessMode): OrderStatus {
  if (mode === "BOOKING_SERVICE") {
    return "WAITING_DP";
  }

  if (mode === "PRODUCT_ORDER") {
    return "ORDER_BARU";
  }

  return "REQUEST_MASUK";
}

export function createAuthUser(input: { name: string; identifier: string; password: string }): AuthUser {
  const timestamp = now();

  return {
    id: buildId("usr"),
    name: input.name,
    identifier: input.identifier,
    password: input.password,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createCustomerRecord(input: {
  businessId: string;
  name: string;
  whatsappNumber: string;
  status: CustomerStatus;
  source?: string;
  notes?: string;
  lastInteractionAt?: string;
  lastOrderSummary?: string;
}): Customer {
  const timestamp = now();

  return {
    id: buildId("cus"),
    businessId: input.businessId,
    name: input.name,
    whatsappNumber: input.whatsappNumber,
    status: input.status,
    source: input.source,
    notes: input.notes,
    lastInteractionAt: input.lastInteractionAt,
    lastOrderSummary: input.lastOrderSummary,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createOrderRecord(input: {
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
  customerStatusSnapshot?: CustomerStatus;
}): Order {
  const timestamp = now();

  return {
    id: buildId("ord"),
    businessId: input.businessId,
    customerId: input.customerId,
    customerName: input.customerName,
    whatsappNumber: input.whatsappNumber,
    title: input.title,
    mode: input.mode,
    status: input.status,
    paymentStatus: input.paymentStatus,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    bookingDurationMinutes: input.bookingDurationMinutes,
    bookingHoldExpiresAt: input.bookingHoldExpiresAt,
    resourceId: input.resourceId,
    resourceNameSnapshot: input.resourceNameSnapshot,
    totalAmount: input.totalAmount,
    dpAmount: input.dpAmount,
    notes: input.notes,
    customerStatusSnapshot: input.customerStatusSnapshot,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createInvoiceRecord(input: {
  businessId: string;
  orderId: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  invoiceCode: string;
}): Invoice {
  const timestamp = now();

  return {
    id: buildId("inv"),
    businessId: input.businessId,
    orderId: input.orderId,
    invoiceCode: input.invoiceCode,
    customerName: input.customerName,
    totalAmount: input.totalAmount,
    paymentStatus: input.paymentStatus,
    notes: input.notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createPublicSubmissionRecord(input: {
  businessId: string;
  customerId: string;
  orderId: string;
  mode: BusinessMode;
  operationalModel: OperationalModel;
  payload: Record<string, string>;
}): PublicSubmission {
  const timestamp = now();

  return {
    id: buildId("pub"),
    businessId: input.businessId,
    customerId: input.customerId,
    orderId: input.orderId,
    mode: input.mode,
    operationalModel: input.operationalModel,
    payload: input.payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createMessageTemplateRecord(template: MessageTemplate, changes: Partial<Pick<MessageTemplate, "title" | "content">>) {
  return {
    ...template,
    ...changes,
    updatedAt: now(),
  };
}

export function getDefaultOrderStatusForMode(mode: BusinessMode) {
  return getOrderStatusForMode(mode);
}
