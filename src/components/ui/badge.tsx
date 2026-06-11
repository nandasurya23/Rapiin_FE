import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import type { StatusTone } from "@/types/common";

const toneStyles: Record<StatusTone, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  success: "bg-green-50 text-green-700 border-green-100",
  danger: "bg-red-50 text-red-700 border-red-100",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium tracking-wide", toneStyles[tone], className)}
      {...props}
    >
      {children}
    </span>
  );
}
