/* ------------------------------------------------------------------ */
/*  Shared API client for frontend ↔ Worker communication             */
/*  Reuses the JWT token from ApiAuthStore                             */
/* ------------------------------------------------------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const TOKEN_KEY = "gaspe_api_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Typed fetch wrapper with JWT auth and JSON handling */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined),
    },
  });

  return res.json() as Promise<T>;
}

/** Check if the app is running in API mode */
export function isApiMode(): boolean {
  return typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_API_URL;
}
