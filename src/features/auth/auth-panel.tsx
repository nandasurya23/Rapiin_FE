"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { ROUTES } from "@/lib/routes";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast-provider";
import { useAuth } from "@/hooks/use-auth";
import { isValidEmail, isValidEmailOrPhone, isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";
import { cn } from "@/lib/cn";

/**
 * mode:
 *   "login"          — Login dengan email / nomor HP
 *   "register"       — Daftar akun baru (owner)
 *   "request-reset"  — Step 1: Kirim email untuk request link reset password
 *   "reset-password" — Step 2: Gunakan token dari email untuk set password baru
 */
type AuthPanelProps = {
  mode: "login" | "register" | "request-reset" | "reset-password";
  /** Token dari URL query param untuk mode "reset-password" */
  resetToken?: string;
  initialEmail?: string;
  roleFilter?: "OWNER" | "SUPER_ADMIN";
};

const benefits = [
  "Customer dan order tidak berantakan",
  "Follow-up lebih cepat via WhatsApp",
  "Nota dan laporan sederhana siap pakai",
  "Kalender booking bawaan tanpa integrasi lain",
];

export function AuthPanel({ mode, resetToken = "", initialEmail = "", roleFilter = "OWNER" }: AuthPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const { currentUser, login, registerOwner, requestForgotPassword, resetPassword, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pwdValue, setPwdValue] = useState("");
  // For request-reset: show success state after sending email
  const [requestResetSent, setRequestResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState(initialEmail);
  const [tokenValue, setTokenValue] = useState(resetToken);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "SUPER_ADMIN") {
        router.replace(ROUTES.superAdminBusinesses);
      } else {
        router.replace("/dashboard");
      }
    }
  }, [currentUser, router]);

  // Local state for inline validation errors and touch state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  function handleBlur(name: string, value: string) {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  }

  function handleChange(name: string, value: string) {
    if (touchedFields[name]) {
      validateField(name, value);
    }
  }

  function validateField(name: string, value: string): boolean {
    let err = "";
    if (name === "name") {
      if (!value.trim()) err = "Nama lengkap wajib diisi.";
      else if (value.trim().length < 2) err = "Nama lengkap minimal 2 karakter.";
    } else if (name === "email") {
      if (!value.trim()) err = "Alamat email wajib diisi.";
      else if (!isValidEmail(value)) err = "Format email tidak valid (contoh: nama@bisnis.com).";
    } else if (name === "request-reset-email") {
      if (!value.trim()) err = "Alamat email wajib diisi.";
      else if (!isValidEmail(value)) err = "Format email tidak valid.";
    } else if (name === "phoneNumber") {
      const num = normalizePhoneNumber(value);
      if (!value.trim()) err = "Nomor WhatsApp wajib diisi.";
      else if (!isValidPhoneNumber(num)) err = "Nomor WhatsApp tidak valid (contoh: 08123456789).";
    } else if (name === "password") {
      if (!value) err = "Password wajib diisi.";
      // Sync dengan BE: minimal 8 karakter
      else if (value.length < 8) err = "Password minimal 8 karakter.";
    } else if (name === "newPassword") {
      if (!value) err = "Password baru wajib diisi.";
      else if (value.length < 8) err = "Password minimal 8 karakter.";
    } else if (name === "identifier") {
      if (!value.trim()) err = "Email atau nomor HP wajib diisi.";
      else if (!isValidEmailOrPhone(value)) err = "Format tidak valid. Gunakan email atau nomor HP.";
    } else if (name === "token") {
      if (!value.trim()) err = "Kode reset password wajib diisi.";
      else if (value.trim().length !== 6) err = "Kode reset harus berupa 6 digit angka.";
    } else if (name === "confirmPassword") {
      if (!value) err = "Ulangi password baru.";
      else if (value !== pwdValue) err = "Konfirmasi password tidak cocok.";
    }
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
    return !err;
  }

  function getPasswordStrength(val: string): { score: number; label: string; color: string } {
    if (!val) return { score: 0, label: "", color: "bg-gray-200" };
    let score = 0;
    if (val.length >= 8) score += 1;
    if (val.length >= 12) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;

    if (score <= 2) return { score, label: "Lemah", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Sedang", color: "bg-amber-500" };
    return { score, label: "Kuat", color: "bg-emerald-500" };
  }

  const pwdStrength = getPasswordStrength(pwdValue);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);

    // ── LOGIN ──────────────────────────────────────────────────────────────
    if (mode === "login") {
      const identifierRaw = String(formData.get("identifier") ?? "");
      const password = String(formData.get("password") ?? "");
      // Normalize: email → lowercase; phone → digits only
      const identifier = identifierRaw.includes("@")
        ? identifierRaw.trim().toLowerCase()
        : normalizePhoneNumber(identifierRaw);

      const newTouched: Record<string, boolean> = {};
      let isValid = true;
      for (const n of ["identifier", "password"]) {
        newTouched[n] = true;
        isValid = validateField(n, n === "identifier" ? identifierRaw : password) && isValid;
      }
      setTouchedFields(newTouched);
      if (!isValid) { setError("Harap lengkapi semua input dengan format yang benar."); return; }

      setIsSubmitting(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const result = await login(identifier, password);
        if (!result.ok) { setError(result.message); return; }

        if (roleFilter === "SUPER_ADMIN" && result.user.role !== "SUPER_ADMIN") {
          setError("Akun ini tidak memiliki akses Super Admin. Silakan gunakan portal Owner.");
          await logout();
          return;
        }
        if (roleFilter === "OWNER" && result.user.role === "SUPER_ADMIN") {
          setError("Akun ini tidak memiliki akses Owner. Silakan gunakan portal Super Admin.");
          await logout();
          return;
        }

        toast.success("Berhasil masuk");
        await new Promise((resolve) => setTimeout(resolve, 180));
        if (result.user.role === "SUPER_ADMIN") { router.push(ROUTES.superAdminBusinesses); return; }
        const onboardingCompleted = result.user.onboardingCompleted ?? false;
        router.push(!onboardingCompleted ? ROUTES.onboarding : "/dashboard");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── REGISTER ───────────────────────────────────────────────────────────
    if (mode === "register") {
      const name = String(formData.get("name") ?? "");
      const emailRaw = String(formData.get("email") ?? "");
      const phoneNumberRaw = String(formData.get("phoneNumber") ?? "");
      const password = String(formData.get("password") ?? "");
      const email = emailRaw.trim().toLowerCase();
      const phoneNumber = normalizePhoneNumber(phoneNumberRaw);

      const newTouched: Record<string, boolean> = {};
      let isValid = true;
      const fieldValues: Record<string, string> = { name, email, phoneNumber: phoneNumberRaw, password };
      for (const n of ["name", "email", "phoneNumber", "password"]) {
        newTouched[n] = true;
        isValid = validateField(n, fieldValues[n]) && isValid;
      }
      setTouchedFields(newTouched);
      if (!isValid) { setError("Harap lengkapi semua input dengan format yang benar."); return; }

      setIsSubmitting(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const result = await registerOwner({ name: name.trim(), email, phoneNumber, password });
        if (!result.ok) { setError(result.message); return; }
        toast.success("Akun berhasil dibuat! Silakan melengkapi setup bisnis.");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        router.push(ROUTES.onboarding);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── REQUEST RESET (Step 1 — kirim email) ──────────────────────────────
    if (mode === "request-reset") {
      const emailRaw = String(formData.get("request-reset-email") ?? "");
      const email = emailRaw.trim().toLowerCase();

      setTouchedFields({ "request-reset-email": true });
      if (!validateField("request-reset-email", emailRaw)) {
        setError("Masukkan email yang valid.");
        return;
      }

      setIsSubmitting(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const result = await requestForgotPassword(email);
        if (!result.ok) { setError(result.message); return; }
        setResetEmail(email);
        setRequestResetSent(true);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── RESET PASSWORD (Step 2 — gunakan token/OTP) ───────────────────────────
    if (mode === "reset-password") {
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      const token = String(formData.get("token") ?? "").trim();
      const newPassword = String(formData.get("newPassword") ?? "");
      const confirmPassword = String(formData.get("confirmPassword") ?? "");

      const newTouched: Record<string, boolean> = { email: true, token: true, newPassword: true, confirmPassword: true };
      let isValid = true;
      isValid = validateField("email", email) && isValid;
      isValid = validateField("token", token) && isValid;
      isValid = validateField("newPassword", newPassword) && isValid;
      isValid = validateField("confirmPassword", confirmPassword) && isValid;
      setTouchedFields(newTouched);
      if (!isValid) { setError("Harap lengkapi semua input dengan benar."); return; }

      setIsSubmitting(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const result = await resetPassword(email, token, newPassword);
        if (!result.ok) { setError(result.message); return; }
        toast.success("Password berhasil diperbarui! Silakan login kembali.");
        await new Promise((resolve) => setTimeout(resolve, 180));
        router.push(ROUTES.login);
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // ── Heading & sub-copy per mode ──────────────────────────────────────────
  const headingMap = {
    login: "Masuk ke akun",
    register: "Buat akun gratis",
    "request-reset": "Lupa password?",
    "reset-password": "Buat password baru",
  };

  const subCopyMap = {
    login: "Gunakan akun yang sudah kamu daftarkan.",
    register: "Buat akun dan dapatkan akses buku admin WA-first.",
    "request-reset": "Masukkan email yang terdaftar. Admin akan mengirimkan kode OTP 6-digit via WhatsApp.",
    "reset-password": "Masukkan email akun dan kode OTP 6-digit yang kamu terima dari Admin, lalu buat password baru.",
  };

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
              {headingMap[mode]}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed">
              {subCopyMap[mode]}
            </p>
          </div>

          {/* ── SUCCESS STATE: request-reset sent ── */}
          {mode === "request-reset" && requestResetSent ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Permintaan Terdaftar!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Permintaan reset password berhasil dikirim. Admin akan segera menghubungi kamu via WhatsApp dengan kode OTP 6-digit.
                    </p>
                  </div>
                </div>

                {/* Langkah selanjutnya */}
                <div className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] p-4 space-y-2.5">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Langkah Selanjutnya:</p>
                  <ol className="space-y-1.5 text-xs text-[var(--color-text-secondary)] list-none">
                    <li className="flex items-start gap-2"><span className="flex-shrink-0 font-bold text-[var(--color-primary)]">1.</span>Tunggu Admin mengirim kode OTP 6-digit via WhatsApp</li>
                    <li className="flex items-start gap-2"><span className="flex-shrink-0 font-bold text-[var(--color-primary)]">2.</span>Buka halaman reset password di bawah ini</li>
                    <li className="flex items-start gap-2"><span className="flex-shrink-0 font-bold text-[var(--color-primary)]">3.</span>Masukkan email + kode OTP + password baru</li>
                  </ol>
                </div>

                <a
                  href={`https://wa.me/628123456789?text=Halo%20Admin%20Rapiin%2C%20saya%20meminta%20bantuan%20reset%20password%20untuk%20akun%20saya%20dengan%20email%3A%20${encodeURIComponent(resetEmail)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm py-3 transition-colors "
                >
                  Hubungi Admin via WhatsApp
                </a>

                <LinkButton href={ROUTES.resetPassword} variant="ghost" className="w-full h-10 text-sm font-semibold">
                  Sudah punya kode? Reset Password →
                </LinkButton>

                <LinkButton href={ROUTES.login} variant="ghost" className="w-full h-10 text-sm font-semibold">
                  ← Kembali ke halaman login
                </LinkButton>
              </div>
            </div>
          ) : (
            /* ── FORM CARD ── */
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ">
              <div className="space-y-4 p-6">
                <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>

                  {/* ─── REGISTER FIELDS ─── */}
                  {mode === "register" ? (
                    <>
                      <label className="block">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nama Owner</span>
                          {touchedFields.name && !fieldErrors.name && (
                            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">✓ Valid</span>
                          )}
                        </div>
                        <Input
                          name="name"
                          placeholder="Nama kamu"
                          required
                          hasError={touchedFields.name && !!fieldErrors.name}
                          onBlur={(e) => handleBlur("name", e.target.value)}
                          onChange={(e) => handleChange("name", e.target.value)}
                        />
                        {touchedFields.name && fieldErrors.name ? (
                          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors.name}</span>
                        ) : (
                          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">Nama lengkap penanggung jawab bisnis.</span>
                        )}
                      </label>
                      <label className="block">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Email</span>
                          {touchedFields.email && !fieldErrors.email && (
                            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">✓ Valid</span>
                          )}
                        </div>
                        <Input
                          name="email"
                          type="email"
                          placeholder="owner@bisnis.com"
                          required
                          hasError={touchedFields.email && !!fieldErrors.email}
                          onBlur={(e) => handleBlur("email", e.target.value)}
                          onChange={(e) => handleChange("email", e.target.value)}
                        />
                        {touchedFields.email && fieldErrors.email ? (
                          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors.email}</span>
                        ) : (
                          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">Digunakan untuk konfirmasi & masuk sistem.</span>
                        )}
                      </label>
                      <label className="block">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nomor WhatsApp</span>
                          {touchedFields.phoneNumber && !fieldErrors.phoneNumber && (
                            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">✓ Valid</span>
                          )}
                        </div>
                        <Input
                          name="phoneNumber"
                          placeholder="08123456789"
                          required
                          hasError={touchedFields.phoneNumber && !!fieldErrors.phoneNumber}
                          onBlur={(e) => handleBlur("phoneNumber", e.target.value)}
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/[^\d]/g, "");
                            handleChange("phoneNumber", e.target.value);
                          }}
                        />
                        {touchedFields.phoneNumber && fieldErrors.phoneNumber ? (
                          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors.phoneNumber}</span>
                        ) : (
                          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">Format: 08123456789 atau 628123456789. Digunakan untuk notifikasi WA.</span>
                        )}
                      </label>
                    </>
                  ) : null}

                  {/* ─── LOGIN: identifier field ─── */}
                  {mode === "login" ? (
                    <label className="block">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Email / Nomor HP</span>
                        {touchedFields.identifier && !fieldErrors.identifier && (
                          <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">✓ Valid</span>
                        )}
                      </div>
                      <Input
                        name="identifier"
                        placeholder="contoh@mail.com atau 08123456789"
                        required
                        hasError={touchedFields.identifier && !!fieldErrors.identifier}
                        onBlur={(e) => handleBlur("identifier", e.target.value)}
                        onChange={(e) => handleChange("identifier", e.target.value)}
                      />
                      {touchedFields.identifier && fieldErrors.identifier && (
                        <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors.identifier}</span>
                      )}
                    </label>
                  ) : null}

                  {/* ─── REQUEST-RESET: email field ─── */}
                  {mode === "request-reset" ? (
                    <label className="block">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Email Terdaftar</span>
                        {touchedFields["request-reset-email"] && !fieldErrors["request-reset-email"] && (
                          <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">✓ Valid</span>
                        )}
                      </div>
                      <Input
                        name="request-reset-email"
                        type="email"
                        placeholder="email@bisnis.com"
                        required
                        hasError={touchedFields["request-reset-email"] && !!fieldErrors["request-reset-email"]}
                        onBlur={(e) => handleBlur("request-reset-email", e.target.value)}
                        onChange={(e) => handleChange("request-reset-email", e.target.value)}
                      />
                      {touchedFields["request-reset-email"] && fieldErrors["request-reset-email"] ? (
                        <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors["request-reset-email"]}</span>
                      ) : (
                        <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">Token reset akan dikirim ke email ini.</span>
                      )}
                    </label>
                  ) : null}

                  {/* ─── RESET-PASSWORD: email + OTP + new password ─── */}
                  {mode === "reset-password" ? (
                    <>
                      <label className="block">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Email Akun</span>
                          {touchedFields.email && !fieldErrors.email && (
                            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">✓ Valid</span>
                          )}
                        </div>
                        <Input
                          name="email"
                          type="email"
                          placeholder="email@bisnis.com"
                          required
                          value={resetEmail}
                          hasError={touchedFields.email && !!fieldErrors.email}
                          onBlur={(e) => handleBlur("email", e.target.value)}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            handleChange("email", e.target.value);
                          }}
                        />
                        {touchedFields.email && fieldErrors.email ? (
                          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors.email}</span>
                        ) : null}
                      </label>

                      <label className="block">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Kode Reset (OTP 6-Digit)</span>
                          {touchedFields.token && !fieldErrors.token && (
                            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">✓ Valid</span>
                          )}
                        </div>
                        <Input
                          name="token"
                          type="text"
                          maxLength={6}
                          placeholder="Contoh: 123456"
                          required
                          value={tokenValue}
                          hasError={touchedFields.token && !!fieldErrors.token}
                          onBlur={(e) => handleBlur("token", e.target.value)}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setTokenValue(val);
                            handleChange("token", val);
                          }}
                        />
                        {touchedFields.token && fieldErrors.token ? (
                          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors.token}</span>
                        ) : (
                          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">Masukkan 6 digit kode OTP yang dikirim ke email atau diberikan Admin.</span>
                        )}
                      </label>

                      <label className="block">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Password Baru</span>
                        </div>
                        <PasswordInput
                          name="newPassword"
                          placeholder="Password baru (min. 8 karakter)"
                          required
                          value={pwdValue}
                          hasError={touchedFields.newPassword && !!fieldErrors.newPassword}
                          onBlur={(e) => handleBlur("newPassword", e.target.value)}
                          onChange={(e) => {
                            setPwdValue(e.target.value);
                            handleChange("newPassword", e.target.value);
                          }}
                        />
                        {touchedFields.newPassword && fieldErrors.newPassword ? (
                          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors.newPassword}</span>
                        ) : null}

                        {pwdValue && (
                          <div className="mt-2.5 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                              <span>Kekuatan Password:</span>
                              <span className={cn(
                                pwdStrength.label === "Lemah" && "text-red-500",
                                pwdStrength.label === "Sedang" && "text-amber-500",
                                pwdStrength.label === "Kuat" && "text-emerald-500"
                              )}>
                                {pwdStrength.label}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden flex gap-0.5">
                              <div className={cn("h-full flex-1 transition-all duration-300", pwdStrength.score >= 1 ? pwdStrength.color : "bg-transparent")} />
                              <div className={cn("h-full flex-1 transition-all duration-300", pwdStrength.score >= 3 ? pwdStrength.color : "bg-transparent")} />
                              <div className={cn("h-full flex-1 transition-all duration-300", pwdStrength.score >= 5 ? pwdStrength.color : "bg-transparent")} />
                            </div>
                          </div>
                        )}
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Konfirmasi Password Baru</span>
                        <PasswordInput
                          name="confirmPassword"
                          placeholder="Ulangi password baru"
                          required
                          hasError={touchedFields.confirmPassword && !!fieldErrors.confirmPassword}
                          onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                          onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        />
                        {touchedFields.confirmPassword && fieldErrors.confirmPassword ? (
                          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors.confirmPassword}</span>
                        ) : null}
                      </label>
                    </>
                  ) : null}

                  {/* ─── PASSWORD field (login & register only) ─── */}
                  {(mode === "login" || mode === "register") ? (
                    <label className="block">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Password</span>
                        {mode === "register" && touchedFields.password && !fieldErrors.password && (
                          <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">✓ Valid</span>
                        )}
                      </div>
                      <PasswordInput
                        name="password"
                        placeholder="Masukkan password"
                        required
                        value={mode === "register" ? pwdValue : undefined}
                        hasError={touchedFields.password && !!fieldErrors.password}
                        onBlur={(e) => handleBlur("password", e.target.value)}
                        onChange={(e) => {
                          if (mode === "register") setPwdValue(e.target.value);
                          handleChange("password", e.target.value);
                        }}
                      />
                      {touchedFields.password && fieldErrors.password ? (
                        <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{fieldErrors.password}</span>
                      ) : (
                        <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">Gunakan password yang kuat (minimal 8 karakter).</span>
                      )}

                      {mode === "register" && pwdValue && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                            <span>Kekuatan Password:</span>
                            <span className={cn(
                              pwdStrength.label === "Lemah" && "text-red-500",
                              pwdStrength.label === "Sedang" && "text-amber-500",
                              pwdStrength.label === "Kuat" && "text-emerald-500"
                            )}>
                              {pwdStrength.label}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden flex gap-0.5">
                            <div className={cn("h-full flex-1 transition-all duration-300", pwdStrength.score >= 1 ? pwdStrength.color : "bg-transparent")} />
                            <div className={cn("h-full flex-1 transition-all duration-300", pwdStrength.score >= 3 ? pwdStrength.color : "bg-transparent")} />
                            <div className={cn("h-full flex-1 transition-all duration-300", pwdStrength.score >= 5 ? pwdStrength.color : "bg-transparent")} />
                          </div>
                        </div>
                      )}
                    </label>
                  ) : null}

                  {/* ─── ERROR BANNER ─── */}
                  {error ? (
                    <div className="rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] px-4 py-3 flex items-start gap-2.5">
                      <span className="text-[var(--color-danger)] text-base leading-none mt-0.5">⚠</span>
                      <p className="text-sm text-[var(--color-danger)] leading-relaxed">{error}</p>
                    </div>
                  ) : null}

                  <Button type="submit" className="w-full h-11 font-bold rounded-xl" isLoading={isSubmitting}>
                    {mode === "login" ? "Masuk ke Akun"
                      : mode === "register" ? "Buat Akun Sekarang"
                      : mode === "request-reset" ? "Kirim Instruksi Reset"
                      : "Simpan Password Baru"}
                  </Button>
                </form>

                {/* Footer links */}
                {roleFilter !== "SUPER_ADMIN" ? (
                  <div className="flex flex-col items-center gap-2 pt-2 text-sm text-[var(--color-text-muted)]">
                    {mode === "login" ? (
                      <LinkButton href={ROUTES.forgotPassword} variant="ghost" className="h-auto px-0 py-0 text-[var(--color-primary)] text-xs font-semibold">
                        Lupa password?
                      </LinkButton>
                    ) : null}
                    {(mode === "request-reset" || mode === "reset-password") ? (
                      <LinkButton href={ROUTES.login} variant="ghost" className="h-auto px-0 py-0 text-[var(--color-text-muted)] text-xs">
                        ← Kembali ke login
                      </LinkButton>
                    ) : null}
                    {(mode === "login" || mode === "register") ? (
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
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
