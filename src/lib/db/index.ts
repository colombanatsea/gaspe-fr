/**
 * Cloudflare D1 / local SQLite database client.
 * In production: pass D1 binding from Cloudflare Workers env.
 * In dev: uses better-sqlite3 with a local .db file.
 */

export function getDb(d1?: any) {
  if (d1) {
    const { drizzle } = require("drizzle-orm/d1");
    const schema = require("./schema");
    return drizzle(d1, { schema });
  }

  // Local dev: use better-sqlite3
  try {
    const Database = require("better-sqlite3");
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const schema = require("./schema");
    const sqlite = new Database("./gaspe-local.db");
    return drizzle(sqlite, { schema });
  } catch (e) {
    throw new Error(
      "No D1 binding and better-sqlite3 not available. Install better-sqlite3 for local dev.",
    );
  }
}
