-- 0012_organization_vessels.sql
-- Flotte détaillée par organisation adhérente (source : tableur armateurs
-- v2024/2025). Éditable via `/admin/flotte` (admin = toutes les compagnies)
-- ou `/espace-adherent/flotte` (adhérent = sa propre compagnie uniquement).
--
-- Le frontend stocke la flotte comme `FleetVessel[]` ; on sérialise en JSON
-- dans une seule colonne pour éviter un schéma relationnel à 25+ colonnes
-- avec autant de formats libres ("2 x 2300 CV", "70 L/h", "2/3", "2032-2034")
-- qui ne se contraignent pas proprement en SQL. Les champs numériques
-- "durs" (yearBuilt, length, beam, grossTonnage, passengerCapacity,
-- vehicleCapacity, freightCapacity, cruiseSpeed, rotationsPerYear) sont
-- extraits dans des colonnes dédiées pour permettre des requêtes
-- statistiques ultérieures (agrégats GASPE).
--
-- Une ligne par navire ; FK sur organizations(id) pour cohérence. Chaque
-- édition depuis le frontend envoie le `FleetVessel[]` complet pour une
-- organisation, le Worker fait un replace atomique (delete + insert).

CREATE TABLE IF NOT EXISTS organization_vessels (
  id TEXT PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identité
  name TEXT NOT NULL,
  imo TEXT,
  type TEXT,
  operating_line TEXT,
  flag TEXT,
  image_url TEXT,

  -- Caractéristiques numériques (indexables / agrégables)
  year_built INTEGER,
  length_m REAL,
  beam_m REAL,
  gross_tonnage REAL,
  passenger_capacity INTEGER,
  vehicle_capacity INTEGER,
  freight_capacity INTEGER,
  cruise_speed REAL,
  rotations_per_year INTEGER,

  -- Champs libres (format mixte du tableur source)
  crew_size TEXT,
  power_kw TEXT,
  consumption_per_trip TEXT,
  renewal_type TEXT,
  renewal_year TEXT,
  owner TEXT,
  shipyard TEXT,
  shipyard_country TEXT,
  propulsion_type TEXT,
  fuel_type TEXT,
  alt_fuel_tests TEXT,
  shore_power TEXT,
  hull_treatment TEXT,
  emission_reduction TEXT,

  -- Audit
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_org_vessels_org ON organization_vessels(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_vessels_imo ON organization_vessels(imo) WHERE imo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_vessels_year ON organization_vessels(year_built);
