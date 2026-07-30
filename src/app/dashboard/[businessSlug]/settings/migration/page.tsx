"use client";

import { useEffect, useState } from "react";
import { useBusiness } from "@/hooks/use-business";
import { migrationService, BusinessMigrationRequestDTO, MigrationRequestStatus } from "@/services/migration.service";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Info, CheckCircle2, XCircle } from "lucide-react";

export default function MigrationDashboardPage() {
  const { business } = useBusiness();
  const [requests, setRequests] = useState<BusinessMigrationRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const data = await migrationService.listOwnerRequests();
        setRequests(data);
      } catch (err) {
        console.error("Failed to load migration requests:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  if (!business) return null;

  const hasActiveRequest = requests.some(r => ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "READY_TO_EXECUTE", "EXECUTING"].includes(r.status));

  const getStatusBadge = (status: MigrationRequestStatus) => {
    switch (status) {
      case "COMPLETED": return <Badge tone="success">Selesai</Badge>;
      case "REJECTED": return <Badge tone="danger">Ditolak</Badge>;
      case "CANCELLED": return <Badge tone="neutral">Dibatalkan</Badge>;
      case "FAILED": return <Badge tone="danger">Gagal</Badge>;
      default: return <Badge tone="warning">Sedang Diproses</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 pt-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Business Migration</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Pusat pengelolaan perubahan model dan arsitektur bisnis Anda.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-[var(--color-primary-surface)] p-3">
            <Info className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Blueprint Bisnis Saat Ini</h2>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Konfigurasi di bawah ini merupakan fondasi utama (Blueprint) dari bisnis Anda yang mengatur perilaku Dashboard, Kalender, Order, Payment, dan Automation. Karena itu, konfigurasi ini tidak dapat diubah secara sepihak untuk mencegah kerusakan data historis.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-elevated)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Business Type</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">{business.mode}</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-elevated)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Booking Model</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">{business.operationalModel}</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-elevated)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Payment Timing</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">{business.paymentTiming}</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-elevated)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Calendar Behavior</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">{business.usesResources ? "Menggunakan Unit/Staf Khusus" : "Tanpa Unit/Staf"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Pengajuan Migrasi</h2>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Ajukan perubahan blueprint jika bisnis Anda berevolusi.
            </p>
          </div>
          <button
            type="button"
            disabled={hasActiveRequest}
            className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-sm font-bold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => alert("Form pengajuan migrasi belum tersedia.")}
          >
            Buat Pengajuan Baru
          </button>
        </div>

        {hasActiveRequest && (
          <div className="mt-4 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-warning-text)] shrink-0" />
            <p className="text-xs text-[var(--color-warning-text)] leading-relaxed">
              Anda memiliki pengajuan migrasi yang sedang diproses. Anda tidak dapat membuat pengajuan baru hingga pengajuan saat ini selesai atau dibatalkan.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Riwayat Migrasi</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Memuat riwayat...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Belum ada riwayat pengajuan migrasi.</div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {requests.map((req) => (
              <div key={req.id} className="p-5 hover:bg-[var(--color-surface-elevated)] transition-colors">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-[var(--color-text-muted)]">#{req.id.split("-")[0]}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-sm font-bold text-[var(--color-text)]">
                      {req.currentConfig?.mode} ➔ {req.requestedConfig?.mode}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-xl line-clamp-2">
                      {req.reason}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2 text-xs text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(req.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {(req.status === "SUBMITTED" || req.status === "DRAFT") && (
                      <button
                        onClick={async () => {
                          if (confirm("Yakin ingin membatalkan pengajuan ini?")) {
                            await migrationService.cancelRequest(req.id);
                            window.location.reload();
                          }
                        }}
                        className="text-[var(--color-danger)] font-bold hover:underline"
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
                {req.adminNotes && (
                  <div className="mt-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
                    <p className="text-xs font-bold text-[var(--color-text)] mb-1">Catatan Review:</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{req.adminNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
