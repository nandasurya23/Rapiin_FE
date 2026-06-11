export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function isValidPhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value);
  return normalized.length >= 9 && normalized.length <= 15;
}

export function isValidEmailOrPhone(value: string) {
  return isValidEmail(value) || isValidPhoneNumber(value);
}
