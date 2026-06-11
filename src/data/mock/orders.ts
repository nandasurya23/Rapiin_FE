import type { Order } from "@/types/order";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

const now = new Date();
const today = toDateKey(now);
const yesterday = toDateKey(addDays(now, -1));

export const mockOrders: Order[] = [
  {
    id: "ord_001",
    businessId: "biz_001",
    customerId: "cus_001",
    customerName: "Raka Wijaya",
    whatsappNumber: "08123456789",
    title: "Booking Studio 2 jam",
    mode: "BOOKING_SERVICE",
    status: "WAITING_DP",
    paymentStatus: "UNPAID",
    scheduledDate: today,
    scheduledTime: "18:00",
    bookingDurationMinutes: 60,
    bookingHoldExpiresAt: addMinutes(now, 20).toISOString(),
    resourceId: "res_1",
    resourceNameSnapshot: "Studio 1",
    totalAmount: 240000,
    dpAmount: 100000,
    notes: "Masih hold sementara, menunggu DP.",
    lastFollowUpAt: now.toISOString(),
    customerStatusSnapshot: "NEED_FOLLOW_UP",
    createdAt: addMinutes(now, -35).toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: "ord_002",
    businessId: "biz_001",
    customerId: "cus_002",
    customerName: "Mira Nada",
    whatsappNumber: "08129876543",
    title: "Booking Studio 1 jam",
    mode: "BOOKING_SERVICE",
    status: "CONFIRMED",
    paymentStatus: "DP_PAID",
    scheduledDate: today,
    scheduledTime: "19:00",
    bookingDurationMinutes: 60,
    resourceId: "res_2",
    resourceNameSnapshot: "Studio 2",
    totalAmount: 120000,
    dpAmount: 60000,
    notes: "Slot aman karena DP sudah masuk.",
    lastFollowUpAt: addMinutes(now, -25).toISOString(),
    customerStatusSnapshot: "DEAL",
    createdAt: addMinutes(now, -80).toISOString(),
    updatedAt: addMinutes(now, -25).toISOString(),
  },
  {
    id: "ord_003",
    businessId: "biz_001",
    customerId: "cus_003",
    customerName: "Dimas Sound",
    whatsappNumber: "628111223344",
    title: "Booking Studio 1 jam",
    mode: "BOOKING_SERVICE",
    status: "CONFIRMED",
    paymentStatus: "DP_PAID",
    scheduledDate: today,
    scheduledTime: "20:00",
    bookingDurationMinutes: 60,
    resourceId: "res_1",
    resourceNameSnapshot: "Studio 1",
    totalAmount: 180000,
    dpAmount: 90000,
    notes: "Sesi malam pertama.",
    lastFollowUpAt: addMinutes(now, -15).toISOString(),
    customerStatusSnapshot: "DEAL",
    createdAt: addMinutes(now, -60).toISOString(),
    updatedAt: addMinutes(now, -15).toISOString(),
  },
  {
    id: "ord_004",
    businessId: "biz_001",
    customerId: "cus_004",
    customerName: "Nadia Putri",
    whatsappNumber: "081377889900",
    title: "Booking Studio 1 jam",
    mode: "BOOKING_SERVICE",
    status: "CONFIRMED",
    paymentStatus: "DP_PAID",
    scheduledDate: today,
    scheduledTime: "20:00",
    bookingDurationMinutes: 60,
    resourceId: "res_2",
    resourceNameSnapshot: "Studio 2",
    totalAmount: 120000,
    dpAmount: 60000,
    notes: "Booking kedua di slot yang sama agar range 20:00–21:00 full.",
    lastFollowUpAt: addMinutes(now, -10).toISOString(),
    customerStatusSnapshot: "DEAL",
    createdAt: addMinutes(now, -40).toISOString(),
    updatedAt: addMinutes(now, -10).toISOString(),
  },
  {
    id: "ord_005",
    businessId: "biz_001",
    customerId: "cus_005",
    customerName: "Fajar Rental",
    whatsappNumber: "081355667788",
    title: "Sewa alat 1 hari",
    mode: "BOOKING_SERVICE",
    status: "SELESAI",
    paymentStatus: "PAID",
    scheduledDate: yesterday,
    scheduledTime: "09:00",
    bookingDurationMinutes: 120,
    resourceId: "res_3",
    resourceNameSnapshot: "Studio 3",
    totalAmount: 250000,
    dpAmount: 0,
    notes: "Riwayat selesai untuk preview kartu sukses.",
    lastFollowUpAt: addMinutes(now, -60).toISOString(),
    customerStatusSnapshot: "DONE",
    createdAt: addDays(now, -2).toISOString(),
    updatedAt: addMinutes(now, -60).toISOString(),
  },
];
