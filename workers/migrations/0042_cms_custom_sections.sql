-- ---------------------------------------------------------------
-- Migration 0042 — CMS sections custom (Phase 1 hybride)
--
-- Permet à l'admin d'ajouter une section éditable sur une page système
-- (homepage, notre-groupement, etc.) sans toucher au code.
--
-- Les sections « système » restent définies dans `src/lib/cms-store.ts`
-- (PAGE_DEFINITIONS). Les sections custom sont fusionnées au runtime
-- côté frontend via le helper `getMergedPageDefinitions()`.
--
-- Contrainte UNIQUE (page_id, section_id) : interdit toute collision
-- avec une section système (le frontend valide aussi côté UI).
--
-- Voir docs/CMS-HYBRID-PLAN.md pour le scope complet.
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cms_custom_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'richtext', 'image', 'config', 'list')),
  item_fields_json TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (page_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_cms_custom_sections_page
  ON cms_custom_sections(page_id, sort_order);
