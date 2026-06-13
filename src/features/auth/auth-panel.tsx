"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/lib/routes";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { isValidEmail, isValidEmailOrPhone, isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";

type AuthPanelProps = {
  mode: "login" | "register" | "forgot-password";
};

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

    if (mode === "register" && !name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    if (mode === "register" && !email) {
      setError("Email wajib diisi.");
      return;
    }

    if (mode === "register" && !isValidEmail(email)) {
      setError("Gunakan email yang valid.");
      return;
    }

    if (mode === "register" && !phoneNumber) {
      setError("Nomor WhatsApp admin wajib diisi.");
      return;
    }

    if (mode === "register" && !isValidPhoneNumber(phoneNumber)) {
      setError("Nomor WhatsApp harus 9-15 digit angka.");
      return;
    }

    if (mode !== "register" && !identifier.trim()) {
      setError("Email / nomor HP wajib diisi.");
      return;
    }

    if (mode !== "register" && !isValidEmailOrPhone(identifierRaw)) {
      setError("Gunakan email yang valid atau nomor HP 9-15 digit.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (mode === "forgot-password" && password !== confirmPassword) {
      setError("Konfirmasi password harus sama.");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (mode === "login") {
        const result = login({ identifier, password });

        if (!result.ok) {
          setError(result.message);
          return;
        }

        toast.success("Berhasil masuk");
        await new Promise((resolve) => setTimeout(resolve, 180));
        if (result.user.role === "SUPER_ADMIN") {
          router.push(ROUTES.superAdminBusinesses);
          return;
        }

        router.push(!auth.onboardingCompleted ? ROUTES.onboarding : ROUTES.dashboard);
        return;
      }

      if (mode === "register") {
        const result = registerOwner({ name: name.trim(), email, phoneNumber, password });

        if (!result.ok) {
          setError(result.message);
          return;
        }

        toast.success("Akun berhasil dibuat");
        await new Promise((resolve) => setTimeout(resolve, 180));
        router.push(ROUTES.onboarding);
        return;
      }

      const result = resetPassword({ identifier, password });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success("Password berhasil diperbarui");
      await new Promise((resolve) => setTimeout(resolve, 180));
      router.push(ROUTES.login);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-6 text-text-primary">
          <div className="inline-flex w-fit rounded-md border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Buku admin online untuk UMKM WhatsApp-first
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {mode === "login" ? "Masuk ke Rapiin" : mode === "register" ? "Mulai rapiin bisnismu" : "Atur ulang password"}
            </h1>
            <p className="max-w-xl text-base leading-7 text-text-secondary">
              {mode === "forgot-password"
                ? "Masukkan email atau nomor HP yang terdaftar, lalu buat password baru untuk lanjut masuk lagi."
                : "Kelola customer, order, follow-up, nota, dan laporan sederhana dari satu tempat tanpa istilah teknis yang membingungkan."}
            </p>
          </div>
          <Card className="max-w-xl">
            <CardBody className="space-y-3 p-5">
              <p className="text-sm font-medium text-brand-700">Yang kamu dapat</p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Customer dan order tidak berantakan</li>
                <li>• Follow-up lebih cepat via WhatsApp</li>
                <li>• Nota dan laporan sederhana langsung siap</li>
              </ul>
            </CardBody>
          </Card>
        </div>

        <Card className="bg-surface/95">
          <CardBody className="space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">
                {mode === "login" ? "Masuk" : mode === "register" ? "Buat akun" : "Lupa Password"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {mode === "login"
                  ? "Gunakan akun yang sudah kamu daftarkan."
                  : mode === "register"
                    ? "Buat akun gratis dan lanjutkan onboarding bisnis."
                    : "Ganti password akun yang sudah terdaftar di perangkat ini."}
              </p>
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              {mode === "register" ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Nama owner</span>
                    <Input name="name" placeholder="Nama kamu" required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Email</span>
                    <Input name="email" type="email" placeholder="owner@bisnis.com" required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-primary">Nomor WhatsApp admin</span>
                    <Input name="phoneNumber" placeholder="08123456789" required />
                  </label>
                </>
              ) : null}
              {mode !== "register" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-primary">Email / Nomor HP</span>
                  <Input name="identifier" placeholder="contoh@mail.com atau 08123456789" required />
                </label>
              ) : null}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Password</span>
                <PasswordInput name="password" placeholder="Masukkan password" required />
              </label>
              {mode === "forgot-password" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-primary">Konfirmasi password baru</span>
                  <PasswordInput name="confirmPassword" placeholder="Ulangi password baru" required />
                </label>
              ) : null}
              {error ? <p className="text-sm text-status-danger">{error}</p> : null}
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                {mode === "login" ? "Masuk" : mode === "register" ? "Buat Akun" : "Simpan Password Baru"}
              </Button>
            </form>

            <div className="space-y-2 text-center text-sm text-text-secondary">
              {mode === "login" ? (
                <div className="rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-left text-xs text-text-secondary">
                  Demo super admin lokal: <span className="font-medium text-text-primary">superadmin@rapiin.local</span> /{" "}
                  <span className="font-medium text-text-primary">superadmin123</span>
                </div>
              ) : null}
              {mode === "login" ? (
                <div>
                  <LinkButton href={ROUTES.forgotPassword} variant="ghost" className="h-auto px-0 py-0 text-brand-700">
                    Lupa password?
                  </LinkButton>
                </div>
              ) : null}
              <div>
                {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                <LinkButton href={mode === "login" ? ROUTES.register : ROUTES.login} variant="ghost" className="h-auto px-0 py-0 text-brand-700">
                  {mode === "login" ? "Daftar gratis" : "Masuk"}
                </LinkButton>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
