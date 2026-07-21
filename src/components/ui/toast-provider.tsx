"use client";

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
 id: string;
 title: string;
 description?: string;
 tone: ToastTone;
};

type ShowToastInput = {
 title: string;
 description?: string;
 tone?: ToastTone;
};

type ToastContextValue = {
 showToast: (input: ShowToastInput) => void;
 success: (title: string, description?: string) => void;
 error: (title: string, description?: string) => void;
 info: (title: string, description?: string) => void;
 promise: <T>(
  promise: Promise<T>,
  msgs: { loading: string; success: string; error: string }
 ) => Promise<T>;
};

const TOAST_DURATION_MS = 3200;

const ToastContext = createContext<ToastContextValue | null>(null);

function toastIcon(tone: ToastTone) {
 if (tone === "success") {
  return CheckCircle2;
 }

 if (tone === "error") {
  return AlertCircle;
 }

 return Info;
}

function toastStyles(tone: ToastTone) {
 if (tone === "success") {
  return {
   shell: "border-[var(--color-success-border)] bg-white",
   icon: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  };
 }

 if (tone === "error") {
  return {
   shell: "border-[var(--color-danger-border)] bg-white",
   icon: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  };
 }

 return {
  shell: "border-[var(--color-info-border)] bg-white",
  icon: "bg-[var(--color-info-surface)] text-[var(--color-info)]",
 };
}

export function ToastProvider({ children }: { children: ReactNode }) {
 const [toasts, setToasts] = useState<ToastItem[]>([]);

 const dismissToast = useCallback((id: string) => {
  setToasts((current) => current.filter((toast) => toast.id !== id));
 }, []);

 const showToast = useCallback(
  ({ title, description, tone = "info" }: ShowToastInput) => {
   const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
   setToasts((current) => [...current, { id, title, description, tone }]);

   window.setTimeout(() => {
    dismissToast(id);
   }, TOAST_DURATION_MS);
  },
  [dismissToast]
 );

 const promise = useCallback(
  async <T,>(
   prom: Promise<T>,
   msgs: { loading: string; success: string; error: string }
  ) => {
   showToast({ title: msgs.loading, tone: "info" });
   try {
    const result = await prom;
    showToast({ title: msgs.success, tone: "success" });
    return result;
   } catch (err) {
    showToast({ title: msgs.error, tone: "error" });
    throw err;
   }
  },
  [showToast]
 );

 const value = useMemo<ToastContextValue>(
  () => ({
   showToast,
   success: (title, description) => showToast({ title, description, tone: "success" }),
   error: (title, description) => showToast({ title, description, tone: "error" }),
   info: (title, description) => showToast({ title, description, tone: "info" }),
   promise,
  }),
  [showToast, promise]
 );

 return (
  <ToastContext.Provider value={value}>
   {children}
   <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-4 sm:top-5">
    {toasts.map((toast) => {
     const Icon = toastIcon(toast.tone);
     const styles = toastStyles(toast.tone);

     return (
      <div
       key={toast.id}
       className={cn(
        "toast-enter pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3.5 shadow-[0_18px_40px_rgba(31,38,34,0.12)] backdrop-blur sm:w-[360px]",
        styles.shell
       )}
       role="status"
       aria-live="polite"
      >
       <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
         <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 pt-0.5">
         <p className="text-sm font-semibold leading-5 text-[var(--color-text)]">{toast.title}</p>
         {toast.description ? <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">{toast.description}</p> : null}
        </div>
        <button
         type="button"
         onClick={() => dismissToast(toast.id)}
         className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
         aria-label="Tutup notifikasi"
        >
         <X className="h-4 w-4" />
        </button>
       </div>
      </div>
     );
    })}
   </div>
  </ToastContext.Provider>
 );
}

export function useToast() {
 const context = useContext(ToastContext);

 if (!context) {
  throw new Error("useToast must be used within ToastProvider");
 }

 return context;
}
