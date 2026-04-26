-- 0023_repair_alter_users_staff_permissions.sql
-- Session 40 — Repair partial migration 0020.
--
-- Smoke tests : GET /api/auth/users ne retourne pas de champ
-- `staffPermissions` sur les 6 utilisateurs en prod, indiquant que la
-- colonne `users.staff_permissions` n'existe pas (0020 jamais persistée).
--
-- Si la colonne existe déjà, ce fichier plante au ALTER ;
-- deploy-worker.yml absorbe via `||` et continue.

ALTER TABLE users ADD COLUMN staff_permissions TEXT;
