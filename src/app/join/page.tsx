"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { teamService } from "@/services/team.service";

type InvitationDetails = {
  valid: boolean;
  staffRole: string;
  businessName: string;
  businessSlug: string;
  expiresAt: string;
};

export default function JoinTeamPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const router = useRouter();
  const toast = useToast();
  const resolvedSearchParams = use(searchParams);
  const token = resolvedSearchParams.token;

  const [isValidating, setIsValidating] = useState(true);
  const [inviteData, setInviteData] = useState<InvitationDetails | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError("Token undangan tidak ditemukan. Harap gunakan link undangan yang valid.");
      setIsValidating(false);
      return;
    }

    async function validateToken() {
      try {
        const data = await teamService.validateToken(token!);
        if (data.valid) {
          setInviteData(data);
        } else {
          setValidationError("Undangan tidak valid atau sudah kedaluwarsa.");
        }
      } catch (err) {
        const error = err as Error;
        setValidationError(error.message || "Gagal memverifikasi token undangan.");
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !inviteData) return;

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok", "Harap pastikan konfirmasi password sama dengan password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await teamService.joinTeam({
        token,
        name,
        email,
        phoneNumber,
        password,
      });

      toast.success("Berhasil bergabung!", `Selamat, Anda sekarang aktif sebagai tim di ${inviteData.businessName}`);
      
      // Redirect directly to the business dashboard
      window.location.href = `/dashboard/${inviteData.businessSlug}`;
    } catch (err) {
      const error = err as Error;
      toast.error("Gagal bergabung", error.message || "Terjadi kesalahan saat mendaftar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Memverifikasi undangan Anda...</p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
        <Card className="max-w-md w-full border-red-500/20 shadow-lg animate-fade-up">
          <CardBody className="p-6 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mx-auto">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">Link Undangan Tidak Valid</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {validationError}
            </p>
            <Button
              variant="secondary"
              className="w-full font-bold"
              onClick={() => router.replace("/auth/login")}
            >
              Kembali ke Login
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const isExpired = inviteData ? new Date() > new Date(inviteData.expiresAt) : true;

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
        <Card className="max-w-md w-full border-amber-500/20 shadow-lg animate-fade-up">
          <CardBody className="p-6 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 mx-auto">
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">Undangan Kedaluwarsa</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Masa berlaku undangan gabung ke tim <strong>{inviteData?.businessName}</strong> telah habis (maksimal 72 jam). Silakan minta Pemilik Bisnis mengirimkan tautan undangan baru.
            </p>
            <Button
              variant="secondary"
              className="w-full font-bold"
              onClick={() => router.replace("/auth/login")}
            >
              Kembali ke Login
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const roleLabel = inviteData?.staffRole === "MANAGER" ? "Manajer Operasional" : "Staff / Operator";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <Card className="max-w-lg w-full border-[var(--color-border)] shadow-xl animate-fade-up">
        <CardBody className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Undangan Aktif
            </div>
            <h2 className="text-2xl font-extrabold text-[var(--color-text)] leading-tight">
              Bergabung dengan {inviteData?.businessName}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto leading-relaxed">
              Anda diundang oleh Pemilik Bisnis untuk mengelola operasional sebagai <span className="font-bold text-[var(--color-primary)]">{roleLabel}</span>.
            </p>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 space-y-2.5 text-xs text-[var(--color-text-secondary)]">
            <div className="flex justify-between">
              <span>Bisnis Tujuan</span>
              <span className="font-bold text-[var(--color-text)]">{inviteData?.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span>Hak Akses Anda</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{roleLabel}</span>
            </div>
            <div className="flex justify-between">
              <span>Akses Fitur</span>
              <span className="text-right font-medium max-w-[200px] truncate">
                {inviteData?.staffRole === "MANAGER"
                  ? "Kelola order, pelanggan, & laporan"
                  : "Kelola order pribadi & jadwal"}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Nama Lengkap Anda
              </label>
              <Input
                required
                type="text"
                placeholder="Ahmad Fauzi"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Alamat Email (Untuk Login)
              </label>
              <Input
                required
                type="email"
                placeholder="ahmad@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Nomor WhatsApp Aktif
              </label>
              <Input
                required
                type="tel"
                placeholder="08123456789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Password Baru
                </label>
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Konfirmasi Password
                </label>
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full flex items-center justify-center gap-2 font-bold" isLoading={isSubmitting}>
                <span>Terima Undangan & Buat Akun</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
