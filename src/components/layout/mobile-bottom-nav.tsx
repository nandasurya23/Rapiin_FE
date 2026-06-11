"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MOBILE_NAV_ITEMS } from "@/lib/constants/navigation";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-surface/96 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "my-2 flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-medium transition-all duration-200",
                active ? "bg-brand-50 text-brand-800" : "text-text-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
