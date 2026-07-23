import { Metadata } from "next";
import { SuperAdminAuditLogsPage } from "@/features/super-admin/audit-logs-page";

export const metadata: Metadata = {
  title: "Global Audit Logs | Super Admin",
  description: "Log aktivitas dari semua pengguna bisnis",
};

export default function Page() {
  return <SuperAdminAuditLogsPage />;
}
