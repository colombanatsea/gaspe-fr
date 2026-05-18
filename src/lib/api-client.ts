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

/**
 * Typed fetch wrapper with JWT auth and JSON handling.
 *
 * Renvoie un message d'erreur FR clair pour 3 catégories de pépins :
 *  - réseau (TypeError du navigateur, Chrome `net::ERR_*` invisible côté JS)
 *  - HTTP non-2xx (timeout, 5xx, 4xx avec body non-JSON)
 *  - JSON 2xx contenant `{ error: "..." }` (laissé à l'appelant)
 *
 * Sans ces messages, les call sites affichent un opaque « Failed to fetch »
 * qui ne dit rien à l'utilisateur ni à l'astreinte.
 */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options?.headers as Record<string, string> | undefined),
      },
    });
  } catch (err) {
    // TypeError côté navigateur : DNS, CORS bloqué avant arrivée, connexion
    // coupée, extension. On loggue l'URL pour faciliter la reproduction.
    const reason = err instanceof Error ? err.message : "erreur inconnue";
    if (typeof console !== "undefined") console.error("[apiFetch] network", url, reason);
    throw new Error(
      `Le serveur n'a pas pu être joint (${reason}). Vérifiez votre connexion puis réessayez. Si le problème persiste, contactez l'administrateur.`,
    );
  }

  // Status non-2xx → on tente d'extraire { error } du body JSON ; sinon message
  // générique avec le status.
  if (!res.ok) {
    let serverMessage: string | undefined;
    try {
      const data = (await res.clone().json()) as { error?: string };
      serverMessage = typeof data?.error === "string" ? data.error : undefined;
    } catch {
      /* body pas JSON */
    }
    if (res.status === 401) {
      throw new Error(serverMessage ?? "Session expirée. Reconnectez-vous puis réessayez.");
    }
    if (res.status === 403) {
      throw new Error(serverMessage ?? "Vous n'avez pas les droits pour cette action.");
    }
    if (res.status >= 500) {
      throw new Error(serverMessage ?? `Erreur serveur (${res.status}). Réessayez dans un instant.`);
    }
    throw new Error(serverMessage ?? `Requête refusée par le serveur (${res.status}).`);
  }

  return res.json() as Promise<T>;
}

/** Check if the app is running in API mode */
export function isApiMode(): boolean {
  return typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_API_URL;
}
