-- 0035_audit_log.sql
-- Session 54+ — P2-3 du rapport docs/PRODUCTION-SAFETY-2026.md (lot G3).
--
-- Trace immuable des actions utilisateur sur les ressources sensibles.
-- Permet :
--   1. Audit conformité (DGCCRF, RGPD article 30 registre des traitements,
--      audit interne).
--   2. Forensic post-incident (qui a modifié quoi, quand, depuis quelle IP).
--   3. Reconstitution chronologique en cas de litige.
--
-- Granularité : 1 ligne par action métier (PATCH organisation, DELETE job,
-- POST validation submit, PATCH user role…). Pas tracé : lectures GET
-- (volumes massifs), endpoints publics (newsletter inscription), uploads
-- de médias (R2 a son propre log).
--
-- Snapshots before/after : JSON sérialisé, complet pour les diffs.
-- Limite payload : 1 MB par ligne (D1 supporte plus mais on cap pour éviter
-- le runaway sur des éditions massives).
--
-- Retention : pas de purge auto pour l'instant. À planifier en P2 ou P3
-- (DELETE WHERE created_at < datetime('now', '-2 years')) selon la durée
-- légale conservation (RGPD = au max nécessaire au but, typiquement 5 ans
-- pour une trace d'audit).

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,                          -- NULL si action anonyme (rare)
  user_email TEXT,                        -- snapshot pour résilience aux DELETE users
  user_role TEXT,                         -- 'admin' | 'staff' | 'adherent' | 'candidat'
  action TEXT NOT NULL,                   -- ex: 'org.update', 'job.delete', 'validation.submit'
  entity_type TEXT NOT NULL,              -- ex: 'organization', 'job', 'formation'
  entity_id TEXT,                         -- ID de l'entité affectée
  before_json TEXT,                       -- snapshot JSON avant (NULL si CREATE)
  after_json TEXT,                        -- snapshot JSON après (NULL si DELETE)
  ip TEXT,                                -- adresse IP de la requête (CF-Connecting-IP)
  user_agent TEXT,                        -- User-Agent (tronqué à 500 chars)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
