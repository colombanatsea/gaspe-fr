import type { FleetVessel } from "@/types";

/**
 * Seed éditorial – flotte des compagnies adhérentes GASPE.
 * Source : tableur adhérents v2024/2025 (remontée directe des armements).
 *
 * Format : dictionnaire `slug de compagnie → FleetVessel[]`.
 * Sert de fallback : la page publique `/nos-adherents/[slug]` et les
 * éditeurs (admin + espace adhérent) lisent d'abord le store dual-mode
 * (localStorage ↔ D1), et retombent sur ce seed si le store est vide.
 *
 * Les champs "libres" (crewSize, powerKw, consumption, renewalYear…) sont
 * conservés tels quels depuis le tableur (ex: "2 x 2300 CV", "70L/H",
 * "2032-2034", "entre 2026 et 2030", "4 ou 3 sur PA") – ils seront
 * éditables via un input texte dans les formulaires.
 *
 * Enrichissement : pour ajouter un navire, soit éditer ce seed (source de
 * vérité côté dépôt), soit passer par l'admin CMS (écrase le seed via le
 * store, non-destructif – `scripts/seed-fleet.ts` peut reseed la base D1).
 */

// --- Compagnie Yeu Continent ---
const compagnieYeuContinent: FleetVessel[] = [
  { id: "cyc-chatelet", name: "Le Châtelet", imo: "9374650", type: "Catamaran NGV – mixte Passagers & VL", operatingLine: "Fromentine – Port Joinville Yeu", yearBuilt: 2006, length: 45.5, beam: 11.2, grossTonnage: 813, passengerCapacity: 435, vehicleCapacity: 6, freightCapacity: 67, renewalType: "Achat neuf", renewalYear: "2028", owner: "Région Pays de la Loire", shipyard: "Fjellstrand", shipyardCountry: "Norvège", propulsionType: "4 Hydrojet MGO", fuelType: "GO", cruiseSpeed: 32, consumptionPerTrip: "1400", crewSize: "8", powerKw: "5592" },
  { id: "cyc-pontdyeu", name: "Pont d'Yeu", imo: "9332004", type: "Catamaran NGV – mixte Passagers & VL", operatingLine: "Fromentine – Port Joinville Yeu", yearBuilt: 2006, length: 45.5, beam: 11.2, grossTonnage: 813, passengerCapacity: 435, vehicleCapacity: 6, freightCapacity: 67, renewalType: "Achat neuf", renewalYear: "2028", owner: "Région Pays de la Loire", shipyard: "Fjellstrand", shipyardCountry: "Norvège", propulsionType: "4 Hydrojet MGO", fuelType: "GO", cruiseSpeed: 32, consumptionPerTrip: "1400", crewSize: "8", powerKw: "5592" },
  { id: "cyc-insulaoya3", name: "Insula Oya III", imo: "9946453", type: "Cargo Mixte Passagers, VL et fret", operatingLine: "Fromentine – Port Joinville Yeu", yearBuilt: 2023, length: 55.1, beam: 13, grossTonnage: 1124, passengerCapacity: 391, vehicleCapacity: 12, freightCapacity: 260, renewalType: "Achat neuf", renewalYear: "2053", owner: "Région Pays de la Loire", shipyard: "Piriou", shipyardCountry: "France", propulsionType: "2 MP HPF MGO", fuelType: "GO", cruiseSpeed: 14.5, consumptionPerTrip: "1700", crewSize: "8", powerKw: "2518" },
];

// --- BreizhGo Penn Ar Bed ---
const breizhgoPennArBed: FleetVessel[] = [
  { id: "pab-enezeussa3", name: "Enez Eussa 3", type: "Navire mixte", operatingLine: "Le Conquet / Molène – Ouessant", yearBuilt: 1991, length: 45, beam: 8.8, grossTonnage: 774, passengerCapacity: 302, freightCapacity: 60, renewalType: "Achat neuf", renewalYear: "2029", owner: "Région Bretagne", shipyard: "Paimbœuf", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 15, consumptionPerTrip: "3000", crewSize: "8", powerKw: "2 x 2300 CV" },
  { id: "pab-fromveur2", name: "Fromveur 2", type: "Navire mixte", operatingLine: "Le Conquet / Molène – Ouessant", yearBuilt: 2011, length: 45, beam: 9.9, grossTonnage: 530, passengerCapacity: 365, freightCapacity: 25, renewalType: "Achat neuf", renewalYear: "2041", owner: "Région Bretagne", shipyard: "Piriou – Concarneau", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 15, consumptionPerTrip: "3000", crewSize: "8", powerKw: "2 x 2240 CV" },
  { id: "pab-molenez", name: "Molenez", type: "Cargo polyvalent", operatingLine: "Brest / Molène – Sein – Ouessant", yearBuilt: 2000, length: 36, beam: 8, grossTonnage: 326, passengerCapacity: 3, freightCapacity: 250, renewalType: "Achat neuf", renewalYear: "2035", owner: "Région Bretagne", shipyard: "CIB – Brest", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 12.5, crewSize: "6", powerKw: "1700 CV" },
  { id: "pab-enezsun3", name: "Enez Sun 3", type: "Navire mixte", operatingLine: "Audierne – Sein", yearBuilt: 1991, length: 34, beam: 8, grossTonnage: 324, passengerCapacity: 250, freightCapacity: 10, renewalType: "Achat neuf", renewalYear: "2028", owner: "Région Bretagne", shipyard: "Gléhen – Douarnenez", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 15, crewSize: "6", powerKw: "2 x 1730 CV" },
  { id: "pab-petrel", name: "Petrel", type: "Vedette à passagers", operatingLine: "Brest / Camaret – Molène – Ouessant", yearBuilt: 2002, length: 26, beam: 6, grossTonnage: 156, passengerCapacity: 183, renewalType: "Refit", renewalYear: "2026", owner: "Région Bretagne", shipyard: "Gléhen – Douarnenez", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 20, crewSize: "5", powerKw: "2 x 1450 CV" },
  { id: "pab-drtricard2", name: "Dr Tricard 2", type: "Navire transbordeur", operatingLine: "Molène", yearBuilt: 1997, length: 10, beam: 4, grossTonnage: 15.17, passengerCapacity: 44, renewalType: "Achat neuf", renewalYear: "2030", owner: "Région Bretagne", shipyard: "CIB – Brest", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 8, crewSize: "2", powerKw: "2 x 960 kW" },
];

// --- Blue Lines (Martinique) ---
const blueLines: FleetVessel[] = [
  { id: "bl-pearlisland", name: "Pearl Island", imo: "929541", type: "Passagers", yearBuilt: 2010, length: 19.66, beam: 5.7, grossTonnage: 66, passengerCapacity: 146, owner: "Martinique Transport", shipyard: "CNB", shipyardCountry: "France", propulsionType: "Thermique", fuelType: "GO", cruiseSpeed: 18, consumptionPerTrip: "120", rotationsPerYear: 0, crewSize: "3", powerKw: "720 kW" },
  { id: "bl-capsalomon", name: "Cap Salomon", imo: "934432", type: "Passagers", operatingLine: "L01b – FdF ↔ Marina Pte du Bout", yearBuilt: 2018, length: 20.06, beam: 5.8, grossTonnage: 50.13, passengerCapacity: 147, owner: "SEA LEASE", shipyard: "ODC", shipyardCountry: "Chine", propulsionType: "Thermique", fuelType: "GO", cruiseSpeed: 18, consumptionPerTrip: "120", rotationsPerYear: 2527, crewSize: "3", powerKw: "1030 kW" },
  { id: "bl-ansebleue", name: "Anse Bleue", imo: "934431", type: "Passagers", yearBuilt: 2018, length: 20.06, beam: 5.8, grossTonnage: 50.13, passengerCapacity: 147, owner: "SEA LEASE", shipyard: "ODC", shipyardCountry: "Chine", propulsionType: "Thermique", fuelType: "GO", cruiseSpeed: 18, consumptionPerTrip: "120", rotationsPerYear: 0, crewSize: "3", powerKw: "1030 kW" },
  { id: "bl-bellemartinique", name: "Belle Martinique", imo: "934430", type: "Passagers", operatingLine: "L02 – FdF ↔ Anse Mitan / Anse à l'Ane", yearBuilt: 2017, length: 19.4, beam: 4.7, grossTonnage: 48.63, passengerCapacity: 98, renewalYear: "2027", owner: "SEA LEASE", shipyard: "ODC", shipyardCountry: "Chine", propulsionType: "Thermique", fuelType: "GO", cruiseSpeed: 18, consumptionPerTrip: "110", rotationsPerYear: 1596, crewSize: "3", powerKw: "596 kW" },
  { id: "bl-diamant", name: "Diamant", imo: "934429", type: "Passagers", operatingLine: "L01a – FdF ↔ Bourg des Trois Îlets", yearBuilt: 2017, length: 19.4, beam: 4.7, grossTonnage: 48.63, passengerCapacity: 98, renewalYear: "2027", owner: "SEA LEASE", shipyard: "ODC", shipyardCountry: "Chine", propulsionType: "Thermique", fuelType: "GO", cruiseSpeed: 18, consumptionPerTrip: "110", rotationsPerYear: 380, crewSize: "3", powerKw: "596 kW" },
  { id: "bl-grosilets", name: "Gros Îlets", imo: "923185", type: "Passagers", yearBuilt: 2008, length: 18.04, beam: 4.66, grossTonnage: 30, passengerCapacity: 97, renewalYear: "2027", owner: "Martinique Transport", shipyard: "ODC", shipyardCountry: "Chine", propulsionType: "Thermique", fuelType: "GO", cruiseSpeed: 18, consumptionPerTrip: "110", rotationsPerYear: 0, crewSize: "3", powerKw: "594 kW" },
  { id: "bl-fortroyal", name: "Fort Royal", imo: "928650", type: "Passagers", yearBuilt: 2008, length: 18.04, beam: 4.66, grossTonnage: 27.29, passengerCapacity: 97, owner: "Martinique Transport", shipyard: "ODC", shipyardCountry: "Chine", propulsionType: "Thermique", fuelType: "GO", cruiseSpeed: 18, consumptionPerTrip: "110", rotationsPerYear: 0, crewSize: "3", powerKw: "594 kW" },
];

// --- Compagnie Maritime TLV (Giens / îles d'Hyères) ---
const compagnieMaritimeTlv: FleetVessel[] = [
  { id: "tlv-med8", name: "Méditerranée VIII", type: "Vedette à passagers", operatingLine: "Tour Fondue – Porquerolles", yearBuilt: 2000, length: 26.35, beam: 7.76, grossTonnage: 199, passengerCapacity: 347, renewalType: "Refit", renewalYear: "entre 2026 et 2030", owner: "SNRTM", shipyard: "SNRTM", shipyardCountry: "France", propulsionType: "2 moteurs à ligne d'arbre", fuelType: "GO", cruiseSpeed: 20, crewSize: "5", powerKw: "740", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif", emissionReduction: "Réduction tours moteurs" },
  { id: "tlv-med9", name: "Méditerranée IX", type: "Vedette à passagers", operatingLine: "Tour Fondue – Porquerolles", yearBuilt: 2001, length: 28.9, beam: 7.82, grossTonnage: 199, passengerCapacity: 347, renewalType: "Refit", renewalYear: "entre 2026 et 2030", owner: "SNRTM", shipyard: "SNRTM", shipyardCountry: "France", propulsionType: "2 moteurs à ligne d'arbre", fuelType: "GO", cruiseSpeed: 20, crewSize: "5", powerKw: "740", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif", emissionReduction: "Réduction tours moteurs" },
  { id: "tlv-med11", name: "Méditerranée XI", type: "Vedette à passagers", operatingLine: "Tour Fondue – Porquerolles", yearBuilt: 2003, length: 29.63, beam: 7.76, grossTonnage: 196, passengerCapacity: 347, renewalType: "Refit", renewalYear: "entre 2026 et 2030", owner: "SNRTM", shipyard: "SNRTM", shipyardCountry: "France", propulsionType: "2 moteurs à ligne d'arbre", fuelType: "GO", cruiseSpeed: 20, crewSize: "5", powerKw: "740", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif", emissionReduction: "Réduction tours moteurs" },
  { id: "tlv-med14", name: "Méditerranée 14", type: "Navire mixte", operatingLine: "Port d'Hyères – Port-Cros / Le Levant", yearBuilt: 2018, length: 25.98, beam: 7.2, grossTonnage: 168, passengerCapacity: 176, freightCapacity: 18, owner: "TPM", shipyard: "SNRTM", shipyardCountry: "France", propulsionType: "2 moteurs à ligne d'arbre", fuelType: "GO", cruiseSpeed: 18, crewSize: "4", powerKw: "750", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "tlv-med15", name: "Méditerranée 15", type: "Navire mixte", operatingLine: "Port d'Hyères – Port-Cros / Le Levant", yearBuilt: 2007, length: 25.81, beam: 6.88, grossTonnage: 134, passengerCapacity: 266, freightCapacity: 10, renewalType: "Refit", renewalYear: "entre 2026 et 2030", owner: "SNRTM", shipyard: "SNRTM", shipyardCountry: "France", propulsionType: "2 moteurs à ligne d'arbre", fuelType: "GO", cruiseSpeed: 18, crewSize: "4", powerKw: "734", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "tlv-archipel5", name: "Archipel V", type: "Navire de charge", operatingLine: "Tour Fondue – Porquerolles / Port-Cros", yearBuilt: 2016, length: 29.07, beam: 8.04, grossTonnage: 150, passengerCapacity: 12, freightCapacity: 58, owner: "TPM", shipyard: "SNRTM", shipyardCountry: "France", propulsionType: "2 moteurs à ligne d'arbre", fuelType: "GO", cruiseSpeed: 15, crewSize: "2", powerKw: "750", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
];

// --- Direction des Transports Maritimes de la Gironde (DTMD / CD33) ---
const dtmdGironde: FleetVessel[] = [
  { id: "dtmd-estuaire", name: "L'Estuaire", imo: "9475375", type: "Ferry / Bac", operatingLine: "Le Verdon – Royan", yearBuilt: 2009, length: 78, beam: 18.3, grossTonnage: 3705, passengerCapacity: 600, vehicleCapacity: 115, renewalYear: "2040", owner: "Dexia crédit bail – CD Gironde", shipyard: "Piriou", shipyardCountry: "France", propulsionType: "Voith", fuelType: "GO", cruiseSpeed: 12, crewSize: "7 mini", powerKw: "4820", shorePower: "Effective", hullTreatment: "Effectif", emissionReduction: "Débitmètres VAF" },
  { id: "dtmd-gironde", name: "La Gironde", imo: "9246748", type: "Ferry / Bac", operatingLine: "Le Verdon – Royan", yearBuilt: 2002, length: 78, beam: 18.3, grossTonnage: 3684, passengerCapacity: 600, vehicleCapacity: 115, renewalType: "Refit ou achat neuf", renewalYear: "2032-2034", owner: "CD Gironde", shipyard: "Zamakona", shipyardCountry: "Espagne", propulsionType: "Voith", fuelType: "GO", cruiseSpeed: 12, crewSize: "7 mini", powerKw: "4820", shorePower: "Effective", hullTreatment: "Effectif", emissionReduction: "Débitmètres VAF" },
  { id: "dtmd-sebastienvauban", name: "Sébastien Vauban", imo: "9696204", type: "Bac", operatingLine: "Blaye – Lamarque", yearBuilt: 2014, length: 60, beam: 13, grossTonnage: 1024, passengerCapacity: 300, vehicleCapacity: 42, renewalYear: "2045", owner: "CD Gironde", shipyard: "Socarenam", shipyardCountry: "France", propulsionType: "Schottel", fuelType: "GO", cruiseSpeed: 12, crewSize: "5 mini", powerKw: "2139", shorePower: "Effective", hullTreatment: "Effectif" },
];

// --- SPM Ferries (Saint-Pierre-et-Miquelon) ---
const spmFerries: FleetVessel[] = [
  { id: "spm-nordet", name: "Nordet", imo: "9803259", type: "Ferry", operatingLine: "Saint-Pierre – Miquelon / Fortune", yearBuilt: 2017, length: 56, beam: 10, grossTonnage: 768, passengerCapacity: 188, vehicleCapacity: 18, freightCapacity: 118, renewalType: "Pas précisé", owner: "CT975", shipyard: "Damen", shipyardCountry: "Turquie", propulsionType: "Moteur Caterpillar", fuelType: "DMA", cruiseSpeed: 18, consumptionPerTrip: "2200", rotationsPerYear: 323, crewSize: "8", powerKw: "4324", altFuelTests: "Souhaités", shorePower: "Effective", hullTreatment: "Effectif" },
  { id: "spm-suroit", name: "Suroit", imo: "9803261", type: "Ferry", operatingLine: "Saint-Pierre – Miquelon / Fortune", yearBuilt: 2017, length: 56, beam: 10, grossTonnage: 768, passengerCapacity: 188, vehicleCapacity: 18, freightCapacity: 118, renewalType: "Pas précisé", owner: "CT975", shipyard: "Damen", shipyardCountry: "Turquie", propulsionType: "Moteur Caterpillar", fuelType: "DMA", cruiseSpeed: 18, consumptionPerTrip: "2200", rotationsPerYear: 322, crewSize: "8", powerKw: "4324", altFuelTests: "Souhaités", shorePower: "Effective", hullTreatment: "Effectif" },
  { id: "spm-jeunefrance", name: "Le Jeune France", type: "Catamaran", operatingLine: "Saint-Pierre – Langlade", yearBuilt: 2010, length: 19, beam: 8, grossTonnage: 75, passengerCapacity: 120, renewalType: "Marché public", renewalYear: "2027", owner: "CT975", shipyard: "Chantier Richeux", shipyardCountry: "France (Saint-Malo)", propulsionType: "Moteur Baudouin", fuelType: "DMA", cruiseSpeed: 9, consumptionPerTrip: "132", rotationsPerYear: 194, crewSize: "3", powerKw: "600 CV", altFuelTests: "Souhaités", shorePower: "Souhaitée", hullTreatment: "Effectif" },
];

// --- Direction des Ports, Bacs et Voies vertes de la Seine-Maritime (CD76) ---
const dpvSeineMaritime: FleetVessel[] = [
  { id: "cd76-bac24", name: "BAC 24", imo: "935679", type: "RoRo/Pax amphidrome", operatingLine: "Quillebeuf – Berville", yearBuilt: 2020, length: 40, beam: 11.2, grossTonnage: 418, passengerCapacity: 150, vehicleCapacity: 27, freightCapacity: 101.5, renewalType: "Éco-conduite – baisse à l'étude", owner: "CD76", shipyard: "Merré", shipyardCountry: "France", propulsionType: "Diesel / GO pêche", fuelType: "GO pêche", cruiseSpeed: 10, consumptionPerTrip: "900 L/jour", rotationsPerYear: 13000, crewSize: "4", powerKw: "1352", shorePower: "Effective", emissionReduction: "Non" },
  { id: "cd76-bac23", name: "BAC 23", imo: "929466", type: "RoRo/Pax amphidrome", operatingLine: "Duclair – Berville", yearBuilt: 2010, length: 31.9, beam: 18.5, grossTonnage: 297, passengerCapacity: 210, vehicleCapacity: 27, freightCapacity: 191, renewalType: "Éco-conduite – baisse", owner: "CD76", shipyard: "Socarénam", shipyardCountry: "France", propulsionType: "Diesel / GO pêche", fuelType: "GO pêche", cruiseSpeed: 0, consumptionPerTrip: "1400 L/jour", rotationsPerYear: 17000, crewSize: "4", powerKw: "750", shorePower: "Effective", emissionReduction: "Non" },
  { id: "cd76-bac13", name: "BAC 13", imo: "302102", type: "RoRo/Pax amphidrome", operatingLine: "En réserve", yearBuilt: 1969, length: 30, beam: 15.7, grossTonnage: 236, passengerCapacity: 130, vehicleCapacity: 28, freightCapacity: 150, renewalType: "Achat neuf, IMO III + HVO", renewalYear: "Fin 2028", owner: "CD76", shipyard: "de Normandie", shipyardCountry: "France", propulsionType: "Diesel / GO pêche", fuelType: "GO pêche", cruiseSpeed: 8, consumptionPerTrip: "1000 L/jour", rotationsPerYear: 4000, crewSize: "4", powerKw: "708", shorePower: "Effective", emissionReduction: "Non" },
];

// --- Morlenn Express (rade de Brest) ---
const morlennExpress: FleetVessel[] = [
  { id: "morlenn-bindy", name: "Bindy", type: "Vedette", operatingLine: "Rade de Brest", yearBuilt: 2004, length: 35, beam: 9, grossTonnage: 380, passengerCapacity: 400, renewalType: "Achat neuf IMO Tier III", renewalYear: "2026", owner: "MN", shipyard: "Gamelin", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 20, crewSize: "5", powerKw: "2290" },
  { id: "morlenn-tibidy", name: "Tibidy", type: "Vedette", operatingLine: "Rade de Brest", yearBuilt: 2004, length: 35, beam: 9, grossTonnage: 380, passengerCapacity: 400, renewalType: "Achat neuf IMO Tier III", renewalYear: "2028", owner: "MN", shipyard: "Gamelin", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 20, crewSize: "5", powerKw: "2290" },
  { id: "morlenn-treberon", name: "Treberon", type: "Vedette", operatingLine: "Rade de Brest", yearBuilt: 2004, length: 35, beam: 9, grossTonnage: 380, passengerCapacity: 400, renewalType: "Achat neuf IMO Tier III", renewalYear: "2027", owner: "MN", shipyard: "Gamelin", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 20, crewSize: "5", powerKw: "2290" },
  { id: "morlenn-arun", name: "Arun", type: "Vedette", operatingLine: "Rade de Brest", yearBuilt: 2005, length: 35, beam: 9, grossTonnage: 380, passengerCapacity: 400, renewalType: "Achat neuf IMO Tier III", renewalYear: "2027", owner: "MN", shipyard: "Gamelin", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 20, crewSize: "5", powerKw: "2290" },
  { id: "morlenn-terenez", name: "Terenez", type: "Vedette", operatingLine: "Rade de Brest", yearBuilt: 2006, length: 35, beam: 9, grossTonnage: 380, passengerCapacity: 400, renewalType: "Achat neuf IMO Tier III", renewalYear: "2028", owner: "MN", shipyard: "Gamelin", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 20, crewSize: "5", powerKw: "2290" },
  { id: "morlenn-louarn", name: "Louarn", type: "Vedette", operatingLine: "Rade de Brest", yearBuilt: 2004, length: 31, beam: 9, grossTonnage: 353, passengerCapacity: 393, renewalType: "Achat neuf IMO Tier III", renewalYear: "2026", owner: "MN", shipyard: "Gléhen", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 20, crewSize: "5", powerKw: "2100" },
];

// --- Manche Iles Express (DNO) ---
const mancheIlesExpress: FleetVessel[] = [
  { id: "dno-granville", name: "Granville", imo: "9356476", type: "Monocoque HSC NGV", operatingLine: "Granville – Jersey / Carteret – Jersey / Diélette – Guernesey / Diélette – Aurigny / Jersey – Guernesey / Jersey – Sercq", yearBuilt: 2014, length: 40, beam: 8, grossTonnage: 325, passengerCapacity: 245, renewalType: "Achat neuf ou occasion", renewalYear: "2030", owner: "Département de la Manche", shipyard: "Damen", shipyardCountry: "Singapour", propulsionType: "3 x 903 kW (Caterpillar C32)", fuelType: "MDO", cruiseSpeed: 23, consumptionPerTrip: "600 L/h", rotationsPerYear: 378, crewSize: "7", powerKw: "2709", altFuelTests: "Souhaités", shorePower: "Souhaitée", hullTreatment: "Effectif", emissionReduction: "Non" },
];

// --- Kéolis Maritime Fouras Aix (KMFA) ---
const keolisMaritimeFourasAix: FleetVessel[] = [
  { id: "kmfa-pierreloti", name: "Pierre Loti", imo: "9032575", type: "Bac", operatingLine: "Fouras – Île d'Aix (17)", yearBuilt: 1992, length: 35, beam: 9, grossTonnage: 278, passengerCapacity: 500, vehicleCapacity: 0, freightCapacity: 45, renewalType: "Construction", renewalYear: "2028", owner: "Région Nouvelle-Aquitaine", shipyard: "Chantier Naval du Ponant", shipyardCountry: "France (La Rochelle)", propulsionType: "Propulsion classique", fuelType: "GO", cruiseSpeed: 9, consumptionPerTrip: "115 L/h", rotationsPerYear: 2165, crewSize: "4", powerKw: "956" },
];

// --- Compagnie des Bacs de Loire ---
const compagnieBacsDeLoire: FleetVessel[] = [
  { id: "bacsloire-lola", name: "Lola", type: "Bac amphidrome", operatingLine: "Basse Indre – Indret", yearBuilt: 2012, length: 69.9, beam: 12.5, grossTonnage: 412, passengerCapacity: 297, vehicleCapacity: 40, renewalType: "Refit hybride", owner: "CD44", shipyard: "Merré", shipyardCountry: "France", propulsionType: "Diesel électrique", fuelType: "GO", cruiseSpeed: 6, crewSize: "3", powerKw: "750" },
  { id: "bacsloire-iledumet", name: "Ile Dumet", type: "Bac amphidrome", operatingLine: "Le Pellerin – Couëron", yearBuilt: 2013, length: 69.9, beam: 12.5, grossTonnage: 412, passengerCapacity: 297, vehicleCapacity: 40, renewalType: "Refit hybride", owner: "CD44", shipyard: "Merré", shipyardCountry: "France", propulsionType: "Diesel électrique", fuelType: "GO", cruiseSpeed: 6, crewSize: "3", powerKw: "750" },
  { id: "bacsloire-annebretagne", name: "Anne de Bretagne", type: "Bac amphidrome", operatingLine: "Réserve", yearBuilt: 1978, length: 50, beam: 10.5, grossTonnage: 212, passengerCapacity: 297, vehicleCapacity: 18, renewalType: "Refit pour 10 ans", owner: "CD44", shipyard: "Nantes", shipyardCountry: "France", fuelType: "GO", cruiseSpeed: 5, crewSize: "3", powerKw: "400" },
];

// --- Compagnie Vendéenne ---
const compagnieVendeenne: FleetVessel[] = [
  { id: "cv-portfromentine", name: "Port Fromentine", type: "Passagers", operatingLine: "Fromentine & SGCV – Yeu", yearBuilt: 2005, length: 25.5, beam: 7.82, grossTonnage: 196, passengerCapacity: 286, renewalType: "Remplacement neuf", renewalYear: "2027", owner: "Croisières Inter-Îles", shipyard: "Gamelin", shipyardCountry: "France", propulsionType: "Hélices", fuelType: "GO", crewSize: "4", powerKw: "1940", altFuelTests: "Effectués", shorePower: "Effective", hullTreatment: "Effectif", emissionReduction: "Souhaité" },
  { id: "cv-vendeenne", name: "La Vendéenne", type: "Passagers", operatingLine: "Fromentine – Yeu", yearBuilt: 2022, length: 23.97, beam: 7.44, grossTonnage: 183, passengerCapacity: 250, renewalType: "Pas prévu", owner: "Croisières Inter-Îles", shipyard: "TMI", shipyardCountry: "France", propulsionType: "Hydrojet", fuelType: "GO", crewSize: "4", powerKw: "1104", altFuelTests: "Non envisagés", shorePower: "Effective", hullTreatment: "Effectif", emissionReduction: "Souhaité" },
  { id: "cv-ogia", name: "Ogia", type: "Passagers", operatingLine: "Saint-Gilles-Croix-de-Vie – Yeu", yearBuilt: 2003, length: 25.5, beam: 7.89, grossTonnage: 172, passengerCapacity: 309, renewalType: "Pas prévu", owner: "Croisières Inter-Îles", shipyard: "Gamelin", shipyardCountry: "France", propulsionType: "Hélices", fuelType: "GO", crewSize: "5", powerKw: "1766", altFuelTests: "Non envisagés", shorePower: "Effective", hullTreatment: "Effectif", emissionReduction: "Souhaité" },
];

// --- LD Tide (CTV parcs éoliens) ---
const ldTide: FleetVessel[] = [
  { id: "ldtide-innovent", name: "INNO'VENT", type: "CTV", operatingLine: "Parc éolien PBG", yearBuilt: 2022, length: 23.9, beam: 9, grossTonnage: 181, passengerCapacity: 24, freightCapacity: 10, renewalType: "Pas de renouvellement planifié à ce jour", owner: "LD Tide", shipyard: "OCEA", shipyardCountry: "France", propulsionType: "CPP", fuelType: "MDO", cruiseSpeed: 24, crewSize: "3", powerKw: "2132" },
  { id: "ldtide-motivent", name: "MOTI'VENT", type: "CTV", operatingLine: "Parc éolien PBG", yearBuilt: 2022, length: 23.9, beam: 9, grossTonnage: 181, passengerCapacity: 24, freightCapacity: 10, renewalType: "Pas de renouvellement planifié à ce jour", owner: "LD Tide", shipyard: "OCEA", shipyardCountry: "France", propulsionType: "CPP", fuelType: "MDO", cruiseSpeed: 24, crewSize: "3", powerKw: "2132" },
  { id: "ldtide-captivent", name: "CAPTI'VENT", type: "CTV", operatingLine: "Parc éolien PBG", yearBuilt: 2023, length: 23.9, beam: 9, grossTonnage: 181, passengerCapacity: 24, freightCapacity: 10, renewalType: "Pas de renouvellement planifié à ce jour", owner: "LD Tide", shipyard: "OCEA", shipyardCountry: "France", propulsionType: "CPP", fuelType: "MDO", cruiseSpeed: 24, crewSize: "3", powerKw: "2132" },
  { id: "ldtide-activent", name: "ACTI'VENT", imo: "9985112", type: "CTV", operatingLine: "Parc éolien Fécamp", yearBuilt: 2023, length: 23.9, beam: 9, grossTonnage: 146, passengerCapacity: 24, freightCapacity: 10, renewalType: "Pas de renouvellement planifié à ce jour", owner: "LD Tide", shipyard: "Strategic Marine", shipyardCountry: "Singapour", propulsionType: "FPP", fuelType: "MDO", cruiseSpeed: 24, crewSize: "3", powerKw: "2162" },
  { id: "ldtide-estivent", name: "ESTI'VENT", imo: "9985124", type: "CTV", operatingLine: "Marché spot", yearBuilt: 2024, length: 23.9, beam: 9, grossTonnage: 146, passengerCapacity: 24, freightCapacity: 10, renewalType: "Pas de renouvellement planifié à ce jour", owner: "LD Tide", shipyard: "Strategic Marine", shipyardCountry: "Singapour", propulsionType: "FPP", fuelType: "MDO", cruiseSpeed: 24, crewSize: "3", powerKw: "2162" },
  { id: "ldtide-optivent", name: "OPTI'VENT", imo: "1054993", type: "CTV", operatingLine: "Parc éolien Yeu", yearBuilt: 2025, length: 23.9, beam: 9, grossTonnage: 146, passengerCapacity: 24, freightCapacity: 10, renewalType: "Pas de renouvellement planifié à ce jour", owner: "LD Tide", shipyard: "Strategic Marine", shipyardCountry: "Singapour", propulsionType: "FPP", fuelType: "MDO", cruiseSpeed: 24, crewSize: "3", powerKw: "2162" },
  { id: "ldtide-fervent", name: "FER'VENT", imo: "1055002", type: "CTV", operatingLine: "Marché spot", yearBuilt: 2025, length: 23.9, beam: 9, grossTonnage: 146, passengerCapacity: 24, freightCapacity: 10, renewalType: "Pas de renouvellement planifié à ce jour", owner: "LD Tide", shipyard: "Strategic Marine", shipyardCountry: "Singapour", propulsionType: "FPP", fuelType: "MDO", cruiseSpeed: 24, crewSize: "3", powerKw: "2162" },
];

// --- SNC Transrades (Marseille) ---
const sncTransrades: FleetVessel[] = [
  { id: "transrades-chevalierpaul", name: "Chevalier Paul", type: "Vedette passagers", operatingLine: "Vieux-Port ↔ Îles du Frioul", yearBuilt: 2007, length: 24, beam: 6.4, grossTonnage: 134, passengerCapacity: 196, renewalType: "Achat neuf", renewalYear: "2047", owner: "Transrades", shipyard: "Construction aluminium", shipyardCountry: "France", propulsionType: "Baudouin 8M26", fuelType: "Diesel", cruiseSpeed: 18, consumptionPerTrip: "60 L/h", rotationsPerYear: 5117, crewSize: "4", powerKw: "2 x 588", hullTreatment: "Trilux 33" },
  { id: "transrades-edmonddantes", name: "Edmond Dantès", type: "Vedette passagers", operatingLine: "Vieux-Port ↔ Îles du Frioul", yearBuilt: 2007, length: 24, beam: 6.4, grossTonnage: 134, passengerCapacity: 196, renewalType: "Achat neuf", renewalYear: "2047", owner: "Transrades", shipyard: "Construction aluminium", shipyardCountry: "France", propulsionType: "Baudouin 8M26", fuelType: "Diesel", cruiseSpeed: 18, consumptionPerTrip: "60 L/h", rotationsPerYear: 5119, crewSize: "4", powerKw: "2 x 588", hullTreatment: "Trilux 33" },
  { id: "transrades-esperandieu", name: "Henri Jacques Espérandieu", type: "Vedette passagers", operatingLine: "Vieux-Port ↔ Îles du Frioul", yearBuilt: 2007, length: 24, beam: 6.4, grossTonnage: 134, passengerCapacity: 196, renewalType: "Achat neuf", renewalYear: "2047", owner: "Transrades", shipyard: "Construction aluminium", shipyardCountry: "France", propulsionType: "Baudouin 8M26", fuelType: "Diesel", cruiseSpeed: 18, consumptionPerTrip: "60 L/h", rotationsPerYear: 5122, crewSize: "4", powerKw: "2 x 588", hullTreatment: "Trilux 33" },
];

// --- RATP Dev Toulon Provence Méditerranée (RDTPM) ---
const ratpDevToulon: FleetVessel[] = [
  { id: "rdtpm-loumerou", name: "Lou Merou", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 2004, length: 22.81, beam: 5.7, grossTonnage: 101.2, passengerCapacity: 147, owner: "TPM", shipyard: "TMI", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2/3", powerKw: "2 x 450 CV", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-rascasso", name: "La Rascasso", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 2005, length: 22.81, beam: 5.7, grossTonnage: 101.2, passengerCapacity: 147, owner: "TPM", shipyard: "TMI", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2/3", powerKw: "2 x 450 CV", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-lousouleu", name: "Lou Souleu", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 2010, length: 21.35, beam: 5.6, grossTonnage: 82.9, passengerCapacity: 98, owner: "TPM", shipyard: "TMI", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2", powerKw: "2 x 390 CV", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-loupichoun", name: "Lou Pichoun", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 2010, length: 21.35, beam: 5.6, grossTonnage: 82.9, passengerCapacity: 98, owner: "TPM", shipyard: "TMI", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2", powerKw: "2 x 390 CV", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-lamousco", name: "La Mousco", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 1983, length: 22, beam: 5.5, grossTonnage: 81, passengerCapacity: 134, owner: "TPM", shipyard: "Arcor", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2/3", powerKw: "2 x 420 CV", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-loumistrau", name: "Lou Mistrau", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 1998, length: 19.32, beam: 5.48, grossTonnage: 79.3, passengerCapacity: 107, owner: "TPM", shipyard: "TMI", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2", powerKw: "2 x 390 CV", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-lesquinade", name: "L'Esquinade", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 1998, length: 19.32, beam: 5.48, grossTonnage: 79.3, passengerCapacity: 107, owner: "TPM", shipyard: "TMI", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2", powerKw: "2 x 390 CV", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-louroucaou", name: "Lou Roucaou", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 1999, length: 19.32, beam: 5.48, grossTonnage: 79.3, passengerCapacity: 107, owner: "TPM", shipyard: "TMI", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2", powerKw: "2 x 390 CV", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-fortdelapre", name: "Fort de la Pré", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 2007, length: 19.09, beam: 5.7, grossTonnage: 68.52, passengerCapacity: 94, owner: "TPM", shipyard: "Atlantic", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2", powerKw: "2 x 450 CV 2100 tr/min", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-lougabian", name: "Lou Gabian", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 1992, length: 19.4, beam: 5.35, grossTonnage: 66.5, passengerCapacity: 137, owner: "TPM", shipyard: "Ciotat", shipyardCountry: "France", fuelType: "Gasoil", cruiseSpeed: 12, crewSize: "2/3", powerKw: "2 x 390 CV", altFuelTests: "Effectués", shorePower: "Non envisagée", hullTreatment: "Effectif" },
  { id: "rdtpm-lestello", name: "L'Estello", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 2014, length: 21.35, beam: 5.15, grossTonnage: 63.8, passengerCapacity: 98, owner: "TPM", shipyard: "TMI", shipyardCountry: "France", fuelType: "Hybride", cruiseSpeed: 12, crewSize: "2", powerKw: "2 x 125 kW", altFuelTests: "Effectués", shorePower: "Effective", hullTreatment: "Effectif" },
  { id: "rdtpm-longomai", name: "Longo Mai", type: "Navire à passagers", operatingLine: "Rade de Toulon", yearBuilt: 2014, length: 21.35, beam: 5.15, grossTonnage: 63.8, passengerCapacity: 98, owner: "TPM", shipyard: "TMI", shipyardCountry: "France", fuelType: "Hybride", cruiseSpeed: 12, crewSize: "2", powerKw: "2 x 125 kW", altFuelTests: "Effectués", shorePower: "Effective", hullTreatment: "Effectif" },
];

// --- Karu'Ferry (Guadeloupe) ---
const karuFerry: FleetVessel[] = [
  { id: "karu-caporosso1", name: "Capo Rosso 1", type: "DSC", operatingLine: "Les Saintes – Trois-Rivières", grossTonnage: 56.24, passengerCapacity: 95, crewSize: "3", powerKw: "1324" },
];

// --- Transdev Maritime La Rochelle (TDLR) ---
const transdevLaRochelle: FleetVessel[] = [
  { id: "tdlr-copernic", name: "Copernic", type: "Navire à passagers", operatingLine: "Vieux-Port – Minimes", yearBuilt: 2009, length: 15, beam: 5, grossTonnage: 40.65, passengerCapacity: 75, owner: "Alternatives Énergies", shipyardCountry: "France", propulsionType: "Électro-solaire", cruiseSpeed: 5, crewSize: "2", powerKw: "40", hullTreatment: "Effectif" },
  { id: "tdlr-galilee", name: "Galilée", type: "Navire à passagers", operatingLine: "Vieux-Port – Minimes", yearBuilt: 2009, length: 15, beam: 5, grossTonnage: 40.65, passengerCapacity: 75, owner: "Alternatives Énergies", shipyardCountry: "France", propulsionType: "Électro-solaire", cruiseSpeed: 5, crewSize: "2", powerKw: "40", hullTreatment: "Effectif" },
  { id: "tdlr-petitoiseau", name: "Petit Oiseau", type: "Navire à passagers", operatingLine: "Bateau de réserve", yearBuilt: 1999, length: 11.94, beam: 4.39, grossTonnage: 23.02, passengerCapacity: 59, owner: "Transdev Maritime", shipyard: "Dubourdieu", shipyardCountry: "France", fuelType: "Diesel", cruiseSpeed: 5, crewSize: "2", powerKw: "294", hullTreatment: "Effectif" },
  { id: "tdlr-volta", name: "Volta", type: "Navire à passagers", operatingLine: "Vieux-Port – Médiathèque", yearBuilt: 2019, length: 10.05, beam: 3.5, grossTonnage: 4.16, passengerCapacity: 35, owner: "Alternatives Énergies", shipyardCountry: "France", propulsionType: "Électro-solaire", cruiseSpeed: 4, crewSize: "1", powerKw: "30", hullTreatment: "Effectif" },
  { id: "tdlr-ampere", name: "Ampère", type: "Navire à passagers", operatingLine: "Vieux-Port – Médiathèque", yearBuilt: 2019, length: 10.05, beam: 3.5, grossTonnage: 4.16, passengerCapacity: 35, owner: "Alternatives Énergies", shipyardCountry: "France", propulsionType: "Électro-solaire", cruiseSpeed: 4, crewSize: "1", powerKw: "30", hullTreatment: "Effectif" },
];

// --- Direction des Infrastructures de la Manche (Tatihou) ---
const directionInfrastructuresManche: FleetVessel[] = [
  { id: "tatihou-2", name: "Tatihou II", type: "Amphibie", operatingLine: "Saint-Vaast-la-Hougue – Île de Tatihou", yearBuilt: 2007, length: 13.6, beam: 4.85, grossTonnage: 25.75, passengerCapacity: 58, owner: "CD 50", shipyard: "Proteau", shipyardCountry: "France", propulsionType: "Hélices + pods hydrauliques", fuelType: "DO", cruiseSpeed: 6, crewSize: "2", powerKw: "221" },
  { id: "tatihou-3", name: "Tatihou III", type: "Amphibie", operatingLine: "Saint-Vaast-la-Hougue – Île de Tatihou", yearBuilt: 2023, length: 14.9, beam: 4.8, grossTonnage: 19.28, passengerCapacity: 63, renewalType: "Neuf", owner: "CD 50", shipyard: "Efinor", shipyardCountry: "France", propulsionType: "Hélices + pods hydrauliques", fuelType: "DO", cruiseSpeed: 7, consumptionPerTrip: "5", rotationsPerYear: 3500, crewSize: "2", powerKw: "236" },
];

// --- Compagnie Maritime de Transport (CMT, Les Sables d'Olonne) ---
const cmtSablesDolonne: FleetVessel[] = [
  { id: "cmt-lenoroit", name: "Le Noroît", type: "Navire à passagers", operatingLine: "Florelle / Belle Olonnaise / Vendée Globe", yearBuilt: 2024, length: 11.9, beam: 4.92, grossTonnage: 9.41, passengerCapacity: 50, owner: "Les Sables d'Olonne Agglomération", shipyard: "Chantier de l'Arsenal", shipyardCountry: "France", propulsionType: "Pods immergés / électriques", fuelType: "Électrique", cruiseSpeed: 4, crewSize: "1", powerKw: "42", altFuelTests: "Non envisagés", shorePower: "Effective", hullTreatment: "Effectif" },
  { id: "cmt-lesuroit", name: "Le Suroît", type: "Navire à passagers", operatingLine: "Florelle / Belle Olonnaise / Vendée Globe", yearBuilt: 2024, length: 11.9, beam: 4.92, grossTonnage: 9.41, passengerCapacity: 50, owner: "Les Sables d'Olonne Agglomération", shipyard: "Chantier de l'Arsenal", shipyardCountry: "France", propulsionType: "Pods immergés / électriques", fuelType: "Électrique", cruiseSpeed: 4, crewSize: "1", powerKw: "42", altFuelTests: "Non envisagés", shorePower: "Effective", hullTreatment: "Effectif" },
  { id: "cmt-lenouch", name: "Le Nouch", type: "Navire à passagers", operatingLine: "Florelle / Belle Olonnaise / Vendée Globe", yearBuilt: 2012, length: 10.13, beam: 3.45, grossTonnage: 6, passengerCapacity: 35, renewalType: "Refit batteries et panneaux solaires (2023)", owner: "Les Sables d'Olonne Agglomération", shipyard: "Alternatives Énergies", shipyardCountry: "France", propulsionType: "Pods immergés / électriques", fuelType: "Électrique", cruiseSpeed: 4, crewSize: "1", powerKw: "40", altFuelTests: "Non envisagés", shorePower: "Effective", hullTreatment: "Effectif" },
  { id: "cmt-lenouch2", name: "Le Nouch 2", type: "Navire à passagers", operatingLine: "Florelle / Belle Olonnaise / Vendée Globe", yearBuilt: 2012, length: 10.13, beam: 3.45, grossTonnage: 6, passengerCapacity: 35, renewalType: "Refit batteries et panneaux solaires (2024)", owner: "Les Sables d'Olonne Agglomération", shipyard: "Alternatives Énergies", shipyardCountry: "France", propulsionType: "Pods immergés / électriques", fuelType: "Électrique", cruiseSpeed: 4, crewSize: "1", powerKw: "40", altFuelTests: "Non envisagés", shorePower: "Effective", hullTreatment: "Effectif" },
  { id: "cmt-passeur2", name: "Le Passeur Électrique 2", type: "Navire à passagers", operatingLine: "Florelle / Belle Olonnaise / Vendée Globe", yearBuilt: 2004, length: 9.4, beam: 3.46, grossTonnage: 5.57, passengerCapacity: 30, renewalType: "Refit total (2021)", owner: "Les Sables d'Olonne Agglomération", shipyard: "Alternatives Énergies", shipyardCountry: "France", propulsionType: "2 hors-bords / électriques", fuelType: "Électrique", cruiseSpeed: 4, crewSize: "1", powerKw: "30", altFuelTests: "Non envisagés", shorePower: "Effective", hullTreatment: "Effectif" },
  { id: "cmt-passeur", name: "Le Passeur Électrique", type: "Navire à passagers", operatingLine: "Florelle / Belle Olonnaise / Vendée Globe", yearBuilt: 1998, length: 9.4, beam: 3.46, grossTonnage: 5.51, passengerCapacity: 30, renewalType: "Refit total (2020)", owner: "Les Sables d'Olonne Agglomération", shipyard: "Alternatives Énergies", shipyardCountry: "France", propulsionType: "2 hors-bords / électriques", fuelType: "Électrique", cruiseSpeed: 4, crewSize: "1", powerKw: "30", altFuelTests: "Non envisagés", shorePower: "Effective", hullTreatment: "Effectif" },
  { id: "cmt-saintnicolas", name: "Saint Nicolas", type: "Navire à passagers", operatingLine: "Saint Nicolas", yearBuilt: 1988, length: 8, beam: 3.01, grossTonnage: 4.83, passengerCapacity: 21, owner: "Les Sables d'Olonne Agglomération", shipyard: "Atelier du Bastion 85", shipyardCountry: "France", propulsionType: "Hydraulique / Gazole", fuelType: "Gazole", cruiseSpeed: 4, crewSize: "1", powerKw: "88", altFuelTests: "Souhaités", shorePower: "Non envisagée", hullTreatment: "Effectif" },
];

// --- Zéphyr & Borée / Treizhadenn An Oriant (TAO, Lorient) ---
const zephyrBoreeTao: FleetVessel[] = [
  { id: "tao-traitdunion", name: "Trait d'Union", type: "Navire à passagers", operatingLine: "Port-Louis – Gâvres", yearBuilt: 1999, length: 10.5, beam: 3.6, grossTonnage: 10.77, passengerCapacity: 27, vehicleCapacity: 10, renewalType: "Achat neuf – électrique", renewalYear: "2027", owner: "Lorient Agglomération", shipyard: "Bernard", shipyardCountry: "France", propulsionType: "Ligne d'arbre", fuelType: "GO", cruiseSpeed: 10, crewSize: "2", powerKw: "128", altFuelTests: "Non", shorePower: "Non" },
  { id: "tao-2rives", name: "Les 2 Rives", type: "Navire à passagers", operatingLine: "Rade de Lorient", yearBuilt: 1996, length: 22.45, beam: 7.1, grossTonnage: 59, passengerCapacity: 150, vehicleCapacity: 20, renewalType: "Achat neuf – élec – H2 ready", renewalYear: "Rétrofit 2027", owner: "Lorient Agglomération", shipyard: "Gamelin", shipyardCountry: "France", propulsionType: "Ligne d'arbre", fuelType: "GO", cruiseSpeed: 10, crewSize: "2 ou 3", powerKw: "352", altFuelTests: "Non", shorePower: "Non" },
  { id: "tao-talhouant", name: "Talhouant", type: "Navire à passagers", operatingLine: "Rade de Lorient", yearBuilt: 1994, length: 22.1, beam: 7.1, grossTonnage: 93, passengerCapacity: 193, vehicleCapacity: 20, renewalType: "Achat neuf – élec – H2 ready", renewalYear: "2029?", owner: "Lorient Agglomération", shipyard: "Pechalu", shipyardCountry: "France", propulsionType: "Azimuth", fuelType: "GO", cruiseSpeed: 10, crewSize: "2 ou 3", powerKw: "420", altFuelTests: "Non", shorePower: "Non" },
  { id: "tao-tanguethen", name: "Tanguethen", type: "Navire à passagers", operatingLine: "Rade de Lorient", yearBuilt: 1993, length: 20, beam: 6.9, grossTonnage: 76.6, passengerCapacity: 112, vehicleCapacity: 20, renewalType: "Achat neuf – élec – H2 ready", renewalYear: "2028?", owner: "Lorient Agglomération", shipyard: "Pechalu", shipyardCountry: "France", propulsionType: "Azimuth", fuelType: "GO", cruiseSpeed: 10, crewSize: "2 ou 3", powerKw: "338", altFuelTests: "Non", shorePower: "Non" },
  { id: "tao-kerpont", name: "Kerpont", type: "Navire à passagers", operatingLine: "Rade de Lorient", yearBuilt: 2012, length: 23, beam: 6.4, grossTonnage: 107.15, passengerCapacity: 193, vehicleCapacity: 20, renewalType: "Refit – élec – H2 ready", owner: "Lorient Agglomération", shipyard: "OCEA", shipyardCountry: "France", propulsionType: "Ligne d'arbre", fuelType: "GO", cruiseSpeed: 10, crewSize: "2 ou 3", powerKw: "736", altFuelTests: "Non", shorePower: "Non" },
  { id: "tao-ericbloodaxe", name: "Eric Bloodaxe", type: "Navire à passagers", operatingLine: "Rade de Lorient", yearBuilt: 2016, length: 18, beam: 6, grossTonnage: 62, passengerCapacity: 130, vehicleCapacity: 20, renewalType: "Pas à l'ODJ", owner: "TAO", shipyard: "Santander Shipyard", shipyardCountry: "Espagne", propulsionType: "Ligne d'arbre", fuelType: "GO", cruiseSpeed: 10, crewSize: "2 ou 3" },
  { id: "tao-arvagtredann", name: "Ar Vag Tredann", type: "Navire à passagers", operatingLine: "Rade de Lorient", yearBuilt: 2013, length: 22, beam: 7, grossTonnage: 125.89, passengerCapacity: 147, vehicleCapacity: 20, renewalType: "Rétrofit en cours (retour en flotte été 2026)", renewalYear: "Rétrofit 2026", owner: "Lorient Agglomération", shipyard: "STX Lorient", shipyardCountry: "France", propulsionType: "Azimuth", fuelType: "Électricité", cruiseSpeed: 10, crewSize: "2 ou 3", powerKw: "150", altFuelTests: "Non", shorePower: "Oui" },
];

// --- Transport Maritime Côtier (TMC) ---
const transportMaritimeCotier: FleetVessel[] = [
  { id: "tmc-taillefer3", name: "TAILLEFER 3", imo: "894118", type: "Caboteur", yearBuilt: 2004, length: 39, beam: 7.83, grossTonnage: 321, passengerCapacity: 12, freightCapacity: 400, owner: "TMC", shipyard: "Merré", shipyardCountry: "France", fuelType: "GO pêche", cruiseSpeed: 10, rotationsPerYear: 198, crewSize: "4", powerKw: "441", altFuelTests: "Non", shorePower: "Oui", hullTreatment: "Oui", emissionReduction: "Non" },
  { id: "tmc-goulphar", name: "GOULPHAR", imo: "934115", type: "Caboteur", yearBuilt: 2018, length: 36, beam: 7.75, grossTonnage: 299, passengerCapacity: 12, vehicleCapacity: 6, freightCapacity: 180, owner: "TMC", shipyard: "de Kaap", shipyardCountry: "Pays-Bas", fuelType: "GO pêche", cruiseSpeed: 10, rotationsPerYear: 195, crewSize: "3", powerKw: "634", altFuelTests: "Non", shorePower: "Oui", hullTreatment: "Oui", emissionReduction: "Non" },
];

// --- Syndicat Mixte des Traversées du Delta du Rhône (SMTDR) ---
const smtdr: FleetVessel[] = [
  { id: "smtdr-barcarin4", name: "Barcarin 4", type: "Bac amphidrome", operatingLine: "Grand Rhône : Salin-de-Giraud – Port-Saint-Louis-du-Rhône", yearBuilt: 1987, length: 38.5, beam: 12.5, grossTonnage: 407, passengerCapacity: 196, vehicleCapacity: 32, freightCapacity: 200, renewalType: "Aucun", owner: "CD13", shipyardCountry: "France", propulsionType: "VSP Voith", fuelType: "Diesel", cruiseSpeed: 10, consumptionPerTrip: "70 L/h", crewSize: "4 ou 3 sur PA", powerKw: "1140", emissionReduction: "Sans" },
  { id: "smtdr-barcarin5", name: "Barcarin 5", imo: "9582740", type: "Bac amphidrome", operatingLine: "Grand Rhône : Salin-de-Giraud – Port-Saint-Louis-du-Rhône", yearBuilt: 2010, length: 43, beam: 14.2, grossTonnage: 498, passengerCapacity: 196, vehicleCapacity: 36, freightCapacity: 200, renewalType: "Aucun", owner: "SMTDR", shipyard: "Merré", shipyardCountry: "France", propulsionType: "VSP Voith", fuelType: "Diesel", cruiseSpeed: 10, consumptionPerTrip: "70 L/h", rotationsPerYear: 48678, crewSize: "4 ou 3 sur PA", powerKw: "772", emissionReduction: "Sans" },
  { id: "smtdr-sauvage3", name: "Sauvage III", type: "Bac amphidrome", operatingLine: "Petit Rhône – Saintes-Maries-de-la-Mer", yearBuilt: 1972, length: 20, beam: 6, grossTonnage: 36.45, passengerCapacity: 30, vehicleCapacity: 8, freightCapacity: 20, renewalType: "Hybride décarboné", renewalYear: "2027-2028", owner: "CD13", shipyardCountry: "France", propulsionType: "Roues à aubes / traille", fuelType: "Diesel", consumptionPerTrip: "8 L/h", rotationsPerYear: 16545, crewSize: "1", powerKw: "77", emissionReduction: "Sans" },
  { id: "smtdr-sauvage4", name: "Sauvage 4", type: "Canot 30 CV", operatingLine: "Petit Rhône – Saintes-Maries-de-la-Mer", yearBuilt: 1994, length: 6.92, grossTonnage: 2.67, passengerCapacity: 4, renewalType: "Aucun", owner: "CD13", shipyard: "Pechalu", shipyardCountry: "France", propulsionType: "Hélice", fuelType: "Diesel", crewSize: "1", powerKw: "18", emissionReduction: "Sans" },
];

// --- BreizhGo Océane (Belle-Île, Groix, Houat, Hoëdic) ---
const breizhgoOceane: FleetVessel[] = [
  { id: "oceane-bangor", name: "Bangor", imo: "9372975", type: "Roulier", operatingLine: "Belle-Île", yearBuilt: 2006, length: 46, beam: 12, grossTonnage: 1269, passengerCapacity: 450, vehicleCapacity: 32, owner: "Région Bretagne", shipyard: "Aker Yard Lorient", shipyardCountry: "France", propulsionType: "2 moteurs ABC + 2 azimutaux Schottel", fuelType: "GO", cruiseSpeed: 12, consumptionPerTrip: "252", rotationsPerYear: 1400, crewSize: "8 / 9", powerKw: "1560" },
  { id: "oceane-iledegroix", name: "Île de Groix", imo: "9372987", type: "Roulier", operatingLine: "Groix", yearBuilt: 2008, length: 46, beam: 12, grossTonnage: 1226, passengerCapacity: 450, vehicleCapacity: 32, owner: "Région Bretagne", shipyard: "Aker Yard Lorient", shipyardCountry: "France", propulsionType: "2 moteurs ABC + 2 azimutaux Schottel", fuelType: "GO", cruiseSpeed: 12, consumptionPerTrip: "219", rotationsPerYear: 950, crewSize: "8 / 9", powerKw: "1560" },
  { id: "oceane-vindilis", name: "Vindilis", imo: "9165566", type: "Roulier", operatingLine: "Belle-Île", yearBuilt: 1999, length: 48, beam: 12.5, grossTonnage: 1299, passengerCapacity: 399, vehicleCapacity: 32, renewalType: "Achat neuf", renewalYear: "2029", owner: "Région Bretagne", shipyard: "CMN Cherbourg", shipyardCountry: "France", propulsionType: "2 moteurs Wärtsilä + 2 azimutaux Schottel", fuelType: "GO", cruiseSpeed: 12, consumptionPerTrip: "252", rotationsPerYear: 1300, crewSize: "8 / 9", powerKw: "1980" },
  { id: "oceane-sainttudy", name: "Saint Tudy", imo: "8403519", type: "Roulier", operatingLine: "Groix", yearBuilt: 1985, length: 44.5, beam: 11, grossTonnage: 935, passengerCapacity: 440, vehicleCapacity: 18, owner: "Région Bretagne", shipyard: "La Perrière Lorient", shipyardCountry: "France", propulsionType: "2 moteurs ABC + 2 azimutaux Aquamaster", fuelType: "GO", cruiseSpeed: 12, consumptionPerTrip: "160", rotationsPerYear: 170, crewSize: "7", powerKw: "920" },
  { id: "oceane-breizhnevez1", name: "Breizh Nevez 1", imo: "9835252", type: "Roulier", operatingLine: "Groix", yearBuilt: 2018, length: 43.78, beam: 11.3, grossTonnage: 1104, passengerCapacity: 300, vehicleCapacity: 18, owner: "Région Bretagne", shipyard: "Piriou Concarneau", shipyardCountry: "France", propulsionType: "2 moteurs ABC + 2 hélices à pas variable", fuelType: "GO", cruiseSpeed: 12, consumptionPerTrip: "166", rotationsPerYear: 1100, crewSize: "8", powerKw: "1324" },
  { id: "oceane-melvan", name: "Melvan", imo: "8747056", type: "Vedette mixte", operatingLine: "Houat – Hoëdic", yearBuilt: 2010, length: 30.5, beam: 7.1, grossTonnage: 269, passengerCapacity: 240, vehicleCapacity: 1, owner: "Région Bretagne", shipyard: "Gléhen Douarnenez", shipyardCountry: "France", propulsionType: "2 moteurs Cummins + 2 hélices à pas fixe", fuelType: "GO", cruiseSpeed: 15, consumptionPerTrip: "175", rotationsPerYear: 1500, crewSize: "4 / 5", powerKw: "2088" },
  { id: "oceane-kerdonis", name: "Kerdonis", type: "Vedette passagers", operatingLine: "Belle-Île + Groix", yearBuilt: 2010, length: 30.75, beam: 7.1, grossTonnage: 199, passengerCapacity: 295, renewalYear: "2029", owner: "Transdev Océane", shipyard: "OCEA", shipyardCountry: "France", propulsionType: "2 moteurs Cummins + 2 hélices à pas fixe", fuelType: "GO", cruiseSpeed: 18, rotationsPerYear: 280, crewSize: "4 / 6", powerKw: "2014" },
];

// --- BreizhGo Ile d'Arz (Golfe du Morbihan) ---
const breizhgoIleDarz: FleetVessel[] = [
  { id: "ileda-boedic2", name: "BOEDIC 2", type: "Navire à passagers", operatingLine: "Vannes – Séné – Île d'Arz", yearBuilt: 2006, length: 22, beam: 7.2, grossTonnage: 99, passengerCapacity: 170, owner: "Navix", shipyardCountry: "France", fuelType: "GO", crewSize: "2", powerKw: "736" },
  { id: "ileda-sterne", name: "STERNE", type: "Navire à passagers", operatingLine: "Vannes – Séné – Île d'Arz", yearBuilt: 2007, length: 21, beam: 6.4, grossTonnage: 108.38, passengerCapacity: 150, owner: "Navix", shipyardCountry: "France", fuelType: "GO", crewSize: "2", powerKw: "736" },
  { id: "ileda-belure", name: "BELURE", type: "Barge braquière", operatingLine: "Vannes – Séné – Île d'Arz", yearBuilt: 1989, length: 16.9, beam: 6.47, grossTonnage: 24.89, passengerCapacity: 6, owner: "Région Bretagne", shipyardCountry: "France", fuelType: "GO", crewSize: "2", powerKw: "130" },
  { id: "ileda-waroch", name: "WAROCH", type: "Navire à passagers", operatingLine: "Vannes – Séné – Île d'Arz", yearBuilt: 1975, length: 19.1, beam: 4.7, grossTonnage: 24.68, passengerCapacity: 97, owner: "Bateaux-Bus du Golfe", shipyardCountry: "France", fuelType: "GO", crewSize: "2", powerKw: "470" },
];

// --- Services des Transports Maritimes (STM Mayotte – ex-DTM) ---
const stmMayotte: FleetVessel[] = [
  { id: "stm-pole", name: "POLE", type: "Amphidrome", operatingLine: "Dzaoudzi – Mamoudzou", passengerCapacity: 470, freightCapacity: 8337, shipyardCountry: "France", cruiseSpeed: 16, powerKw: "1324" },
  { id: "stm-karihani", name: "KARIHANI", type: "Amphidrome", operatingLine: "Dzaoudzi – Mamoudzou", passengerCapacity: 470, freightCapacity: 4075, shipyardCountry: "France", cruiseSpeed: 16, powerKw: "1324" },
  { id: "stm-chatouilleuse", name: "CHATOUILLEUSE", type: "Amphidrome", operatingLine: "Dzaoudzi – Mamoudzou", passengerCapacity: 439, freightCapacity: 3037, shipyardCountry: "France", cruiseSpeed: 15, powerKw: "748" },
  { id: "stm-imane", name: "IMANE", type: "Amphidrome", operatingLine: "Dzaoudzi – Mamoudzou", passengerCapacity: 439, freightCapacity: 3100, shipyardCountry: "France", cruiseSpeed: 25, powerKw: "748" },
];

// --- Jalilo (Bassin d'Arcachon) ---
// Source : https://www.jalilo.fr/le-bateau/ – capacité passagers et autres champs
// dimensionnels à confirmer par l'opérateur via /espace-adherent/flotte.
const jalilo: FleetVessel[] = [
  { id: "jalilo-le-jalilo", name: "Le Jalilo", type: "Vedette à passagers", operatingLine: "Bassin d'Arcachon – Île aux Oiseaux / Cap Ferret / Dune du Pilat", yearBuilt: 2012, propulsionType: "Moteurs Caterpillar à gestion électronique (ACERT)", fuelType: "GO", cruiseSpeed: 17, crewSize: "2", emissionReduction: "Faibles émissions CO₂ (norme ACERT)" },
];

/**
 * Dictionnaire : slug de compagnie → liste des navires.
 * Les slugs correspondent à `Member.slug` dans `src/data/members.ts`.
 * Une compagnie absente de ce dictionnaire n'a pas encore de détail flotte.
 */
export const FLEET_SEED: Record<string, FleetVessel[]> = {
  "compagnie-yeu-continent": compagnieYeuContinent,
  "breizhgo-penn-ar-bed": breizhgoPennArBed,
  "blue-lines": blueLines,
  "compagnie-maritime-tlv": compagnieMaritimeTlv,
  "direction-transports-maritimes-gironde": dtmdGironde,
  "spm-ferries": spmFerries,
  "direction-ports-bacs-seine-maritime": dpvSeineMaritime,
  "morlenn-express": morlennExpress,
  "manche-iles-express": mancheIlesExpress,
  "keolis-maritime-fouras-aix": keolisMaritimeFourasAix,
  "compagnie-bacs-de-loire": compagnieBacsDeLoire,
  "compagnie-vendeenne": compagnieVendeenne,
  "ld-tide": ldTide,
  "snc-transrades": sncTransrades,
  "ratp-dev-toulon": ratpDevToulon,
  "karu-ferry": karuFerry,
  "transdev-maritime-la-rochelle": transdevLaRochelle,
  "direction-infrastructures-manche": directionInfrastructuresManche,
  "compagnie-maritime-transport-cmt": cmtSablesDolonne,
  "zephyr-boree-tao": zephyrBoreeTao,
  "transport-maritime-cotier": transportMaritimeCotier,
  "smtdr": smtdr,
  "breizhgo-oceane": breizhgoOceane,
  "breizhgo-ile-darz": breizhgoIleDarz,
  "stm-mayotte": stmMayotte,
  jalilo,
};

/** Helper : récupère la flotte seed pour une compagnie (fallback vide). */
export function getFleetForSlug(slug: string): FleetVessel[] {
  return FLEET_SEED[slug] ?? [];
}

/** Nombre total de navires seed (tous armateurs confondus). */
export const TOTAL_SEED_VESSELS = Object.values(FLEET_SEED).reduce(
  (sum, list) => sum + list.length,
  0,
);

