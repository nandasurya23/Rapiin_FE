"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createAuthUser,
  createCustomerRecord,
  createInitialAppStorageState,
  createInvoiceRecord,
  createMessageTemplateRecord,
  createOrderRecord,
  createPublicSubmissionRecord,
  getDefaultOrderStatusForMode,
  readAppStorageState,
  writeAppStorageState,
} from "@/lib/storage-service";
import { createBusinessResources, doesOperationalModelUseResources } from "@/lib/constants/business";
import type { Business, BusinessMode, BusinessResource, NicheTemplate, OperationalModel } from "@/types/business";
import type { AppStorageState, MessageComposerDraft } from "@/types/app-state";
import type { Customer, CustomerStatus } from "@/types/customer";
import type { Invoice } from "@/types/invoice";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

type OnboardingPayload = {
  name: string;
  whatsappNumber: string;
  mode: BusinessMode;
  operationalModel: OperationalModel;
  usesResources: boolean;
  resourceLabel?: string;
  resourceCount?: number;
  resources?: BusinessResource[];
  defaultBookingDurationMinutes?: number;
  niche: NicheTemplate;
  description: string;
};

type BusinessSettingsInput = Pick<
  Business,
  | "name"
  | "whatsappNumber"
  | "mode"
  | "operationalModel"
  | "usesResources"
  | "resourceLabel"
  | "resourceCount"
  | "resources"
  | "defaultBookingDurationMinutes"
  | "niche"
  | "description"
  | "openingHours"
  | "address"
>;

type CustomerInput = {
  name: string;
  whatsappNumber: string;
  status: CustomerStatus;
  source?: string;
  notes?: string;
  lastInteractionAt?: string;
  lastOrderSummary?: string;
};

type OrderInput = {
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
};

type AuthInput = {
  name?: string;
  identifier: string;
  password: string;
};

type PublicOrderInput = {
  payload: Record<string, string>;
};

type AppDataContextValue = AppStorageState & {
  hydrated: boolean;
  currentUser: AppStorageState["auth"]["users"][number] | null;
  updateBusiness: (payload: Partial<Business>) => void;
  saveBusinessSettings: (payload: BusinessSettingsInput) => void;
  completeOnboarding: (payload: OnboardingPayload) => void;
  register: (payload: Required<Pick<AuthInput, "name">> & AuthInput) => { ok: true } | { ok: false; message: string };
  login: (payload: AuthInput) => { ok: true } | { ok: false; message: string };
  logout: () => void;
  createCustomer: (payload: CustomerInput) => Customer;
  updateCustomer: (id: string, payload: CustomerInput) => Customer | null;
  deleteCustomer: (id: string) => void;
  createOrder: (payload: OrderInput) => Order;
  updateOrder: (id: string, payload: OrderInput) => Order | null;
  deleteOrder: (id: string) => void;
  createInvoiceFromOrder: (orderId: string, notes?: string) => Invoice | null;
  updateMessageTemplate: (id: string, payload: { title: string; content: string }) => void;
  updateMessageComposer: (payload: Partial<MessageComposerDraft>) => void;
  saveMessageDraft: (templateId: string, payload: { title: string; content: string }) => void;
  submitPublicOrder: (input: PublicOrderInput) => { customer: Customer; order: Order };
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function createInvoiceCode(orderId: string, sequence: number) {
  return `INV-${orderId.toUpperCase()}-${String(sequence).padStart(3, "0")}`;
}

function normalizeBusinessNameToSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCustomerStatusFromOrderStatus(status: OrderStatus): CustomerStatus {
  if (status === "SELESAI") {
    return "DONE";
  }

  if (status === "BATAL") {
    return "CANCELLED";
  }

  if (status === "DEAL" || status === "CONFIRMED") {
    return "DEAL";
  }

  return "NEED_FOLLOW_UP";
}

function getPublicOrderTitle(mode: BusinessMode, payload: Record<string, string>) {
  if (mode === "BOOKING_SERVICE") {
    return payload.service?.trim() || "Booking baru";
  }

  if (mode === "PRODUCT_ORDER") {
    return payload.product?.trim() || "Order produk";
  }

  return payload.requestDetail?.trim() || "Request custom";
}

function normalizeBusinessPayload(current: Business, payload: Partial<BusinessSettingsInput>) {
  const mode = payload.mode ?? current.mode;
  const operationalModel = payload.operationalModel ?? current.operationalModel;
  const usesResources =
    typeof payload.usesResources === "boolean" ? payload.usesResources : doesOperationalModelUseResources(operationalModel);
  const resourceLabel = usesResources ? payload.resourceLabel?.trim() || current.resourceLabel?.trim() || "Slot" : undefined;
  const resourceCount = usesResources ? Math.max(1, payload.resourceCount ?? current.resourceCount ?? current.resources?.length ?? 1) : undefined;
  const resources = usesResources
    ? (payload.resources?.length ? payload.resources : current.resources?.length ? current.resources : createBusinessResources(resourceLabel ?? "Slot", resourceCount ?? 1)).map(
        (resource, index) => ({
          id: resource.id || `res_${index + 1}`,
          name: resource.name.trim() || `${resourceLabel} ${index + 1}`,
          isActive: resource.isActive,
        })
      )
    : current.resources?.map((resource) => ({ ...resource, isActive: false })) ?? [];

  return {
    ...current,
    ...payload,
    mode,
    operationalModel,
    usesResources,
    resourceLabel,
    resourceCount,
    resources,
    defaultBookingDurationMinutes:
      payload.defaultBookingDurationMinutes ?? current.defaultBookingDurationMinutes,
    updatedAt: new Date().toISOString(),
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStorageState>(createInitialAppStorageState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const nextState = readAppStorageState();
    setState(nextState);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeAppStorageState(state);
  }, [hydrated, state]);

  function setAppState(updater: (current: AppStorageState) => AppStorageState) {
    setState((current) => updater(current));
  }

  function updateBusiness(payload: Partial<Business>) {
    setAppState((current) => ({
      ...current,
      business: normalizeBusinessPayload(current.business, payload),
    }));
  }

  function saveBusinessSettings(payload: BusinessSettingsInput) {
    setAppState((current) => ({
      ...current,
      business: normalizeBusinessPayload(current.business, payload),
    }));
  }

  function completeOnboarding(payload: OnboardingPayload) {
    setAppState((current) => ({
      ...current,
      business: {
        ...normalizeBusinessPayload(current.business, payload),
        ownerName: current.auth.users.find((user) => user.id === current.auth.currentUserId)?.name ?? current.business.ownerName,
        slug: normalizeBusinessNameToSlug(payload.name) || current.business.slug,
      },
      auth: {
        ...current.auth,
        onboardingCompleted: true,
      },
    }));
  }

  function register(payload: Required<Pick<AuthInput, "name">> & AuthInput) {
    const normalizedIdentifier = payload.identifier.trim().toLowerCase();
    const existing = state.auth.users.find((user) => user.identifier.toLowerCase() === normalizedIdentifier);

    if (existing) {
      return { ok: false as const, message: "Akun dengan email / nomor HP ini sudah ada." };
    }

    const nextUser = createAuthUser({
      name: payload.name.trim(),
      identifier: normalizedIdentifier,
      password: payload.password,
    });

    setAppState((current) => ({
      ...current,
      business: {
        ...current.business,
        ownerName: nextUser.name,
        updatedAt: new Date().toISOString(),
      },
      auth: {
        ...current.auth,
        currentUserId: nextUser.id,
        users: [nextUser, ...current.auth.users],
      },
    }));

    return { ok: true as const };
  }

  function login(payload: AuthInput) {
    const normalizedIdentifier = payload.identifier.trim().toLowerCase();
    const user = state.auth.users.find(
      (item) => item.identifier.toLowerCase() === normalizedIdentifier && item.password === payload.password
    );

    if (!user) {
      return { ok: false as const, message: "Akun tidak ditemukan atau password salah." };
    }

    setAppState((current) => ({
      ...current,
      business: {
        ...current.business,
        ownerName: user.name,
      },
      auth: {
        ...current.auth,
        currentUserId: user.id,
      },
    }));

    return { ok: true as const };
  }

  function logout() {
    setAppState((current) => ({
      ...current,
      auth: {
        ...current.auth,
        currentUserId: null,
      },
    }));
  }

  function createCustomer(payload: CustomerInput) {
    const nextCustomer = createCustomerRecord({
      businessId: state.business.id,
      ...payload,
      name: payload.name.trim(),
      whatsappNumber: payload.whatsappNumber.trim(),
      source: payload.source?.trim() || undefined,
      notes: payload.notes?.trim() || undefined,
    });

    setAppState((current) => ({
      ...current,
      customers: [nextCustomer, ...current.customers],
    }));

    return nextCustomer;
  }

  function updateCustomer(id: string, payload: CustomerInput) {
    let updatedCustomer: Customer | null = null;

    setAppState((current) => ({
      ...current,
      customers: current.customers.map((customer) => {
        if (customer.id !== id) {
          return customer;
        }

        updatedCustomer = {
          ...customer,
          name: payload.name.trim(),
          whatsappNumber: payload.whatsappNumber.trim(),
          status: payload.status,
          source: payload.source?.trim() || undefined,
          notes: payload.notes?.trim() || undefined,
          lastInteractionAt: payload.lastInteractionAt,
          lastOrderSummary: payload.lastOrderSummary,
          updatedAt: new Date().toISOString(),
        };

        return updatedCustomer;
      }),
    }));

    return updatedCustomer;
  }

  function deleteCustomer(id: string) {
    setAppState((current) => ({
      ...current,
      customers: current.customers.filter((customer) => customer.id !== id),
    }));
  }

  function upsertCustomerFromOrder(current: AppStorageState, payload: Pick<OrderInput, "customerName" | "whatsappNumber" | "status" | "title">) {
    const existingCustomer =
      current.customers.find((customer) => customer.whatsappNumber === payload.whatsappNumber.trim()) ??
      current.customers.find((customer) => customer.name.toLowerCase() === payload.customerName.trim().toLowerCase());

    const nextCustomerStatus = getCustomerStatusFromOrderStatus(payload.status);
    const lastInteractionAt = new Date().toISOString();

    if (existingCustomer) {
      const updatedCustomer: Customer = {
        ...existingCustomer,
        name: payload.customerName.trim(),
        whatsappNumber: payload.whatsappNumber.trim(),
        status: nextCustomerStatus,
        lastInteractionAt,
        lastOrderSummary: payload.title.trim(),
        updatedAt: lastInteractionAt,
      };

      return {
        customer: updatedCustomer,
        customers: current.customers.map((item) => (item.id === existingCustomer.id ? updatedCustomer : item)),
      };
    }

    const nextCustomer = createCustomerRecord({
      businessId: current.business.id,
      name: payload.customerName.trim(),
      whatsappNumber: payload.whatsappNumber.trim(),
      status: nextCustomerStatus,
      lastInteractionAt,
      lastOrderSummary: payload.title.trim(),
      source: "Order manual",
    });

    return {
      customer: nextCustomer,
      customers: [nextCustomer, ...current.customers],
    };
  }

  function createOrder(payload: OrderInput) {
    const nextHoldExpiresAt = payload.bookingHoldExpiresAt;
    let createdOrder: Order | null = null;

    setAppState((current) => {
      const customerSync = upsertCustomerFromOrder(current, {
        customerName: payload.customerName,
        whatsappNumber: payload.whatsappNumber,
        status: payload.status,
        title: payload.title,
      });

      createdOrder = createOrderRecord({
        businessId: current.business.id,
        customerId: customerSync.customer.id,
        customerName: payload.customerName.trim(),
        whatsappNumber: payload.whatsappNumber.trim(),
        title: payload.title.trim(),
        mode: payload.mode,
        status: payload.status,
        paymentStatus: payload.paymentStatus,
        scheduledDate: payload.scheduledDate || undefined,
        scheduledTime: payload.scheduledTime || undefined,
        bookingDurationMinutes: payload.mode === "BOOKING_SERVICE" ? payload.bookingDurationMinutes : undefined,
        bookingHoldExpiresAt: nextHoldExpiresAt,
        resourceId: payload.resourceId,
        resourceNameSnapshot: payload.resourceNameSnapshot,
        totalAmount: payload.totalAmount,
        dpAmount: payload.dpAmount,
        notes: payload.notes?.trim() || undefined,
        customerStatusSnapshot: customerSync.customer.status,
      });

      return {
        ...current,
        customers: customerSync.customers,
        orders: createdOrder ? [createdOrder, ...current.orders] : current.orders,
      };
    });

    if (!createdOrder) {
      throw new Error("Failed to create order");
    }

    return createdOrder;
  }

  function updateOrder(id: string, payload: OrderInput) {
    let updatedOrder: Order | null = null;

    setAppState((current) => {
      const customerSync = upsertCustomerFromOrder(current, {
        customerName: payload.customerName,
        whatsappNumber: payload.whatsappNumber,
        status: payload.status,
        title: payload.title,
      });

      return {
        ...current,
        customers: customerSync.customers,
        orders: current.orders.map((order) => {
          if (order.id !== id) {
            return order;
          }

          updatedOrder = {
            ...order,
            customerId: customerSync.customer.id,
            customerName: payload.customerName.trim(),
            whatsappNumber: payload.whatsappNumber.trim(),
            title: payload.title.trim(),
            mode: payload.mode,
            status: payload.status,
            paymentStatus: payload.paymentStatus,
            scheduledDate: payload.scheduledDate || undefined,
            scheduledTime: payload.scheduledTime || undefined,
            bookingDurationMinutes: payload.mode === "BOOKING_SERVICE" ? payload.bookingDurationMinutes : undefined,
            bookingHoldExpiresAt: payload.bookingHoldExpiresAt,
            resourceId: payload.resourceId,
            resourceNameSnapshot: payload.resourceNameSnapshot,
            totalAmount: payload.totalAmount,
            dpAmount: payload.dpAmount,
            notes: payload.notes?.trim() || undefined,
            customerStatusSnapshot: customerSync.customer.status,
            updatedAt: new Date().toISOString(),
          };

          return updatedOrder;
        }),
      };
    });

    return updatedOrder;
  }

  function deleteOrder(id: string) {
    setAppState((current) => ({
      ...current,
      orders: current.orders.filter((order) => order.id !== id),
      invoices: current.invoices.filter((invoice) => invoice.orderId !== id),
    }));
  }

  function createInvoiceFromOrder(orderId: string, notes?: string) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) {
      return null;
    }

    const nextInvoice = createInvoiceRecord({
      businessId: state.business.id,
      orderId: order.id,
      invoiceCode: createInvoiceCode(order.id, state.invoices.length + 1),
      customerName: order.customerName,
      totalAmount: order.totalAmount ?? 0,
      paymentStatus: order.paymentStatus,
      notes: notes?.trim() || "Nota dibuat dari order.",
    });

    setAppState((current) => ({
      ...current,
      invoices: [nextInvoice, ...current.invoices],
    }));

    return nextInvoice;
  }

  function updateMessageTemplate(id: string, payload: { title: string; content: string }) {
    setAppState((current) => ({
      ...current,
      messageTemplates: current.messageTemplates.map((template) =>
        template.id === id ? createMessageTemplateRecord(template, payload) : template
      ),
    }));
  }

  function updateMessageComposer(payload: Partial<MessageComposerDraft>) {
    setAppState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        messageComposer: {
          ...current.ui.messageComposer,
          ...payload,
          drafts: payload.drafts ?? current.ui.messageComposer.drafts,
        },
      },
    }));
  }

  function saveMessageDraft(templateId: string, payload: { title: string; content: string }) {
    setAppState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        messageComposer: {
          ...current.ui.messageComposer,
          drafts: {
            ...current.ui.messageComposer.drafts,
            [templateId]: payload,
          },
        },
      },
    }));
  }

  function submitPublicOrder(input: PublicOrderInput) {
    const customerName = input.payload.name?.trim() || "Customer baru";
    const whatsappNumber = input.payload.whatsappNumber?.trim() || "";
    const mode = state.business.mode;
    const operationalModel = state.business.operationalModel;
    const title = getPublicOrderTitle(mode, input.payload);

    const customer = createCustomerRecord({
      businessId: state.business.id,
      name: customerName,
      whatsappNumber,
      status: "NEW",
      source: "Link Bisnis",
      notes: input.payload.notes?.trim() || undefined,
      lastInteractionAt: new Date().toISOString(),
      lastOrderSummary: title,
    });

    const order = createOrderRecord({
      businessId: state.business.id,
      customerId: customer.id,
      customerName,
      whatsappNumber,
      title,
      mode,
      status: getDefaultOrderStatusForMode(mode),
      paymentStatus: "UNPAID",
      scheduledDate: input.payload.scheduledDate || input.payload.deadline || undefined,
      scheduledTime: input.payload.scheduledTime || undefined,
      bookingDurationMinutes: input.payload.bookingDurationMinutes ? Number(input.payload.bookingDurationMinutes) : undefined,
      resourceId: undefined,
      resourceNameSnapshot: undefined,
      totalAmount: input.payload.budget ? Number(input.payload.budget.replace(/[^\d]/g, "")) : undefined,
      notes: input.payload.notes?.trim() || undefined,
      customerStatusSnapshot: "NEW",
    });

    const publicSubmission = createPublicSubmissionRecord({
      businessId: state.business.id,
      customerId: customer.id,
      orderId: order.id,
      mode,
      operationalModel,
      payload: input.payload,
    });

    setAppState((current) => ({
      ...current,
      customers: [customer, ...current.customers],
      orders: [order, ...current.orders],
      publicSubmissions: [publicSubmission, ...current.publicSubmissions],
    }));

    return { customer, order };
  }

  const currentUser = state.auth.users.find((user) => user.id === state.auth.currentUserId) ?? null;

  const value: AppDataContextValue = {
    ...state,
    hydrated,
    currentUser,
    updateBusiness,
    saveBusinessSettings,
    completeOnboarding,
    register,
    login,
    logout,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createOrder,
    updateOrder,
    deleteOrder,
    createInvoiceFromOrder,
    updateMessageTemplate,
    updateMessageComposer,
    saveMessageDraft,
    submitPublicOrder,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }

  return context;
}
