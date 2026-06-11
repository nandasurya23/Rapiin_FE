const idNumberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function formatIndonesianNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "";
  }

  return idNumberFormatter.format(value);
}

export function parseIndonesianNumber(value: string) {
  const cleaned = value.replace(/[^\d]/g, "");

  if (!cleaned) {
    return undefined;
  }

  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function normalizeIndonesianNumberInput(value: string) {
  return value.replace(/[^\d]/g, "");
}
