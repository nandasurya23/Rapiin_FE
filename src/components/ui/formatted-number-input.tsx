"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { formatIndonesianNumber, normalizeIndonesianNumberInput } from "@/lib/number";

type FormattedNumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode"> & {
 value: string;
 onValueChange: (value: string) => void;
};

export function FormattedNumberInput({ value, onValueChange, placeholder = "0", ...props }: FormattedNumberInputProps) {
 const normalizedValue = normalizeIndonesianNumberInput(value);
 const displayValue = normalizedValue ? formatIndonesianNumber(Number(normalizedValue)) : "";

 return (
  <Input
   {...props}
   value={displayValue}
   placeholder={placeholder}
   inputMode="numeric"
   onChange={(event) => onValueChange(normalizeIndonesianNumberInput(event.target.value))}
  />
 );
}
