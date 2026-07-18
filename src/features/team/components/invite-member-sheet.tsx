import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Copy, Check, Info } from "lucide-react";
import type { StaffRole } from "@/types/team";
import { teamService } from "@/services/team.service";

interface InviteMemberSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onInvited?: () => void;
  businessName: string;
}

export function InviteMemberSheet({ isOpen, onClose, onInvited, businessName: _businessName }: InviteMemberSheetProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const [label, setLabel] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("STAFF");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    inviteUrl: string;
    whatsappMessage: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const roleOptions = [
    {
      value: "STAFF",
      label: "Staff / Operator",
      helperText: "Hanya dapat melihat jadwal pribadi, tidak bisa akses laporan & pengaturan.",
    },
    {
      value: "MANAGER",
      label: "Manager / Admin",
      helperText: "Bisa mengelola semua order, jadwal & pelanggan. Tidak bisa akses billing & settings.",
    },
  ];

  async function handleGenerateInvite(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await teamService.createInvitation({
        staffRole,
        label: label.trim() || undefined,
        expiresInHours: 72,
      });
      setInviteResult({
        inviteUrl: result.inviteUrl,
        whatsappMessage: result.whatsappMessage,
        expiresAt: result.expiresAt,
      });
      onInvited?.();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Gagal membuat undangan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    if (!inviteResult) return;
    navigator.clipboard.writeText(inviteResult.whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSendWhatsApp() {
    if (!inviteResult) return;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteResult.whatsappMessage)}`;
    window.open(waUrl, "_blank");
  }

  function handleReset() {
    setLabel("");
    setStaffRole("STAFF");
    setInviteResult(null);
    setError(null);
    onClose();
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={handleReset}
      title="Undang Anggota Tim"
      description="Buat link undangan aman untuk staf atau pengelola baru bergabung ke bisnis Anda."
    >
      {!inviteResult ? (
        <form onSubmit={handleGenerateInvite} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Label Undangan (Opsional)
            </label>
            <Input
              type="text"
              placeholder="cth: Untuk Ahmad - Kasir"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              hasError={!!error}
            />
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Label hanya untuk penanda Anda. Tidak ditampilkan ke staf.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Peran Hak Akses *
            </label>
            <Select
              value={staffRole}
              options={roleOptions}
              onValueChange={(val) => setStaffRole(val as StaffRole)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500 font-medium">
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              {isLoading ? "Membuat Undangan..." : "Buat Link Undangan"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs flex gap-3 text-[var(--color-text)]">
            <Info className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Link Undangan Berhasil Dibuat!</p>
              <p className="text-[var(--color-text-secondary)]">
                Kirimkan pesan undangan di bawah kepada staf baru Anda melalui WhatsApp agar mereka bisa membuat akun dan langsung bergabung.
              </p>
              <p className="text-[var(--color-text-muted)] mt-1">
                Link berlaku sampai: {new Date(inviteResult.expiresAt).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Pesan Undangan (Siap Kirim via WA)
            </label>
            <textarea
              readOnly
              rows={7}
              className="w-full p-3.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] outline-none resize-none font-mono"
              value={inviteResult.whatsappMessage}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopy}
              className="flex-1 flex gap-2 items-center"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Salin Pesan</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleSendWhatsApp}
              className="flex-1 flex gap-2 items-center bg-emerald-600 hover:bg-emerald-700 border-none text-white"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Kirim via WA</span>
            </Button>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 text-center">
            <Button type="button" variant="secondary" onClick={handleReset} className="w-full">
              Selesai & Tutup
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
