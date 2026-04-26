-- 0015_seed_jalilo.sql
-- Ajout du navire "Le Jalilo" (compagnie Jalilo, Bassin d'Arcachon).
--
-- Jalilo n'avait pas remonté de flotte au moment du seed initial 0013.
-- Source : https://www.jalilo.fr/le-bateau/ – capacité passagers et autres
-- caractéristiques dimensionnelles à confirmer par l'opérateur via
-- /espace-adherent/flotte (ce seed pose les valeurs connues, l'adhérent
-- complète le reste).
--
-- Idempotent : INSERT OR IGNORE + id stable (réapplicable sans doublon).
-- L'organization_id est résolu via sous-requête sur slug → pas de couplage
-- à l'id numérique auto-généré.

INSERT OR IGNORE INTO organization_vessels (
  id, organization_id, name, type, operating_line, year_built,
  cruise_speed, crew_size, propulsion_type, fuel_type, emission_reduction
) VALUES (
  'jalilo-le-jalilo',
  (SELECT id FROM organizations WHERE slug = 'jalilo'),
  'Le Jalilo',
  'Vedette à passagers',
  'Bassin d''Arcachon – Île aux Oiseaux / Cap Ferret / Dune du Pilat',
  2012,
  17,
  '2',
  'Moteurs Caterpillar à gestion électronique (ACERT)',
  'GO',
  'Faibles émissions CO₂ (norme ACERT)'
);
