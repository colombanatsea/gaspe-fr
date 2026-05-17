/**
 * Helper CORS — calcule les headers selon l'origine de la requête.
 *
 * Extrait de `workers/api.ts` en J1 vague 8 (finalize).
 */

const ALLOWED_ORIGINS = [
  "https://gaspe-fr.pages.dev",
  "https://www.gaspe.fr",
  "https://gaspe.fr",
  "http://localhost:3001",
  "http://localhost:3000",
];

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}
