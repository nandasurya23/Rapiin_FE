"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
  helperText?: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
};

export function Select({
  value,
  options,
  onValueChange,
  placeholder = "Pilih opsi",
  disabled,
  hasError,
  className,
  buttonClassName,
  menuClassName,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-3",
          "rounded-[var(--radius-md)]",
          "border border-[var(--color-border)]",
          "bg-[var(--color-surface)]",
          "px-3.5 text-left text-sm",
          "outline-none transition-all duration-[var(--transition-fast)]",
          "focus:border-[var(--color-border-focus)] focus:ring-3 focus:ring-[var(--state-focus-ring)]",
          "disabled:cursor-not-allowed disabled:bg-[var(--color-surface-elevated)] disabled:opacity-[var(--state-disabled-opacity)]",
          hasError && "border-[var(--color-danger)] focus:ring-[var(--color-danger-surface)]",
          open && "border-[var(--color-border-focus)] ring-3 ring-[var(--state-focus-ring)]",
          buttonClassName
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            selected ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-[var(--transition-fast)]",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open ? (
        <div
          id={menuId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-50 mt-1.5",
            "overflow-hidden rounded-[var(--radius-lg)]",
            "border border-[var(--color-border-strong)]",
            "bg-[var(--color-surface)]",
            "shadow-[var(--shadow-lg)]",
            "animate-slide-down",
            menuClassName
          )}
        >
          <div className="max-h-64 overflow-auto py-1.5">
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  aria-selected={active}
                  role="option"
                  onClick={() => {
                    if (option.disabled) return;
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-3.5 py-2.5 text-left text-sm",
                    "transition-colors duration-[var(--transition-fast)]",
                    active
                      ? "bg-[var(--color-primary-surface)] text-[var(--color-primary)]"
                      : "text-[var(--color-text)] hover:bg-[var(--state-hover-bg)]",
                    option.disabled && "cursor-not-allowed opacity-[var(--state-disabled-opacity)] hover:bg-transparent"
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-medium">{option.label}</div>
                    {option.helperText ? (
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{option.helperText}</p>
                    ) : null}
                  </div>
                  {active ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
