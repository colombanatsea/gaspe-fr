-- 0031_formations.sql
-- Session 54 — P0-1 du rapport docs/PRODUCTION-SAFETY-2026.md
--
-- Migre les formations de localStorage (clé `gaspe_formations`, perte au cleanup
-- navigateur) vers une table D1 partagée. Avant cette migration, les pages
-- /admin/formations et /espace-{adherent,candidat}/formations lisaient un
-- localStorage isolé par utilisateur — donc l'admin saisissait des formations
-- jamais visibles côté candidat. CRITIQUE pour le passage en prod.
--
-- Schéma aligné sur le type Formation actuellement utilisé par
-- src/app/(admin)/admin/formations/page.tsx (modality + schedule + attachments
-- + registrations) plutôt que sur le seed src/data/formations.ts (qui a
-- divergé). Le seed restera comme référence éditoriale optionnelle.
--
-- P0-3 inclus : colonne `registration_deadline` (ISO YYYY-MM-DD). Quand la
-- deadline est passée, l'UI affiche un badge "Inscriptions closes" et désactive
-- le bouton « S'inscrire ». La fiche reste consultable (lecture archive).
--
-- Note : les attachments sont stockés en JSON (base64 inline). Pour des fichiers
-- volumineux il faudra passer par R2 (comme cms_documents) — backlog P1.

CREATE TABLE IF NOT EXISTS formations (
  id TEXT PRIMARY KEY,
  slug TEXT,                               -- généré depuis id si non fourni (unique nullable)
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,                            -- HTML body riche (sanitized)
  organizer TEXT,
  start_date TEXT,                          -- ISO YYYY-MM-DD
  end_date TEXT,                            -- ISO YYYY-MM-DD
  location TEXT,
  duration TEXT,
  capacity INTEGER DEFAULT 0,
  enrolled INTEGER DEFAULT 0,
  target_audience TEXT,
  prerequisites TEXT,
  price TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'open',                -- 'open' | 'closed' | 'full'
  category TEXT,                              -- 'sécurité' | 'brevets' | 'management' | 'réglementaire' | 'technique'
  modality TEXT,                              -- 'presentiel' | 'distanciel' | 'hybride'
  schedule_json TEXT,                         -- JSON array of {date, location, visioLink}
  attachments_json TEXT,                      -- JSON array of {id, name, data, type} (base64)
  registrations_json TEXT,                    -- JSON array of user.id
  registration_deadline TEXT,                 -- ISO YYYY-MM-DD (P0-3 deadline)
  is_published INTEGER DEFAULT 1,
  is_archived INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_formations_slug ON formations(slug);
CREATE INDEX IF NOT EXISTS idx_formations_published ON formations(is_published, is_archived);
CREATE INDEX IF NOT EXISTS idx_formations_category ON formations(category);
CREATE INDEX IF NOT EXISTS idx_formations_deadline ON formations(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_formations_status ON formations(status);
