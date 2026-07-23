"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Activity, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { formatDateTime } from "@/lib/format";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiAdminService } from "@/services/admin.service";

export function SuperAdminAuditLogsPage() {
  const toast = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const pageSize = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiAdminService.fetchAuditLogs(currentPage, pageSize, debouncedSearch);
      if (response && response.data) {
        setLogs(response.data);
        setTotalItems(response.meta?.total ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
      toast.error("Gagal mengambil log aktivitas");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATED") || action.includes("ACCEPTED") || action.includes("LOGIN")) return "success";
    if (action.includes("DELETED") || action.includes("REVOKED") || action.includes("REMOVED") || action.includes("LOGOUT")) return "danger";
    if (action.includes("UPDATED") || action.includes("CHANGED")) return "warning";
    return "neutral";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen lg:overflow-y-auto bg-[var(--color-background)]">
      <div className="p-4 sm:p-6 lg:p-8 pb-24">
        <PageHeader
          title="Global Activity Logs"
          description="Pantau seluruh aktivitas di dalam sistem Rapiin secara real-time untuk keperluan audit dan investigasi."
        />

        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <form onSubmit={handleSearch} className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
              <Input
                placeholder="Cari user, bisnis, atau tipe aksi..."
                className="pl-9 bg-[var(--color-surface)] border-[var(--color-border)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <Button variant="secondary" className="shrink-0 gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--color-navy-900)] text-[var(--color-text-secondary)] uppercase text-xs border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Aktor</th>
                    <th className="px-4 py-3 font-medium">Bisnis</th>
                    <th className="px-4 py-3 font-medium">Aktivitas</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-[var(--color-text-secondary)]">
                        Memuat data logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12">
                        <EmptyState 
                          icon={<Activity className="h-10 w-10 opacity-50" />} 
                          title="Tidak Ada Log" 
                          description="Belum ada aktivitas yang tercatat atau sesuai dengan pencarian Anda." 
                        />
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-secondary)]">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{log.actor?.name || "System"}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">{log.actorRole}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{log.business?.name || "Unknown"}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">#{log.business?.slug || ""}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={getActionBadgeColor(log.actionType)} size="sm">
                            {log.actionType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono text-[var(--color-text-secondary)] break-all max-w-[200px] truncate" title={log.targetId}>
                            {log.targetType}: {log.targetId || "-"}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {!loading && totalItems > pageSize && (
              <div className="p-4 border-t border-[var(--color-border)]">
                <Pagination 
                  currentPage={currentPage}
                  pageSize={50}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
