/**
 * Seed script for Cloudflare D1 (SQLite).
 * Run locally: npx tsx src/lib/db/seed.ts
 * Requires: better-sqlite3 installed, or run via wrangler d1 execute
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import { members as memberData } from "../../data/members";

async function seed() {
  console.log("Seeding D1 database...");

  // Connect to local D1 SQLite file
  const dbPath = process.argv[2] || "./gaspe-local.db";
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  // Create tables if not exist (for local dev)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      emailVerified INTEGER,
      image TEXT,
      password TEXT,
      role TEXT NOT NULL DEFAULT 'editor'
    );
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      city TEXT,
      latitude REAL,
      longitude REAL,
      region TEXT,
      territory TEXT,
      category TEXT,
      description TEXT,
      logo_url TEXT,
      website_url TEXT,
      employee_count INTEGER,
      ship_count INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      company_name TEXT,
      member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
      location TEXT,
      contract_type TEXT,
      category TEXT,
      salary_range TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      expires_at TEXT,
      contact_email TEXT,
      application_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      cover_image_url TEXT,
      category TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      author_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      location TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      all_day INTEGER NOT NULL DEFAULT 0,
      event_url TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed members
  console.log(`Inserting ${memberData.length} members...`);
  for (const m of memberData) {
    await db.insert(schema.members).values({
      name: m.name,
      slug: m.slug,
      city: m.city,
      latitude: m.latitude,
      longitude: m.longitude,
      region: m.region,
      territory: m.territory,
      category: m.category,
      description: m.description,
      logoUrl: m.logoUrl,
      websiteUrl: m.websiteUrl,
      employeeCount: m.employeeCount,
      shipCount: m.shipCount,
    }).onConflictDoNothing();
  }
  console.log("Members inserted.");

  // Seed admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await db.insert(schema.users).values({
    id: crypto.randomUUID(),
    name: "Admin GASPE",
    email: "admin@gaspe.fr",
    password: hashedPassword,
    role: "admin",
  }).onConflictDoNothing();
  console.log("Admin user created (admin@gaspe.fr / admin123).");

  sqlite.close();
  console.log("Seed complete.");
}

seed().catch(console.error);
