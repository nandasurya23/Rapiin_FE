"use client";

import type { Business } from "@/types/business";
import { AppointmentForm } from "./components/appointment-form";
import { ResourceBookingForm } from "./components/resource-booking-form";
import { CustomOrderForm } from "./components/custom-order-form";

export function PublicOrderForm(props: {
  slug: string;
  initialBusiness?: Business | null;
  onDateChange?: (date: string) => void;
  onAvailabilityChange?: (availability: Record<string, string[]>) => void;
}) {
  const business = props.initialBusiness;

  if (!business) {
    // Parent page (public-business-page.tsx) handles loading and missing business UI
    return null; 
  }

  // Phase 1 Safe Refactor: Routing to polymorphic forms
  if (business.mode === "BOOKING_SERVICE") {
    if (business.operationalModel === "RESOURCE_BOOKING") {
      return <ResourceBookingForm {...props} />;
    }
    return <AppointmentForm {...props} />;
  }

  // PRODUCT_ORDER and CUSTOM_REQUEST
  return <CustomOrderForm {...props} />;
}
