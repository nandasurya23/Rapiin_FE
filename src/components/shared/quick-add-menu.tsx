"use client";

import { Plus, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";
import { QuickPasteModal } from "@/components/shared/quick-paste-modal";

export function QuickAddMenu() {
 const [open, setOpen] = useState(false);
 const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
 const { canAccessWriteMode, business } = useAppData();
 const rootRef = useRef<HTMLDivElement>(null);

 const items = [
  { label: "Tambah Customer", href: ROUTES.customers(business.slug) },
  { label: "Tambah Order / Booking", href: ROUTES.orders(business.slug) },
  { label: "Buat Nota", href: ROUTES.invoices(business.slug) },
 ];

 useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
   if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
    setOpen(false);
   }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);



 return (
  <div ref={rootRef} className="relative">
   <button
    type="button"
    disabled={!canAccessWriteMode}
    onClick={() => setOpen((v) => !v)}
    className={cn(
     "inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)]",
     "border border-[var(--color-border-strong)]",
     "bg-[var(--color-surface)]",
     "px-3 text-sm font-medium text-[var(--color-text)]",
     "hover:bg-[var(--state-hover-bg)] hover:text-[var(--color-primary)]",
     "transition-colors duration-[var(--transition-fast)]",
     "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
     "disabled:cursor-not-allowed disabled:opacity-[var(--state-disabled-opacity)]"
    )}
   >
    <Plus className="h-4 w-4" />
    <span className="hidden sm:inline">Tambah</span>
    <ChevronDown
     className={cn(
      "h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform duration-[var(--transition-fast)]",
      open && "rotate-180"
     )}
    />
   </button>

   {open ? (
    <div
     className={cn(
      "absolute right-0 top-[calc(100%+6px)] z-50 w-52",
      "rounded-[var(--radius-lg)]",
      "border border-[var(--color-border-strong)]",
      "bg-[var(--color-surface)]",
      " ",
      "py-1.5",
      "animate-slide-down"
     )}
    >
     {items.map((item) => (
      <Link
       key={item.href}
       href={item.href}
       onClick={() => setOpen(false)}
       className={cn(
        "flex w-full items-center px-3.5 py-2.5 text-sm",
        "text-[var(--color-text)]",
        "hover:bg-[var(--state-hover-bg)] hover:text-[var(--color-primary)]",
        "transition-colors duration-[var(--transition-fast)]",
        "focus-visible:outline-none focus-visible:bg-[var(--state-hover-bg)]"
       )}
      >
       {item.label}
      </Link>
     ))}
     <div className="my-1 border-t border-[var(--color-border)]" />
     <button
      type="button"
      onClick={() => {
       setOpen(false);
       setIsPasteModalOpen(true);
      }}
      className={cn(
       "flex w-full items-center px-3.5 py-2.5 text-sm text-left font-medium",
       "text-[var(--color-primary)]",
       "hover:bg-[var(--color-primary-surface)]",
       "transition-colors duration-[var(--transition-fast)]",
       "focus-visible:outline-none focus-visible:bg-[var(--color-primary-surface)]"
      )}
     >
      ⚡ Tempel Chat WA
     </button>
    </div>
   ) : null}

   <QuickPasteModal
    isOpen={isPasteModalOpen}
    onClose={() => setIsPasteModalOpen(false)}
   />
  </div>
 );
}
