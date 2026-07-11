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

export async function apiFetch<T>(path: string, options?: RequestInit & { rawResponse?: boolean }): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const defaultHeaders: Record<string, string> = {};

  if (!(options?.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (typeof window !== "undefined") {
    defaultHeaders["X-Rapiin-Path"] = window.location.pathname;
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
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rapiin-unauthorized"));
    }
    if (response.status === 401 && path === "/api/auth/me") {
      return { user: null } as unknown as T;
    }
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
    if (options?.rawResponse) {
      return data as T;
    }
    // In Rapiin_BE, responses are structured as { ok: true, data: T } or { ok: true, data: T[], meta: ... }
    if (data && typeof data === "object" && "data" in data) {
      return data.data as T;
    }
    return data as T;
  }

  return {} as T;
}
