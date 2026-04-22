-- 0011_cms_revisions.sql
-- Versioning des pages CMS (`cms_pages`) – chaque PUT sur une page crée un
-- snapshot horodaté de l'état précédent. Permet rollback + audit éditorial.

CREATE TABLE IF NOT EXISTS cms_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  -- JSON serialisé : { section_id: { type, content }, ... }
  -- Représente l'état COMPLET de la page à l'instant du snapshot.
  snapshot_json TEXT NOT NULL,
  -- Auteur du snapshot (user.sub du JWT qui a déclenché le PUT)
  created_by TEXT,
  -- Libellé optionnel : "Mise à jour hero", "Correction faute", etc.
  label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cms_revisions_page ON cms_revisions(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_revisions_author ON cms_revisions(created_by);
