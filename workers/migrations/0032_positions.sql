-- 0032_positions.sql
-- Session 54 — P0-2 du rapport docs/PRODUCTION-SAFETY-2026.md
--
-- Migre les positions/communiqués/actualités de localStorage (clé
-- `gaspe_positions`) vers une table D1 partagée. Avant cette migration,
-- /admin/positions saisissait dans le localStorage du seul admin connecté ;
-- la fiche publique /positions/[slug] et le feed RSS lisaient un fichier TS
-- statique src/data/positions.ts (vide depuis session 33d). En prod = aucune
-- publication possible côté admin sans modifier le code. CRITIQUE pour le
-- passage en prod.
--
-- Schéma aligné sur le type `Position` de
-- src/app/(admin)/admin/positions/page.tsx (utilisé en runtime).

CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,                       -- HTML body riche (sanitized)
  category TEXT,                       -- 'Position' | 'Communiqué de presse' | 'Actualité'
  date TEXT,                           -- ISO YYYY-MM-DD (date de publication éditoriale)
  cover_image_url TEXT,
  attachment_url TEXT,
  tags_json TEXT,                      -- JSON array of strings
  published INTEGER DEFAULT 0,         -- 0 = brouillon, 1 = publié
  is_archived INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_positions_slug ON positions(slug);
CREATE INDEX IF NOT EXISTS idx_positions_published ON positions(published, is_archived);
CREATE INDEX IF NOT EXISTS idx_positions_category ON positions(category);
CREATE INDEX IF NOT EXISTS idx_positions_date ON positions(date DESC);
