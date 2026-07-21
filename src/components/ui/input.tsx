import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const baseInputStyles = [
 "h-10 w-full px-3.5 text-sm",
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
 "read-only:bg-[var(--color-surface-elevated)]",
].join(" ");

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
 hasError?: boolean;
};

export function Input({ className, hasError, ...props }: InputProps) {
 return (
  <input
   className={cn(
    baseInputStyles,
    hasError && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-surface)]",
    className
   )}
   {...props}
  />
 );
}
