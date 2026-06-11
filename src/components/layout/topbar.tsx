"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, PanelLeftClose, PanelLeftOpen, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { QuickAddMenu } from "@/components/shared/quick-add-menu";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";

type TopbarProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const toast = useToast();
  const { business, logout } = useAppData();

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-surface/90 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">Rapiin command center</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-text-primary">{business.name}</p>
              <span className="inline-flex items-center gap-1 rounded-md border border-brand-100 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-800">
                <Sparkles className="h-3 w-3" />
                WhatsApp-first
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="hidden lg:inline-flex" onClick={onToggleSidebar}>
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              {sidebarCollapsed ? "Buka sidebar" : "Sembunyikan"}
            </Button>
            <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Bell className="h-4 w-4" />
            </Button>
            <QuickAddMenu />
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                logout();
                toast.info("Logout berhasil", "Kamu keluar dari sesi admin.");
                await new Promise((resolve) => setTimeout(resolve, 180));
                router.push(ROUTES.login);
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block lg:max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input placeholder="Cari customer, order, nota, atau template" className="pl-9" />
          </label>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-secondary">
              Hari ini fokus follow-up dan jadwal
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
