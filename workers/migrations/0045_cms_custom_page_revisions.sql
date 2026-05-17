-- Versioning des pages custom CMS (parallèle a cms_revisions pour les
-- pages système). Snapshot capturé AVANT chaque update + sur restore
-- (rétention 30 par page, auto-purge dans le handler). Permet rollback.
--
-- Schéma simplifié vs cms_revisions car les pages custom ont un seul
-- bloc de contenu (string HTML rich) au lieu d'un array de sections.
-- Le snapshot capture label/description/content/published.
--
-- Migration session 70 (clôture J1 + items backlog HANDOFF).

CREATE TABLE IF NOT EXISTS cms_custom_page_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_page_slug TEXT NOT NULL,
  snapshot_label TEXT NOT NULL,
  snapshot_description TEXT,
  snapshot_content TEXT,
  snapshot_published INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_custom_page_rev_slug
  ON cms_custom_page_revisions(custom_page_slug);
CREATE INDEX IF NOT EXISTS idx_custom_page_rev_created
  ON cms_custom_page_revisions(created_at DESC);
