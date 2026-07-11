import { getBookingDurationMinutes, getBookingInterval, isBookingHoldActive, isBookingLocked } from "@/lib/booking";
import type { Order } from "@/types/order";

describe("Booking Scheduling Library Tests", () => {
  describe("getBookingDurationMinutes", () => {
    it("should return the custom booking duration if it is a positive number", () => {
      const order = { bookingDurationMinutes: 45, mode: "BOOKING_SERVICE" } as unknown as Order;
      expect(getBookingDurationMinutes(order)).toBe(45);
    });

    it("should return the default fallback if the booking duration is invalid or not specified", () => {
      expect(getBookingDurationMinutes(null)).toBe(60);
      expect(getBookingDurationMinutes({ bookingDurationMinutes: undefined } as unknown as Order)).toBe(60);
      expect(getBookingDurationMinutes({ bookingDurationMinutes: 0 } as unknown as Order)).toBe(60);
      expect(getBookingDurationMinutes({ bookingDurationMinutes: -10 } as unknown as Order)).toBe(60);
    });
  });

  describe("isBookingHoldActive", () => {
    const baseOrder = {
      id: "ord_1",
      businessId: "biz_1",
      customerId: "cust_1",
      title: "Test Order",
      mode: "BOOKING_SERVICE",
      status: "WAITING_DP",
      paymentStatus: "UNPAID",
      scheduledDate: "2026-07-11",
      scheduledTime: "10:00",
      bookingHoldExpiresAt: "2026-07-11T10:15:00.000Z",
      createdAt: "2026-07-11T10:00:00.000Z",
      updatedAt: "2026-07-11T10:00:00.000Z",
    } as unknown as Order;

    it("should return true if current time is before the hold expiration time", () => {
      const now = new Date("2026-07-11T10:10:00.000Z");
      expect(isBookingHoldActive(baseOrder, now)).toBe(true);
    });

    it("should return false if current time is after the hold expiration time", () => {
      const now = new Date("2026-07-11T10:20:00.000Z");
      expect(isBookingHoldActive(baseOrder, now)).toBe(false);
    });

    it("should return false if the order status is cancelled or refunded", () => {
      const cancelledOrder = { ...baseOrder, status: "BATAL" } as unknown as Order;
      const now = new Date("2026-07-11T10:10:00.000Z");
      expect(isBookingHoldActive(cancelledOrder, now)).toBe(false);
    });
  });

  describe("isBookingLocked", () => {
    const baseOrder = {
      id: "ord_1",
      businessId: "biz_1",
      customerId: "cust_1",
      title: "Test Order",
      mode: "BOOKING_SERVICE",
      status: "WAITING_DP",
      paymentStatus: "UNPAID",
      scheduledDate: "2026-07-11",
      scheduledTime: "10:00",
      bookingHoldExpiresAt: "2026-07-11T10:15:00.000Z",
      createdAt: "2026-07-11T10:00:00.000Z",
      updatedAt: "2026-07-11T10:00:00.000Z",
    } as unknown as Order;

    it("should return true if paymentStatus is PAID or DP_PAID", () => {
      const paidOrder = { ...baseOrder, paymentStatus: "PAID", status: "CONFIRMED" } as unknown as Order;
      const now = new Date("2026-07-11T11:00:00.000Z");
      expect(isBookingLocked(paidOrder, now)).toBe(true);
    });

    it("should return true if the booking hold is active", () => {
      const now = new Date("2026-07-11T10:10:00.000Z");
      expect(isBookingLocked(baseOrder, now)).toBe(true);
    });

    it("should return false if booking hold has expired and no payment was made", () => {
      const now = new Date("2026-07-11T10:20:00.000Z");
      expect(isBookingLocked(baseOrder, now)).toBe(false);
    });
  });

  describe("getBookingInterval", () => {
    it("should return correct start and end times based on date, time and duration", () => {
      const order = {
        id: "ord_1",
        businessId: "biz_1",
        customerId: "cust_1",
        title: "Test Order",
        mode: "BOOKING_SERVICE",
        status: "CONFIRMED",
        paymentStatus: "PAID",
        scheduledDate: "2026-07-11",
        scheduledTime: "10:00",
        bookingDurationMinutes: 90,
        createdAt: "2026-07-11T09:00:00.000Z",
        updatedAt: "2026-07-11T09:00:00.000Z",
      } as unknown as Order;

      const interval = getBookingInterval(order);
      expect(interval).not.toBeNull();
      if (interval) {
        expect(interval.start.getHours()).toBe(10);
        expect(interval.start.getMinutes()).toBe(0);
        expect(interval.durationMinutes).toBe(90);
        expect(interval.end.getHours()).toBe(11);
        expect(interval.end.getMinutes()).toBe(30);
      }
    });

    it("should return null if scheduled date or time is missing", () => {
      const order = {
        id: "ord_1",
        businessId: "biz_1",
        customerId: "cust_1",
        title: "Test Order",
        mode: "BOOKING_SERVICE",
        status: "CONFIRMED",
        paymentStatus: "PAID",
        scheduledDate: "",
        scheduledTime: "",
        createdAt: "2026-07-11T09:00:00.000Z",
        updatedAt: "2026-07-11T09:00:00.000Z",
      } as unknown as Order;
      expect(getBookingInterval(order)).toBeNull();
    });
  });
});
