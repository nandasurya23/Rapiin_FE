"use client";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/cn";

interface ResetPasswordFormFieldsProps {
  resetEmail: string;
  tokenValue: string;
  pwdValue: string;
  pwdStrength: { score: number; label: string; color: string };
  touchedFields: Record<string, boolean>;
  fieldErrors: Record<string, string>;
  setResetEmail: (email: string) => void;
  setTokenValue: (token: string) => void;
  setPwdValue: (pwd: string) => void;
  handleBlur: (name: string, value: string) => void;
  handleChange: (name: string, value: string) => void;
}

export function ResetPasswordFormFields({
  resetEmail,
  tokenValue,
  pwdValue,
  pwdStrength,
  touchedFields,
  fieldErrors,
  setResetEmail,
  setTokenValue,
  setPwdValue,
  handleBlur,
  handleChange,
}: ResetPasswordFormFieldsProps) {
  return (
    <>
      <label className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
            Email Akun
          </span>
          {touchedFields.email && !fieldErrors.email && (
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              ✓ Valid
            </span>
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
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.email}
          </span>
        ) : null}
      </label>

      <label className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
            Kode Reset (OTP 6-Digit)
          </span>
          {touchedFields.token && !fieldErrors.token && (
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              ✓ Valid
            </span>
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
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.token}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">
            Masukkan 6 digit kode OTP yang dikirim ke email atau diberikan Admin.
          </span>
        )}
      </label>

      <label className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
            Password Baru
          </span>
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
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.newPassword}
          </span>
        ) : null}

        {pwdValue && (
          <div className="mt-2.5 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              <span>Kekuatan Password:</span>
              <span
                className={cn(
                  pwdStrength.label === "Lemah" && "text-red-500",
                  pwdStrength.label === "Sedang" && "text-amber-500",
                  pwdStrength.label === "Kuat" && "text-emerald-500"
                )}
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

      <label className="block">
        <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
          Konfirmasi Password Baru
        </span>
        <PasswordInput
          name="confirmPassword"
          placeholder="Ulangi password baru"
          required
          hasError={touchedFields.confirmPassword && !!fieldErrors.confirmPassword}
          onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
        />
        {touchedFields.confirmPassword && fieldErrors.confirmPassword ? (
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.confirmPassword}
          </span>
        ) : null}
      </label>
    </>
  );
}
