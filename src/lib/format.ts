const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

const relativeFormatter = new Intl.RelativeTimeFormat("id-ID", {
  numeric: "auto",
});

function parseDateValue(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return rupiahFormatter.format(value);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return shortDateFormatter.format(date);
}

export function formatLongDate(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return longDateFormatter.format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return dateTimeFormatter.format(date);
}

export function formatRelativeDate(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const diffDays = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "hari ini";
  }

  return relativeFormatter.format(diffDays, "day");
}

export function formatPhoneNumber(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");

  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  const normalized = cleaned.startsWith("0") ? `62${cleaned.slice(1)}` : cleaned;
  return `+${normalized}`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${value}%`;
}

export function formatRupiahInput(value: string): string {
  const numericValue = value.replace(/[^\d]/g, "");
  if (/^\d+$/.test(numericValue) || value === "") {
    if (!numericValue) return "";
    return `Rp ${new Intl.NumberFormat("id-ID").format(parseInt(numericValue, 10))}`;
  }
  return value;
}

