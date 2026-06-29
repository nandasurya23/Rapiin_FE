import type { PlanCode } from "@/types/subscription";

export type HelperConsoleLimits = {
  planLabel: string;
  maxDailyCommands: number;
  maxHistoryLogs: number;
  allowedActions: string[];
  macrosEnabled: boolean;
  autoExecuteInvoiceEnabled: boolean;
};

export interface HelperConsoleSettings {
  autoFocus: boolean;
  saveHistory: boolean;
  autoCreateInvoice: boolean; // PREMIUM Only
  macrosEnabled: boolean; // PREMIUM Only
}

// Get limits based on subscription plan
export function getHelperConsoleLimits(planCode: PlanCode): HelperConsoleLimits {
  switch (planCode) {
    case "FREE_TRIAL":
      return {
        planLabel: "Free Trial",
        maxDailyCommands: 5,
        maxHistoryLogs: 3,
        allowedActions: ["CREATE_CUSTOMER", "SEARCH", "UNKNOWN"],
        macrosEnabled: false,
        autoExecuteInvoiceEnabled: false,
      };
    case "PRO":
      return {
        planLabel: "Pro",
        maxDailyCommands: 50,
        maxHistoryLogs: 20,
        allowedActions: ["CREATE_CUSTOMER", "CREATE_ORDER", "UPDATE_ORDER_PAYMENT", "UPDATE_ORDER_STATUS", "SEARCH", "UNKNOWN"],
        macrosEnabled: false,
        autoExecuteInvoiceEnabled: false,
      };
    case "PREMIUM":
      return {
        planLabel: "Premium",
        maxDailyCommands: 999999, // unlimited
        maxHistoryLogs: 999999, // unlimited
        allowedActions: ["CREATE_CUSTOMER", "CREATE_ORDER", "UPDATE_ORDER_PAYMENT", "UPDATE_ORDER_STATUS", "CREATE_INVOICE", "SEARCH", "UNKNOWN"],
        macrosEnabled: true,
        autoExecuteInvoiceEnabled: true,
      };
    default:
      return {
        planLabel: "Free Trial",
        maxDailyCommands: 5,
        maxHistoryLogs: 3,
        allowedActions: ["CREATE_CUSTOMER", "SEARCH", "UNKNOWN"],
        macrosEnabled: false,
        autoExecuteInvoiceEnabled: false,
      };
  }
}

const USAGE_KEY = "rapiin_helper_usage";
const SETTINGS_KEY = "rapiin_helper_settings";

interface DailyUsage {
  date: string;
  count: number;
}

// Get daily command usage
export function getDailyCommandUsage(): DailyUsage {
  if (typeof window === "undefined") return { date: "", count: 0 };
  const todayStr = new Date().toISOString().split("T")[0];
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) {
      const parsed: DailyUsage = JSON.parse(raw);
      if (parsed.date === todayStr) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse helper daily usage", e);
  }
  return { date: todayStr, count: 0 };
}

// Check if user is allowed to run more commands today
export function checkDailyCommandLimit(planCode: PlanCode): { allowed: boolean; count: number; max: number } {
  const usage = getDailyCommandUsage();
  const limits = getHelperConsoleLimits(planCode);
  return {
    allowed: usage.count < limits.maxDailyCommands,
    count: usage.count,
    max: limits.maxDailyCommands,
  };
}

// Increment command usage
export function incrementDailyCommandUsage(): void {
  if (typeof window === "undefined") return;
  const usage = getDailyCommandUsage();
  const nextUsage = { date: usage.date, count: usage.count + 1 };
  localStorage.setItem(USAGE_KEY, JSON.stringify(nextUsage));
}

// Get helper console settings
export function getHelperSettings(planCode: PlanCode): HelperConsoleSettings {
  const defaultSettings: HelperConsoleSettings = {
    autoFocus: true,
    saveHistory: true,
    autoCreateInvoice: false,
    macrosEnabled: false,
  };

  if (typeof window === "undefined") return defaultSettings;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const limits = getHelperConsoleLimits(planCode);
      
      return {
        autoFocus: parsed.autoFocus !== undefined ? parsed.autoFocus : defaultSettings.autoFocus,
        saveHistory: parsed.saveHistory !== undefined ? parsed.saveHistory : defaultSettings.saveHistory,
        autoCreateInvoice: limits.autoExecuteInvoiceEnabled ? (parsed.autoCreateInvoice ?? false) : false,
        macrosEnabled: limits.macrosEnabled ? (parsed.macrosEnabled ?? false) : false,
      };
    }
  } catch (e) {
    console.error("Failed to parse helper settings", e);
  }

  return defaultSettings;
}

// Save helper settings
export function saveHelperSettings(settings: HelperConsoleSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
