import type { BusinessResource } from "@/types/business";
import type { Order } from "@/types/order";

export const BOOKING_SLOT_CAPACITY = 2;
export const RESOURCE_BOOKING_RESOURCE_CAPACITY = 1;
export const BOOKING_HOLD_MINUTES = 15;
export const DEFAULT_BOOKING_DURATION_MINUTES = 60;

export type BookingSlotSummary = {
  time: string;
  count: number;
  holdCount: number;
  paidCount: number;
  isFull: boolean;
};

export type BookingAvailability = {
  count: number;
  holdCount: number;
  paidCount: number;
  remaining: number;
  isFull: boolean;
  hasHold: boolean;
  overlappingOrders: Order[];
  earliestHoldExpiresAt: Date | null;
  availableResourceCount?: number;
  busyResourceCount?: number;
  totalResourceCount?: number;
  unavailableResourceIds?: string[];
};

export type ResourceBookingDetail = {
  resourceId: string;
  resourceName: string;
  isActive: boolean;
  count: number;
  holdCount: number;
  paidCount: number;
  remaining: number;
  isFull: boolean;
  hasHold: boolean;
  statusLabel: string;
  statusTone: "success" | "warning" | "danger" | "neutral";
  bookings: Order[];
  earliestHoldExpiresAt: Date | null;
};

function normalizeValue(value?: string | null) {
  return value?.trim() ?? "";
}

function parseBookingDateTime(date?: string | null, time?: string | null) {
  const normalizedDate = normalizeValue(date);
  const normalizedTime = normalizeValue(time);

  if (!normalizedDate || !normalizedTime) {
    return null;
  }

  const [year, month, day] = normalizedDate.split("-").map(Number);
  const [hours, minutes] = normalizedTime.split(":").map(Number);

  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function intervalsOverlap(leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date) {
  return leftStart < rightEnd && leftEnd > rightStart;
}

function compareEventTimes(left: { time: number; delta: number }, right: { time: number; delta: number }) {
  if (left.time !== right.time) {
    return left.time - right.time;
  }

  return left.delta - right.delta;
}

function getActiveResources(resources?: BusinessResource[]) {
  return (resources ?? []).filter((resource) => resource.isActive);
}

function buildTargetInterval(date?: string | null, time?: string | null, durationMinutes?: number) {
  const targetStart = parseBookingDateTime(date, time);

  if (!targetStart) {
    return null;
  }

  const safeDuration = durationMinutes && durationMinutes > 0 ? durationMinutes : DEFAULT_BOOKING_DURATION_MINUTES;

  return {
    start: targetStart,
    end: addMinutes(targetStart, safeDuration),
    durationMinutes: safeDuration,
  };
}

function getOrdersByResource(
  orders: Order[],
  resourceId: string,
  date?: string | null,
  time?: string | null,
  durationMinutes?: number,
  excludeOrderId?: string | null,
  now = new Date()
) {
  const targetInterval = buildTargetInterval(date, time, durationMinutes);

  if (!targetInterval) {
    return [];
  }

  return orders.filter((order) => {
    if (excludeOrderId && order.id === excludeOrderId) {
      return false;
    }

    if (order.resourceId !== resourceId) {
      return false;
    }

    if (!isBookingLocked(order, now)) {
      return false;
    }

    const interval = getBookingInterval(order);
    if (!interval) {
      return false;
    }

    return intervalsOverlap(targetInterval.start, targetInterval.end, interval.start, interval.end);
  });
}

function getUnassignedOverlapOrders(
  orders: Order[],
  date?: string | null,
  time?: string | null,
  durationMinutes?: number,
  excludeOrderId?: string | null,
  now = new Date()
) {
  const targetInterval = buildTargetInterval(date, time, durationMinutes);

  if (!targetInterval) {
    return [];
  }

  return orders.filter((order) => {
    if (excludeOrderId && order.id === excludeOrderId) {
      return false;
    }

    if (order.resourceId) {
      return false;
    }

    if (!isBookingLocked(order, now)) {
      return false;
    }

    const interval = getBookingInterval(order);
    if (!interval) {
      return false;
    }

    return intervalsOverlap(targetInterval.start, targetInterval.end, interval.start, interval.end);
  });
}

function getResourceStatusLabel(detail: Pick<ResourceBookingDetail, "isActive" | "isFull" | "hasHold" | "earliestHoldExpiresAt">) {
  if (!detail.isActive) {
    return "Nonaktif";
  }

  if (detail.isFull && detail.hasHold) {
    return detail.earliestHoldExpiresAt ? "Hold sampai aktif lagi" : "Sedang di-hold";
  }

  if (detail.isFull) {
    return "Penuh";
  }

  if (detail.hasHold) {
    return "Ditahan sementara";
  }

  return "Kosong";
}

function getResourceStatusTone(detail: Pick<ResourceBookingDetail, "isActive" | "isFull" | "hasHold">) {
  if (!detail.isActive) {
    return "neutral" as const;
  }

  if (detail.isFull && detail.hasHold) {
    return "warning" as const;
  }

  if (detail.isFull) {
    return "danger" as const;
  }

  if (detail.hasHold) {
    return "warning" as const;
  }

  return "success" as const;
}

export function getBookingDurationMinutes(order?: Pick<Order, "bookingDurationMinutes" | "mode"> | null, fallback = DEFAULT_BOOKING_DURATION_MINUTES) {
  const duration = order?.bookingDurationMinutes;

  if (typeof duration !== "number" || Number.isNaN(duration) || duration <= 0) {
    return fallback;
  }

  return duration;
}

export function getBookingHoldExpiresAt(order?: Pick<Order, "bookingHoldExpiresAt"> | null) {
  if (!order?.bookingHoldExpiresAt) {
    return null;
  }

  const holdExpiresAt = new Date(order.bookingHoldExpiresAt);
  if (Number.isNaN(holdExpiresAt.getTime())) {
    return null;
  }

  return holdExpiresAt;
}

export function isBookingHoldActive(order: Order, now = new Date()) {
  if (!order.scheduledDate || !order.scheduledTime) {
    return false;
  }

  if (order.status === "BATAL" || order.paymentStatus === "CANCELLED" || order.paymentStatus === "REFUNDED") {
    return false;
  }

  if (order.paymentStatus !== "UNPAID" || order.status !== "WAITING_DP") {
    return false;
  }

  const holdExpiresAt = getBookingHoldExpiresAt(order);
  return Boolean(holdExpiresAt && holdExpiresAt.getTime() > now.getTime());
}

export function isBookingLocked(order: Order, now = new Date()) {
  if (!order.scheduledDate || !order.scheduledTime) {
    return false;
  }

  if (order.status === "BATAL" || order.paymentStatus === "CANCELLED" || order.paymentStatus === "REFUNDED") {
    return false;
  }

  if (order.paymentStatus === "DP_PAID" || order.paymentStatus === "PAID") {
    return true;
  }

  return isBookingHoldActive(order, now);
}

export function getBookingInterval(order: Order) {
  const start = parseBookingDateTime(order.scheduledDate, order.scheduledTime);

  if (!start) {
    return null;
  }

  const durationMinutes = getBookingDurationMinutes(order);
  return {
    start,
    end: addMinutes(start, durationMinutes),
    durationMinutes,
  };
}

export function getBookingOverlapOrders(
  orders: Order[],
  date?: string | null,
  time?: string | null,
  durationMinutes?: number,
  excludeOrderId?: string | null,
  now = new Date()
) {
  const targetInterval = buildTargetInterval(date, time, durationMinutes);

  if (!targetInterval) {
    return [];
  }

  return orders.filter((order) => {
    if (excludeOrderId && order.id === excludeOrderId) {
      return false;
    }

    if (!isBookingLocked(order, now)) {
      return false;
    }

    const interval = getBookingInterval(order);
    if (!interval) {
      return false;
    }

    return intervalsOverlap(targetInterval.start, targetInterval.end, interval.start, interval.end);
  });
}

function getMaxConcurrentBookingsWithinInterval(
  orders: Order[],
  targetStart: Date,
  targetEnd: Date,
  excludeOrderId?: string | null,
  now = new Date()
) {
  const events: Array<{ time: number; delta: number }> = [];
  let currentCount = 0;

  orders.forEach((order) => {
    if (excludeOrderId && order.id === excludeOrderId) {
      return;
    }

    if (!isBookingLocked(order, now)) {
      return;
    }

    const interval = getBookingInterval(order);

    if (!interval || !intervalsOverlap(targetStart, targetEnd, interval.start, interval.end)) {
      return;
    }

    if (interval.start <= targetStart && interval.end > targetStart) {
      currentCount += 1;
    }

    if (interval.start > targetStart && interval.start < targetEnd) {
      events.push({ time: interval.start.getTime(), delta: 1 });
    }

    if (interval.end > targetStart && interval.end < targetEnd) {
      events.push({ time: interval.end.getTime(), delta: -1 });
    }
  });

  let maxCount = currentCount;
  events.sort(compareEventTimes);

  for (let index = 0; index < events.length; ) {
    const currentTime = events[index].time;

    while (index < events.length && events[index].time === currentTime) {
      currentCount += events[index].delta;
      index += 1;
    }

    if (currentCount > maxCount) {
      maxCount = currentCount;
    }
  }

  return maxCount;
}

export function getBookingSlotCount(
  orders: Order[],
  date?: string | null,
  time?: string | null,
  durationMinutesOrExcludeOrderId?: number | string | null,
  excludeOrderId?: string | null,
  now = new Date()
) {
  let durationMinutes: number | undefined;
  let orderIdToExclude = excludeOrderId ?? null;

  if (typeof durationMinutesOrExcludeOrderId === "number") {
    durationMinutes = durationMinutesOrExcludeOrderId;
  } else if (typeof durationMinutesOrExcludeOrderId === "string") {
    orderIdToExclude = durationMinutesOrExcludeOrderId;
  }

  const targetInterval = buildTargetInterval(date, time, durationMinutes);

  if (!targetInterval) {
    return 0;
  }

  return getMaxConcurrentBookingsWithinInterval(orders, targetInterval.start, targetInterval.end, orderIdToExclude, now);
}

export function isBookingSlotFull(
  orders: Order[],
  date?: string | null,
  time?: string | null,
  durationMinutesOrExcludeOrderId?: number | string | null,
  excludeOrderId?: string | null,
  now = new Date(),
  capacity = BOOKING_SLOT_CAPACITY
) {
  return getBookingSlotCount(orders, date, time, durationMinutesOrExcludeOrderId, excludeOrderId, now) >= capacity;
}

export function getBookingAvailability(
  orders: Order[],
  date?: string | null,
  time?: string | null,
  durationMinutesOrExcludeOrderId?: number | string | null,
  excludeOrderId?: string | null,
  now = new Date(),
  capacity = BOOKING_SLOT_CAPACITY
): BookingAvailability {
  let durationMinutes: number | undefined;
  let orderIdToExclude = excludeOrderId ?? null;

  if (typeof durationMinutesOrExcludeOrderId === "number") {
    durationMinutes = durationMinutesOrExcludeOrderId;
  } else if (typeof durationMinutesOrExcludeOrderId === "string") {
    orderIdToExclude = durationMinutesOrExcludeOrderId;
  }

  const overlappingOrders = getBookingOverlapOrders(orders, date, time, durationMinutes, orderIdToExclude, now);
  const holdOrders = overlappingOrders.filter((order) => isBookingHoldActive(order, now));
  const count = getBookingSlotCount(orders, date, time, durationMinutesOrExcludeOrderId, orderIdToExclude, now);

  return {
    count,
    holdCount: holdOrders.length,
    paidCount: overlappingOrders.length - holdOrders.length,
    remaining: Math.max(capacity - count, 0),
    isFull: count >= capacity,
    hasHold: holdOrders.length > 0,
    overlappingOrders,
    earliestHoldExpiresAt: holdOrders.reduce<Date | null>((earliest, order) => {
      const holdExpiresAt = getBookingHoldExpiresAt(order);

      if (!holdExpiresAt) {
        return earliest;
      }

      if (!earliest || holdExpiresAt.getTime() < earliest.getTime()) {
        return holdExpiresAt;
      }

      return earliest;
    }, null),
  };
}

export function getResourceBookingAvailability(
  orders: Order[],
  resources: BusinessResource[],
  date?: string | null,
  time?: string | null,
  durationMinutesOrExcludeOrderId?: number | string | null,
  excludeOrderId?: string | null,
  now = new Date()
): BookingAvailability {
  let durationMinutes: number | undefined;
  let orderIdToExclude = excludeOrderId ?? null;

  if (typeof durationMinutesOrExcludeOrderId === "number") {
    durationMinutes = durationMinutesOrExcludeOrderId;
  } else if (typeof durationMinutesOrExcludeOrderId === "string") {
    orderIdToExclude = durationMinutesOrExcludeOrderId;
  }

  const activeResources = getActiveResources(resources);
  const resourceDetails = activeResources.map((resource) => ({
    resourceId: resource.id,
    availability: getResourceAvailabilityForSelection(orders, resource.id, date, time, durationMinutes, orderIdToExclude, now),
  }));
  const unavailableResources = resourceDetails.filter((detail) => detail.availability.isFull);
  const holdResources = resourceDetails.filter((detail) => detail.availability.hasHold);
  const overlappingOrders = resourceDetails.flatMap((detail) => detail.availability.overlappingOrders);
  const unassignedOverlaps = getUnassignedOverlapOrders(orders, date, time, durationMinutes, orderIdToExclude, now);
  const abstractUnavailableCount = Math.min(unassignedOverlaps.length, activeResources.length);
  const effectiveBusyCount = Math.min(unavailableResources.length + abstractUnavailableCount, activeResources.length);
  const remaining = Math.max(activeResources.length - effectiveBusyCount, 0);

  return {
    count: effectiveBusyCount,
    holdCount: holdResources.length,
    paidCount: unavailableResources.length - holdResources.length,
    remaining,
    isFull: activeResources.length > 0 ? remaining <= 0 : true,
    hasHold: holdResources.length > 0,
    overlappingOrders: [...overlappingOrders, ...unassignedOverlaps],
    earliestHoldExpiresAt: [...holdResources.flatMap((detail) => (detail.availability.earliestHoldExpiresAt ? [detail.availability.earliestHoldExpiresAt] : [])), ...unassignedOverlaps.flatMap((order) => {
      const hold = getBookingHoldExpiresAt(order);
      return hold ? [hold] : [];
    })].reduce<Date | null>((earliest, value) => {
      if (!earliest || value.getTime() < earliest.getTime()) {
        return value;
      }

      return earliest;
    }, null),
    availableResourceCount: remaining,
    busyResourceCount: effectiveBusyCount,
    totalResourceCount: activeResources.length,
    unavailableResourceIds: unavailableResources.map((detail) => detail.resourceId),
  };
}

export function getResourceAvailabilityForSelection(
  orders: Order[],
  resourceId: string,
  date?: string | null,
  time?: string | null,
  durationMinutesOrExcludeOrderId?: number | string | null,
  excludeOrderId?: string | null,
  now = new Date()
): BookingAvailability {
  let durationMinutes: number | undefined;
  let orderIdToExclude = excludeOrderId ?? null;

  if (typeof durationMinutesOrExcludeOrderId === "number") {
    durationMinutes = durationMinutesOrExcludeOrderId;
  } else if (typeof durationMinutesOrExcludeOrderId === "string") {
    orderIdToExclude = durationMinutesOrExcludeOrderId;
  }

  const overlappingOrders = getOrdersByResource(orders, resourceId, date, time, durationMinutes, orderIdToExclude, now);
  const holdOrders = overlappingOrders.filter((order) => isBookingHoldActive(order, now));
  const count = overlappingOrders.length;

  return {
    count,
    holdCount: holdOrders.length,
    paidCount: overlappingOrders.length - holdOrders.length,
    remaining: Math.max(RESOURCE_BOOKING_RESOURCE_CAPACITY - count, 0),
    isFull: count >= RESOURCE_BOOKING_RESOURCE_CAPACITY,
    hasHold: holdOrders.length > 0,
    overlappingOrders,
    earliestHoldExpiresAt: holdOrders.reduce<Date | null>((earliest, order) => {
      const holdExpiresAt = getBookingHoldExpiresAt(order);

      if (!holdExpiresAt) {
        return earliest;
      }

      if (!earliest || holdExpiresAt.getTime() < earliest.getTime()) {
        return holdExpiresAt;
      }

      return earliest;
    }, null),
    availableResourceCount: Math.max(RESOURCE_BOOKING_RESOURCE_CAPACITY - count, 0),
    busyResourceCount: count,
    totalResourceCount: RESOURCE_BOOKING_RESOURCE_CAPACITY,
    unavailableResourceIds: count > 0 ? [resourceId] : [],
  };
}

export function getResourceBookingDetailsForDate(
  orders: Order[],
  resources: BusinessResource[],
  date?: string | null,
  now = new Date()
) {
  const normalizedDate = normalizeValue(date);
  const activeResources = resources ?? [];

  if (!normalizedDate) {
    return [];
  }

  return activeResources.map<ResourceBookingDetail>((resource) => {
    const bookings = orders
      .filter((order) => order.scheduledDate === normalizedDate && order.resourceId === resource.id)
      .sort((left, right) => (left.scheduledTime ?? "").localeCompare(right.scheduledTime ?? ""));
    const lockedBookings = bookings.filter((order) => isBookingLocked(order, now));
    const holdBookings = lockedBookings.filter((order) => isBookingHoldActive(order, now));
    const earliestHoldExpiresAt = holdBookings.reduce<Date | null>((earliest, order) => {
      const holdExpiresAt = getBookingHoldExpiresAt(order);

      if (!holdExpiresAt) {
        return earliest;
      }

      if (!earliest || holdExpiresAt.getTime() < earliest.getTime()) {
        return holdExpiresAt;
      }

      return earliest;
    }, null);

    const detail: ResourceBookingDetail = {
      resourceId: resource.id,
      resourceName: resource.name,
      isActive: resource.isActive,
      count: lockedBookings.length,
      holdCount: holdBookings.length,
      paidCount: lockedBookings.length - holdBookings.length,
      remaining: resource.isActive && lockedBookings.length < RESOURCE_BOOKING_RESOURCE_CAPACITY ? 1 : 0,
      isFull: resource.isActive ? lockedBookings.length >= RESOURCE_BOOKING_RESOURCE_CAPACITY : false,
      hasHold: holdBookings.length > 0,
      statusLabel: "",
      statusTone: "neutral",
      bookings,
      earliestHoldExpiresAt,
    };

    return {
      ...detail,
      statusLabel: getResourceStatusLabel(detail),
      statusTone: getResourceStatusTone(detail),
    };
  });
}

export function getBookingSlotTone(count: number, capacity = BOOKING_SLOT_CAPACITY) {
  if (count <= 0) {
    return "neutral" as const;
  }

  if (count >= capacity) {
    return "danger" as const;
  }

  return "success" as const;
}

export function getBookingSlotLabel(count: number, capacity = BOOKING_SLOT_CAPACITY) {
  if (count <= 0) {
    return "Kosong";
  }

  if (count >= capacity) {
    return "Full";
  }

  return `${count} booking`;
}

export function getBookingSlotsForDate(orders: Order[], date?: string | null, excludeOrderId?: string | null, now = new Date(), capacity = BOOKING_SLOT_CAPACITY) {
  const slotMap = new Map<
    string,
    {
      time: string;
      count: number;
      holdCount: number;
      paidCount: number;
    }
  >();
  const normalizedDate = normalizeValue(date);

  if (!normalizedDate) {
    return [];
  }

  const timeGroups = new Map<string, Order[]>();

  orders.forEach((order) => {
    if (excludeOrderId && order.id === excludeOrderId) {
      return;
    }

    if (order.scheduledDate !== normalizedDate || !order.scheduledTime) {
      return;
    }

    const normalizedTime = normalizeValue(order.scheduledTime);
    if (!normalizedTime) {
      return;
    }

    const existingGroup = timeGroups.get(normalizedTime) ?? [];
    existingGroup.push(order);
    timeGroups.set(normalizedTime, existingGroup);
  });

  Array.from(timeGroups.entries()).forEach(([time, groupOrders]) => {
    const representativeDuration = Math.max(
      ...groupOrders.map((order) => getBookingDurationMinutes(order)),
      DEFAULT_BOOKING_DURATION_MINUTES
    );
    const overlappingOrders = getBookingOverlapOrders(orders, normalizedDate, time, representativeDuration, excludeOrderId, now);
    slotMap.set(time, {
      time,
      count: getBookingSlotCount(orders, normalizedDate, time, representativeDuration, excludeOrderId, now),
      holdCount: overlappingOrders.filter((order) => isBookingHoldActive(order, now)).length,
      paidCount: overlappingOrders.filter((order) => !isBookingHoldActive(order, now)).length,
    });
  });

  return Array.from(slotMap.values())
    .map<BookingSlotSummary>((slot) => ({
      ...slot,
      isFull: slot.count >= capacity,
    }))
    .sort((left, right) => left.time.localeCompare(right.time));
}
