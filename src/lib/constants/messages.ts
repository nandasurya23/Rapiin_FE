import type { MessageCategory } from "@/types/message";

export const MESSAGE_CATEGORY_LABELS: Record<MessageCategory, string> = {
  INQUIRY: "Inquiry",
  BOOKING_ORDER: "Booking / Order",
  PEMBAYARAN: "Pembayaran",
  FOLLOW_UP: "Follow-Up",
  REVIEW: "Review",
  ALAMAT: "Alamat",
  SELESAI: "Selesai",
};

export const MESSAGE_VARIABLES = [
  "{{customer_name}}",
  "{{business_name}}",
  "{{order_title}}",
  "{{scheduled_date}}",
  "{{scheduled_time}}",
  "{{total_amount}}",
  "{{dp_amount}}",
] as const;
