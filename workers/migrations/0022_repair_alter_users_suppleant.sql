-- 0022_repair_alter_users_suppleant.sql
-- Session 40 — Repair partial migration 0019.
--
-- Smoke tests : GET /api/users/me/suppleant retourne HTTP 500 en prod
-- alors que la route est câblée côté Worker. Cause probable : la colonne
-- `users.suppleant_user_id` n'existe pas (0019 jamais persistée).
--
-- Si la colonne existe déjà (0019 a tourné), ce fichier plante au
-- ALTER ; deploy-worker.yml absorbe via `||` et continue.

ALTER TABLE users ADD COLUMN suppleant_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_suppleant ON users(suppleant_user_id) WHERE suppleant_user_id IS NOT NULL;
