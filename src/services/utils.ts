import { ApiError } from "@/lib/api-client";

export function logServiceError(context: string, err: unknown) {
  if (err instanceof ApiError && (err.status === 401 || err.status === 429)) {
    console.warn(`${context}: ${err.message} (Status: ${err.status})`);
  } else {
    console.error(`${context}`, err);
  }
}
