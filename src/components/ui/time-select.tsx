"use client";

import { useMemo } from "react";
import { Select } from "@/components/ui/select";

type TimeSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  intervalMinutes?: number;
};

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

function buildTimeOptions(intervalMinutes: number) {
  const safeInterval = intervalMinutes > 0 ? intervalMinutes : 15;
  const totalMinutes = 24 * 60;

  return Array.from({ length: Math.floor(totalMinutes / safeInterval) }, (_, index) => {
    const minutesFromStart = index * safeInterval;
    const hours = Math.floor(minutesFromStart / 60);
    const minutes = minutesFromStart % 60;
    const label = `${padTime(hours)}:${padTime(minutes)}`;

    return {
      value: label,
      label,
    };
  });
}

export function TimeSelect({
  value,
  onValueChange,
  placeholder = "Pilih jam",
  disabled,
  intervalMinutes = 15,
}: TimeSelectProps) {
  const options = useMemo(() => buildTimeOptions(intervalMinutes), [intervalMinutes]);

  return (
    <Select
      value={value}
      options={options}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
