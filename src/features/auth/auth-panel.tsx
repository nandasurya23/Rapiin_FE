"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { ROUTES } from "@/lib/routes";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { isValidEmail, isValidEmailOrPhone, isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";
import { cn } from "@/lib/cn";

type AuthPanelProps = {
  mode: "login" | "register" | "forgot-password";
};

const benefits = [
  "Customer dan order tidak berantakan",
  "Follow-up lebih cepat via WhatsApp",
  "Nota dan laporan sederhana siap pakai",
  "Kalender booking bawaan tanpa integrasi lain",
];

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const { auth, login, registerOwner, resetPassword } = useAppData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const emailRaw = String(formData.get("email") ?? "");
    const phoneNumberRaw = String(formData.get("phoneNumber") ?? "");
    const identifierRaw = String(formData.get("identifier") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const identifier = identifierRaw.includes("@") ? identifierRaw.trim().toLowerCase() : normalizePhoneNumber(identifierRaw);
    const email = emailRaw.trim().toLowerCase();
    const phoneNumber = normalizePhoneNumber(phoneNumberRaw);

    if (mode === "register" && !name.trim()) { setError("Nama wajib diisi."); return; }
    if (mode === "register" && !email) { setError("Email wajib diisi."); return; }
    if (mode === "register" && !isValidEmail(email)) { setError("Gunakan email yang valid."); return; }
    if (mode === "register" && !phoneNumber) { setError("Nomor WhatsApp admin wajib diisi."); return; }
    if (mode === "register" && !isValidPhoneNumber(phoneNumber)) { setError("Nomor WhatsApp harus 9-15 digit angka."); return; }
    if (mode !== "register" && !identifier.trim()) { setError("Email / nomor HP wajib diisi."); return; }
    if (mode !== "register" && !isValidEmailOrPhone(identifierRaw)) { setError("Gunakan email yang valid atau nomor HP 9-15 digit."); return; }
    if (password.trim().length < 6) { setError("Password minimal 6 karakter."); return; }
    if (mode === "forgot-password" && password !== confirmPassword) { setError("Konfirmasi password harus sama."); return; }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));

      if (mode === "login") {
        const result = login({ identifier, password });
        if (!result.ok) { setError(result.message); return; }
        toast.success("Berhasil masuk");
        await new Promise((resolve) => setTimeout(resolve, 180));
        if (result.user.role === "SUPER_ADMIN") { router.push(ROUTES.superAdminBusinesses); return; }
        router.push(!auth.onboardingCompleted ? ROUTES.onboarding : ROUTES.dashboard);
        return;
      }

      if (mode === "register") {
        const result = registerOwner({ name: name.trim(), email, phoneNumber, password });
        if (!result.ok) { setError(result.message); return; }
        toast.success("Akun berhasil dibuat");
        await new Promise((resolve) => setTimeout(resolve, 180));
        router.push(ROUTES.onboarding);
        return;
      }

      const result = resetPassword({ identifier, password });
      if (!result.ok) { setError(result.message); return; }
      toast.success("Password berhasil diperbarui");
      await new Promise((resolve) => setTimeout(resolve, 180));
      router.push(ROUTES.login);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL — Brand hero ─────────────────────── */}
      <div
        className={cn(
          "hidden lg:flex lg:flex-col lg:justify-between lg:w-[420px] xl:w-[480px] shrink-0",
          "relative overflow-hidden",
          "bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] px-10 py-12"
        )}
      >
        {/* Decorative background orbs */}
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-1/3 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-16 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center mb-2">
          <Image src="/images/rapiin.png" alt="Rapiin" width={140} height={40} className="h-10 w-auto object-contain brightness-0 invert" priority />
        </div>

        {/* Hero copy */}
        <div className="relative space-y-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 mb-4">
              ✦ Admin bisnis WA-first
            </span>
            <h1 className="text-3xl font-black text-white leading-snug tracking-tight">
              Buku admin online<br />untuk bisnis WhatsApp‑first
            </h1>
            <p className="mt-4 text-white/50 text-sm leading-relaxed">
              Kelola customer, order, follow-up, nota, dan laporan sederhana dari satu tempat —
              tanpa istilah teknis yang bikin bingung.
            </p>
          </div>

          {/* Benefits list */}
          <ul className="space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-amber-300" />
                </div>
                <span className="text-sm text-white/75">{benefit}</span>
              </li>
            ))}
          </ul>


        </div>

        {/* Footer */}
        <p className="relative text-xs text-white/25">© {new Date().getFullYear()} Rapiin. All rights reserved.</p>
      </div>

      {/* ── RIGHT PANEL — Form ─────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-12 bg-[var(--color-background)]">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center mb-8 lg:hidden">
            <Image src="/images/rapiin.png" alt="Rapiin" width={140} height={40} className="h-10 w-auto object-contain dark:brightness-0 dark:invert" priority />
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tight">
              {mode === "login" ? "Masuk ke akun" : mode === "register" ? "Buat akun gratis" : "Atur ulang password"}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed">
              {mode === "login"
                ? "Gunakan akun yang sudah kamu daftarkan."
                : mode === "register"
                  ? "Buat akun dan lanjutkan onboarding bisnis."
                  : "Ganti password akun yang terdaftar di perangkat ini."}
            </p>
          </div>

          {/* Form card */}
          <Card className="border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <CardBody className="space-y-4 p-6">
              <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                {mode === "register" ? (
                  <>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nama Owner</span>
                      <Input name="name" placeholder="Nama kamu" required />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Email</span>
                      <Input name="email" type="email" placeholder="owner@bisnis.com" required />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nomor WhatsApp</span>
                      <Input name="phoneNumber" placeholder="08123456789" required />
                    </label>
                  </>
                ) : null}

                {mode !== "register" ? (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Email / Nomor HP</span>
                    <Input name="identifier" placeholder="contoh@mail.com atau 08123456789" required />
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Password</span>
                  <PasswordInput name="password" placeholder="Masukkan password" required />
                </label>

                {mode === "forgot-password" ? (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Konfirmasi Password Baru</span>
                    <PasswordInput name="confirmPassword" placeholder="Ulangi password baru" required />
                  </label>
                ) : null}

                {error ? (
                  <div className="rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] px-4 py-3 flex items-start gap-2.5">
                    <span className="text-[var(--color-danger)] text-base leading-none mt-0.5">⚠</span>
                    <p className="text-sm text-[var(--color-danger)] leading-relaxed">{error}</p>
                  </div>
                ) : null}

                <Button type="submit" className="w-full h-11 font-bold rounded-xl" isLoading={isSubmitting}>
                  {mode === "login" ? "Masuk ke Akun" : mode === "register" ? "Buat Akun Sekarang" : "Simpan Password Baru"}
                </Button>
              </form>

              {/* Footer links */}
              <div className="flex flex-col items-center gap-2 pt-2 text-sm text-[var(--color-text-muted)]">
                {mode === "login" ? (
                  <LinkButton href={ROUTES.forgotPassword} variant="ghost" className="h-auto px-0 py-0 text-[var(--color-primary)] text-xs font-semibold">
                    Lupa password?
                  </LinkButton>
                ) : null}
                <span className="text-xs">
                  {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                  <LinkButton
                    href={mode === "login" ? ROUTES.register : ROUTES.login}
                    variant="ghost"
                    className="h-auto px-0 py-0 text-[var(--color-primary)] font-bold text-xs"
                  >
                    {mode === "login" ? "Daftar gratis" : "Masuk"}
                  </LinkButton>
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
