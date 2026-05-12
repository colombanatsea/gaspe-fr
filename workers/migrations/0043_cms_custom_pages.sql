-- ---------------------------------------------------------------
-- Migration 0043 — CMS pages custom (Phase 3 hybride)
--
-- Permet à l'admin de créer des pages entièrement custom (slug, label,
-- HTML body), publiées sous /p?slug=X. Contrairement aux pages système
-- (codées dans PAGE_DEFINITIONS + templates publics dédiés), les pages
-- custom ont une structure libre éditée intégralement via l'admin.
--
-- Le slug est unique. Le content est un HTML riche sanitisé côté serveur
-- avant rendu. Soft-delete via is_archived (préserve l'historique).
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cms_custom_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cms_custom_pages_slug
  ON cms_custom_pages(slug) WHERE is_archived = 0;

CREATE INDEX IF NOT EXISTS idx_cms_custom_pages_published
  ON cms_custom_pages(published, is_archived);
