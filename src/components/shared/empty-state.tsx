import type { ReactNode } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
 title: string;
 description: string;
 icon?: ReactNode;
 actionLabel?: string;
 actionHref?: string;
 onAction?: () => void;
 size?: "sm" | "md" | "lg";
 dashed?: boolean;
 className?: string;
};

export function EmptyState({
 title,
 description,
 icon,
 actionLabel,
 actionHref,
 onAction,
 size = "md",
 dashed = true,
 className,
}: EmptyStateProps) {
 return (
  <div
   className={cn(
    "flex flex-col items-center justify-center text-center",
    "rounded-[var(--radius-lg)]",
    dashed
     ? "border border-dashed border-[var(--color-border-strong)]"
     : "border border-[var(--color-border)]",
    "bg-[var(--color-surface-elevated)]",
    size === "sm" && "px-4 py-6 gap-3",
    size === "md" && "px-6 py-10 gap-4",
    size === "lg" && "px-8 py-16 gap-5",
    className
   )}
  >
   {/* Icon container */}
   {icon && (
    <div
     className={cn(
      "flex items-center justify-center rounded-full",
      "bg-[var(--color-primary-surface)]",
      size === "sm" && "h-10 w-10",
      size === "md" && "h-12 w-12",
      size === "lg" && "h-16 w-16"
     )}
    >
     <span className="text-[var(--color-primary)]">{icon}</span>
    </div>
   )}

   {/* Text */}
   <div className="max-w-xs">
    <h3
     className={cn(
      "font-semibold text-[var(--color-text)]",
      size === "sm" && "text-sm",
      size === "md" && "text-base",
      size === "lg" && "text-lg"
     )}
    >
     {title}
    </h3>
    <p
     className={cn(
      "mt-1.5 text-[var(--color-text-muted)]",
      size === "sm" && "text-xs",
      size === "md" && "text-sm",
      size === "lg" && "text-base"
     )}
    >
     {description}
    </p>
   </div>

   {/* Action */}
   {actionLabel && (
    actionHref ? (
     <LinkButton href={actionHref} size="sm">
      {actionLabel}
     </LinkButton>
    ) : onAction ? (
     <Button type="button" size="sm" onClick={onAction}>
      {actionLabel}
     </Button>
    ) : (
     <Button type="button" size="sm" disabled>
      {actionLabel}
     </Button>
    )
   )}
  </div>
 );
}
