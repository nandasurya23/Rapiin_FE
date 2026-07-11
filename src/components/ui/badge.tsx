import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import type { StatusTone } from "@/types/common";

const toneStyles: Record<StatusTone, string> = {
  info:    "bg-[var(--color-info-surface)]    text-[var(--color-info-text)]    border-[var(--color-info-border)]",
  warning: "bg-[var(--color-warning-surface)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]",
  success: "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border-[var(--color-success-border)]",
  danger:  "bg-[var(--color-danger-surface)]  text-[var(--color-danger-text)]  border-[var(--color-danger-border)]",
  neutral: "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]  border-[var(--color-border)]",
};

type BadgeSizeStyle = "sm" | "md";

const sizeStyles: Record<BadgeSizeStyle, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone;
  size?: BadgeSizeStyle;
  dot?: boolean;
};

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  dot = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border font-medium tracking-wide",
        toneStyles[tone],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full flex-shrink-0",
            tone === "info"    && "bg-[var(--color-info)]",
            tone === "warning" && "bg-[var(--color-warning)]",
            tone === "success" && "bg-[var(--color-success)]",
            tone === "danger"  && "bg-[var(--color-danger)]",
            tone === "neutral" && "bg-[var(--color-text-muted)]"
          )}
        />
      )}
      {children}
    </span>
  );
}
