"use client";

import { Input } from "@/components/ui/input";

interface ForgotPasswordFormFieldsProps {
  touchedFields: Record<string, boolean>;
  fieldErrors: Record<string, string>;
  handleBlur: (name: string, value: string) => void;
  handleChange: (name: string, value: string) => void;
}

export function ForgotPasswordFormFields({
  touchedFields,
  fieldErrors,
  handleBlur,
  handleChange,
}: ForgotPasswordFormFieldsProps) {
  return (
    <label className="block">
      <div className="flex justify-between items-center mb-1.5">
        <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
          Email Terdaftar
        </span>
        {touchedFields["request-reset-email"] && !fieldErrors["request-reset-email"] && (
          <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
            ✓ Valid
          </span>
        )}
      </div>
      <Input
        name="request-reset-email"
        type="email"
        placeholder="email@bisnis.com"
        required
        hasError={
          touchedFields["request-reset-email"] && !!fieldErrors["request-reset-email"]
        }
        onBlur={(e) => handleBlur("request-reset-email", e.target.value)}
        onChange={(e) => handleChange("request-reset-email", e.target.value)}
      />
      {touchedFields["request-reset-email"] && fieldErrors["request-reset-email"] ? (
        <span className="mt-1.5 block text-xs text-[var(--color-danger)]">
          {fieldErrors["request-reset-email"]}
        </span>
      ) : (
        <span className="mt-1.5 block text-[11px] text-[var(--color-text-muted)]">
          Token reset akan dikirim ke email ini.
        </span>
      )}
    </label>
  );
}
