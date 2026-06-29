import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/* ============================================================
   CARD — Base surface container using brand tokens
   ============================================================ */

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
  inset?: boolean;
};

export function Card({ className, hoverable = false, inset = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]",
        inset
          ? "bg-[var(--color-surface-elevated)]"
          : "bg-[var(--color-surface)]",
        hoverable && [
          "cursor-pointer transition-all duration-[var(--transition-base)]",
          "hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]",
          "hover:-translate-y-px",
        ],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-b border-[var(--color-border)] px-5 py-4",
        className
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-5", className)} {...props} />;
}

export function CardSection({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-[var(--color-border)] px-5 py-4",
        className
      )}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-4",
        "rounded-b-[var(--radius-lg)]",
        className
      )}
      {...props}
    />
  );
}
