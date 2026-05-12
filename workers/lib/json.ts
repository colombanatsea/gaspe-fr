/**
 * Helper de réponse JSON standardisée (statut + headers CORS).
 *
 * Extrait de `workers/api.ts` (session J1, refactor split monolithique).
 */

export function json(
  data: unknown,
  headers: Record<string, string>,
  status = 200,
  extraHeaders?: Record<string, string>,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, ...extraHeaders, "Content-Type": "application/json" },
  });
}
