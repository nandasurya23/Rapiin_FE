"use client";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

interface LoginFormFieldsProps {
  touchedFields: Record<string, boolean>;
  fieldErrors: Record<string, string>;
  handleBlur: (name: string, value: string) => void;
  handleChange: (name: string, value: string) => void;
}

export function LoginFormFields({
  touchedFields,
  fieldErrors,
  handleBlur,
  handleChange,
}: LoginFormFieldsProps) {
  return (
    <>
      <label className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
            Email / Nomor HP
          </span>
          {touchedFields.identifier && !fieldErrors.identifier && (
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              ✓ Valid
            </span>
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
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.identifier}
          </span>
        )}
      </label>

      <label className="block">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
            Password
          </span>
        </div>
        <PasswordInput
          name="password"
          placeholder="Masukkan password"
          required
          hasError={touchedFields.password && !!fieldErrors.password}
          onBlur={(e) => handleBlur("password", e.target.value)}
          onChange={(e) => handleChange("password", e.target.value)}
        />
        {touchedFields.password && fieldErrors.password ? (
          <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
            {fieldErrors.password}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">
            Gunakan password yang terdaftar.
          </span>
        )}
      </label>
    </>
  );
}
