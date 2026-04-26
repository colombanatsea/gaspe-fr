-- 0026_repair_alter_jobs_created_by.sql
-- Session 40 — Repair partial migration 0005.
--
-- Symptôme observé sur le run Deploy Worker du 26 avril 2026 (post-fix
-- du token CLOUDFLARE_API_TOKEN) :
--
--   ✘ [ERROR] no such column: created_by at offset 56: SQLITE_ERROR
--   workers/migrations/0005_cms_jobs_medical_media.sql
--
-- Cause : la table `jobs` a été créée à un stade antérieur (session 23
-- vraisemblablement) sans la colonne `created_by`. Le `CREATE TABLE IF
-- NOT EXISTS jobs (..., created_by TEXT, ...)` est alors un no-op (la
-- table existe déjà), mais le `CREATE INDEX IF NOT EXISTS
-- idx_jobs_created_by ON jobs(created_by)` plante parce que la colonne
-- n'a jamais été ajoutée à la table existante.
--
-- Fix : ALTER ADD COLUMN ciblé. Idempotent côté pipeline : si la colonne
-- existe déjà, le statement plante (« duplicate column name ») et le
-- workflow le classe en `::warning::` via le grep
-- "duplicate column name|already exists".

ALTER TABLE jobs ADD COLUMN created_by TEXT;

-- Recréer l'index proprement (CREATE INDEX IF NOT EXISTS est idempotent
-- mais plantera si l'index existe déjà avec un nom différent ; ici on
-- réutilise le nom canonique de 0005).
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
