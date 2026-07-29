"use client";

import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";

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
    <label className="block relative">
      <div className="flex justify-between items-center mb-1.5">
        <span className="block text-sm font-bold text-[var(--color-text)]">
          Email Terdaftar
        </span>
      </div>
      <div className="relative">
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
          className={touchedFields["request-reset-email"] && !fieldErrors["request-reset-email"] ? "pr-10" : ""}
        />
        {touchedFields["request-reset-email"] && !fieldErrors["request-reset-email"] && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-500 animate-scale-in">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )}
      </div>
      {touchedFields["request-reset-email"] && fieldErrors["request-reset-email"] ? (
        <span className="mt-1.5 block text-xs font-medium text-[var(--color-danger)] animate-fade-in">
          {fieldErrors["request-reset-email"]}
        </span>
      ) : (
        <span className="mt-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">
          Token reset akan dikirim ke email ini.
        </span>
      )}
    </label>
  );
}
