"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/* ============================================================
  FILTER CHIP — Unified filter/tab selector component
  Replaces all inline button filter implementations across pages.
  ============================================================ */

type FilterChipOption<T extends string> = {
 value: T;
 label: string;
 count?: number;
 icon?: ReactNode;
};

type FilterChipGroupProps<T extends string> = {
 options: FilterChipOption<T>[];
 value: T;
 onChange: (value: T) => void;
 className?: string;
 size?: "sm" | "md";
};

export function FilterChipGroup<T extends string>({
 options,
 value,
 onChange,
 className,
 size = "md",
}: FilterChipGroupProps<T>) {
 return (
  <div
   className={cn(
    "flex flex-wrap gap-2",
    className
   )}
   role="group"
   aria-label="Filter pilihan"
  >
   {options.map((option) => (
    <FilterChip
     key={option.value}
     active={value === option.value}
     onClick={() => onChange(option.value)}
     size={size}
     count={option.count}
     icon={option.icon}
    >
     {option.label}
    </FilterChip>
   ))}
  </div>
 );
}

type FilterChipProps = {
 children: ReactNode;
 active?: boolean;
 onClick?: () => void;
 className?: string;
 size?: "sm" | "md";
 count?: number;
 icon?: ReactNode;
 disabled?: boolean;
};

export function FilterChip({
 children,
 active = false,
 onClick,
 className,
 size = "md",
 count,
 icon,
 disabled,
}: FilterChipProps) {
 return (
  <button
   type="button"
   onClick={onClick}
   disabled={disabled}
   className={cn(
    // Base
    "inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border font-medium",
    "transition-all duration-[var(--transition-fast)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-[var(--state-disabled-opacity)]",

    // Size
    size === "sm" && "px-3 py-1 text-xs h-7",
    size === "md" && "px-3.5 py-1.5 text-sm h-8",

    // State
    active
     ? [
       "bg-[var(--color-primary)] text-[var(--color-text-inverse)]",
       "border-[var(--color-primary)]",
       "shadow-[var(--shadow-xs)]",
      ]
     : [
       "bg-[var(--color-surface)] text-[var(--color-text-muted)]",
       "border-[var(--color-border)]",
       "hover:bg-[var(--color-primary-surface)]",
       "hover:text-[var(--color-primary)]",
       "hover:border-[var(--color-border-strong)]",
      ],

    className
   )}
  >
   {icon && <span className="shrink-0">{icon}</span>}
   {children}
   {count !== undefined && (
    <span
     className={cn(
      "ml-0.5 inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold",
      active
       ? "bg-white/20 text-white"
       : "bg-[var(--color-primary-surface)] text-[var(--color-primary)]"
     )}
    >
     {count}
    </span>
   )}
  </button>
 );
}
