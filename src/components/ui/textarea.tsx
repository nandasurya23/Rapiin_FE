import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
 hasError?: boolean;
};

export function Textarea({ className, hasError, ...props }: TextareaProps) {
 return (
  <textarea
   className={cn(
    "min-h-[80px] w-full resize-y px-3.5 py-2.5 text-sm",
    "rounded-[var(--radius-md)]",
    "border border-[var(--color-border)]",
    "bg-[var(--color-surface)]",
    "text-[var(--color-text)]",
    "placeholder:text-[var(--color-text-muted)]",
    "outline-none",
    "transition-all duration-[var(--transition-fast)]",
    "focus:border-[var(--color-border-focus)]",
    "focus:ring-3 focus:ring-[var(--state-focus-ring)]",
    "disabled:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed",
    "disabled:opacity-[var(--state-disabled-opacity)]",
    hasError && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-surface)]",
    className
   )}
   {...props}
  />
 );
}
