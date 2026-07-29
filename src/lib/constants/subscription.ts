import type { PlanCode, PlanDefinition } from "@/types/subscription";

export const TRIAL_DURATION_DAYS = 30;
export const TRIAL_WARNING_DAYS = 5;

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    code: "FREE_TRIAL",
    label: "Free Trial",
    trialDays: TRIAL_DURATION_DAYS,
    customerLimit: 25, // Display limit for landing page
    staffLimit: 1,
    features: ["Dashboard harian", "Customer & order", "Pesan cepat", "Nota sederhana", "Backup manual"],
    requiresManualApproval: false,
    readLimitedAfterExpiry: true,
  },
  {
    code: "PRO",
    label: "Pro",
    customerLimit: 500, // Display limit for landing page
    staffLimit: 15,
    features: ["Limit customer lebih besar", "Riwayat backup", "Restore nanti", "Support prioritas standar"],
    requiresManualApproval: true,
    readLimitedAfterExpiry: false,
  },
  {
    code: "PREMIUM",
    label: "Premium",
    customerLimit: 9999, // Display limit for landing page
    staffLimit: 9999,
    features: ["Limit sangat besar", "Siap multi-admin", "Auto backup nanti", "Support prioritas"],
    requiresManualApproval: true,
    readLimitedAfterExpiry: false,
  },
];

export const PLAN_LABELS: Record<PlanCode, string> = PLAN_DEFINITIONS.reduce(
  (accumulator, plan) => ({ ...accumulator, [plan.code]: plan.label }),
  {} as Record<PlanCode, string>
);

export const PLAN_SELECTION_OPTIONS = PLAN_DEFINITIONS.filter((plan) => plan.code !== "FREE_TRIAL").map((plan) => ({
  value: plan.code,
  label: plan.label,
  helperText: `${plan.customerLimit.toLocaleString("id-ID")} customer`,
}));
