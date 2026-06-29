"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MOBILE_NAV_ITEMS, SUPER_ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";
import { useAppData } from "@/components/providers/app-data-provider";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isSuperAdmin } = useAppData();
  const navItems = isSuperAdmin ? SUPER_ADMIN_NAV_ITEMS : MOBILE_NAV_ITEMS;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 lg:hidden",
        "border-t border-[var(--color-border)]",
        "bg-[var(--color-surface)]/97 backdrop-blur-md",
        "shadow-[0_-4px_16px_rgba(14,37,84,0.07)]"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className={cn(
          "grid px-1 py-1",
          isSuperAdmin ? "grid-cols-2" : "grid-cols-7"
        )}
      >
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5",
                "min-h-[52px] rounded-[var(--radius-md)] px-1 py-2",
                "text-[11px] font-medium",
                "transition-all duration-[var(--transition-fast)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                active
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--state-hover-bg)]"
              )}
            >
              {/* Active top indicator bar */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-b-full bg-[var(--color-primary)]"
                  aria-hidden
                />
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  "transition-all duration-[var(--transition-fast)]",
                  active
                    ? "h-[20px] w-[20px] text-[var(--color-primary)]"
                    : "h-[18px] w-[18px]"
                )}
              />

              {/* Label */}
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
