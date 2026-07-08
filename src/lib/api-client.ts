// src/lib/api-client.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const defaultHeaders: Record<string, string> = {};

  if (!(options?.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
    credentials: "include", // Required for HttpOnly cookie exchange (same-site/cross-port)
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data.error?.details && Array.isArray(data.error.details)) {
        message = data.error.details
          .map((detail: { path: string; message: string }) => `${detail.path}: ${detail.message}`)
          .join(" | ");
      } else {
        message = data.message || data.error?.message || message;
      }
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    // In Rapiin_BE, responses are structured as { ok: true, data: T } or { ok: true, data: T[], meta: ... }
    if (data && typeof data === "object" && "data" in data) {
      return data.data as T;
    }
    return data as T;
  }

  return {} as T;
}
