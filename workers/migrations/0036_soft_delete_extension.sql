-- 0036_soft_delete_extension.sql
-- Session 54+ — P2-2 du rapport docs/PRODUCTION-SAFETY-2026.md (lot G3).
--
-- Étend la stratégie soft-delete (déjà appliquée en P0-1 sur formations,
-- P0-2 sur positions, 0007 sur organizations) à 3 tables qui faisaient
-- encore des DELETE physiques :
--   - jobs : DELETE par admin/owner → soft-delete pour préserver le
--     historique et l'audit log (avant : DELETE FROM jobs perdait toute
--     trace).
--   - medical_visits : DELETE par owner → soft-delete (aptitude médicale
--     est une donnée sensible avec valeur légale, conserver l'historique
--     pour audits ENIM / DAM).
--   - nl_drafts : DELETE par admin → soft-delete (preserve les brouillons
--     même après suppression UI).
--
-- Pas appliqué à : sessions, password_reset_tokens, vote_responses,
-- audit_log lui-même (intrinsèquement éphémères / immuables / déjà
-- traçables).
--
-- ALTER ADD COLUMN safe (idempotent via le workflow phase 1 qui catch
-- duplicate column).

ALTER TABLE jobs ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE medical_visits ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE nl_drafts ADD COLUMN is_archived INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_jobs_archived ON jobs(is_archived);
CREATE INDEX IF NOT EXISTS idx_medical_visits_archived ON medical_visits(is_archived);
CREATE INDEX IF NOT EXISTS idx_nl_drafts_archived ON nl_drafts(is_archived);
