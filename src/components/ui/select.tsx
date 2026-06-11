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
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
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
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 text-left text-sm text-text-primary outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60",
          buttonClassName
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", selected ? "text-text-primary" : "text-text-muted")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-lg border border-border bg-surface shadow-soft",
            menuClassName
          )}
        >
          <div className="max-h-64 overflow-auto py-1">
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
                    if (option.disabled) {
                      return;
                    }

                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-muted",
                    active ? "bg-brand-50 text-brand-800" : "text-text-primary",
                    option.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-medium">{option.label}</div>
                    {option.helperText ? <p className="mt-1 text-xs text-text-secondary">{option.helperText}</p> : null}
                  </div>
                  {active ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
