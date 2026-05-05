-- 0014_archive_keolis_bordeaux.sql
-- Kéolis Bordeaux Métropole a été retirée de la liste des adhérents dans
-- src/data/members.ts en session 34 (v2.21.0 : "30 adhérents, 26 compagnies,
-- 128 navires"), mais la table D1 `organizations` gardait encore les 31
-- orgs seedées par la migration 0003. Conséquence en prod (API mode) :
-- - Header (source statique memberStats) → 30 adhérents
-- - /notre-groupement (source dual-mode getActiveMembers) → 31 adhérents
-- On archive simplement la ligne (archived=1) pour la masquer des listings
-- publics sans perdre l'historique. Le Worker filtre déjà `archived != 1`
-- dans handleListOrganizations côté public (via `include_archived` flag).
-- Idempotent : ré-applicable sans effet (UPDATE sur condition).

UPDATE organizations SET archived = 1, updated_at = datetime('now')
WHERE slug = 'keolis-bordeaux-metropole' AND (archived IS NULL OR archived = 0);
