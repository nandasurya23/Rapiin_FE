import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
        className
      )}
      {...props}
    />
  );
}
