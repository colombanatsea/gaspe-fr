-- 0033_jobs_application_deadline.sql
-- Session 54 — P0-4 du rapport docs/PRODUCTION-SAFETY-2026.md
--
-- Ajoute la colonne `application_deadline` à la table `jobs` (créée en
-- migration 0005). Quand la date est dépassée, l'UI affiche un badge
-- « Candidatures closes » et désactive le bouton « Postuler ». L'offre
-- reste consultable (lecture archive) tant qu'elle n'est pas dépubliée
-- ou supprimée.
--
-- Idempotent : SQLite ne supporte pas IF NOT EXISTS sur ALTER, donc le
-- workflow `.github/workflows/deploy-worker.yml` catche le « duplicate
-- column name » en `::warning::` lors d'un re-run.

ALTER TABLE jobs ADD COLUMN application_deadline TEXT;

CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline ON jobs(application_deadline);
