"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("rapiin-sidebar-collapsed");
    if (stored) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("rapiin-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen overflow-x-hidden lg:flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <Topbar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed((current) => !current)} />
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}
