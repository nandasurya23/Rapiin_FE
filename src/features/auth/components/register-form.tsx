"use client";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/cn";

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
      <label className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
            Nama Owner
          </span>
          {touchedFields.name && !fieldErrors.name && (
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              ✓ Valid
            </span>
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
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.name}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">
            Nama lengkap penanggung jawab bisnis.
          </span>
        )}
      </label>

      <label className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
            Email
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
          placeholder="owner@bisnis.com"
          required
          hasError={touchedFields.email && !!fieldErrors.email}
          onBlur={(e) => handleBlur("email", e.target.value)}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        {touchedFields.email && fieldErrors.email ? (
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.email}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">
            Digunakan untuk konfirmasi & masuk sistem.
          </span>
        )}
      </label>

      <label className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
            Nomor WhatsApp
          </span>
          {touchedFields.phoneNumber && !fieldErrors.phoneNumber && (
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              ✓ Valid
            </span>
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
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.phoneNumber}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">
            Format: 08123456789 atau 628123456789. Digunakan untuk notifikasi WA.
          </span>
        )}
      </label>

      <label className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
            Password
          </span>
          {touchedFields.password && !fieldErrors.password && (
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              ✓ Valid
            </span>
          )}
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
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.password}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">
            Gunakan password yang kuat (minimal 8 karakter).
          </span>
        )}

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
    </>
  );
}
