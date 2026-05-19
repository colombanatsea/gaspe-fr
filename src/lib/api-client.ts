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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Typed fetch wrapper with JWT auth and JSON handling.
 *
 * Stratégie face aux `TypeError: Failed to fetch` du navigateur :
 *  - on retry une seule fois (800ms de délai) car la cause la plus fréquente
 *    est une connexion HTTP/2 keep-alive morte côté Chrome/Cloudflare. Un
 *    second fetch ouvre une nouvelle connexion et passe.
 *  - safe pour POST/PUT/DELETE : si la première requête a été reçue par le
 *    Worker mais que la réponse n'est pas arrivée, le retry sera vu côté
 *    serveur comme une seconde tentative (mais comme `fetch` a throw avant
 *    le moindre TCP ACK, c'est extrêmement improbable dans ce mode d'échec).
 *
 * Messages d'erreur FR :
 *  - réseau persistant → demande de copier-coller le code Chrome précis.
 *  - HTTP non-2xx → message contextuel (401 session, 403 droits, 5xx serveur).
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
  const finalInit: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined),
    },
  };

  let res: Response;
  try {
    res = await fetch(url, finalInit);
  } catch (firstErr) {
    if (typeof console !== "undefined") {
      console.warn("[apiFetch] network attempt #1 failed", url, firstErr);
    }
    // Retry une fois après 800ms : ouvre une nouvelle connexion TCP/HTTP/2.
    await delay(800);
    try {
      res = await fetch(url, finalInit);
    } catch (secondErr) {
      const reason = secondErr instanceof Error ? secondErr.message : "erreur inconnue";
      if (typeof console !== "undefined") {
        console.error("[apiFetch] network attempt #2 failed", url, secondErr);
      }
      throw new Error(
        `Le serveur n'a pas pu être joint (${reason}). ` +
          `Ouvrez DevTools (F12) → onglet Réseau, cliquez la requête en rouge et ` +
          `copiez le code Chrome (par ex. net::ERR_NAME_NOT_RESOLVED, net::ERR_FAILED, ` +
          `net::ERR_HTTP2_PROTOCOL_ERROR). Si le code est récurrent, contactez l'administrateur.`,
      );
    }
  }

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
