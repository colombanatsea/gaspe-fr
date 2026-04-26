-- 0020_users_staff_permissions.sql
-- Permet à l'admin maître (admin@gaspe.fr) d'inviter des collaborateurs GASPE
-- avec un rôle `staff` et des permissions granulaires (formations, positions,
-- CMS, cotisations, jobs, etc.).
--
-- Stockage : nouvelle colonne `staff_permissions` sur la table `users`,
-- contenu JSON array de StaffPermission. NULL ou "[]" pour les autres rôles.
--
-- Le rôle existant `admin` (master) bypasse toujours les checks de permissions.
-- Le nouveau rôle `staff` doit avoir au moins une permission pour être utile.

ALTER TABLE users ADD COLUMN staff_permissions TEXT;
