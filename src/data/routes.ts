/**
 * Routes maritimes des adhérents GASPE
 * Liaisons de service public — format [lat, lon][]
 * Chaque route relie un port de départ à une destination
 */

export interface MaritimeRoute {
  name: string;
  member: string;
  coordinates: [number, number][]; // [lat, lon]
  tier: 1 | 2 | 3; // 1 = liaison principale, 2 = secondaire, 3 = saisonnière
}

export const maritimeRoutes: MaritimeRoute[] = [
  // ── Bretagne / Finistère ──
  {
    name: "Brest – Ouessant",
    member: "Compagnie Penn Ar Bed",
    coordinates: [[48.384, -4.487], [48.38, -4.60], [48.42, -4.85], [48.46, -5.10]],
    tier: 1,
  },
  {
    name: "Brest – Molène",
    member: "Compagnie Penn Ar Bed",
    coordinates: [[48.384, -4.487], [48.39, -4.70], [48.40, -4.95]],
    tier: 1,
  },
  {
    name: "Brest – Sein",
    member: "Compagnie Penn Ar Bed",
    coordinates: [[48.384, -4.487], [48.30, -4.60], [48.10, -4.80], [48.04, -4.85]],
    tier: 2,
  },
  // ── Morbihan ──
  {
    name: "Lorient – Groix",
    member: "Compagnie Océane",
    coordinates: [[47.742, -3.353], [47.65, -3.42], [47.63, -3.46]],
    tier: 1,
  },
  {
    name: "Quiberon – Belle-Île",
    member: "Compagnie Océane",
    coordinates: [[47.49, -3.12], [47.38, -3.15], [47.34, -3.18]],
    tier: 1,
  },
  {
    name: "Vannes – Île-d'Arz",
    member: "Compagnie Océane",
    coordinates: [[47.638, -2.762], [47.59, -2.78]],
    tier: 2,
  },
  {
    name: "Lorient – Rade",
    member: "Bateau Bus – Rade de Lorient",
    coordinates: [[47.709, -3.361], [47.742, -3.353]],
    tier: 2,
  },
  {
    name: "Vannes – Golfe du Morbihan",
    member: "Bateaux-Bus du Golfe",
    coordinates: [[47.638, -2.762], [47.58, -2.80], [47.56, -2.84]],
    tier: 2,
  },
  // ── Vendée ──
  {
    name: "Fromentine – Île d'Yeu",
    member: "Compagnie Yeu Continent",
    coordinates: [[46.893, -2.139], [46.84, -2.20], [46.73, -2.32]],
    tier: 1,
  },
  {
    name: "Fromentine – Noirmoutier",
    member: "Compagnie Vendéenne",
    coordinates: [[46.892, -2.138], [46.95, -2.18]],
    tier: 2,
  },
  {
    name: "Sables-d'Olonne – Île d'Yeu",
    member: "Transport Urbain Maritime",
    coordinates: [[46.504, -1.794], [46.60, -2.00], [46.73, -2.32]],
    tier: 3,
  },
  // ── Charente-Maritime ──
  {
    name: "Fouras – Île d'Aix",
    member: "Société Fouras – Aix",
    coordinates: [[45.99, -1.09], [46.01, -1.174]],
    tier: 1,
  },
  {
    name: "La Rochelle – Île de Ré",
    member: "Transdev Maritime La Rochelle",
    coordinates: [[46.159, -1.151], [46.19, -1.22], [46.21, -1.35]],
    tier: 1,
  },
  // ── Gironde / Aquitaine ──
  {
    name: "Blaye – Lamarque (Bac de Gironde)",
    member: "Bacs de Gironde",
    coordinates: [[45.125, -0.664], [45.09, -0.72]],
    tier: 1,
  },
  {
    name: "Arcachon – Cap Ferret",
    member: "Jalilo",
    coordinates: [[44.663, -1.169], [44.64, -1.22], [44.63, -1.25]],
    tier: 2,
  },
  {
    name: "Bordeaux – Navette fluviale",
    member: "Keolis Bordeaux",
    coordinates: [[44.851, -0.557], [44.87, -0.55], [44.89, -0.54]],
    tier: 2,
  },
  // ── Loire ──
  {
    name: "Bacs de Loire",
    member: "Compagnie des Bacs de Loire",
    coordinates: [[47.198, -1.674], [47.26, -1.80], [47.28, -2.00]],
    tier: 1,
  },
  // ── Normandie ──
  {
    name: "Granville – Jersey",
    member: "Compagnie Maritime DNO – Manche Iles Express",
    coordinates: [[48.833, -1.603], [49.10, -1.80], [49.18, -2.11]],
    tier: 1,
  },
  {
    name: "Granville – Guernesey",
    member: "Compagnie Maritime DNO – Manche Iles Express",
    coordinates: [[48.833, -1.603], [49.15, -2.00], [49.46, -2.54]],
    tier: 1,
  },
  {
    name: "Saint-Vaast – Tatihou",
    member: "Tatihou",
    coordinates: [[49.587, -1.262], [49.60, -1.24]],
    tier: 2,
  },
  {
    name: "Bacs de Seine",
    member: "Département de Seine-Maritime – Bacs de Seine",
    coordinates: [[49.44, 0.74], [49.482, 0.877]],
    tier: 1,
  },
  // ── Méditerranée ──
  {
    name: "Marseille – Navette maritime",
    member: "Transrades",
    coordinates: [[43.293, 5.364], [43.30, 5.35], [43.33, 5.33]],
    tier: 2,
  },
  {
    name: "Toulon – Rade",
    member: "Réseau Mistral – Rade de Toulon",
    coordinates: [[43.120, 5.931], [43.10, 5.90], [43.09, 5.87]],
    tier: 2,
  },
  {
    name: "Hyères – Porquerolles",
    member: "TLV TVM",
    coordinates: [[43.005, 6.200], [42.98, 6.21], [42.99, 6.22]],
    tier: 1,
  },
  {
    name: "Arles – Bac du Rhône",
    member: "Syndicat Mixte des Traversées du Delta du Rhône",
    coordinates: [[43.676, 4.627], [43.64, 4.60]],
    tier: 1,
  },
  // ── Seine / Île-de-France ──
  {
    name: "Paris – Navette Seine",
    member: "LD Tide",
    coordinates: [[48.891, 2.237], [48.86, 2.30], [48.85, 2.35]],
    tier: 2,
  },
  // ── DOM-TOM ──
  {
    name: "Mamoudzou – Dzaoudzi (Mayotte)",
    member: "DTM Mayotte",
    coordinates: [[-12.777, 45.233], [-12.78, 45.25], [-12.79, 45.28]],
    tier: 1,
  },
  {
    name: "Pointe-à-Pitre – Les Saintes (Guadeloupe)",
    member: "Karu Ferry",
    coordinates: [[15.979, -61.642], [15.90, -61.60], [15.86, -61.58]],
    tier: 1,
  },
  {
    name: "Saint-Pierre – Miquelon",
    member: "SPM Ferries",
    coordinates: [[46.78, -56.17], [47.05, -56.35], [47.111, -56.375]],
    tier: 1,
  },
];
