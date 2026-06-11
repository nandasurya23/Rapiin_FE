import type { CustomerStatus } from "@/types/customer";

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  NEW: "Baru",
  NEED_FOLLOW_UP: "Perlu Follow-Up",
  DEAL: "Deal",
  DONE: "Selesai",
  CANCELLED: "Batal",
};

export const CUSTOMER_FILTER_OPTIONS: Array<{
  value: "ALL" | CustomerStatus;
  label: string;
}> = [
  { value: "ALL", label: "Semua" },
  { value: "NEW", label: "Baru" },
  { value: "NEED_FOLLOW_UP", label: "Perlu Follow-Up" },
  { value: "DEAL", label: "Deal" },
  { value: "DONE", label: "Selesai" },
  { value: "CANCELLED", label: "Batal" },
];
