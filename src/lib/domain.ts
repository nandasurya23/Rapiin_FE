import type { Customer } from "@/types/customer";
import type { Order } from "@/types/order";

export type ReportPeriod = "TODAY" | "WEEK" | "MONTH";

export type DashboardSummary = {
  todayOrders: Order[];
  completedToday: Order[];
  unpaidOrders: Order[];
  followUps: Customer[];
  revenue: number;
  recentOrders: Order[];
};

export type ReportSummary = {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  newCustomers: number;
  revenue: number;
  unpaidCount: number;
};

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfPeriod(period: ReportPeriod, referenceDate: Date) {
  if (period === "TODAY") {
    return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  }

  if (period === "WEEK") {
    const start = new Date(referenceDate);
    const day = start.getDay() === 0 ? 7 : start.getDay();
    start.setDate(start.getDate() - (day - 1));
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
}

function endOfPeriod(period: ReportPeriod, referenceDate: Date) {
  if (period === "TODAY") {
    const end = new Date(referenceDate);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  if (period === "WEEK") {
    const end = startOfPeriod(period, referenceDate);
    end.setDate(end.getDate() + 7);
    return end;
  }

  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
}

export function getOrderReferenceDate(order: Order) {
  return order.scheduledDate ?? toDateKey(new Date(order.createdAt));
}

export function isWithinPeriod(value: string, period: ReportPeriod, referenceDate: Date) {
  const start = startOfPeriod(period, referenceDate);
  const end = endOfPeriod(period, referenceDate);
  const parsed = parseDateKey(value);

  return parsed >= start && parsed < end;
}

export function getDashboardSummary(orders: Order[], customers: Customer[], referenceDate = new Date()): DashboardSummary {
  const today = toDateKey(referenceDate);
  const todayOrders = orders.filter((order) => order.scheduledDate === today);
  const completedToday = todayOrders.filter((order) => order.status === "SELESAI");
  const unpaidOrders = orders.filter((order) => order.paymentStatus === "UNPAID" || order.paymentStatus === "DP_PAID");
  const followUps = customers.filter((customer) => customer.status === "NEED_FOLLOW_UP");
  const revenue = orders
    .filter((order) => order.status === "SELESAI")
    .reduce((sum, order) => sum + (order.totalAmount ?? 0), 0);
  const recentOrders = [...orders].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 3);

  return {
    todayOrders,
    completedToday,
    unpaidOrders,
    followUps,
    revenue,
    recentOrders,
  };
}

export function getReportSummary(orders: Order[], customers: Customer[], period: ReportPeriod, referenceDate = new Date()): ReportSummary {
  const periodOrders = orders.filter((order) => isWithinPeriod(getOrderReferenceDate(order), period, referenceDate));
  const periodCustomers = customers.filter((customer) => isWithinPeriod(toDateKey(new Date(customer.createdAt)), period, referenceDate));

  return {
    totalOrders: periodOrders.length,
    completedOrders: periodOrders.filter((order) => order.status === "SELESAI").length,
    cancelledOrders: periodOrders.filter((order) => order.status === "BATAL").length,
    newCustomers: periodCustomers.length,
    revenue: periodOrders
      .filter((order) => order.status === "SELESAI")
      .reduce((sum, order) => sum + (order.totalAmount ?? 0), 0),
    unpaidCount: periodOrders.filter((order) => order.paymentStatus === "UNPAID" || order.paymentStatus === "DP_PAID").length,
  };
}

export function getEntityById<T extends { id: string }>(items: T[], id: string) {
  return items.find((item) => item.id === id);
}
