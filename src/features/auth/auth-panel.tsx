"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/lib/routes";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { isValidEmailOrPhone, normalizePhoneNumber } from "@/lib/validation";

type AuthPanelProps = {
  mode: "login" | "register";
};

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const { auth, login, register } = useAppData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const identifierRaw = String(formData.get("identifier") ?? "");
    const password = String(formData.get("password") ?? "");
    const identifier = identifierRaw.includes("@") ? identifierRaw.trim().toLowerCase() : normalizePhoneNumber(identifierRaw);

    if (mode === "register" && !name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    if (!identifier.trim()) {
      setError("Email / nomor HP wajib diisi.");
      return;
    }

    if (!isValidEmailOrPhone(identifierRaw)) {
      setError("Gunakan email yang valid atau nomor HP 9-15 digit.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const result =
        mode === "login"
          ? login({ identifier, password })
          : register({ name: name.trim(), identifier, password });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      toast.success(mode === "login" ? "Berhasil masuk" : "Akun berhasil dibuat");
      await new Promise((resolve) => setTimeout(resolve, 180));
      router.push(mode === "register" || !auth.onboardingCompleted ? ROUTES.onboarding : ROUTES.dashboard);
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
              {mode === "login" ? "Masuk ke Rapiin" : "Mulai rapiin bisnismu"}
            </h1>
            <p className="max-w-xl text-base leading-7 text-text-secondary">
              Kelola customer, order, follow-up, nota, dan laporan sederhana dari satu tempat tanpa istilah teknis yang membingungkan.
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
                {mode === "login" ? "Masuk" : "Buat akun"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {mode === "login"
                  ? "Gunakan akun yang sudah kamu daftarkan."
                  : "Buat akun gratis dan lanjutkan onboarding bisnis."}
              </p>
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              {mode === "register" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-primary">Nama</span>
                  <Input name="name" placeholder="Nama kamu" required />
                </label>
              ) : null}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Email / Nomor HP</span>
                <Input name="identifier" placeholder="contoh@mail.com atau 08123456789" required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Password</span>
                <Input name="password" type="password" placeholder="Masukkan password" required />
              </label>
              {error ? <p className="text-sm text-status-danger">{error}</p> : null}
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                {mode === "login" ? "Masuk" : "Buat Akun"}
              </Button>
            </form>

            <div className="text-center text-sm text-text-secondary">
              {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <LinkButton href={mode === "login" ? ROUTES.register : ROUTES.login} variant="ghost" className="h-auto px-0 py-0 text-brand-700">
                {mode === "login" ? "Daftar gratis" : "Masuk"}
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
