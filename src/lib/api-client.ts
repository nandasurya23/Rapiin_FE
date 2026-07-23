// src/lib/api-client.ts

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window === "undefined") {
    return "http://localhost:3003";
  }
  return "";
};

const BASE_URL = getBaseUrl();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit & { rawResponse?: boolean; signal?: AbortSignal }): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const defaultHeaders: Record<string, string> = {};

  if (!(options?.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (typeof window !== "undefined") {
    defaultHeaders["X-Rapiin-Path"] = window.location.pathname;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "default",
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
      signal: options?.signal,
      credentials: "include", // Required for HttpOnly cookie exchange (same-site/cross-port)
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Koneksi gagal. Periksa koneksi internet Anda atau coba beberapa saat lagi.", 0);
  }

  const cleanPath = path.split("?")[0];
  const authPaths = [
    "/api/auth/me",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/register",
    "/api/auth/reset-password",
    "/api/auth/forgot-password",
  ];

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined" && !authPaths.includes(cleanPath)) {
      window.dispatchEvent(new CustomEvent("rapiin-unauthorized"));
    }
    if (response.status === 403 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rapiin-forbidden"));
    }
    if (response.status === 401 && cleanPath === "/api/auth/me") {
      return { user: null } as unknown as T;
    }
    let message = "";
    if (response.status >= 500) {
      message = "Terjadi gangguan pada server. Silakan coba lagi beberapa saat lagi.";
    } else {
      message = `API request failed with status ${response.status}`;
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
