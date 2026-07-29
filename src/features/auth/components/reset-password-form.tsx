"use client";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/cn";
import { CheckCircle2 } from "lucide-react";

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
      <label className="block relative">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-sm font-bold text-[var(--color-text)]">
            Email Akun
          </span>
        </div>
        <div className="relative">
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
        ) : null}
      </label>

      <div className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-sm font-bold text-[var(--color-text)]">
            Kode Reset (OTP 6-Digit)
          </span>
          {touchedFields.token && !fieldErrors.token && (
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 animate-scale-in">
              <CheckCircle2 className="h-3 w-3" /> Valid
            </span>
          )}
        </div>
        
        <div className="flex gap-2 justify-between">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const otpArray = tokenValue.split("").concat(Array(6).fill("")).slice(0, 6);
            return (
              <input
                key={index}
                id={`otp-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otpArray[index] || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  const newOtp = [...otpArray];
                  newOtp[index] = val;
                  const joined = newOtp.join("").slice(0, 6);
                  setTokenValue(joined);
                  handleChange("token", joined);
                  if (val && index < 5) {
                    document.getElementById(`otp-input-${index + 1}`)?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otpArray[index] && index > 0) {
                    document.getElementById(`otp-input-${index - 1}`)?.focus();
                  }
                }}
                onBlur={() => handleBlur("token", tokenValue)}
                className={cn(
                  "w-12 h-14 text-center text-xl font-black rounded-xl border bg-[var(--color-surface)] text-[var(--color-text)] transition-all",
                  "focus:border-[var(--color-border-focus)] focus:ring-3 focus:ring-[var(--state-focus-ring)] outline-none",
                  touchedFields.token && fieldErrors.token ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                )}
              />
            );
          })}
        </div>
        <input type="hidden" name="token" value={tokenValue} />
        
        {touchedFields.token && fieldErrors.token ? (
          <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {fieldErrors.token}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">
            Masukkan 6 digit kode OTP yang dikirim ke email atau diberikan Admin.
          </span>
        )}
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent my-2"></div>

      <label className="block relative">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-sm font-bold text-[var(--color-text)]">
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
          <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {fieldErrors.newPassword}
          </span>
        ) : null}

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

      <label className="block relative">
        <span className="block text-sm font-bold text-[var(--color-text)] mb-1.5">
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
          <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {fieldErrors.confirmPassword}
          </span>
        ) : null}
      </label>
    </>
  );
}
