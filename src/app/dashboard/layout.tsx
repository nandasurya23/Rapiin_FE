import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppDataProvider } from "@/components/providers/app-data-provider";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AppDataProvider>
      <AppShell>{children}</AppShell>
    </AppDataProvider>
  );
}
