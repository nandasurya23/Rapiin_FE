"use client";

import { Plus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";

const items = [
  { label: "Tambah Customer", href: ROUTES.customers },
  { label: "Tambah Order / Booking", href: ROUTES.orders },
  { label: "Buat Nota", href: ROUTES.invoices },
];

export function QuickAddMenu() {
  const [open, setOpen] = useState(false);
  const { canAccessWriteMode } = useAppData();

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!canAccessWriteMode}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Aksi
        <ChevronDown className="h-4 w-4 text-text-muted" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-30 w-64 rounded-lg border border-border bg-surface p-2 shadow-soft">
          {items.map((item) => (
            <LinkButton
              key={item.href}
              href={item.href}
              variant="ghost"
              className="flex w-full justify-start rounded-md px-3 py-2 text-sm"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </LinkButton>
          ))}
        </div>
      ) : null}
    </div>
  );
}
