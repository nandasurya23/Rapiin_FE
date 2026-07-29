"use client";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/cn";
import { CheckCircle2 } from "lucide-react";

interface RegisterFormFieldsProps {
  pwdValue: string;
  pwdStrength: { score: number; label: string; color: string };
  touchedFields: Record<string, boolean>;
  fieldErrors: Record<string, string>;
  handleBlur: (name: string, value: string) => void;
  handleChange: (name: string, value: string) => void;
  setPwdValue: (val: string) => void;
}

export function RegisterFormFields({
  pwdValue,
  pwdStrength,
  touchedFields,
  fieldErrors,
  handleBlur,
  handleChange,
  setPwdValue,
}: RegisterFormFieldsProps) {
  return (
    <>
      <label className="block relative">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-sm font-bold text-[var(--color-text)]">
            Nama Owner
          </span>
        </div>
        <div className="relative">
          <Input
            name="name"
            placeholder="Contoh: Budi Santoso"
            required
            hasError={touchedFields.name && !!fieldErrors.name}
            onBlur={(e) => handleBlur("name", e.target.value)}
            onChange={(e) => handleChange("name", e.target.value)}
            className={touchedFields.name && !fieldErrors.name ? "pr-10" : ""}
          />
          {touchedFields.name && !fieldErrors.name && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-500 animate-scale-in">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
        </div>
        {touchedFields.name && fieldErrors.name ? (
          <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {fieldErrors.name}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">
            Nama lengkap penanggung jawab bisnis.
          </span>
        )}
      </label>

      <label className="block relative">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-sm font-bold text-[var(--color-text)]">
            Email
          </span>
        </div>
        <div className="relative">
          <Input
            name="email"
            type="email"
            placeholder="contoh@mail.com"
            required
            hasError={touchedFields.email && !!fieldErrors.email}
            onBlur={(e) => handleBlur("email", e.target.value)}
            onChange={(e) => handleChange("email", e.target.value)}
            className={touchedFields.email && !fieldErrors.email ? "pr-10" : ""}
          />
          {touchedFields.email && !fieldErrors.email && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-500 animate-scale-in">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
        </div>
        {touchedFields.email && fieldErrors.email ? (
          <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {fieldErrors.email}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">
            Digunakan untuk konfirmasi & masuk sistem.
          </span>
        )}
      </label>

      <label className="block relative">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-sm font-bold text-[var(--color-text)]">
            Nomor WhatsApp
          </span>
        </div>
        <div className="relative">
          <Input
            name="phoneNumber"
            placeholder="Contoh: 0812-xxxx-xxxx"
            required
            hasError={touchedFields.phoneNumber && !!fieldErrors.phoneNumber}
            onBlur={(e) => handleBlur("phoneNumber", e.target.value)}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/[^\d]/g, "");
              handleChange("phoneNumber", e.target.value);
            }}
            className={touchedFields.phoneNumber && !fieldErrors.phoneNumber ? "pr-10" : ""}
          />
          {touchedFields.phoneNumber && !fieldErrors.phoneNumber && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-500 animate-scale-in">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
        </div>
        {touchedFields.phoneNumber && fieldErrors.phoneNumber ? (
          <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {fieldErrors.phoneNumber}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">
            Format: 08123456789 atau 628123456789. Digunakan untuk notifikasi WA.
          </span>
        )}
      </label>

      <label className="block relative">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-sm font-bold text-[var(--color-text)]">
            Password
          </span>
        </div>
        <PasswordInput
          name="password"
          placeholder="Masukkan password"
          required
          value={pwdValue}
          hasError={touchedFields.password && !!fieldErrors.password}
          onBlur={(e) => handleBlur("password", e.target.value)}
          onChange={(e) => {
            setPwdValue(e.target.value);
            handleChange("password", e.target.value);
          }}
        />
        {touchedFields.password && fieldErrors.password ? (
          <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {fieldErrors.password}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">
            Gunakan password yang kuat (minimal 8 karakter).
          </span>
        )}

        {pwdValue && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <div className="flex justify-between items-center text-xs font-bold text-[var(--color-text)]">
              <span>Kekuatan Password:</span>
              <span
                className={cn(
                  pwdStrength.label === "Lemah" && "text-red-500",
                  pwdStrength.label === "Sedang" && "text-amber-500",
                  pwdStrength.label === "Kuat" && "text-emerald-500"
                )}
                aria-live="polite"
              >
                {pwdStrength.label}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden flex gap-0.5">
              <div
                className={cn(
                  "h-full flex-1 transition-all duration-300",
                  pwdStrength.score >= 1 ? pwdStrength.color : "bg-transparent"
                )}
              />
              <div
                className={cn(
                  "h-full flex-1 transition-all duration-300",
                  pwdStrength.score >= 3 ? pwdStrength.color : "bg-transparent"
                )}
              />
              <div
                className={cn(
                  "h-full flex-1 transition-all duration-300",
                  pwdStrength.score >= 5 ? pwdStrength.color : "bg-transparent"
                )}
              />
            </div>
          </div>
        )}
      </label>
    </>
  );
}
