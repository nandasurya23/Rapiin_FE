import type { ID, Timestamped } from "@/types/common";

export type CustomerStatus = "NEW" | "NEED_FOLLOW_UP" | "DEAL" | "DONE" | "CANCELLED";

export type Customer = Timestamped & {
  id: ID;
  businessId: ID;
  name: string;
  whatsappNumber: string;
  status: CustomerStatus;
  source?: string;
  notes?: string;
  lastInteractionAt?: string;
  lastOrderSummary?: string;
};
