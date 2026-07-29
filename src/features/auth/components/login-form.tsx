"use client";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { CheckCircle2 } from "lucide-react";

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
      <label className="block relative">
        <div className="flex justify-between items-center mb-1.5">
          <span className="block text-sm font-bold text-[var(--color-text)]">
            Email / Nomor HP
          </span>
        </div>
        <div className="relative">
          <Input
            name="identifier"
            placeholder="contoh@mail.com atau 08123456789"
            required
            hasError={touchedFields.identifier && !!fieldErrors.identifier}
            onBlur={(e) => handleBlur("identifier", e.target.value)}
            onChange={(e) => handleChange("identifier", e.target.value)}
            className={touchedFields.identifier && !fieldErrors.identifier ? "pr-10" : ""}
          />
          {touchedFields.identifier && !fieldErrors.identifier && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-500 animate-scale-in">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
        </div>
        {touchedFields.identifier && fieldErrors.identifier && (
          <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {fieldErrors.identifier}
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
          hasError={touchedFields.password && !!fieldErrors.password}
          onBlur={(e) => handleBlur("password", e.target.value)}
          onChange={(e) => handleChange("password", e.target.value)}
        />
        {touchedFields.password && fieldErrors.password ? (
          <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {fieldErrors.password}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">
            Gunakan password yang terdaftar.
          </span>
        )}
      </label>
    </>
  );
}
