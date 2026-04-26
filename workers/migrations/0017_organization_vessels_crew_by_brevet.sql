-- 0017_organization_vessels_crew_by_brevet.sql
-- Ajoute la composition d'équipage par brevet sur chaque navire.
-- Stocké en JSON dans une colonne TEXT : { "matelot": 3, "capitaine_500_3000": 1, ... }
--
-- Clés alignées sur `CrewBrevetKey` côté frontend (cf. src/types/index.ts +
-- CREW_BREVETS) — matelot/matelot_qualifie/maitre_equipage/patron_vedette_50ums/
-- capitaine_50_200/capitaine_200_500/capitaine_500_3000/capitaine_3000_plus/
-- matelot_machine/officier_mecanicien/chef_meca_750/chef_meca_3000/chef_meca_8000/
-- chef_meca_illimite/agent_service_polyvalent/commissaire_bord/navpax.
--
-- Pas de table dédiée car :
-- - Données denses (max 17 clés / navire)
-- - Pas de jointure ni d'index multi-critères pour le moment
-- - Si on veut un jour rechercher "navires avec >= 1 capitaine 500", on
--   pourra extraire via json_extract() sans toucher au schéma.
--
-- Idempotent côté D1 : ALTER ADD COLUMN ne supporte pas IF NOT EXISTS,
-- mais le runner de migrations applique chaque fichier une seule fois.

ALTER TABLE organization_vessels ADD COLUMN crew_by_brevet TEXT;
