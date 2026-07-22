// src/features/super-admin/reset-requests-page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { Key, Copy, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast-provider";
import { formatDateTime } from "@/lib/format";
import { ApiAdminService, AdminResetRequestRow } from "@/services/admin.service";

export function SuperAdminResetRequestsPage() {
 const toast = useToast();
 const [requests, setRequests] = useState<AdminResetRequestRow[]>([]);
 const [totalItems, setTotalItems] = useState(0);
 const [currentPage, setCurrentPage] = useState(1);
 const [loading, setLoading] = useState(true);
 const pageSize = 10;

 const fetchRequests = useCallback(async () => {
  setLoading(true);
  try {
   const response = await ApiAdminService.fetchResetRequests(currentPage, pageSize);
   if (response && response.data) {
    setRequests(response.data);
    setTotalItems(response.meta?.total ?? 0);
   }
  } catch (err) {
   console.error("Failed to fetch reset requests", err);
  } finally {
   setLoading(false);
  }
 }, [currentPage]);

 useEffect(() => {
  fetchRequests();
 }, [fetchRequests]);

 const handleCopyLink = async (request: AdminResetRequestRow) => {
  let origin = typeof window !== "undefined" ? window.location.origin : "https://app.rapiinusaha.com";
  if (origin.includes("admin.rapiinusaha.com")) {
   origin = origin.replace("admin.rapiinusaha.com", "app.rapiinusaha.com");
  } else if (origin.includes("localhost:3002")) {
   origin = origin.replace("localhost:3002", "localhost:3000");
  }
  const resetUrl = `${origin}/auth/reset-password?email=${encodeURIComponent(request.user.email)}&token=${encodeURIComponent(request.plainToken || "")}`;
  try {
   await navigator.clipboard.writeText(resetUrl);
   toast.success("Link reset password berhasil disalin!");
  } catch {
   toast.error("Gagal menyalin link.");
  }
 };

 const handleSendWhatsApp = (request: AdminResetRequestRow) => {
  let origin = typeof window !== "undefined" ? window.location.origin : "https://app.rapiinusaha.com";
  if (origin.includes("admin.rapiinusaha.com")) {
   origin = origin.replace("admin.rapiinusaha.com", "app.rapiinusaha.com");
  } else if (origin.includes("localhost:3002")) {
   origin = origin.replace("localhost:3002", "localhost:3000");
  }
  const resetUrl = `${origin}/auth/reset-password?email=${encodeURIComponent(request.user.email)}&token=${encodeURIComponent(request.plainToken || "")}`;
  const phone = request.user.phoneNumber || "";
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone;

  const message = `Halo ${request.user.name},\n\nBerikut adalah kode OTP untuk menyetel ulang kata sandi akun Rapiin Anda: *${request.plainToken || ""}*\n\nAtau silakan klik link berikut untuk pengisian otomatis:\n${resetUrl}\n\nKode ini berlaku selama 1 jam. Silakan lakukan pembaruan password Anda.`;
  
  window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
 };

 const handleDelete = async (requestId: string) => {
  try {
   await ApiAdminService.deleteResetRequest(requestId);
   toast.success("Permintaan reset berhasil dihapus.");
   fetchRequests();
  } catch {
   toast.error("Gagal menghapus permintaan reset.");
  }
 };

 return (
  <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
   {/* HERO HEADER */}
   <PageHeader
    variant="hero"
    title="Permintaan Reset Password"
    description="Bantu pengguna yang lupa password secara manual dengan menyalin link reset unik dan kirim via WhatsApp."
    badge={
     <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-warning-text)]">
      <Key className="h-3.5 w-3.5 text-[var(--color-accent-hover)]" />
      Reset Password
     </span>
    }
    statsCard={
     <div className="rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-5 py-3 flex flex-col">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Total Request</p>
      <p className="text-2xl font-black text-[var(--color-text)] mt-0.5">{totalItems}</p>
     </div>
    }
   />

   {/* REQUEST LIST */}
   <section className="space-y-4 animate-fade-up-delay-1">
    {loading ? (
     <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
     </div>
    ) : requests.length ? (
     requests.map((request) => (
      <div key={request.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
       <div className="h-1 w-full bg-amber-400" />
       <div className="space-y-4 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
         <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-[var(--color-text)]">{request.user.name}</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
           Email: <span className="font-semibold">{request.user.email}</span> • WhatsApp: <span className="font-semibold">{request.user.phoneNumber || "-"}</span>
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
           Diminta pada: {formatDateTime(request.createdAt)}
          </p>
         </div>
         
         <div className="flex flex-wrap gap-2 pt-1">
          <Button
           type="button"
           variant="secondary"
           size="sm"
           onClick={() => handleCopyLink(request)}
           className="flex items-center gap-1.5"
          >
           <Copy className="h-4 w-4" />
           Salin Link
          </Button>
          <Button
           type="button"
           variant="primary"
           size="sm"
           onClick={() => handleSendWhatsApp(request)}
           className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
           disabled={!request.user.phoneNumber}
          >
           <MessageSquare className="h-4 w-4" />
           Kirim WhatsApp
          </Button>
          <Button
           type="button"
           variant="danger"
           size="sm"
           onClick={() => handleDelete(request.id)}
           className="flex items-center gap-1.5"
          >
           <Trash2 className="h-4 w-4" />
           Hapus
          </Button>
         </div>
        </div>
       </div>
      </div>
     ))
    ) : (
     <EmptyState
      title="Tidak ada permintaan reset"
      description="Semua permintaan reset password aktif akan muncul di sini."
      icon={<Key className="h-6 w-6" />}
      size="lg"
      dashed
     />
    )}
   </section>

   {/* PAGINATION */}
   {!loading && totalItems > pageSize && (
    <Pagination
     currentPage={currentPage}
     pageSize={pageSize}
     totalItems={totalItems}
     onPageChange={setCurrentPage}
    />
   )}
  </main>
 );
}
