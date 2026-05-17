/**
 * Mock D1Database minimal pour tests handler.
 *
 * Stratégie : queue-based. Le test enqueue les résultats que chaque
 * `prepare().bind().first()/all()/run()` doit retourner, dans l'ordre
 * d'appel. Pas de parsing SQL — l'idée est de tester la logique métier
 * du handler (validation input, transformation output, branches d'auth),
 * pas le SQL lui-même.
 *
 * Pour tests d'intégration SQL réels, utiliser `wrangler.unstable_dev`
 * ou miniflare. Ce mock n'est pas un remplacement de D1, juste un harness
 * suffisant pour valider les chemins de code.
 *
 * Usage :
 * ```ts
 * const db = createMockD1();
 * db.enqueueAll([{ id: "1", name: "Foo" }]); // pour le prochain .all()
 * db.enqueueFirst(null); // pour le prochain .first() qui retourne null
 * const env = makeMockEnv({ DB: db });
 * const res = await handleXxx(req, env, corsHeaders);
 * ```
 */

export interface MockD1Database extends D1Database {
  /** Enqueue le prochain `prepare().bind().all<T>()` result. */
  enqueueAll: (results: unknown[]) => void;
  /** Enqueue le prochain `prepare().bind().first<T>()` result (null pour aucune ligne). */
  enqueueFirst: (row: unknown | null) => void;
  /** Enqueue le prochain `prepare().bind().run()` result. */
  enqueueRun: (meta?: { changes?: number; success?: boolean }) => void;
  /** Liste des SQL queries préparées (utile pour assertions). */
  queries: string[];
  /** Bindings passés à chaque prepare (parallèle à `queries`). */
  bindings: unknown[][];
}

export function createMockD1(): MockD1Database {
  const allQueue: unknown[][] = [];
  const firstQueue: (unknown | null)[] = [];
  const runQueue: { changes?: number; success?: boolean }[] = [];
  const queries: string[] = [];
  const bindings: unknown[][] = [];

  const stmt = (sql: string): D1PreparedStatement => {
    queries.push(sql);
    const currentBindings: unknown[] = [];
    bindings.push(currentBindings);

    const prepared: D1PreparedStatement = {
      bind: (...vals: unknown[]) => {
        currentBindings.push(...vals);
        return prepared;
      },
      first: async <T = unknown>() => {
        if (firstQueue.length === 0) return null as T | null;
        return firstQueue.shift() as T | null;
      },
      all: async <T = unknown>() => {
        const results = (allQueue.shift() ?? []) as T[];
        return {
          results,
          success: true,
          meta: {
            duration: 0,
            rows_read: results.length,
            rows_written: 0,
          },
        } as D1Result<T>;
      },
      run: async <T = unknown>() => {
        const meta = runQueue.shift() ?? { changes: 1, success: true };
        return {
          results: [],
          success: meta.success ?? true,
          meta: {
            duration: 0,
            rows_read: 0,
            rows_written: meta.changes ?? 0,
            changes: meta.changes ?? 0,
          },
        } as unknown as D1Result<T>;
      },
      raw: async () => [] as unknown[],
    } as D1PreparedStatement;

    return prepared;
  };

  return {
    prepare: stmt,
    batch: async (stmts: D1PreparedStatement[]) => {
      // Simple batch : on consomme un .run() pour chaque statement.
      const results: D1Result[] = [];
      for (const _s of stmts) {
        const meta = runQueue.shift() ?? { changes: 1, success: true };
        results.push({
          results: [],
          success: meta.success ?? true,
          meta: { duration: 0, rows_read: 0, rows_written: meta.changes ?? 0, changes: meta.changes ?? 0 },
        } as unknown as D1Result);
      }
      return results;
    },
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
    enqueueAll: (results) => allQueue.push(results),
    enqueueFirst: (row) => firstQueue.push(row),
    enqueueRun: (meta) => runQueue.push(meta ?? { changes: 1 }),
    queries,
    bindings,
  } as unknown as MockD1Database;
}

/** Helper : crée un Env de test avec DB mock + valeurs sentinelles. */
export function makeMockEnv(overrides: Partial<{
  DB: D1Database;
  UPLOADS: R2Bucket;
  JWT_SECRET: string;
  BREVO_API_KEY: string;
  CONTACT_EMAIL: string;
}> = {}): { DB: D1Database; UPLOADS: R2Bucket; JWT_SECRET: string; BREVO_API_KEY: string; CONTACT_EMAIL: string } {
  return {
    DB: overrides.DB ?? (createMockD1() as unknown as D1Database),
    UPLOADS: overrides.UPLOADS ?? ({} as R2Bucket),
    JWT_SECRET: overrides.JWT_SECRET ?? "test-secret",
    BREVO_API_KEY: overrides.BREVO_API_KEY ?? "",
    CONTACT_EMAIL: overrides.CONTACT_EMAIL ?? "test@gaspe.fr",
  };
}

/** Headers CORS factices pour les tests. */
export const TEST_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

/** Construit un fake Request avec URL + headers. */
export function makeRequest(
  url: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): Request {
  return new Request(url, {
    method: init.method ?? "GET",
    headers: init.headers ?? {},
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}
