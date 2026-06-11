import type { ID, Timestamped } from "@/types/common";

export type MessageCategory =
  | "INQUIRY"
  | "BOOKING_ORDER"
  | "PEMBAYARAN"
  | "FOLLOW_UP"
  | "REVIEW"
  | "ALAMAT"
  | "SELESAI";

export type MessageTemplate = Timestamped & {
  id: ID;
  businessId: ID;
  category: MessageCategory;
  title: string;
  content: string;
  variables: string[];
};
