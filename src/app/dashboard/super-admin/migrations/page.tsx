"use client";

import { useEffect, useState } from "react";
import { BusinessMigrationRequestDTO } from "@/services/migration.service";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SuperAdminMigrationsPage() {
  const [requests, setRequests] = useState<BusinessMigrationRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      try {
        // We will need a new API endpoint for Super Admin to fetch all requests.
        // For now, we reuse listOwnerRequests or assume we have a super admin fetcher.
        // Assuming we created a fetcher for super admin in the service.
        const res = await fetch("/api/admin/migrations");
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch (err) {
        console.error("Failed to load all migration requests:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const getRiskBadge = (score: string) => {
    switch (score) {
      case "HIGH": return <Badge tone="danger">High Risk</Badge>;
      case "MEDIUM": return <Badge tone="warning">Medium Risk</Badge>;
      default: return <Badge tone="success">Low Risk</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <Badge tone="success">Selesai</Badge>;
      case "READY_TO_EXECUTE": return <Badge tone="info">Siap Eksekusi</Badge>;
      case "APPROVED": return <Badge tone="success">Disetujui</Badge>;
      case "REJECTED": return <Badge tone="danger">Ditolak</Badge>;
      case "CANCELLED": return <Badge tone="neutral">Dibatalkan</Badge>;
      default: return <Badge tone="warning">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.businessId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 pt-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Migration Management</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Tinjau dan eksekusi pengajuan migrasi model bisnis dari para Owner.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input 
            placeholder="Cari ID Request atau Business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm font-semibold hover:bg-[var(--color-surface-elevated)]">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Business / Request ID</th>
                <th className="px-6 py-4 font-semibold">Perubahan Model</th>
                <th className="px-6 py-4 font-semibold">Risk Level</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                    Tidak ada pengajuan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req: BusinessMigrationRequestDTO & { business?: { name: string } }) => (
                  <tr key={req.id} className="hover:bg-[var(--color-surface-elevated)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[var(--color-text)]">{req.business?.name || req.businessId}</p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">#{req.id.split("-")[0]}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-[var(--color-text-secondary)]">{String(req.currentConfig?.mode || "-")}</span>
                        <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)]" />
                        <span className="text-[var(--color-text)]">{String(req.requestedConfig?.mode || "-")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRiskBadge(req.riskScore)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--color-text-secondary)]">
                      {new Date(req.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => alert("Halaman detail & eksekusi sedang dalam pengembangan.")}
                        className="text-[var(--color-primary)] font-bold text-xs hover:underline"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
