// Ported from standalone sim-ademe.jsx – fully typed
"use client";
/**
 * ============================================================================
 * SIMULATEUR AAP ADEME 2026
 * « Aides à l'investissement pour la décarbonation du transport
 *   et des services maritimes »
 * ============================================================================
 *
 * GASPE · Localement ancrées. Socialement engagées.
 * Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau
 * Maison de la Mer, Quai de la Fosse, 44000 Nantes
 *
 * Ce simulateur transforme un armateur côtier GASPE (TPE/PME, aucune
 * connaissance en montage de dossier) en candidat crédible face à un
 * instructeur ADEME, en 30 minutes.
 *
 * Cadre réglementaire :
 *   - AAP ouvert le 2 avril 2026, clôture 6 juillet 2026
 *   - Thématique 1 : Décarbonation directe des navires (projet mono-partenaire) (TRL ≥ 7)
 *   - Thématique 2 : Investissements industriels (TRL ≥ 7)
 *   - Régime SA.111726 (LDACEE), SA.111728 (PME), SA.119559 (AFR)
 *   - Mono-partenaire (thématiques 1 et 2)
 *   - Budget min 300k€ (PME), 1M€ (GE)
 *   - Aide max 6M€ par projet et par entreprise
 *
 * Architecture : React 18 (globals) + Recharts + Tailwind CSS (extraites)
 * Zéro CDN, zéro Google Fonts. CSP strict GitHub Pages.
 *
 * Sources scientifiques :
 *   - dimBatt : DNV Pt.6 Ch.2, Corvus Orca, ABB Marine 2022, BNEF 2024
 *   - Émissions : IMO MEPC.1/Circ.684, ENTEC 2005
 *   - Taux LDACEE : CdC AAP ADEME 2026, Annexe 2 (vérifié le 2 avril 2026)
 *
 * Version : 1.0.0 · 2 avril 2026
 * Propulsé par VAIATA Dynamics
 * ============================================================================
 */

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell
} from "recharts";
import { memberStats } from "@/data/members";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type EntSize = "PE" | "ME" | "GE";
type ZoneAFR = "hors" | "zoneC" | "zoneA";
type ChargeMode = "opportunity" | "overnight";

interface FuelDef {
  id: string;
  l: string;
  cat: string;
  co2: number;
  price: number;
  pGr: number;
  note: string;
  unit?: string;
  adv?: boolean;
}

interface TechDef {
  id: string;
  l: string;
  gL: number;
  gM: number;
  gH: number;
  ox: number;
  retro: string;
  n: string;
  cat: string;
  trl: number;
  adv?: boolean;
}

interface VesselDefaults {
  loa: number;
  gt: number;
  pP: number;
  pA: number;
  pPeak: number;
  spd: number;
  fc: number;
  pTr: number;
  pMa: number;
  pQu: number;
  opD: number;
  rD: number;
  cDur: number;
  qT: number;
  pax: number;
  veh: number;
  opex: number;
  crew: number;
  ins: number;
  dd: number;
  ddC: number;
  mktV: number;
  rev: number;
  debt: number;
  dspR: number;
  lifeR: number;
}

interface VesselType {
  id: string;
  l: string;
  d: VesselDefaults;
}

interface Region {
  id: string;
  l: string;
  zone: ZoneAFR;
}

interface EmFact {
  sox: number;
  nox: number;
  pm: number;
  src: string;
}

interface RatesBySize {
  PE: number;
  ME: number;
  GE: number;
}

interface AdemeRates {
  navPropre: Record<string, RatesBySize>;
  navEmissionNulle: Record<string, RatesBySize>;
  amelioContrefactuel: Record<string, RatesBySize>;
  amelioSans: Record<string, RatesBySize>;
  etudes: Record<string, RatesBySize>;
  industrielPME: Record<string, RatesBySize>;
}

interface ExpenseCat {
  id: string;
  l: string;
  poste: string;
  sub: string;
  ex: string;
  plafond?: number;
}

interface DnshAxis {
  id: string;
  l: string;
  icon: string;
  auto: boolean;
  template: string;
}

type FuelMix = Record<string, number>;

interface TechConfig {
  a?: boolean;
  year?: number;
}

type TechsMap = Record<string, TechConfig>;

interface Trajectory {
  name: string;
  fuelMix: FuelMix;
  techs: TechsMap;
  iC: number;
  iE: number;
  iI: number;
  gridCost: number;
}

interface Vessel extends VesselDefaults {
  type: string;
  name: string;
  entSize: EntSize;
  zoneAFR: ZoneAFR;
  chargeMode: ChargeMode;
  region?: string;
  serviceType?: string;
  [key: string]: unknown;
}

interface ProjectParams {
  sy: number;
  dur: number;
  disc: number;
  cont: number;
  fpG: number;
}

interface FuelRef {
  id: string;
  price: number;
  co2: number;
}

interface BudgetItem {
  id: string;
  montant: number;
}

interface DnshItem {
  id: string;
  text: string;
  ok: boolean;
  fournisseur?: string;
  certification?: string;
  antifouling?: string;
}

interface Contrefactuel {
  type: string;
  coutEntretien?: number;
  coutNewbuild?: number;
  delaiReport?: number;
}

interface Project {
  id: string;
  name: string;
  upd: string;
  thematique: number;
  v: Vessel;
  p: ProjectParams;
  ref: { fuels: FuelRef[] };
  trajs: Trajectory[];
  contrefactuel: Contrefactuel;
  budget: BudgetItem[];
  dnsh: DnshItem[];
  autresAides?: number;
  autresAidesDetail?: string;
}

interface ProjectListEntry {
  id: string;
  name: string;
  upd: string;
  vType?: string;
  vName?: string;
}

interface YearResult {
  yr: number;
  inv: number;
  ex: number;
  en: number;
  cr: number;
  ins: number;
  dd: number;
  tot: number;
  disc: number;
  co2: number;
  cC: number;
  cCO2: number;
}

interface ScenarioResult {
  ccv: number;
  co2: number;
  rv: number;
  yrs: YearResult[];
  fuel?: number[];
}

interface TrajectoryResult {
  name: string;
  idx: number;
  totI: number;
  gain: { m: number };
  base: ScenarioResult;
  deg: ScenarioResult;
  fav: ScenarioResult;
}

interface BattResult {
  kWh: number;
  constraint: string;
  chargePower: number;
  eTrip: number;
  loadFactor: number;
  costBatt: number;
  costCharger: number;
  gridConnect: number;
  eqCyclesAn: number;
  dod: number;
  lifeCycles: number;
  lifeYrs: number;
  cRate: number;
  costPerKwh: number;
  cP?: number;
}

interface BiofuelResult {
  tankClean: number;
  filterUpgrade: number;
  sealReplace: number;
  fuelHeating: number;
  monitoring: number;
  certification: number;
  engineConv: number;
  tankInstall: number;
  safety: number;
  ingenierie: number;
  totalEquip: number;
  total: number;
  notes: string[];
  hasBio: boolean;
  hasB30tech: boolean;
  hasDual: boolean;
}

interface AideResult {
  taux: number;
  aide: number;
  regime: string;
  cls: string;
  plafond: number;
}

interface ScoringResult {
  total: number;
  noteEnviron: number;
  noteAide: number;
  noteTechEco: number;
  co2Evite: number;
  co2Ref: number;
  co2Alt: number;
  gainPct: number;
  ratioEuroParTonne: number;
  triSansAide: number | null;
  triAvecAide: number | null;
  refYears: number;
}

interface CaseRef {
  id: string;
  n: string;
  co: string;
  yr: number;
  vt: string[];
  tr: string[];
  loa: number;
  batt: number;
  rot: number;
  nm: number;
  retro: boolean;
  co2: number;
  nox: number;
  s: string;
  d: string;
  url?: string;
}

interface CaseRefScored extends CaseRef {
  score: number;
}

interface StepDef {
  n: number;
  l: string;
  icon: string;
  min: number;
}

// ============================================================================
// SECTION 1 : CONSTANTES & DONNÉES
// ============================================================================

// --- Palette de couleurs ---
const T  = "#1B9AAA"; // Teal GASPE (accent principal)
const D  = "#1E2D3D"; // Dark navy (texte, header)
const AC = "#E8634A"; // Coral (alertes, accents chauds)
const LB = "#EAF4F7"; // Light blue (backgrounds)
const W  = "#F59E0B"; // Warning amber
const GR = "#10B981"; // Green success
const PU = "#7C3AED"; // Purple (wizard, CTA)

// --- Logos GASPE (base64, extraits en haute résolution) ---
const GASPE_LOGO = "data:image/png;base64,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";

// --- Symbole A GASPE (footer / branding) ---
const GASPE_A_COULEUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAZABkAAD/7AARRHVja3kAAQAEAAAAZAAA/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg8MEBcUGBgXFBYWGh0lHxobIxwWFiAsICMmJykqKRkfLTAtKDAlKCko/9sAQwEHBwcKCAoTCgoTKBoWGigoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgo/8AAEQgAQABAAwERAAIRAQMRAf/EABsAAQACAwEBAAAAAAAAAAAAAAAGBwQFCAID/8QANxAAAQMDAAcGAwYHAAAAAAAAAQIDBAAFEQYHEiExUYETIkFCcZEyUmEUFRehwdJTVHKDkqKx/8QAGgEBAAMBAQEAAAAAAAAAAAAAAAMEBQYBAv/EAC8RAAICAgADBQcEAwAAAAAAAAABAgMEEQUhMRIVQVFhEyIycaGx4YGRwdEUQvD/2gAMAwEAAhEDEQA/AOqaAUAoBQCgFAKAUAoBQGPcZjNvgvy5StlllBWo/QfrX3CDskox6sjtsjVBzl0RDvxNs/8ALT/8E/uq93Zb5oyu+6PJ/T+zc6M6W2/SF95mGHm3Wkhey6kAqGcZGCeG73qC/EnQk5FvE4hVlNxhva8yQVVLwoBQCgFAVjrdvm9mzsK5PSMf6p/X2rW4bT1tf6HO8ayulEfm/wCP7K2bbccS4pCFKS2naWQM7IyBk9SPetZtLqc+k3trwM2wXR2zXeNOZyeyV3k/Mk/EPao7q1bBwfiTY2RLHtVi8PsdCw5DUuK1IjrC2XUhaFDxB4VzMouLcX1R3UJxsipx6M+tfJ9CgFAYd3uDNrtkmbJOGmUFRHPkB9ScCvuuDskorxIr7o01uyXRHPNwmO3CdIlyTl55ZWrr4eg4dK6SEVCKiuiOEttds3OXVlq6u9GWkaMSHJ7eV3NGFAjeGsd0dfi9qyMzJbtSj/r9zpeGYUVjt2L4/t/3MwTC0O0T7s5X3jPTxSodoQf6fhT131J7TJyfh5Ih9ngYPKz3pfv9Oi/U8nWhHZAbiWdQZTuSC6E4HoAQKd3N85SPO/YR5Qr5fM2lp1lWqW4G5zT0JR8yu+jqRvHtUVnD7I84vZZp43TN6mnH7E2YdbfaS6ytLjaxlK0nII5g1RaaembEZKS3F7R7rw9Kr1vXztJDNnYV3G8Ov48VeVPQb+orTwa9J2M5rjeVtqiPhzf8FcsrSh1CnGw4gKBKCcBQ5VoN8jBi0ntrZJbvpzebi0WUuohx8Y7OMNndy2uPtiq1eLXB76v1NC/il9q7O+yvQ0EGHJnyQxCjuvvK37DYyfU8vU1YlZGK3JlKuqVsuzBbZMIerS8vNbb7sSOr5FLKiPXAx+dVZZ9a6bZqV8EvktyaRpr9ondrKpJkx+1aUoJS6wdtJJ4DhkE/UVLXk12dGVcjh92P8S2vNFtaBWJyw2NLMhxSpDp7VxG1lLZPlA4evM1lZNytntdDp+HYrxqezJ83z+RtL9c2rPaZU5/ellGQn5lcAOpwKihBzkoosZF8aK3ZLwOdpkp6ZLekyFbbzyytZ5kmtmOorSOFsnKyTnLqyY6O6vpV4tDE5UxEYPZKUKaKjs53HOfGq9mWoS7OtmrjcHnfUrHLW/Qklt1XQmlhVwnPyQPI2kNg9d5/5UEs2T+FaL9XAq4vdkm/oTW3WqHa4pYtkdqMkjyp4nmfE9TVWU5Te5PZr1UV0x7NS0UjpHfNIPvSRHuNwkIeZWUFDSy2gY8QB4Y31qVQr7O4o5DKysr2jjZN7XlyJ1qs0meuKH7Zc31PSWx2jK3DlSkeIJ8SD+R+lVMqpR96JscIzZWp1WvbXNfL8FhVTN01GktgjaQxWo816QhlC9vZZWE7RxgZyDw31JXY63tFXKxIZUVCbevQjv4YWP8AjTz/AHU/tqX/ACplHuTH83+/4Juy2hlpDTSQltCQlKRwAG4CqzezXjFRWl0PVD0UBGdIdCrVfZ/2yWZDb2wEKLKwkKxwJyDvqaF8oLSM/J4bTkz7c979DGtWr+12u4MTYkiel9lW0nLqcHmD3eBG6vZZEpLTI6eE00zVkG9r1/BL6gNQUAoBQCgFAKAUAoD/2Q==";
const GASPE_A_BLANC = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAAAAAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAALCAAgACABAREA/8QAGAAAAwEBAAAAAAAAAAAAAAAABQcIAwb/xAAuEAABAwMCAwYGAwAAAAAAAAABAgMEBQYRAAcSITEIEyJRcZEUFRYyQWFigYL/2gAIAQEAAD8AlTXS2rYtzXXGfkW7RZlQYZWG3FspBCVEZxknrjQ24aFU7cqjlOrkJ6DObCVKZeThQBGQfbQzW8KK9OmMRYjSnpD7iWmm0jJWpRwAP2SRq51TqX2f9nqSxJbRIll1tDiEnBffWQXleiUhWP0lI/OllvXR6jvRMp1TsWz6uoRkKaNSlhuK3KaPNPAHCCQDnB/keWp/u+y7is+Qhm5aRKp6l/YpxOUL8+FYyk/0dObsfWH85ul+6Z7WYNJPBG4hyXJUOv8AhJz6qTpzX5uhtK1WA5cEiPVKtSHHGW2REcfLTgPi4cju85SPFn8ddArT3UujdmuVCFYbtJt6DAQlxTlRbMiU6kkgFKB4AM8iMnGRz56VXaL3CvB1r6FumNBZdiPB5+VESQicnGWlJCvtHXODzPljGlhb24t227TEU6h1+dBhIUpSWWVhKQSck9OuuVcWpxaluKKlqOSScknz0Ttu4KtbVR+PoM+RAmcBb71hXCrhPUenIe2tboumtXVKZk3DUpFQkMo7tDj5BUlOc4z5ZJ99f//Z";

// --- Carburants de référence ---
// Sources: IMO GHG Study 2020, ADEME 2024
// Prix MDO ajusté post-crise Iran (fermeture Ormuz fév. 2026)
// Source prix: EIA STEO mars 2026 (Brent ~80 $/bbl horizon H2 2026)
const DEF_FUELS: FuelDef[] = [
  { id: "mdo",  l: "MDO (Marine Diesel Oil)",    cat: "Fossile",        co2: 3.206, price: 850,  pGr: 4, note: "Référence · prix post-crise Iran" },
  { id: "b30",  l: "B30 (blend 30% bio)",        cat: "Drop-in",        co2: 2.244, price: 1050, pGr: 2, note: "Sans modification moteur" },
  { id: "fame", l: "Biodiesel FAME B100",         cat: "Bio",            co2: 0.641, price: 1500, pGr: 1, note: "Drop-in diesel, joints à vérifier" },
  { id: "hvo",  l: "HVO (huile hydrogénée)",      cat: "Bio",            co2: 0.480, price: 1700, pGr: 1, note: "Drop-in sans modification" },
  { id: "elec", l: "Électricité batteries",       cat: "Zéro émission",  co2: 0,     price: 180,  pGr: 2, note: "€/MWh · réseau FR", unit: "MWh" },
  { id: "h2",   l: "Hydrogène vert (PàC)",        cat: "e-fuel",         co2: 0,     price: 6000, pGr: -2, note: "Expérimental TRL 7-8", adv: true },
  { id: "ops",  l: "OPS (électricité quai)",      cat: "Zéro quai",      co2: 0,     price: 150,  pGr: 2, note: "À quai uniquement", unit: "MWh", adv: true },
];

// --- Technologies avec TRL (nouveau) ---
// Sources: IMO, DNV, BNEF 2024, ADEME fiches leviers 2025
const TECHS: TechDef[] = [
  { id: "helice",    l: "Hélice optimisée",             gL: .03, gM: .05, gH: .08, ox: 5,  retro: "2-4 sem.", n: "Tous profils",       cat: "Efficacité",       trl: 9 },
  { id: "antifouling",l: "Antifouling avancé",           gL: .02, gM: .03, gH: .05, ox: 20, retro: "1-2 sem.", n: "Renouvelable",        cat: "Efficacité",       trl: 9 },
  { id: "slowsteam", l: "Réduction vitesse",             gL: .10, gM: .15, gH: .25, ox: 0,  retro: "Immédiat",  n: "Impact temps trajet", cat: "Opérationnel",     trl: 9 },
  { id: "hybride",   l: "Hybridation diesel-élect.",     gL: .15, gM: .25, gH: .35, ox: 40, retro: "3-6 mois",  n: "Charge variable",    cat: "Électrification",  trl: 9 },
  { id: "fullelec",  l: "Électrification complète",      gL: .90, gM: .95, gH: 1.0, ox: 30, retro: "6-12 mois", n: "Zéro émission",      cat: "Électrification",  trl: 9 },
  { id: "bulbe",     l: "Bulbe d'étrave",                gL: .03, gM: .07, gH: .12, ox: 0,  retro: "3-6 sem.",  n: "> 12 nœuds",          cat: "Efficacité",       trl: 9 },
  { id: "routage",   l: "Routage marée/courant (IA)",    gL: .08, gM: .15, gH: .20, ox: 5,  retro: "1-2 mois",  n: "Bacs de Seine −17%",  cat: "Efficacité",       trl: 8 },
  { id: "velique",   l: "Propulsion vélique",            gL: .05, gM: .10, gH: .20, ox: 10, retro: "3-6 mois",  n: "Routes favorables",   cat: "Renouvelable",     trl: 8, adv: true },
  { id: "h2pac",     l: "Pile à combustible H₂",        gL: .80, gM: .90, gH: .95, ox: 50, retro: "12+ mois",  n: "TRL 7-8",             cat: "Hydrogène",        trl: 7, adv: true },
  { id: "biofuel",   l: "Conversion biocarburant (HVO/FAME)", gL: 0, gM: 0, gH: 0, ox: 5, retro: "1-4 sem.", n: "Drop-in · reduction CO2 via le mix carburant",      cat: "Biocarburant",     trl: 9 },
  { id: "biofuel_b30",l: "Blend B30 (30% bio)",           gL: 0, gM: 0, gH: 0, ox: 0,  retro: "Immediat",  n: "Sans modif · reduction CO2 via le mix carburant",    cat: "Biocarburant",     trl: 9 },
  { id: "dualfuel",  l: "Conversion dual-fuel (GNL/bio)", gL: .03, gM: .05, gH: .10, ox: 30, retro: "3-6 mois",  n: "GNL/bio-GNL · gain Otto cycle",       cat: "Carburant alt.",   trl: 9 },
];

// --- Types de navires avec valeurs par défaut ---
const VT: VesselType[] = [
  { id: "bac",      l: "Bac estuarien / passage d'eau",      d: { loa: 45, gt: 400, pP: 800,  pA: 200,  pPeak: 1200, spd: 8,  fc: 80,  pTr: 40, pMa: 30, pQu: 30, opD: 300, rD: 40, cDur: 8,  qT: 5,  pax: 0,   veh: 50,  opex: 800,  crew: 500, ins: 60,  dd: 120, ddC: 5, mktV: 5000,  rev: 2000,  debt: 0, dspR: 10, lifeR: 15 }},
  { id: "navette",  l: "Navette passagers",                   d: { loa: 25, gt: 150, pP: 600,  pA: 100,  pPeak: 800,  spd: 12, fc: 40,  pTr: 60, pMa: 20, pQu: 20, opD: 300, rD: 30, cDur: 20, qT: 10, pax: 200, veh: 0,   opex: 500,  crew: 400, ins: 50,  dd: 100, ddC: 5, mktV: 3000,  rev: 1500,  debt: 0, dspR: 8,  lifeR: 18 }},
  { id: "ferry",    l: "Ferry insulaire (ropax)",             d: { loa: 80, gt: 3000, pP: 8000, pA: 1500, pPeak: 10000, spd: 15, fc: 600, pTr: 70, pMa: 15, pQu: 15, opD: 330, rD: 6,  cDur: 60, qT: 30, pax: 600, veh: 120, opex: 3000, crew: 2000, ins: 350, dd: 800, ddC: 5, mktV: 25000, rev: 12000, debt: 5000, dspR: 10, lifeR: 15 }},
  { id: "lamanage", l: "Navire de lamanage",                  d: { loa: 18, gt: 80,  pP: 1000, pA: 50,   pPeak: 1500, spd: 10, fc: 25,  pTr: 20, pMa: 60, pQu: 20, opD: 340, rD: 15, cDur: 5,  qT: 15, pax: 0,   veh: 0,   opex: 200,  crew: 250, ins: 30,  dd: 60,  ddC: 5, mktV: 2000,  rev: 800,   debt: 0, dspR: 7,  lifeR: 12 }},
  { id: "vedette",  l: "Vedette rapide",                      d: { loa: 20, gt: 100, pP: 1200, pA: 100,  pPeak: 1600, spd: 25, fc: 80,  pTr: 70, pMa: 15, pQu: 15, opD: 280, rD: 20, cDur: 15, qT: 10, pax: 100, veh: 0,   opex: 500,  crew: 350, ins: 80,  dd: 120, ddC: 5, mktV: 3500,  rev: 1800,  debt: 0, dspR: 6,  lifeR: 20 }},
  { id: "ctv",      l: "Crew Transfer Vessel (EMR)",          d: { loa: 27, gt: 200, pP: 2500, pA: 200,  pPeak: 3000, spd: 25, fc: 100, pTr: 65, pMa: 15, pQu: 20, opD: 280, rD: 4,  cDur: 45, qT: 30, pax: 24,  veh: 0,   opex: 600,  crew: 400, ins: 80,  dd: 150, ddC: 5, mktV: 5000,  rev: 2500,  debt: 0, dspR: 0,  lifeR: 20 }},
  { id: "fret",      l: "Navire de fret côtier (caboteur)",    d: { loa: 40, gt: 300, pP: 600,  pA: 150,  pPeak: 800,  spd: 9,  fc: 60,  pTr: 70, pMa: 15, pQu: 15, opD: 280, rD: 2,  cDur: 120, qT: 60, pax: 12,  veh: 0,   opex: 500,  crew: 400, ins: 70,  dd: 150, ddC: 5, mktV: 4000,  rev: 1500,  debt: 0, dspR: 0,  lifeR: 25 }},
];


// --- Régions françaises → Zone AFR automatique ---
// Source: Décret n° 2022-968 du 30 juin 2022 relatif aux zones d'aide à finalité régionale
const REGIONS: Region[] = [
  { id: "metropole_standard", l: "Métropole (hors zone AFR)", zone: "hors" },
  { id: "bretagne",       l: "Bretagne",                           zone: "hors" },
  { id: "normandie",      l: "Normandie",                          zone: "hors" },
  { id: "paca",           l: "Provence-Alpes-Côte d'Azur",         zone: "hors" },
  { id: "occitanie",      l: "Occitanie",                          zone: "hors" },
  { id: "nouvelle_aq",    l: "Nouvelle-Aquitaine",                  zone: "hors" },
  { id: "pays_loire",     l: "Pays de la Loire",                    zone: "hors" },
  { id: "hauts_france",   l: "Hauts-de-France",                     zone: "hors" },
  { id: "idf",            l: "Île-de-France",                       zone: "hors" },
  { id: "corse",          l: "Corse",                               zone: "zoneC" },
  { id: "nord_pas_calais",l: "Nord (Dunkerque, Boulogne…)",         zone: "zoneC" },
  { id: "guadeloupe",     l: "Guadeloupe",                          zone: "zoneA" },
  { id: "martinique",     l: "Martinique",                          zone: "zoneA" },
  { id: "reunion",        l: "La Réunion",                          zone: "zoneA" },
  { id: "guyane",         l: "Guyane",                              zone: "zoneA" },
  { id: "mayotte",        l: "Mayotte",                             zone: "zoneA" },
  { id: "saint_martin",   l: "Saint-Martin",                        zone: "zoneA" },
  { id: "spm",            l: "Saint-Pierre-et-Miquelon",            zone: "zoneA" },
];
// --- Facteurs d'émission SOx/NOx/PM (g/kWh) ---
// Sources: IMO MEPC.1/Circ.684, ENTEC 2005, Cooper & Gustafsson 2004
const EMFACT: Record<string, EmFact> = {
  mdo:  { sox: 10.3, nox: 9.8, pm: 0.38, src: "IMO MEPC.1/Circ.684, Tier II" },
  b30:  { sox: 7.2,  nox: 8.8, pm: 0.32, src: "Bates et al. 2021, 30% FAME blend" },
  fame: { sox: 0.8,  nox: 7.5, pm: 0.18, src: "Jayaram et al. 2011, B100" },
  hvo:  { sox: 0.5,  nox: 7.0, pm: 0.12, src: "Sjöblom 2023, HVO marine" },
  elec: { sox: 0,    nox: 0,   pm: 0,    src: "Zéro émission directe" },
  h2:   { sox: 0,    nox: 0,   pm: 0,    src: "Pile à combustible, zéro émission directe" },
  ops:  { sox: 0,    nox: 0,   pm: 0,    src: "Alimentation réseau terrestre" },
};

// --- Taux d'aide ADEME (LDACEE) ---
// Source: CdC AAP ADEME 2026, Annexe 2, pages 35-36
// Vérifié le 2 avril 2026 · conforme au régime SA.111726
const ADEME_RATES: AdemeRates = {
  // Thématique 1 : Décarbonation directe des navires
  navPropre:           { "-":     { PE: 50,   ME: 40,   GE: 20   }},
  navEmissionNulle:    { "-":     { PE: 60,   ME: 50,   GE: 30   }},
  amelioContrefactuel: { hors:    { PE: 50,   ME: 40,   GE: 30   },
                         zoneC:   { PE: 55,   ME: 45,   GE: 35   },
                         zoneA:   { PE: 65,   ME: 55,   GE: 45   }},
  amelioSans:          { hors:    { PE: 25,   ME: 20,   GE: 15   },
                         zoneC:   { PE: 27.5, ME: 22.5, GE: 17.5 },
                         zoneA:   { PE: 32.5, ME: 27.5, GE: 22.5 }},
  etudes:              { "-":     { PE: 80,   ME: 70,   GE: 60   }},
  // Thématique 2 : Investissements industriels (PME hors zone AFR)
  industrielPME:       { hors:    { PE: 20,   ME: 10,   GE: 0    },
                         zoneC:   { PE: 35,   ME: 25,   GE: 15   },
                         zoneA:   { PE: 70,   ME: 60,   GE: 50   }},
};

// --- Catégorisation des dépenses ADEME (Guide 2026, type "Investissement") ---
// Source: Guide de catégorisation des dépenses ADEME 2026, page 5
const ADEME_EXPENSE_CATS: ExpenseCat[] = [
  { id: "equip_prop",  l: "Équipements de propulsion bas carbone",     poste: "Équipements / Investissements", sub: "Équipements process",         ex: "Moteur hybride, pod électrique, pile H₂" },
  { id: "equip_stock", l: "Systèmes de stockage d'énergie",           poste: "Équipements / Investissements", sub: "Équipements process",         ex: "Batteries LFP, réservoirs H₂" },
  { id: "infra",       l: "Infrastructure de charge / avitaillement",  poste: "Équipements / Investissements", sub: "Aménagements et constructions", ex: "Bornes, câbles, transformateurs" },
  { id: "ing_ext",     l: "Ingénierie réalisée en externe",           poste: "Équipements / Investissements", sub: "Ingénierie d'investissement", ex: "MOE, AMO, études, classification" },
  { id: "trav_modif",  l: "Travaux de modification / adaptation",     poste: "Équipements / Investissements", sub: "Autres équipements",          ex: "Adaptation coque, réseaux bord" },
  { id: "certif",      l: "Certification et classification",          poste: "Équipements / Investissements", sub: "Logiciels et brevets",        ex: "Bureau Veritas, DNV, essais" },
  { id: "moe_int",     l: "Maîtrise d'œuvre interne",                 poste: "Personnel",                     sub: "MOE réalisée en interne",      ex: "Plafonné 10% coût total", plafond: 0.10 },
  { id: "formation",   l: "Formation équipage STCW",                  poste: "Autres dépenses",               sub: "Prestations extérieures",      ex: "Plafonné 10% dépenses éligibles", plafond: 0.10 },
  { id: "certif_dep",  l: "Certification contrôle des dépenses",      poste: "Autres dépenses",               sub: "Certification",                ex: "CAC ou expert-comptable" },
  { id: "charges_cx",  l: "Charges connexes (forfaitaire 20%)",       poste: "Charges connexes",              sub: "Forfaitaire",                  ex: "Frais de structure, max 20%", plafond: 0.20 },
];

// --- DNSH : 6 objectifs de la Taxonomie UE ---
// Source: CdC AAP ADEME 2026, Annexe 1 (art. 17 règlement 2020/852)
const DNSH_AXES: DnshAxis[] = [
  { id: "attenuation",    l: "Atténuation du changement climatique",         icon: "🌡️", auto: true,  template: "Le projet réduit les émissions de {co2} tCO₂/an (−{pctCo2}% vs référence), contribuant directement à l'objectif OMI de −20% en 2030." },
  { id: "adaptation",     l: "Adaptation au changement climatique",          icon: "🌊", auto: false, template: "Les équipements installés sont conçus pour fonctionner dans les conditions climatiques projetées (hausse du niveau marin, tempêtes plus fréquentes). Durée de vie de conception ≥ 15 ans." },
  { id: "eau",            l: "Utilisation durable de l'eau et ressources marines", icon: "💧", auto: false, template: "Le navire respecte la Convention BWM (gestion des eaux de ballast). Aucun rejet polluant additionnel. Peintures antifouling conformes Convention AFS 2001." },
  { id: "circulaire",     l: "Économie circulaire",                          icon: "♻️", auto: false, template: "Les equipements installes sont concus pour etre recycles en fin de vie. Filiere de recyclage identifiee (batteries : SNAM/Eramet 95% ; composants moteur : filieres metallurgiques certifiees)." },
  { id: "pollution",      l: "Prévention et réduction de la pollution",      icon: "🏭", auto: true,  template: "Réduction de {sox} t SOx/an, {nox} t NOx/an et {pm} t PM/an par rapport au scénario de référence." },
  { id: "biodiversite",   l: "Protection de la biodiversité",                icon: "🐟", auto: false, template: "Le projet reduit les nuisances sur la faune marine : reduction du bruit sous-marin (objectif < 160 dB re 1 uPa RMS, ref. DNV Silent Class) et/ou reduction des emissions polluantes en zone cotiere. Antifouling sans biocides toxiques." },
];


// --- Base de cas de référence sourcés ---
/**
 * dimBiofuel · Estimation couts conversion biocarburant
 * Sources : Ship Universe 2025, DNV White Paper 2025, VPS Biofuels 2024
 */
function dimBiofuel(v: Vessel, techs: TechsMap | undefined, fuelMix: FuelMix): BiofuelResult | null {
  const pP = v.pP || 800;
  const gt = v.gt || 400;
  const hasFAME = (fuelMix.fame || 0) > 0;
  const hasHVO = (fuelMix.hvo || 0) > 0;
  const hasB30 = (fuelMix.b30 || 0) > 0;
  const hasBio = techs?.biofuel?.a || hasFAME || hasHVO;
  const hasB30tech = techs?.biofuel_b30?.a || hasB30;
  const hasDual = techs?.dualfuel?.a || (fuelMix.lng || 0) > 0;
  if (!hasBio && !hasB30tech && !hasDual) return null;

  let tankClean = 0, filterUpgrade = 0, sealReplace = 0, fuelHeating = 0;
  let monitoring = 0, certification = 0, engineConv = 0, tankInstall = 0, safety = 0;
  const notes: string[] = [];

  if (hasBio) {
    // Conversion HVO/FAME B100
    tankClean = Math.round(5 + gt * 0.02);  // 5-15 k€ selon taille
    filterUpgrade = Math.round(3 + pP * 0.005);  // 3-10 k€
    if (hasFAME) {
      sealReplace = Math.round(5 + pP * 0.01);  // 5-20 k€ (joints non compatibles FAME)
      fuelHeating = Math.round(10 + pP * 0.01);  // 10-30 k€ (FAME fige a basse T)
      notes.push("FAME : remplacement joints, chauffage carburant (Ship Universe 2025)");
    }
    if (hasHVO) {
      notes.push("HVO : drop-in direct, modifications minimales (DNV 2025)");
    }
    monitoring = Math.round(2 + gt * 0.005);  // Monitoring qualite carburant
    certification = Math.round(5 + gt * 0.01);
    notes.push("Nettoyage cuves, filtration, essais (VPS 2024)");
  }

  if (hasB30tech && !hasBio) {
    // B30 seulement : quasi zero modif
    filterUpgrade = Math.round(1 + pP * 0.002);
    monitoring = 2;
    certification = 3;
    notes.push("B30 : sans modification moteur, filtration renforcee (ISO 8217:2024)");
  }

  if (hasDual) {
    // Conversion dual-fuel
    engineConv = Math.round(pP * 0.3);  // ~300 €/kW
    tankInstall = Math.round(gt * 0.15);  // Reservoirs GNL
    safety = Math.round(20 + gt * 0.02);  // Systemes securite
    certification = Math.round(15 + gt * 0.015);
    notes.push("Dual-fuel : conversion moteur, reservoirs, securite (estimation GASPE)");
  }

  const totalEquip = tankClean + filterUpgrade + sealReplace + fuelHeating + monitoring + engineConv + tankInstall + safety;
  const ingenierie = Math.round(totalEquip * 0.08);

  return {
    tankClean, filterUpgrade, sealReplace, fuelHeating, monitoring, certification,
    engineConv, tankInstall, safety, ingenierie,
    totalEquip, total: totalEquip + ingenierie + certification,
    notes, hasBio, hasB30tech, hasDual
  };
}

// Algorithme matchCases() : score de pertinence 0-100% sur 7 critères
const CASE_DB: CaseRef[] = [
  { id:"ampere", n:"MF Ampere", co:"NO", yr:2015, vt:["bac","ferry"], tr:["full_elec"], loa:80, batt:1000, rot:34, nm:3.2, retro:false,
    co2:-570, nox:-15, s:"Norled 2025; Siemens Energy; EAFO", d:"80m alu catamaran, 120 véh./360 pax, Lavik-Oppedal. 1 MWh Corvus. Réduction 95% GES. > 100 000 traversées." },
  { id:"ellen", n:"E-ferry Ellen", co:"DK", yr:2019, vt:["ferry"], tr:["full_elec"], loa:60, batt:4300, rot:7, nm:22, retro:false,
    co2:-2520, nox:-14.3, s:"EU Horizon 2020 #636027; HKF Marineconsult 2022", d:"60m, 31 voi./198 pax, Ærø-Fynshav (22 NM). 4,3 MWh Leclanchè. −2 520 tCO₂/an." },
  { id:"lamelec", n:"LAMELEC", co:"FR", yr:2026, vt:["lamanage"], tr:["full_elec"], loa:15, batt:500, rot:15, nm:0, retro:false,
    co2:-150, nox:0, s:"GASPE/OCEA/VEBRAT; Bpifrance PULSE; CMA CGM Fonds décarb.", d:"Premier lamaneur 100% électrique français. OCEA (Les Sables). Loire estuaire." },
  { id:"volta1", n:"Volta 1 (Anvers)", co:"BE", yr:2024, vt:["lamanage"], tr:["full_elec"], loa:28, batt:2782, rot:0, nm:0, retro:false,
    co2:-400, nox:0, s:"Port of Antwerp-Bruges 2024; Damen Shipyards", d:"Remorqueur RSD LTO 2 782 kWh, 70 t traction. Premier remorqueur électrique européen." },
  { id:"basto_hybrid", n:"Bastø Fosen (hybrides)", co:"NO", yr:2021, vt:["ferry"], tr:["hybride"], loa:139, batt:4300, rot:0, nm:5.4, retro:true,
    co2:-1500, nox:0, s:"Bastø Fosen / Siemens 2022; Bellona", d:"2 ferries diesel→hybride + 1 newbuild, Moss-Horten. −75% CO₂, −6 M litres diesel/an." },
  { id:"seachange", n:"Sea Change", co:"US", yr:2024, vt:["navette"], tr:["h2"], loa:21, batt:0, rot:0, nm:0, retro:false,
    co2:0, nox:0, s:"ScienceDirect 2025 (IJHE); WETA/CARB", d:"75 pax, pile H₂ haute pression. Premier ferry H₂ commercial au monde. SF Bay." },
  { id:"dublin_hvo", n:"Dublin Port HVO Trial", co:"IE", yr:2023, vt:["navette","fret"], tr:["hvo"], loa:15, batt:0, rot:0, nm:0, retro:false,
    co2:-85, nox:0, s:"Dublin Port Company 2023; Certa", d:"4 pilotines, 100% HVO drop-in. Réduction 80-90% CO₂ sans modification moteur." },
  { id:"medstraum", n:"MS Medstraum", co:"NO", yr:2022, vt:["navette"], tr:["full_elec"], loa:31, batt:1500, rot:0, nm:0, retro:false,
    co2:-500, nox:0, s:"EU TrAM Project; Kolombus; EAFO", d:"31m catamaran, 150 pax, 23 nœuds. Premier ferry rapide 100% électrique." },
  { id:"lca_2025", n:"Étude LCA ferries électriques", co:"INT", yr:2025, vt:["bac","ferry","navette"], tr:["full_elec","hybride"], loa:0, batt:0, rot:0, nm:0, retro:false,
    co2:-90, nox:0, s:"ScienceDirect, Applied Energy 2025 (peer-reviewed)", d:"LCA complète : −90% GES, −75% acidification, −70% PM. CMA ~100 €/tCO₂. LFP préférable." },
  { id:"shiftr", n:"SHIFTR (Norled)", co:"NO", yr:2026, vt:["navette"], tr:["full_elec"], loa:0, batt:0, rot:0, nm:0, retro:true,
    co2:-3000, nox:0, s:"Business Norway 2024; Norled; DNV", d:"Swap batterie autonome. Retrofit Oslofjord : −1 M litres diesel, −3 000 tCO₂/an." },
  { id:"candela_p12", n:"Candela P-12 Shuttle", co:"SE", yr:2024, vt:["navette"], tr:["full_elec"], loa:12, batt:180, rot:0, nm:9, retro:false,
    co2:-100, nox:0, s:"Candela Technology 2024; Stockholm SL", d:"Hydroptere electrique 30 pax, 30 nds. 80% moins de consommation vs ferry classique.", url:"https://candela.com/p-12-shuttle/" },
  { id:"at1_auckland", n:"AT1 (EV Maritime)", co:"NZ", yr:2025, vt:["navette"], tr:["full_elec"], loa:24, batt:1075, rot:0, nm:10, retro:false,
    co2:-300, nox:0, s:"EV Maritime 2025; Auckland Transport", d:"200 pax, 25 nds, coque carbone. 1 075 kWh Freudenberg, 4x Danfoss 300 kW.", url:"https://www.evmaritime.co.nz" },
  { id:"hull096", n:"Hull 096 (Buquebus/Incat)", co:"UY", yr:2025, vt:["ferry"], tr:["full_elec"], loa:130, batt:40000, rot:0, nm:30, retro:false,
    co2:-10000, nox:0, s:"Incat 2025; IEEE Spectrum jan. 2026", d:"Plus grand navire electrique au monde. 130m, 2 100 pax, 225 veh., 40 MWh, 8 waterjets.", url:"https://spectrum.ieee.org/electric-boat-battery-ship-ferry" },
  { id:"wsf_hybrid", n:"Washington State Ferries", co:"US", yr:2025, vt:["ferry","bac"], tr:["hybride"], loa:100, batt:0, rot:0, nm:0, retro:true,
    co2:-5000, nox:0, s:"WSDOT 2025; ABB Marine & Ports", d:"Programme 16 ferries hybrides d'ici 2040. Retrofit Jumbo Mark II (160 vehicules). ABB propulsion.", url:"https://wsdot.wa.gov/construction-planning/major-projects/ferry-system-electrification" },
  { id:"sf_bay", n:"SF Bay Ferry (electrique)", co:"US", yr:2025, vt:["navette"], tr:["full_elec"], loa:30, batt:0, rot:0, nm:0, retro:false,
    co2:-500, nox:0, s:"Wartsila mai 2025; All American Marine", d:"3 ferries rapides full-electriques, 24 nds, 30m. Propulsion Wartsila. Premiers du genre aux USA.", url:"https://www.wartsila.com/media/news/28-05-2025-wartsila-to-supply-the-electric-propulsion-system-for-usa-s-first-battery-electric-zero-emission-high-speed-passenger-ferries-3590753" },
  { id:"stmalo", n:"Saint-Malo (Brittany Ferries)", co:"FR", yr:2025, vt:["ferry"], tr:["hybride"], loa:170, batt:0, rot:0, nm:0, retro:false,
    co2:-2000, nox:0, s:"Brittany Ferries 2024; Stena RoRo", d:"Hybride GNL/batterie, 1 400 pax. Premier ferry hybride transmanche francais.", url:"https://www.brittany-ferries.fr" },
  { id:"te_ferries", n:"Etude T&E electrification ferries EU", co:"EU", yr:2025, vt:["bac","ferry","navette"], tr:["full_elec","hybride"], loa:0, batt:0, rot:0, nm:0, retro:false,
    co2:0, nox:0, s:"Transport & Environment, mars 2026 (peer-reviewed)", d:"20% des ferries EU rentables en electrique des 2025. 52% en 2035. France : 11% eligible.", url:"https://www.transportenvironment.org/articles/full-charge-ahead-investigating-the-potential-to-electrify-europes-ferries" },
  { id:"irish_hvo", n:"Irish Ferries Dublin Swift (HVO)", co:"IE", yr:2024, vt:["ferry","vedette"], tr:["biofuel"], loa:86, batt:0, rot:0, nm:0, retro:false,
    co2:-3000, nox:0, s:"Irish Times 2024; Circle K Ireland", d:"Catamaran rapide, premier navire Irish Ferries au HVO100. Reduction 80-90% CO2 sans modification moteur.", url:"https://www.irishferries.com" },
  { id:"norden_b100", n:"Norden B100 Singapore", co:"DK", yr:2024, vt:["fret"], tr:["biofuel"], loa:180, batt:0, rot:0, nm:0, retro:false,
    co2:-5000, nox:0, s:"NORDEN/BHP 2024; Bunkerspot", d:"Premier bunkering B100 complet a Singapour (mai 2024). Drop-in sur vraquier existant, zero retrofit.", url:"https://www.norden.com" },
  { id:"hgk_hvo", n:"HGK Shipping HVO fluvial", co:"DE", yr:2024, vt:["fret","bac"], tr:["biofuel"], loa:110, batt:0, rot:0, nm:0, retro:false,
    co2:-2000, nox:0, s:"HGK Shipping 2024; Biofuels International", d:"Plus grand armement fluvial europeen. Flotte au HVO100. Reduction 90% GES sans retrofit.", url:"https://www.hgk-shipping.de" },
  { id:"biofuel_express", n:"Biofuel Express (ports nordiques)", co:"DK", yr:2025, vt:["bac","ferry","navette","fret"], tr:["biofuel","biofuel_b30"], loa:0, batt:0, rot:0, nm:0, retro:false,
    co2:0, nox:0, s:"Biofuel Express / BlackCoral Energy 2025", d:"Avitaillement HVO100 et B100 dans les ports du Danemark, sud Norvege, Suede et nord Allemagne.", url:"https://www.biofuel-express.com" },
  { id:"dnv_biofuel_wp", n:"Etude DNV biocarburants maritimes", co:"INT", yr:2025, vt:["bac","ferry","navette","fret","vedette"], tr:["biofuel","biofuel_b30"], loa:0, batt:0, rot:0, nm:0, retro:false,
    co2:0, nox:0, s:"DNV White Paper 2025; Interviews armateurs", d:"1.6 Mt biocarburants maritimes en 2024 (Singapour + Rotterdam). B24/B30 a +30-60% vs VLSFO. Drop-in = zero retrofit.", url:"https://www.dnv.com/expert-story/maritime-impact/maximizing-the-potential-of-biofuels-in-shipping/" },
];

function matchCases(proj: Project | null): CaseRefScored[] {
  if (!proj) return [];
  const v = proj.v;
  const fuelMix = proj.trajs?.[1]?.fuelMix || {};
  const techs = proj.trajs?.[1]?.techs || {};
  const trTypes: string[] = [];
  if (fuelMix.elec > 50 && !fuelMix.mdo) trTypes.push("full_elec");
  else if (fuelMix.elec > 0) trTypes.push("hybride");
  if (fuelMix.hvo > 0) trTypes.push("hvo");
  if (fuelMix.fame > 0) trTypes.push("fame");
  if (fuelMix.h2 > 0) trTypes.push("h2");
  if (fuelMix.hvo > 0 || fuelMix.fame > 0 || fuelMix.b30 > 0) trTypes.push("biofuel");
  if (techs.fullelec?.a) trTypes.push("full_elec");
  if (techs.hybride?.a) trTypes.push("hybride");
  return CASE_DB.map(c => {
    let score = 0;
    if (c.vt.includes(v.type)) score += 30;
    else if (c.vt.some(t => ["bac","ferry"].includes(t)) && ["bac","ferry"].includes(v.type)) score += 15;
    const trMatch = c.tr.filter(t => trTypes.includes(t));
    score += trMatch.length * 25;
    if (c.loa > 0 && v.loa > 0) { const r = Math.abs(c.loa - v.loa) / Math.max(c.loa, v.loa); score += Math.round((1 - r) * 15); }
    if (c.batt > 0) { const bd = dimBatt(v); if (bd.kWh > 0) { const r = Math.abs(c.batt - bd.kWh) / Math.max(c.batt, bd.kWh); score += Math.round((1 - r) * 10); }}
    if (c.rot > 0 && v.rD > 0) { const r = Math.abs(c.rot - v.rD) / Math.max(c.rot, v.rD); score += Math.round((1 - r) * 8); }
    return { ...c, score };
  }).filter(c => c.score > 15).sort((a, b) => b.score - a.score).slice(0, 5);
}

// --- Deadline de l'AAP ---
const AAP_DEADLINE = new Date("2026-07-06T23:59:00");
const AAP_PREDEPOT_DEADLINE = new Date("2026-06-22T23:59:00"); // 2 semaines avant clôture

// ============================================================================
// SECTION 2 : MOTEURS DE CALCUL
// ============================================================================

// --- Formatage ---
const fmt = (n: number | unknown, d = 0): string => typeof n === "number" ? n.toLocaleString("fr-FR", { maximumFractionDigits: d }) : " - ";
const fK = (n: number): string => fmt(Math.round(n)) + " k€";
const fPct = (n: number): string => (n * 100).toFixed(1) + "%";

// --- Jours restants avant la deadline ---
function joursRestants(): number {
  const now = new Date();
  const diff = AAP_DEADLINE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// --- Prix carburant avec référencement utilisateur ---
function getFuelPrice(proj: Project, fid: string): number {
  const ref = proj.ref?.fuels?.find((x: FuelRef) => x.id === fid);
  return ref ? ref.price : (DEF_FUELS.find((x: FuelDef) => x.id === fid)?.price || 850);
}
function getFuelCO2(proj: Project, fid: string): number {
  const ref = proj.ref?.fuels?.find((x: FuelRef) => x.id === fid);
  return ref ? ref.co2 : (DEF_FUELS.find((x: FuelDef) => x.id === fid)?.co2 || 3.206);
}

/**
 * dimBatt · Dimensionnement batteries
 * Audité scientifiquement (janvier 2026, 22 cas de référence)
 * 
 * Méthode : max(contrainte énergie, contrainte puissance)
 * - Énergie : eTrip / 0.80 (SoC 10-90%, DNV Pt.6 Ch.2 Sec.1)
 * - Puissance : pPeak / 2C (Corvus Orca ESS, décharge continue 2C)
 * - Chargeur : eTrip / (qT/60) × 1.1 (ABB Marine 2022)
 * - Coût : 450 €/kWh installé maritime (Corvus 2024), 200 €/kW chargeur
 * - Cycles : 5000 à 80% DoD (Preger et al. 2020, LFP)
 */
function dimBatt(v: Vessel): BattResult {
  const pTr = (v.pTr || 60) / 100, pMa = (v.pMa || 20) / 100, pQu = (v.pQu || 20) / 100;
  const lf = pTr * 1.0 + pMa * Math.min(v.pPeak / v.pP, 1.5) + pQu * (v.pA / v.pP);
  const eTrip = v.pP * v.cDur / 60 * lf;
  const chargeMode = v.chargeMode || "opportunity";
  let e_energy;
  if (chargeMode === "overnight") {
    // Recharge la nuit uniquement : batterie couvre toute la journee
    const tripsPerDay = v.rD * 2; // aller-retour
    e_energy = (eTrip * tripsPerDay) / 0.80;
  } else {
    // Opportunity charging : batterie couvre une traversee
    e_energy = eTrip / 0.80;
  }
  const cRate = 2;
  const e_power = v.pPeak / cRate;
  const kWh = Math.max(e_energy, e_power);
  const c = e_power > e_energy ? "puissance" : "énergie";
  let cP;
  if (chargeMode === "overnight") {
    // Recharge nocturne : 8h pour charger toute la journee
    const nightHours = 8;
    const tripsDay = v.rD * 2;
    cP = (eTrip * tripsDay) / nightHours * 1.1;
  } else {
    // Opportunity : recharge pendant le temps au quai
    cP = eTrip / (v.qT / 60) * 1.1;
  }
  const dod = Math.min(0.80, eTrip / kWh);
  const eqCyclesAn = v.rD * v.opD * dod / 0.80;
  const lifeCycles = 5000;
  const lifeYrs = Math.max(3, Math.round(lifeCycles / Math.max(1, eqCyclesAn)));
  const costPerKwh = 450; // €/kWh installé maritime (Corvus Orca 2024, incl. BMS/refroid./certif. BV NR 547)
  const costPerKwCharger = 200;
  const gridConnect = cP > 2000 ? 500 : cP > 1000 ? 350 : cP > 500 ? 200 : cP > 200 ? 100 : 50;
  return {
    kWh: Math.round(kWh), constraint: c, chargePower: Math.round(cP),
    eTrip: Math.round(eTrip), loadFactor: Math.round(lf * 1000) / 1000,
    costBatt: Math.round(kWh * costPerKwh / 1000),
    costCharger: Math.round(cP * costPerKwCharger / 1000),
    gridConnect, eqCyclesAn: Math.round(eqCyclesAn),
    dod: Math.round(dod * 100), lifeCycles, lifeYrs,
    cRate, costPerKwh,
  };
}

/**
 * compute · Moteur CCV (Coût de Cycle de Vie)
 * ISO 15686-5 adapté maritime
 * 
 * Pour chaque trajectoire : calcule CCV actualisé, émissions CO₂ cumulées,
 * en 3 scénarios (base, dégradé, favorable).
 */
function compute(proj: Project): TrajectoryResult[] {
  const { v, p, trajs } = proj;
  const N = p.dur; const r = p.disc / 100; const fg = p.fpG / 100;
  const pTr = (v.pTr || 60) / 100, pMa = (v.pMa || 20) / 100, pQu = (v.pQu || 20) / 100;
  const loadFactor = pTr * 1.0 + pMa * Math.min(v.pPeak / v.pP, 1.5) + pQu * (v.pA / v.pP);
  // fc est en L/h, CO₂ en kgCO₂/kg → conversion par densité MDO 0.85 kg/L
  // Source : ISO 8217:2017, DMB grade, densité typique 0.840-0.890 kg/L
  const MDO_DENSITY = 0.85; // kg/L
  const hFuel = v.fc * MDO_DENSITY * v.opD * (v.rD * v.cDur / 60) / 1000 * loadFactor;
  const battLife = dimBatt(v).lifeYrs;
  return trajs.map((tj: Trajectory, ti: number) => {
    const at = Object.entries(tj.techs || {}).filter(([, x]) => (x as TechConfig)?.a);
    const totI = (tj.iC || 0) + (tj.iE || 0) + (tj.iI || 0) + (tj.gridCost || 0);
    const contA = totI * p.cont / 100;
    const calc = (cs: string) => {
      let cC = 0, cCO2 = 0; const yrs: YearResult[] = [];
      for (let t = 0; t < N; t++) {
        const yr = p.sy + t; const df = Math.pow(1 + r, t);
        const fp = getFuelPrice(proj, "mdo") * Math.pow(1 + fg, t);
        const mix: FuelMix = tj.fuelMix || { mdo: 100 };
        const mixT = Object.values(mix).reduce((a: number, b: number) => a + b, 0) || 100;
        let wCO2 = 0, wCost = 0;
        Object.entries(mix).forEach(([fid, pct]: [string, number]) => {
          if (pct > 0) {
            const sh = pct / mixT;
            wCO2 += sh * (getFuelCO2(proj, fid) / 3.206);
            wCost += sh * (getFuelPrice(proj, fid) / 850);
          }
        });
        if (wCO2 === 0) { wCO2 = 1; wCost = 1; }
        // Dégradation moteur fossile : +1.5%/an pour la trajectoire de référence
        // Source : MAN Energy Solutions 2023, typical SFOC degradation for medium-speed diesels
        const fossilDeg = ti === 0 ? Math.pow(1.015, t) : 1; // +1.5%/an conso fossile
        let prd = fossilDeg;
        at.forEach(([tid, cfg]: [string, TechConfig]) => {
          const tech = TECHS.find(x => x.id === tid);
          if (tech) {
            const depY = (cfg.year || p.sy) - p.sy;
            if (t >= depY) {
              const g = cs === "deg" ? tech.gM * 0.7 : cs === "fav" ? Math.min(tech.gH, 1) : tech.gM;
              prd *= (1 - g);
            }
          }
        });
        const inv = t === 0 ? totI + contA : 0;
        const fC = hFuel * prd;
        const en = fC * wCost * fp / 1000;
        const ex = v.opex + (ti === 0 ? 0 : at.reduce((s, [tid]) => {
          const t2 = TECHS.find(x => x.id === tid); return s + (t2 ? t2.ox : 0);
        }, 0));
        const cr = v.crew;
        const insElec = Object.keys(mix).some(k => ["elec", "h2"].includes(k) && mix[k] > 50);
        const insHybrid = Object.keys(mix).some(k => k === "elec" && mix[k] > 10 && mix[k] <= 50);
        const insH2 = Object.keys(mix).some(k => k === "h2" && mix[k] > 10);
        const ins = v.ins + (ti === 0 ? 0 : (insH2 ? v.ins * 0.5 : insElec ? v.ins * 0.35 : insHybrid ? v.ins * 0.2 : 0));
        const dd = (t > 0 && t % v.ddC === 0) ? v.dd : 0;
        const bt = (tj.iE > 0 && battLife > 0 && t > 0 && t % battLife === 0) ? tj.iE * 0.4 : 0;
        const decom = (t === N - 1 && tj.iE > 0) ? tj.iE * 0.15 : 0;
        const tot = inv + ex + en + cr + ins + dd + bt + decom;
        const disc = tot / df;
        const co2 = fC * 3.206 * wCO2;
        cC += disc; cCO2 += co2;
        yrs.push({ yr, inv, ex, en, cr, ins, dd: dd + bt + decom, tot, disc, co2, cC, cCO2 });
      }
      const rvN = v.mktV * Math.max(0, 1 - N / (v.lifeR + 5)) * 0.7;
      const rvB = cs === "fav" ? (tj.iE || 0) * 0.1 : 0;
      return { ccv: cC - (rvN + rvB) / Math.pow(1 + r, N), co2: cCO2, rv: rvN + rvB, yrs };
    };
    return {
      name: tj.name, idx: ti, totI: totI + contA,
      gain: { m: 1 - at.reduce((p2, [tid]) => { const t2 = TECHS.find(x => x.id === tid); return p2 * (1 - (t2?.gM || 0)); }, 1) },
      base: calc("base"), deg: calc("deg"), fav: calc("fav"),
    };
  });
}

/**
 * classifyVessel · Classification ADEME du navire
 * Source: CdC p.10 (définitions RGEC art. 36 ter)
 *
 * - "emissionNulle" : 0% émissions CO₂ au tuyau d'échappement
 * - "propre" : ≥ 25% énergie zéro-CO₂ ou EEDI −10%
 * - "efficace" : plus efficace que le contrefactuel
 */
function classifyVessel(fuelMix: FuelMix | undefined): string {
  if (!fuelMix) return "efficace";
  const mixT = Object.values(fuelMix).reduce((a: number, b: number) => a + b, 0) || 100;
  const zeroPct = Object.entries(fuelMix)
    .filter(([fid]) => ["elec", "h2", "ops"].includes(fid))
    .reduce((s: number, [, pct]: [string, number]) => s + pct, 0) / mixT;
  if (zeroPct >= 0.99) return "emissionNulle";
  if (zeroPct >= 0.25) return "propre";
  return "efficace";
}

/**
 * computeAide · Calcul de l'aide ADEME
 * Source: CdC AAP 2026, Annexe 2 + Guide aides d'État
 *
 * aide = min(surcoût × taux_LDACEE, 6 000 000 €)
 * taux dépend de : classification navire, taille entreprise, zone AFR,
 * et existence d'un scénario contrefactuel crédible
 */
function computeAide(proj: Project, surcout: number): AideResult {
  const { v } = proj;
  const cls = classifyVessel(proj.trajs?.[1]?.fuelMix);
  const size = v.entSize || "PE";
  const zone = v.zoneAFR || "hors";
  let taux = 0;
  let regime = "";

  if (cls === "emissionNulle") {
    taux = ADEME_RATES.navEmissionNulle["-"]?.[size] ?? 0;
    regime = "Navire à émission nulle (Section 6.3, SA.111726)";
  } else if (cls === "propre") {
    taux = ADEME_RATES.navPropre["-"]?.[size] ?? 0;
    regime = "Navire propre (Section 6.3, SA.111726)";
  } else {
    // Efficacité énergétique · taux dépend du contrefactuel
    const hasContref = proj.contrefactuel?.type && proj.contrefactuel?.type !== "aucun";
    if (hasContref) {
      taux = ADEME_RATES.amelioContrefactuel[zone]?.[size] || 30;
      regime = "Efficacité avec contrefactuel (Section 6.4, SA.111726)";
    } else {
      taux = ADEME_RATES.amelioSans[zone]?.[size] || 15;
      regime = "Efficacité sans contrefactuel · taux réduit (Section 6.4, SA.111726)";
    }
  }

  const aide = Math.min(surcout * taux / 100, 6000, surcout); // plafonné à 6M€ ET au surcoût
  return { taux, aide, regime, cls, plafond: 6000 };
}

/**
 * computeScoring · Simulation de la notation ADEME (100 points)
 * Source: CdC AAP 2026, pp. 27-29
 *
 * Période de référence thématique 1 : 5 ans
 * Le score est indicatif · l'ADEME classe les projets entre eux
 */
function computeScoring(proj: Project, res: TrajectoryResult[] | null, aide: number): ScoringResult | null {
  if (!res || res.length < 2) return null;
  const ref = res[0];   // trajectoire actuelle (fossile)
  const alt = res[1];   // trajectoire décarbonée

  // Période de référence : 5 ans
  const refYears = Math.min(5, ref.base.yrs.length);
  const co2Ref = ref.base.yrs.slice(0, refYears).reduce((s: number, y: YearResult) => s + y.co2, 0);
  const co2Alt = alt.base.yrs.slice(0, refYears).reduce((s: number, y: YearResult) => s + y.co2, 0);
  const co2Evite = co2Ref - co2Alt; // en tonnes

  // 1. Efficacité environnementale (45 pts)
  // Sous-critère 1 (15 pts) : quantité absolue · on ne peut pas comparer aux autres projets,
  // mais on donne une estimation basée sur les ordres de grandeur typiques GASPE
  const typicalMaxCO2 = 5000; // tCO₂ évitées sur 5 ans pour un gros ferry full-elec
  const noteQuantite = Math.min(15, 15 * co2Evite / typicalMaxCO2);

  // Sous-critère 2 (30 pts) : gain relatif
  const gainPct = co2Ref > 0 ? 1 - co2Alt / co2Ref : 0;
  const noteGain = 30 * gainPct;

  const noteEnviron = noteQuantite + noteGain;

  // 2. Efficacité des aides publiques (25 pts)
  const aideTotale = aide || 0; // k€
  const ratioEuroParTonne = co2Evite > 0 ? (aideTotale * 1000) / co2Evite : Infinity;
  let noteAide = 0;
  if (ratioEuroParTonne > 200) {
    noteAide = -5; // pénalité éliminatoire
  } else {
    const typicalBest = 30; // €/tCO₂ pour un excellent projet
    noteAide = Math.min(25, 25 * typicalBest / Math.max(1, ratioEuroParTonne));
  }

  // 3. Qualité technico-économique (30 pts) · estimation qualitative
  let noteTechEco = 0;
  // TRL (max 5 pts)
  const minTRL = Math.min(...Object.entries(proj.trajs?.[1]?.techs || {})
    .filter(([, x]) => (x as TechConfig)?.a)
    .map(([tid]) => TECHS.find(t => t.id === tid)?.trl || 7));
  noteTechEco += minTRL >= 9 ? 5 : minTRL >= 8 ? 4 : 3;
  // Réduction hors-GES (max 5 pts)
  if (gainPct > 0.5) noteTechEco += 5;
  else if (gainPct > 0.2) noteTechEco += 3;
  else noteTechEco += 1;
  // Socle de base pour dossier GASPE structuré (10 pts)
  noteTechEco += 10;
  // Localisation FR (max 10 pts)
  noteTechEco += 10;

  const total = noteEnviron + noteAide + noteTechEco;
  return {
    total: Math.round(total * 10) / 10,
    noteEnviron: Math.round(noteEnviron * 10) / 10,
    noteAide: Math.round(noteAide * 10) / 10,
    noteTechEco: Math.round(noteTechEco * 10) / 10,
    co2Evite: Math.round(co2Evite),
    co2Ref: Math.round(co2Ref),
    co2Alt: Math.round(co2Alt),
    gainPct: Math.round(gainPct * 1000) / 10,
    ratioEuroParTonne: Math.round(ratioEuroParTonne),
    // Incitativité : TRI avec et sans aide
    triSansAide: null, // calculé dans le composant avec les cash-flows
    triAvecAide: null,
    refYears,
  };
}


/**
 * computeTRI - Taux de Rentabilité Interne (Newton-Raphson)
 * Exigence CdC p.28 : TRI avant impôts, après toutes aides publiques
 * Calculé sur les cash-flows différentiels (projet décarboné vs contrefactuel)
 */
function computeTRI(cashflows: number[]): number | null {
  if (!cashflows || cashflows.length < 2) return null;
  let r = 0.10; // estimation initiale 10%
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const df = Math.pow(1 + r, t);
      npv += cashflows[t] / df;
      dnpv -= t * cashflows[t] / (df * (1 + r));
    }
    if (Math.abs(npv) < 0.01) break;
    if (Math.abs(dnpv) < 1e-10) break;
    r = r - npv / dnpv;
    if (r < -0.5) r = -0.5;
    if (r > 2) r = 2;
  }
  return Math.round(r * 10000) / 100; // en %
}
// ============================================================================
// SECTION 3 : COMPOSANTS UI RÉUTILISABLES
// ============================================================================

// --- Tooltip informatif ---
const Tip = ({ text }: { text: string }) => {
  const [o, setO] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); setO(!o); }}
        className="inline-flex items-center justify-center rounded-full text-white font-bold"
        style={{ width: 16, height: 16, fontSize: 9, backgroundColor: T, cursor: "pointer" }}>i</button>
      {o && <div className="absolute z-50 bottom-6 left-0 p-3 rounded-lg text-xs leading-relaxed"
        style={{ width: 280, background: D, color: "#e8ecef", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
        <button onClick={e => { e.stopPropagation(); setO(false); }} className="absolute top-1 right-2 text-xs" style={{ color: "#888" }}>✕</button>
        {text}
      </div>}
    </span>
  );
};

// --- Input numérique ---
const In = ({ l, v, onChange: oc, t = "number", u, n, min, h }: { l: string; v: string | number; onChange: (val: number) => void; t?: string; u?: string; n?: string; min?: number; h?: string }) => (
  <div className="mb-2">
    <label className="block text-xs font-semibold mb-0.5" style={{ color: D }}>{l}{h && <Tip text={h} />}</label>
    <div className="flex items-center gap-1">
      <input type={t} value={v} min={min || 0}
        onChange={e => oc(Math.max(min || 0, parseFloat(e.target.value) || 0))}
        className="border rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2"
        style={{ borderColor: "#ddd", outlineColor: T }} />
      {u && <span className="text-xs shrink-0" style={{ color: "#aaa" }}>{u}</span>}
    </div>
    {n && <p className="text-xs mt-0.5" style={{ color: "#bbb" }}>{n}</p>}
  </div>
);

// --- Select ---
const Se = ({ l, v, onChange: oc, opts, h }: { l: string; v: string | number; onChange: (val: string) => void; opts: Array<{ v: string | number; l: string }>; h?: string }) => (
  <div className="mb-2">
    <label className="block text-xs font-semibold mb-0.5" style={{ color: D }}>{l}{h && <Tip text={h} />}</label>
    <select value={v} onChange={e => oc(e.target.value)}
      className="border rounded px-2 py-1.5 text-sm w-full" style={{ borderColor: "#ddd" }}>
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

// --- Card avec bordure accent ---
const Cd = ({ title: tl, children: ch, accent: ac, ...rest }: { title?: string; children: ReactNode; accent?: string; "data-protected"?: string }) => (
  <div className="rounded-xl border p-4 mb-3"
    style={{ borderColor: ac || "#e5e7eb", background: "white", borderLeftWidth: ac ? 3 : 1 }}>
    {tl && <h3 className="font-bold text-sm mb-2" style={{ color: D }}>{tl}</h3>}
    {ch}
  </div>
);

// --- Stat affichée ---
const St = ({ l, v, c = D }: { l: string; v: string; c?: string }) => (
  <div className="text-center p-2">
    <div className="text-lg font-bold" style={{ color: c }}>{v}</div>
    <div className="text-xs" style={{ color: "#999" }}>{l}</div>
  </div>
);

// --- Bannière deadline ---
const DeadlineBanner = () => {
  const j = joursRestants();
  const jpd = Math.max(0, Math.ceil((AAP_PREDEPOT_DEADLINE.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const urgent = j < 30;
  return (
    <div className="text-center py-2 px-4 text-sm font-bold"
      style={{ background: urgent ? AC : T, color: "white" }}>
      ⏱️ AAP ADEME 2026 · {j > 0 ? `J-${j} avant clôture (6 juillet 2026)` : "AAP CLÔTURÉ"}
      {jpd > 0 && jpd < j && <span className="ml-3 text-xs font-normal opacity-80">| Pré-dépôt : J-{jpd}</span>}
    </div>
  );
};

// --- Barre de progression 7 étapes ---
const STEPS: StepDef[] = [
  { n: 1, l: "Mon navire",       icon: "⚓", min: 5 },
  { n: 2, l: "Mon projet",       icon: "🔋", min: 8 },
  { n: 3, l: "Contrefactuel",    icon: "⚖️", min: 3 },
  { n: 4, l: "Gains & DNSH",     icon: "🌿", min: 5 },
  { n: 5, l: "Budget",           icon: "💰", min: 5 },
  { n: 6, l: "Aide & scoring",   icon: "📊", min: 2 },
  { n: 7, l: "Dossier",          icon: "📄", min: 2 },
];

const StepBar = ({ step, setStep, maxStep }: { step: number; setStep: (n: number) => void; maxStep: number }) => (
  <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto" style={{ background: "white", borderBottom: "1px solid #e5e7eb" }}>
    {STEPS.map(s => {
      const active = s.n === step;
      const done = s.n < step;
      const locked = s.n > maxStep;
      return (
        <button key={s.n} onClick={() => !locked && setStep(s.n)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
          style={{
            background: active ? T : done ? GR + "15" : "transparent",
            color: active ? "white" : done ? GR : locked ? "#ccc" : "#666",
            cursor: locked ? "not-allowed" : "pointer",
            border: active ? "none" : "1px solid " + (done ? GR + "40" : "#e5e7eb"),
            minWidth: 36,
          }}>
          <span className="font-bold">{done ? "\u2713" : s.n}</span>
          <span className="hidden sm:inline">{s.l}</span>
          {s.min && <span className="hidden md:inline text-xs opacity-60">~{s.min}min</span>}
        </button>
      );
    })}
  </div>
);

// ============================================================================
// SECTION 4 : APPLICATION PRINCIPALE · 7 ÉTAPES GUIDÉES
// ============================================================================

/**
 * État initial d'un projet ADEME
 */
function defProjet(): Project {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: "Nouveau projet ADEME",
    upd: new Date().toISOString(),
    thematique: 1, // 1 ou 2
    v: {
      type: "bac", name: "", entSize: "PE" as EntSize, zoneAFR: "hors" as ZoneAFR, chargeMode: "opportunity" as ChargeMode,
      ...VT[0].d,
    },
    p: { sy: 2026, dur: 15, disc: 5, cont: 12, fpG: 4 },
    ref: { fuels: DEF_FUELS.map(f => ({ id: f.id, price: f.price, co2: f.co2 })) },
    trajs: [
      { name: "Scénario fossile (référence)", fuelMix: { mdo: 100 }, techs: {}, iC: 0, iE: 0, iI: 0, gridCost: 0 },
      { name: "Projet décarbonation", fuelMix: {}, techs: {}, iC: 0, iE: 0, iI: 0, gridCost: 0 },
    ],
    contrefactuel: { type: "maintien", coutEntretien: 0 },
    budget: ADEME_EXPENSE_CATS.map(c => ({ id: c.id, montant: 0 })),
    dnsh: DNSH_AXES.map(a => ({ id: a.id, text: a.template, ok: true })),
  };
}

// --- Persistance localStorage multi-projet ---
const SK_LIST = "ademe2026_list";
function ldList(): ProjectListEntry[] {
  try { const r = localStorage.getItem(SK_LIST); return r ? JSON.parse(r) : []; } catch { return []; }
}
function svList(list: ProjectListEntry[]): void {
  try { localStorage.setItem(SK_LIST, JSON.stringify(list)); } catch { /* noop */ }
}
function ldProj(id: string): Project | null {
  if (!id) return null;
  try { const r = localStorage.getItem("ademe2026:" + id); return r ? JSON.parse(r) : null; } catch { return null; }
}
function svProj(p: Project): void {
  try {
    p.upd = new Date().toISOString();
    localStorage.setItem("ademe2026:" + p.id, JSON.stringify(p));
    const list = ldList();
    const entry: ProjectListEntry = { id: p.id, name: p.name, upd: p.upd, vType: p.v?.type, vName: p.v?.name };
    const idx = list.findIndex((x: ProjectListEntry) => x.id === p.id);
    if (idx >= 0) list[idx] = entry; else list.push(entry);
    svList(list);
  } catch { /* noop */ }
}
function rmProj(id: string): void {
  try {
    localStorage.removeItem("ademe2026:" + id);
    svList(ldList().filter((x: ProjectListEntry) => x.id !== id));
  } catch { /* noop */ }
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function AdemeSimulator() {
  const [projList, setProjList] = useState<ProjectListEntry[]>([]);
  const [proj, setProj] = useState<Project | null>(null);
  const [step, setStep] = useState(0); // 0 = accueil, 1-7 = étapes
  const [maxStep, setMaxStep] = useState(1);
  const [saved, setSaved] = useState(false);

  // Charger la liste des projets au montage
  useEffect(() => { setProjList(ldList()); }, []);

  // Sauvegarder à chaque modification
  const upd = useCallback((fn: ((prev: Project) => Project) | Partial<Project>) => {
    setProj(prev => {
      if (!prev) return prev;
      const next: Project = typeof fn === "function" ? fn(prev) : { ...prev, ...fn };
      svProj(next);
      setProjList(ldList());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      return next;
    });
  }, []);

  const uV = useCallback((k: string, val: unknown) => upd((p: Project) => ({ ...p, v: { ...p.v, [k]: val } })), [upd]);
  const uP = useCallback((k: string, val: unknown) => upd((p: Project) => ({ ...p, p: { ...p.p, [k]: val } })), [upd]);

  // Résultats CCV (mémoïsés)
  const res = useMemo(() => proj ? compute(proj) : null, [proj]);
  const batt = useMemo(() => proj ? dimBatt(proj.v) : null, [proj]);
  const bioEstim = useMemo(() => proj ? dimBiofuel(proj.v, proj.trajs?.[1]?.techs, proj.trajs?.[1]?.fuelMix || {}) : null, [proj]);

  // Avancer d'une étape
  const nextStep = () => {
    const ns = Math.min(step + 1, 7);
    setStep(ns);
    setMaxStep(m => Math.max(m, ns));
  };
  const prevStep = () => setStep(Math.max(1, step - 1));

  // --- Ouvrir un projet existant ---
  const openProj = (id: string) => {
    const p = ldProj(id);
    if (p) { setProj(p); setStep(1); setMaxStep(7); }
  };

  // --- Nouveau projet ---
  const newProj = () => {
    const p = defProjet();
    svProj(p);
    setProj(p);
    setProjList(ldList());
    setStep(1);
    setMaxStep(1);
  };

  // --- Supprimer un projet ---
  const deleteProj = (id: string) => {
    if (confirm("Supprimer ce projet ? Cette action est irréversible.")) {
      rmProj(id);
      setProjList(ldList());
      if (proj && proj.id === id) { setProj(null); setStep(0); }
    }
  };

  // --- Retour à la liste ---
  const backToList = () => {
    setProj(null);
    setStep(0);
    setProjList(ldList());
  };

  // ========================
  // ÉCRAN D'ACCUEIL · Liste des projets
  // ========================
  if (step === 0 || !proj) {
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #0a1628 0%, #1B3A4B 50%, #1B9AAA 100%)" }}>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <img src={GASPE_LOGO} alt="GASPE" style={{ height: 32, mixBlendMode: "screen" }} />
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Simulateur AAP ADEME 2026
          </h1>
          <p className="text-center text-sm mb-1" style={{ color: "#a8d8e0" }}>
            Décarbonation du transport et des services maritimes
          </p>
          <p className="text-center text-xs mb-6" style={{ color: "#7ab8c4" }}>
            70 M€ · Clôture le 6 juillet 2026 · J-{joursRestants()}
          </p>

          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)" }}>
            <p className="text-sm text-center mb-4" style={{ color: "#555" }}>
              Construisez votre pré-dossier ADEME en 7 étapes guidées.
              30 minutes pour un dossier structuré, chiffré et sourcé.
            </p>

            {/* Bannière webinaire ADEME */}
            <a href="https://www.b2match.com/e/aap-decarbonation-maritime/sign-up"
              target="_blank" rel="noopener"
              className="block w-full mb-4 p-3 rounded-xl text-xs"
              style={{ background: PU + "15", border: "1px solid " + PU + "40", textDecoration: "none", color: D }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 18 }}>📅</span>
                <div>
                  <div className="font-bold" style={{ color: PU }}>Webinaire ADEME · 21 avril 2026</div>
                  <div style={{ color: "#666" }}>Pôle Mer Bretagne Atlantique • Présentation de l'AAP</div>
                  <div className="font-bold mt-1" style={{ color: PU }}>→ S'inscrire</div>
                </div>
              </div>
            </a>

            {/* Liste des projets existants */}
            {projList.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold mb-2" style={{ color: D }}>Mes projets ({projList.length})</p>
                {projList.sort((a, b) => (b.upd || "").localeCompare(a.upd || "")).map(pr => (
                  <div key={pr.id} className="flex items-center gap-2 p-2 rounded-lg mb-1"
                    style={{ background: "#f8f9fb", border: "1px solid #e5e7eb" }}>
                    <button onClick={() => openProj(pr.id)} className="flex-1 text-left" style={{ background: "none", cursor: "pointer" }}>
                      <div className="text-sm font-medium" style={{ color: D }}>{pr.name}</div>
                      <div className="text-xs" style={{ color: "#999" }}>
                        {pr.vName || VT.find(x => x.id === pr.vType)?.l || " - "} • {pr.upd ? new Date(pr.upd).toLocaleDateString("fr-FR") : ""}
                      </div>
                    </button>
                    <button onClick={() => {
                      const src = ldProj(pr.id);
                      if (src) {
                        const dup = { ...src, id: Date.now().toString(36) + Math.random().toString(36).slice(2), name: src.name + " (copie)" };
                        svProj(dup); setProjList(ldList());
                      }
                    }} className="text-xs px-2 py-1 rounded" style={{ color: T, background: T + "10", cursor: "pointer" }}>⧉</button>
                    <button onClick={() => deleteProj(pr.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: AC, background: AC + "10", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={newProj}
              className="w-full py-3 rounded-xl text-sm font-bold mb-4"
              style={{ background: T, color: "white" }}>
              ✨ {projList.length > 0 ? "Nouveau projet" : "Démarrer mon dossier ADEME"}
            </button>

            <div className="text-xs text-center space-y-1" style={{ color: "#999" }}>
              <p>Thématique 1 : Décarbonation directe des navires</p>
              <p>Thématique 2 : Investissements industriels</p>
              <p className="font-medium" style={{ color: T }}>Budget min. 300 k€ (PME) · Aide max 6 M€</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6">
            <img src={GASPE_A_COULEUR} alt="" style={{ height: 24, borderRadius: 4 }} />
            <span className="text-xs" style={{ color: "#5a8a94" }}>
              Localement ancrées. Socialement engagées.
            </span>
          </div>
          <p className="text-xs text-center mt-1" style={{ color: "#3d6a74" }}>
            v2.0.2 · Propulsé par <a href="https://vaiata-dynamics.com/fr/" target="_blank" rel="noopener" style={{ color: "#7ab8c4" }}>VAIATA Dynamics</a>
          </p>
        </div>
      </div>
    );
  }

  // ========================
  // INTERFACE PRINCIPALE (7 ÉTAPES)
  // ========================

  // Calculs dérivés pour les étapes avancées
  // Surcoût éligible selon les 4 formules du CdC §1.4.1 (a-d)
  const surcout = (() => {
    const budgetTotal = proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || 0;
    const invStep2 = (proj.trajs?.[1]?.iC || 0) + (proj.trajs?.[1]?.iE || 0) + (proj.trajs?.[1]?.iI || 0) + (proj.trajs?.[1]?.gridCost || 0);
    const invDecarb = budgetTotal > 0 ? budgetTotal : invStep2 > 0 ? invStep2 : (res?.[1]?.totI || 0);
    if (invDecarb <= 0) return 0;
    const disc = proj.p.disc / 100 || 0.05;
    const dur = proj.p.dur || 15;
    const ct = proj.contrefactuel?.type;
    if (ct === "maintien") {
      const entAn = proj.contrefactuel?.coutEntretien || 0;
      const vanEntretien = disc > 0 ? entAn * ((1 - Math.pow(1 + disc, -dur)) / disc) : entAn * dur;
      return Math.max(0, invDecarb - vanEntretien);
    } else if (ct === "newbuild_fossile") {
      return Math.max(0, invDecarb - (proj.contrefactuel?.coutNewbuild || 0));
    } else if (ct === "reporté") {
      const delai = proj.contrefactuel?.delaiReport || 3;
      const vanReport = invDecarb / Math.pow(1 + disc, delai);
      return Math.max(0, invDecarb - vanReport);
    } else {
      return invDecarb;
    }
  })();

  const aide = computeAide(proj, surcout);
  const scoring = computeScoring(proj, res, aide.aide);

  // Émissions sur 5 ans pour le DNSH
  const emissionsRef5 = res?.[0]?.base?.yrs?.slice(0, 5) || [];
  const emissionsAlt5 = res?.[1]?.base?.yrs?.slice(0, 5) || [];
  const co2Ref5 = emissionsRef5.reduce((s: number, y: YearResult) => s + y.co2, 0);
  const co2Alt5 = emissionsAlt5.reduce((s: number, y: YearResult) => s + y.co2, 0);
  const hFuelBase = (() => {
    const v = proj.v;
    const pTr = (v.pTr || 60) / 100, pMa = (v.pMa || 20) / 100, pQu = (v.pQu || 20) / 100;
    const lf = pTr * 1.0 + pMa * Math.min(v.pPeak / v.pP, 1.5) + pQu * (v.pA / v.pP);
    return v.fc * 0.85 * v.opD * (v.rD * v.cDur / 60) / 1000 * lf; // densité MDO 0.85 kg/L
  })();

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100vh", background: "#f5f7f9" }}>

      {/* Header */}
      <DeadlineBanner />
      <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: D, color: "white" }}>
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={backToList} className="text-xs px-2 py-1 rounded"
            style={{ background: "rgba(255,255,255,0.15)", color: "white", cursor: "pointer" }}>← Projets</button>
          <img src={GASPE_LOGO} alt="GASPE" style={{ height: 22, mixBlendMode: "screen" }} />
          <input type="text" value={proj.name || ""} onChange={e => upd({ name: e.target.value })}
            placeholder="Nommez votre dossier..."
            className="font-bold text-sm truncate" style={{ background: "transparent", color: "white", border: "none", outline: "none", width: "100%", minWidth: 0 }} />
          <span style={{ color: "#7ab8c4", fontSize: 12, flexShrink: 0, cursor: "pointer" }} title="Renommer le dossier">✏️</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && <span className="text-xs" style={{ color: GR }}>✓ Sauvé</span>}
        </div>
      </div>

      {/* Stepper */}
      <StepBar step={step} setStep={setStep} maxStep={maxStep} />

      {/* Bandeau récapitulatif persistant */}
      {proj && res && res.length >= 2 && step >= 2 && (
        <div className="flex items-center justify-around px-3 py-2 text-xs" style={{ background: D + "08", borderBottom: "1px solid #e5e7eb" }}>
          <span><span className="font-bold" style={{ color: GR }}>CO₂ évité</span> ~{fmt(Math.round((res[0].base.co2 - res[1].base.co2) / proj.p.dur))} t/an</span>
          <span><span className="font-bold" style={{ color: T }}>Aide</span> ~{fK(aide.aide)}</span>
          <span style={{ color: (scoring?.ratioEuroParTonne ?? 0) > 200 ? AC : "#666" }}><span className="font-bold">Ratio</span> {scoring?.ratioEuroParTonne || "..."} €/tCO₂</span>
        </div>
      )}

      {/* Contenu des étapes */}
      <div className="max-w-3xl mx-auto px-3 py-4">

        {/* ============================================ */}
        {/* ÉTAPE 1 : MON NAVIRE                        */}
        {/* ============================================ */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: D }}>⚓ Étape 1 · Mon navire</h2>
            <p className="text-xs mb-4" style={{ color: "#888" }}>Décrivez le navire concerné par le projet ADEME. Les données pré-remplies sont ajustables.</p>

            <Cd title="Identification">
              <div className="grid grid-cols-2 gap-3">
                <In l="Nom du navire / liaison" v={proj.v.name} t="text" onChange={v => uV("name", v)} />
                <Se l="Type de navire" v={proj.v.type}
                  onChange={v => { uV("type", v); const vt = VT.find(x => x.id === v); if (vt) upd(p => ({ ...p, v: { ...p.v, ...vt.d, type: v, name: p.v.name, entSize: p.v.entSize, zoneAFR: p.v.zoneAFR } })); }}
                  opts={VT.map(v => ({ v: v.id, l: v.l }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Se l="Taille de l'entreprise (UE)" v={proj.v.entSize}
                  onChange={v => uV("entSize", v)}
                  opts={[{ v: "PE", l: "Petite entreprise (< 50 pers., < 10 M€ CA)" }, { v: "ME", l: "Moyenne entreprise (< 250 pers., < 50 M€ CA)" }, { v: "GE", l: "Grande entreprise" }]}
                  h="Au sens de l'annexe I du règlement UE 651/2014. Inclut les entreprises partenaires et liées." />
                <Se l="Région d'exploitation du navire" v={proj.v.region || "metropole_standard"}
                  onChange={v => {
                    const reg = REGIONS.find(r => r.id === v);
                    uV("region", v);
                    uV("zoneAFR", reg?.zone || "hors");
                  }}
                  opts={REGIONS.map(r => ({ v: r.id, l: r.l + (r.zone === "zoneA" ? " (zone AFR a · taux majorés)" : r.zone === "zoneC" ? " (zone AFR c)" : "") }))}
                  h="La zone AFR est déduite automatiquement de votre région. Outre-mer = zone a (taux majorés). Source : Décret n° 2022-968." />
              </div>
            </Cd>

            <Cd title="Caractéristiques techniques">
              <div className="grid grid-cols-3 gap-3">
                <In l="Longueur (LOA)" v={proj.v.loa} onChange={v => uV("loa", v)} u="m" />
                <In l="Jauge brute" v={proj.v.gt} onChange={v => uV("gt", v)} u="GT" />
                <In l="Puissance propulsion" v={proj.v.pP} onChange={v => uV("pP", v)} u="kW" />
                <In l="Puissance auxiliaire" v={proj.v.pA} onChange={v => uV("pA", v)} u="kW" />
                <In l="Puissance crête" v={proj.v.pPeak} onChange={v => uV("pPeak", v)} u="kW" />
                <In l="Vitesse de service" v={proj.v.spd} onChange={v => uV("spd", v)} u="nds" />
              </div>
            </Cd>

            <Cd title="Profil opérationnel">
              <div className="grid grid-cols-3 gap-3">


                <In l="Jours d'exploitation/an" v={proj.v.opD} onChange={v => uV("opD", v)} u="j/an" />
                <In l="Rotations/jour" v={proj.v.rD} onChange={v => uV("rD", v)} u="rot/j" />
                <In l="Durée traversée" v={proj.v.cDur} onChange={v => uV("cDur", v)} u="min" />
                <In l="Temps à quai" v={proj.v.qT} onChange={v => uV("qT", v)} u="min" />
                <In l="Conso carburant" v={proj.v.fc} onChange={v => uV("fc", v)} u="L/h"
                  h="Consommation horaire en litres de MDO au régime de transit nominal." />
                <Se l="Cadre d'exploitation" v={proj.v.serviceType || (proj.v.dspR > 0 ? "dsp" : "prive")}
                  onChange={v => { uV("serviceType", v); if (v === "prive") uV("dspR", 0); }}
                  opts={[
                    { v: "dsp", l: "DSP (delegation de service public)" },
                    { v: "sp", l: "Service public (regie, marche public)" },
                    { v: "agrement", l: "Agrement ou convention d'exploitation" },
                    { v: "prive", l: "100% prive (pas de SP/DSP)" },
                  ]}
                  h="Le cadre d'exploitation peut influencer l'argumentaire du dossier (captivite tarifaire, obligation de continuite, visibilite pour le contribuable)." />
                {(proj.v.serviceType || "dsp") !== "prive" && (
                  <In l="Duree residuelle du contrat/agrement" v={proj.v.dspR} onChange={v => uV("dspR", v)} u="ans"
                    h="Nombre d'annees restantes sur le contrat en cours. Si renouvellement imminent, indiquer 0." />
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <In l="% Transit" v={proj.v.pTr} onChange={v => uV("pTr", v)} u="%" />
                <In l="% Manœuvre" v={proj.v.pMa} onChange={v => uV("pMa", v)} u="%" />
                <In l="% Quai" v={proj.v.pQu} onChange={v => uV("pQu", v)} u="%" />
              </div>
            </Cd>

            {/* Pré-dimensionnement batteries (si projet électrique) */}
            {batt && batt.kWh > 0 && (Object.keys(proj.trajs?.[1]?.fuelMix || {}).some(k => ["elec","h2"].includes(k) && proj.trajs[1].fuelMix[k] > 0)) && (
              <Cd title="📊 Pre-dimensionnement batteries" accent={T}>
                <div className="grid grid-cols-4 gap-2">
                  <St l="Capacite installee" v={fmt(batt.kWh) + " kWh"} c={T} />
                  <St l="Chargeur" v={fmt(batt.chargePower) + " kW"} c={T} />
                  <St l="Duree de vie pack" v={batt.lifeYrs + " ans"} c={T} />
                  <St l="Cout estime total" v={fK(batt.costBatt + batt.costCharger + batt.gridConnect)} c={T} />
                </div>
                <p className="text-xs mt-2" style={{ color: "#999" }}>
                  Dimensionne par contrainte de {batt.constraint}. SoC 10-90% (DNV Pt.6 Ch.2). C-rate 2C (Corvus Orca). 450 EUR/kWh installe maritime (Corvus 2024, incl. BMS/certif. BV).
                </p>
              </Cd>
            )}
            {/* Pré-dimensionnement biocarburant (si projet biocarburant) */}
            {bioEstim && (
              <Cd title="📊 Estimation conversion biocarburant" accent={T}>
                <div className="grid grid-cols-3 gap-2">
                  {bioEstim.tankClean > 0 && <St l="Nettoyage cuves" v={fK(bioEstim.tankClean)} c={T} />}
                  {bioEstim.filterUpgrade > 0 && <St l="Filtration" v={fK(bioEstim.filterUpgrade)} c={T} />}
                  {bioEstim.sealReplace > 0 && <St l="Joints / etancheite" v={fK(bioEstim.sealReplace)} c={T} />}
                  {bioEstim.fuelHeating > 0 && <St l="Chauffage carburant" v={fK(bioEstim.fuelHeating)} c={T} />}
                  {bioEstim.engineConv > 0 && <St l="Conversion moteur" v={fK(bioEstim.engineConv)} c={T} />}
                  {bioEstim.tankInstall > 0 && <St l="Reservoirs" v={fK(bioEstim.tankInstall)} c={T} />}
                  {bioEstim.safety > 0 && <St l="Securite" v={fK(bioEstim.safety)} c={T} />}
                  <St l="Cout estime total" v={fK(bioEstim.total)} c={T} />
                </div>
                <p className="text-xs mt-2" style={{ color: "#999" }}>
                  {bioEstim.notes.join(" · ")}
                </p>
              </Cd>
            )}

            <div className="flex justify-end mt-6 mb-6">
              <button onClick={() => { setMaxStep(m => Math.max(m, 2)); nextStep(); }}
                disabled={!proj.v.name}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: proj.v.name ? T : "#ccc", cursor: proj.v.name ? "pointer" : "not-allowed" }}>
                {!proj.v.name ? "Nommez votre navire pour continuer" : "Suivant"}
              </button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 2 : MON PROJET DE DÉCARBONATION       */}
        {/* ============================================ */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: D }}>🔋 Étape 2 · Mon projet de décarbonation</h2>
            <p className="text-xs mb-4" style={{ color: "#888" }}>Sélectionnez les technologies et le mix énergétique cible. Le simulateur vérifie la conformité TRL ≥ 7.</p>

            <Cd title="Thématique ADEME">
              <Se l="Thématique du projet" v={proj.thematique}
                onChange={v => upd(p => ({ ...p, thematique: parseInt(v) }))}
                opts={[{ v: 1, l: "Thématique 1 · Décarbonation directe du navire" }, { v: 2, l: "Thématique 2 · Investissement industriel" }]} />
            </Cd>

            <Cd title="Technologies sélectionnées">
              <p className="text-xs mb-3" style={{ color: "#888" }}>Cochez les technologies prévues. Le TRL doit être ≥ 7 en début de projet et 9 en fin.</p>
              {TECHS.map(tech => {
                const active = proj.trajs?.[1]?.techs?.[tech.id]?.a;
                const trlOk = tech.trl >= 7;
                return (
                  <div key={tech.id} className="flex items-center gap-3 p-2 rounded-lg mb-1"
                    style={{ background: active ? T + "15" : "#fafafa", border: "1px solid " + (active ? T + "40" : "#eee") }}>
                    <input type="checkbox" checked={!!active}
                      onChange={e => upd(p => {
                        const ts = { ...p.trajs[1].techs };
                        if (e.target.checked) ts[tech.id] = { a: true, year: p.p.sy };
                        else delete ts[tech.id];
                        const trajs = [...p.trajs]; trajs[1] = { ...trajs[1], techs: ts };
                        return { ...p, trajs };
                      })} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: D }}>{tech.l}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                          style={{ background: trlOk ? GR + "20" : AC + "20", color: trlOk ? GR : AC, fontSize: 10 }}>
                          TRL {tech.trl}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#f0f0f0", color: "#888", fontSize: 10 }}>
                          {tech.cat}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "#999" }}>
                        Gain : {(tech.gL * 100).toFixed(0)}–{(tech.gH * 100).toFixed(0)}% | Retrofit : {tech.retro} | {tech.n}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Cd>

            <Cd title="Mix énergétique cible">
              <p className="text-xs mb-3" style={{ color: "#888" }}>Répartition du mix après décarbonation (en %). Le total doit faire 100%.</p>
              {DEF_FUELS.filter(f => !f.adv).map(fuel => (
                <div key={fuel.id} className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium w-40" style={{ color: D }}>{fuel.l}</span>
                  <input type="range" min={0} max={100} step={1}
                    value={proj.trajs?.[1]?.fuelMix?.[fuel.id] || 0}
                    onChange={e => upd(p => {
                      const mix = { ...p.trajs[1].fuelMix, [fuel.id]: parseInt(e.target.value) };
                      const trajs = [...p.trajs]; trajs[1] = { ...trajs[1], fuelMix: mix };
                      return { ...p, trajs };
                    })}
                    className="flex-1" />
                  <input type="number" min={0} max={100} step={1}
                    value={proj.trajs?.[1]?.fuelMix?.[fuel.id] || 0}
                    onChange={e => upd(p => {
                      const mix = { ...p.trajs[1].fuelMix, [fuel.id]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) };
                      const trajs = [...p.trajs]; trajs[1] = { ...trajs[1], fuelMix: mix };
                      return { ...p, trajs };
                    })}
                    className="w-12 text-center border rounded text-sm font-bold"
                    style={{ color: T, borderColor: "#ddd" }} />
                  <span className="text-xs" style={{ color: "#999" }}>%</span>
                </div>
              ))}
              <div className="text-xs mt-2 p-2 rounded" style={{
                background: (() => {
                  const tot = Object.values(proj.trajs?.[1]?.fuelMix || {}).reduce((a, b) => a + b, 0);
                  return tot === 100 ? GR + "15" : AC + "15";
                })()
              }}>
                Total : {Object.values(proj.trajs?.[1]?.fuelMix || {}).reduce((a, b) => a + b, 0)}%
                {Object.values(proj.trajs?.[1]?.fuelMix || {}).reduce((a, b) => a + b, 0) !== 100 && " ⚠️ Doit faire 100%"}
              </div>

              {/* Classification automatique */}
              <div className="mt-3 p-3 rounded-lg" style={{ background: T + "10", border: "1px solid " + T + "30" }}>
                <span className="text-xs font-bold" style={{ color: D }}>Classification ADEME : </span>
                <span className="text-sm font-bold" style={{ color: T }}>
                  {classifyVessel(proj.trajs?.[1]?.fuelMix) === "emissionNulle" ? "🟢 Navire à émission nulle" :
                   classifyVessel(proj.trajs?.[1]?.fuelMix) === "propre" ? "🔵 Navire propre (≥ 25% zéro-CO₂)" :
                   "🟡 Navire plus efficace (amélioration énergétique)"}
                </span>
              </div>
            </Cd>

            {/* Mode de recharge : visible uniquement si composante electrique dans le mix */}
            {(Object.entries(proj.trajs?.[1]?.fuelMix || {}).some(([k, v]) => ["elec", "h2"].includes(k) && v > 0)) && (
              <Cd title="Mode de recharge batteries" accent={T}>
                <Se l="Comment rechargez-vous les batteries ?" v={proj.v.chargeMode || "opportunity"}
                  onChange={v => uV("chargeMode", v)}
                  opts={[
                    { v: "opportunity", l: "Recharge au quai entre chaque traversee (ex: MF Ampere)" },
                    { v: "overnight", l: "Recharge la nuit uniquement (ex: Bacs de Loire)" },
                  ]}
                  h="Opportunity : batterie = 1 traversee, recharge rapide au quai. Overnight : batterie = journee entiere, recharge 8h la nuit. Impact majeur sur dimensionnement et budget." />
              </Cd>
            )}

            <Cd title="Investissements previsionnels (estimation)">
              <div className="grid grid-cols-2 gap-3">
                <In l="Coque / structure" v={proj.trajs?.[1]?.iC || 0}
                  onChange={v => upd(p => { const ts = [...p.trajs]; ts[1] = { ...ts[1], iC: Number(v) }; return { ...p, trajs: ts }; })}
                  u="k€" h="Adaptation coque, renforcements structurels" />
                <In l={(Object.keys(proj.trajs?.[1]?.fuelMix || {}).some(k => ['elec','h2'].includes(k) && proj.trajs[1].fuelMix[k] > 0)) ? "Systeme energetique (batteries, H2)" : bioEstim ? "Equipements conversion carburant" : "Systeme energetique"}
                  v={proj.trajs?.[1]?.iE || (batt && batt.kWh > 0 ? batt.costBatt : bioEstim ? bioEstim.totalEquip : 0)}
                  onChange={v => upd(p => { const ts = [...p.trajs]; ts[1] = { ...ts[1], iE: Number(v) }; return { ...p, trajs: ts }; })}
                  u="k€" h={(Object.keys(proj.trajs?.[1]?.fuelMix || {}).some(k => ['elec','h2'].includes(k) && proj.trajs[1].fuelMix[k] > 0)) ? "Batteries, piles H2, convertisseurs" : "Cuves, filtres, joints, chauffage carburant, conversion moteur"} />
                <In l={(Object.keys(proj.trajs?.[1]?.fuelMix || {}).some(k => ['elec','h2'].includes(k) && proj.trajs[1].fuelMix[k] > 0)) ? "Infrastructure charge" : bioEstim?.hasDual ? "Reservoirs GNL" : "Avitaillement / logistique"}
                  v={proj.trajs?.[1]?.iI || (batt && batt.kWh > 0 ? batt.costCharger : bioEstim?.tankInstall || 0)}
                  onChange={v => upd(p => { const ts = [...p.trajs]; ts[1] = { ...ts[1], iI: Number(v) }; return { ...p, trajs: ts }; })}
                  u="k€" h={(Object.keys(proj.trajs?.[1]?.fuelMix || {}).some(k => ['elec','h2'].includes(k) && proj.trajs[1].fuelMix[k] > 0)) ? "Bornes, cables, transformateurs" : "Logistique avitaillement, stockage, reservoirs"} />
                <In l={(Object.keys(proj.trajs?.[1]?.fuelMix || {}).some(k => ['elec','h2'].includes(k) && proj.trajs[1].fuelMix[k] > 0)) ? "Raccordement reseau" : "Certification / essais"}
                  v={proj.trajs?.[1]?.gridCost || (batt && batt.kWh > 0 ? batt.gridConnect : bioEstim?.certification || 0)}
                  onChange={v => upd(p => { const ts = [...p.trajs]; ts[1] = { ...ts[1], gridCost: Number(v) }; return { ...p, trajs: ts }; })}
                  u="k€" h={(Object.keys(proj.trajs?.[1]?.fuelMix || {}).some(k => ['elec','h2'].includes(k) && proj.trajs[1].fuelMix[k] > 0)) ? "Raccordement ENEDIS / reseau" : "Bureau Veritas, DNV, essais moteur, certification ISO"} />
              </div>
              {res && res[1] && (
                <div className="mt-2 text-xs font-bold" style={{ color: D }}>
                  Investissement total estimé : {fK(res[1].totI)} (hors contingences)
                </div>
              )}
            </Cd>


            {/* Projets de référence similaires */}
            {(() => {
              const cases = matchCases(proj);
              if (cases.length === 0) return null;
              const allScored = CASE_DB.map(c => ({ ...c, sc: cases.find(x => x.id === c.id)?.score || 0 })).sort((a, b) => b.sc - a.sc);
              const top = allScored.slice(0, 5);
              const rest = allScored.slice(5);
              const countryFlags: Record<string, string> = {"NO":"🇳🇴","DK":"🇩🇰","FR":"🇫🇷","BE":"🇧🇪","US":"🇺🇸","IE":"🇮🇪","INT":"🌍","SE":"🇸🇪","NZ":"🇳🇿","UY":"🇺🇾","JP":"🇯🇵","EU":"🇪🇺"};
              const renderRef = (c: typeof allScored[number], compact: boolean) => (
                <div key={c.id} className={"p-" + (compact ? "2" : "2") + " rounded-lg mb-2 text-xs"} style={{ background: compact ? "#f8f8f8" : LB, borderLeft: "3px solid " + (c.sc > 60 ? GR : c.sc > 30 ? T : "#ddd") }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold" style={{ color: compact ? "#888" : D }}>{countryFlags[c.co]||"🚢"} {c.n} ({c.yr})</span>
                    {c.sc > 0 && <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: c.sc > 60 ? GR : c.sc > 30 ? T : "#ccc", color: "white", fontSize: 9 }}>{c.sc}%</span>}
                  </div>
                  <p style={{ color: compact ? "#aaa" : "#555" }}>{compact ? c.d.slice(0, 90) + "..." : c.d}</p>
                  {!compact && c.co2 < 0 && <p className="mt-1" style={{ color: GR }}>Impact : {Math.abs(c.co2)} tCO₂/an evitees</p>}
                  {!compact && <p className="mt-1" style={{ color: "#999" }}>Source : {c.s}</p>}
                  {c.url && <a href={c.url} target="_blank" rel="noopener" className="text-xs font-bold" style={{ color: T }}>Voir le projet →</a>}
                </div>
              );
              return (
                <Cd title={"📚 " + cases.length + " projet(s) similaire(s) sur " + CASE_DB.length + " references"} accent={T}>
                  <p className="text-xs mb-2" style={{ color: "#888" }}>
                    Matching dynamique sur type, technologie, taille, distance. Tries par pertinence.
                  </p>
                  {top.map(c => renderRef(c, false))}
                  {rest.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs font-bold py-2" style={{ color: T, cursor: "pointer" }}>
                        Voir les {rest.length} autres projets
                      </summary>
                      <div className="mt-2">{rest.map(c => renderRef(c, true))}</div>
                    </details>
                  )}
                </Cd>
              );
            })()}

            <div className="flex justify-between mt-6 mb-6">
              <button onClick={prevStep} className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid #ddd", color: "#888" }}>← Retour</button>
              <button onClick={nextStep} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: T }}>
                Suivant → Scénario contrefactuel
              </button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 3 : SCÉNARIO CONTREFACTUEL            */}
        {/* ============================================ */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: D }}>⚖️ Étape 3 · Scénario contrefactuel</h2>
            <div className="p-3 rounded-lg mb-4" style={{ background: W + "15", border: "1px solid " + W + "30" }}>
              <p className="text-sm" style={{ color: D }}>
                <span className="font-bold">💡 En un mot :</span> le contrefactuel, c'est ce que vous feriez si vous n'aviez PAS cette aide.
                Identifier un contrefactuel credible double les taux d'aide. Preparez ce dossier en amont : c'est le point le plus chronophage (source : CdC ADEME 2026, §1.4.1).
              </p>
            </div>

            <Cd title="Type de scénario contrefactuel" accent={W}>
              {[
                ["maintien", "Maintien du navire existant + entretien", "Scénario c) du CdC. Le plus fréquent pour les TPE/PME. Coûts éligibles = investissement décarboné − VAN entretien/réparation actualisée."],
                ["newbuild_fossile", "Remplacement par un navire diesel neuf", "Scénario a) du CdC. Coûts éligibles = surcoût du navire décarboné par rapport au navire fossile équivalent."],
                ["reporté", "Même investissement, mais plus tard", "Scénario b) du CdC. Coûts éligibles = différence entre investissement maintenant et VAN de l'investissement ultérieur."],
                ["aucun", "Pas de contrefactuel identifiable", "⚠️ Les taux d'aide sont divisés par 2. À éviter si possible."],
              ].map(([id, label, desc]) => (
                <button key={id}
                  onClick={() => upd(p => ({ ...p, contrefactuel: { ...p.contrefactuel, type: id } }))}
                  className="w-full text-left p-3 rounded-lg mb-2 text-sm"
                  style={{
                    background: proj.contrefactuel?.type === id ? T + "15" : "#fafafa",
                    border: "2px solid " + (proj.contrefactuel?.type === id ? T : "transparent"),
                  }}>
                  <span className="font-bold" style={{ color: D }}>{label}</span>
                  <p className="text-xs mt-1" style={{ color: "#888" }}>{desc}</p>
                </button>
              ))}
            </Cd>

            {proj.contrefactuel?.type === "maintien" && (
              <Cd title="Coûts d'entretien du scénario fossile (sur la durée du projet)">
                <In l="Budget entretien / réparation annuel estimé" v={proj.contrefactuel?.coutEntretien || Math.round(proj.v.mktV * 0.03)}
                  onChange={v => upd(p => ({ ...p, contrefactuel: { ...p.contrefactuel, coutEntretien: v } }))}
                  u="k€/an" h="Estimation par défaut : 3% de la valeur vénale/an (RINA 2022, Ship Lifecycle Cost Analysis). Ajustez selon vos données réelles."
                  n={"Estimation type : " + (proj.v.gt < 200 ? "30-80" : proj.v.gt < 1000 ? "80-200" : "200-500") + " k€/an (source : OPEX benchmarks Clarksons 2024, ajusté proximité). Cliquez pour modifier."} />
                <p className="text-xs mt-2" style={{ color: "#999" }}>
                  VAN entretien actualisée sur {proj.p.dur} ans à {proj.p.disc}% : {fK(
                    (proj.contrefactuel?.coutEntretien || 0) * ((1 - Math.pow(1 + proj.p.disc / 100, -proj.p.dur)) / (proj.p.disc / 100))
                  )}
                </p>
              </Cd>
            )}

            {proj.contrefactuel?.type === "newbuild_fossile" && (
              <Cd title="Coût du navire diesel de référence">
                <In l="Prix d'un navire fossile équivalent" v={proj.contrefactuel?.coutNewbuild || 0}
                  onChange={v => upd(p => ({ ...p, contrefactuel: { ...p.contrefactuel, coutNewbuild: v } }))}
                  u="k€" h="Coût d'acquisition d'un navire neuf de même catégorie, conforme aux normes UE en vigueur." />
              </Cd>
            )}

            <Cd title="📊 Impact sur le taux d'aide" accent={proj.contrefactuel?.type === "aucun" ? AC : GR}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs" style={{ color: "#888" }}>Avec contrefactuel crédible</div>
                  <div className="text-xl font-bold" style={{ color: GR }}>
                    {ADEME_RATES.amelioContrefactuel[proj.v.zoneAFR]?.[proj.v.entSize] || " - "}%
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "#888" }}>Sans contrefactuel</div>
                  <div className="text-xl font-bold" style={{ color: AC }}>
                    {ADEME_RATES.amelioSans[proj.v.zoneAFR]?.[proj.v.entSize] || " - "}%
                  </div>
                </div>
              </div>
              {proj.contrefactuel?.type === "aucun" && (
                <div className="mt-2 p-2 rounded text-xs font-bold" style={{ background: AC + "15", color: AC }}>
                  ⚠️ Sans contrefactuel, les taux d'aide sont divisés par 2. Identifiez un scénario de référence crédible.
                </div>
              )}
            </Cd>

            <div className="flex justify-between mt-6 mb-6">
              <button onClick={prevStep} className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid #ddd", color: "#888" }}>← Retour</button>
              <button onClick={nextStep} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: T }}>
                Suivant → Gains environnementaux
              </button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 4 : GAINS ENVIRONNEMENTAUX + DNSH     */}
        {/* ============================================ */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: D }}>🌿 Étape 4 · Gains environnementaux</h2>
            <div className="p-3 rounded-lg mb-4" style={{ background: GR + "15", border: "1px solid " + GR + "30" }}>
              <p className="text-sm" style={{ color: D }}>
                <span className="font-bold">💡 En un mot :</span> cette étape mesure les bénéfices concrets de votre projet pour la planète.
                Les tonnes de CO₂ évitées et le ratio €/tCO₂ sont les deux chiffres les plus scrutés par l'instructeur ADEME.
              </p>
            </div>

            {scoring && (
              <Cd title="📊 Résumé des gains sur 5 ans" accent={GR}>
                <div className="grid grid-cols-3 gap-2">
                  <St l="CO₂ évité (5 ans)" v={fmt(scoring.co2Evite) + " t"} c={GR} />
                  <St l="Gain relatif" v={scoring.gainPct + "%"} c={GR} />
                  <St l="CO₂ résiduel (5 ans)" v={fmt(scoring.co2Alt) + " t"} c={D} />
                </div>
              </Cd>
            )}

            {/* Réductions hors-GES */}
            <Cd title="Réductions hors-GES (polluants atmosphériques)">
              {(() => {
                const fuelMixAlt = proj.trajs?.[1]?.fuelMix || {};
                const mixT = Object.values(fuelMixAlt).reduce((a, b) => a + b, 0) || 100;
                let soxRef = hFuelBase * EMFACT.mdo.sox / 1e6;
                let noxRef = hFuelBase * EMFACT.mdo.nox / 1e6;
                let pmRef = hFuelBase * EMFACT.mdo.pm / 1e6;
                let soxAlt = 0, noxAlt = 0, pmAlt = 0;
                const gainTech = res?.[1]?.gain?.m || 0;
                Object.entries(fuelMixAlt).forEach(([fid, pct]) => {
                  const ef = EMFACT[fid] || EMFACT.mdo;
                  const sh = pct / mixT;
                  soxAlt += hFuelBase * (1 - gainTech) * sh * ef.sox / 1e6;
                  noxAlt += hFuelBase * (1 - gainTech) * sh * ef.nox / 1e6;
                  pmAlt += hFuelBase * (1 - gainTech) * sh * ef.pm / 1e6;
                });
                return (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs" style={{ color: "#888" }}>SOx</div>
                      <div className="text-lg font-bold" style={{ color: GR }}>−{((soxRef - soxAlt) * 5).toFixed(1)} t</div>
                      <div className="text-xs" style={{ color: "#aaa" }}>sur 5 ans</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "#888" }}>NOx</div>
                      <div className="text-lg font-bold" style={{ color: GR }}>−{((noxRef - noxAlt) * 5).toFixed(1)} t</div>
                      <div className="text-xs" style={{ color: "#aaa" }}>sur 5 ans</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "#888" }}>PM</div>
                      <div className="text-lg font-bold" style={{ color: GR }}>−{((pmRef - pmAlt) * 5).toFixed(2)} t</div>
                      <div className="text-xs" style={{ color: "#aaa" }}>sur 5 ans</div>
                    </div>
                  </div>
                );
              })()}
            </Cd>

            {/* DNSH */}
            <Cd title="DNSH · Do No Significant Harm (Annexe 1)" accent={PU}>
              <p className="text-xs mb-3" style={{ color: "#888" }}>
                Les projets causant un préjudice important à l'environnement sont exclus (art. 17, règlement 2020/852).
              </p>
              {DNSH_AXES.map((axis, i) => (
                <div key={axis.id} className="p-3 rounded-lg mb-2" style={{ background: "#fafafa", border: "1px solid #eee" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold" style={{ color: D }}>{axis.icon} {axis.l}</span>
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox"
                        checked={proj.dnsh?.[i]?.ok !== false}
                        onChange={e => upd(p => {
                          const dnsh = [...(p.dnsh || [])];
                          dnsh[i] = { ...dnsh[i], ok: e.target.checked };
                          return { ...p, dnsh };
                        })} />
                      Conforme
                    </label>
                  </div>
                  <textarea
                    className="w-full text-xs p-2 border rounded" rows={3}
                    style={{ borderColor: "#ddd" }}
                    value={proj.dnsh?.[i]?.text || (() => {
                      let t = axis.template;
                      if (scoring) {
                        t = t.replace("{co2}", fmt(Math.abs(scoring.co2Evite / 5)));
                        t = t.replace("{pctCo2}", String(scoring.gainPct));
                      }
                      const mixAlt = proj.trajs?.[1]?.fuelMix || {};
                      const mixT = Object.values(mixAlt).reduce((a,b) => a+b, 0) || 100;
                      const gTech = res?.[1]?.gain?.m || 0;
                      const soxR = (hFuelBase * EMFACT.mdo.sox / 1e6);
                      let soxA = 0, noxA = 0, pmA = 0;
                      Object.entries(mixAlt).forEach(([fid, pct]) => {
                        const ef = EMFACT[fid] || EMFACT.mdo;
                        const sh = pct / mixT;
                        soxA += hFuelBase * (1 - gTech) * sh * ef.sox / 1e6;
                        noxA += hFuelBase * (1 - gTech) * sh * ef.nox / 1e6;
                        pmA += hFuelBase * (1 - gTech) * sh * ef.pm / 1e6;
                      });
                      t = t.replace("{sox}", (soxR - soxA).toFixed(1));
                      t = t.replace("{nox}", ((hFuelBase * EMFACT.mdo.nox / 1e6) - noxA).toFixed(1));
                      t = t.replace("{pm}", ((hFuelBase * EMFACT.mdo.pm / 1e6) - pmA).toFixed(2));
                      return t;
                    })()}
                    onChange={e => upd(p => {
                      const dnsh = [...(p.dnsh || [])];
                      dnsh[i] = { ...dnsh[i], text: e.target.value };
                      return { ...p, dnsh };
                    })} />
                  {axis.id === "circulaire" && (
                    <input type="text" placeholder="Fournisseur recyclage batteries (ex: SNAM, Eramet...)"
                      className="w-full text-xs p-2 border rounded mt-1" style={{ borderColor: "#ddd" }}
                      value={proj.dnsh?.[i]?.fournisseur || ""}
                      onChange={e => upd(p => { const d = [...(p.dnsh||[])]; d[i] = { ...d[i], fournisseur: e.target.value }; return { ...p, dnsh: d }; })} />
                  )}
                  {axis.id === "biodiversite" && (
                    <input type="text" placeholder="Certification bruit visée (ex: DNV Silent Class, BV NR 614...)"
                      className="w-full text-xs p-2 border rounded mt-1" style={{ borderColor: "#ddd" }}
                      value={proj.dnsh?.[i]?.certification || ""}
                      onChange={e => upd(p => { const d = [...(p.dnsh||[])]; d[i] = { ...d[i], certification: e.target.value }; return { ...p, dnsh: d }; })} />
                  )}
                  {axis.id === "eau" && (
                    <input type="text" placeholder="Type antifouling (ex: silicone sans biocide, cuivre réduit...)"
                      className="w-full text-xs p-2 border rounded mt-1" style={{ borderColor: "#ddd" }}
                      value={proj.dnsh?.[i]?.antifouling || ""}
                      onChange={e => upd(p => { const d = [...(p.dnsh||[])]; d[i] = { ...d[i], antifouling: e.target.value }; return { ...p, dnsh: d }; })} />
                  )}
                </div>
              ))}
            </Cd>


            <Cd title="🌍 Empreinte Projet ADEME (niveau 1)" accent={T}>
              <p className="text-xs mb-2" style={{ color: "#555" }}>
                Le CdC exige une analyse environnementale de niveau 1 selon la méthode Empreinte Projet
                (Annexe 5 du dossier). Les données de ce simulateur alimentent directement cette analyse.
                Une ACV simplifiée (niveau 3) sera demandée lors du suivi d'exécution.
              </p>
              <a href="https://base-empreinte.ademe.fr/empreinte-projet"
                target="_blank" rel="noopener"
                className="inline-block px-4 py-2 rounded-lg text-sm font-bold"
                style={{ background: T, color: "white", textDecoration: "none" }}>
                Accéder à l'outil Empreinte Projet ADEME →
              </a>
            </Cd>
            <div className="flex justify-between mt-6 mb-6">
              <button onClick={prevStep} className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid #ddd", color: "#888" }}>← Retour</button>
              <button onClick={nextStep} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: T }}>
                Suivant → Budget & dépenses
              </button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 5 : BUDGET & DÉPENSES ADEME           */}
        {/* ============================================ */}
        {step === 5 && (() => {
          // Auto-mapping budget si vide : dimBatt + étape 2 → nomenclature ADEME
          const tj1 = proj.trajs?.[1] || {};
          const bd = batt;
          const budgetVide = !proj.budget?.some(b => b.montant > 0);
          const hasBattData = bd && bd.kWh > 0;
          const hasInvData = tj1.iC > 0 || tj1.iE > 0 || tj1.iI > 0 || tj1.gridCost > 0;
          const hasBioData = bioEstim && bioEstim.total > 0;
          if (budgetVide && (hasBattData || hasInvData || hasBioData)) {
            const costProp = hasBattData ? (bd.costBatt || 0) : hasBioData ? bioEstim.totalEquip : (tj1.iC || 0);
            const costStock = hasBattData ? (bd.costCharger || 0) : hasBioData ? 0 : (tj1.iE || 0);
            const costInfra = hasBattData ? (bd.gridConnect || 0) : hasBioData ? (bioEstim.tankInstall || 0) : ((tj1.iI || 0) + (tj1.gridCost || 0));
            const totalEquip = costProp + costStock;
            const newBudget = proj.budget?.map(b => {
              if (b.id === "equip_prop") return { ...b, montant: costProp };
              if (b.id === "equip_stock") return { ...b, montant: costStock };
              if (b.id === "infra") return { ...b, montant: costInfra };
              if (b.id === "ing_ext") return { ...b, montant: Math.round(totalEquip * 0.08) };
              if (b.id === "certif") return { ...b, montant: Math.round(totalEquip * 0.03) };
              return b;
            }) || [];
            upd(p => ({ ...p, budget: newBudget }));
          }
          return null;
        })() || (step === 5) && (
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: D }}>💰 Étape 5 · Budget & dépenses</h2>
            <p className="text-xs mb-4" style={{ color: "#888" }}>
              Ventilation des dépenses selon la nomenclature ADEME (Guide de catégorisation 2026).
              Les montants sont en k€ HTR (hors taxes récupérables).
            </p>


            {/* Estimations budget (dynamiques selon technologie) */}
            {batt && batt.kWh > 0 && (Object.entries(proj.trajs?.[1]?.fuelMix || {}).some(([k, v]) => ["elec", "h2"].includes(k) && v > 0)) && (
              <div className="p-3 rounded-lg mb-4 text-xs" style={{ background: T + "10", border: "1px solid " + T + "30" }}>
                <p className="font-bold mb-1" style={{ color: T }}>Estimations projet electrique (modifiables)</p>
                <p>Batteries : ~{fK(batt.costBatt)} ({batt.kWh} kWh x 450 EUR/kWh, Corvus 2024)</p>
                <p>Chargeur : ~{fK(batt.costCharger)} ({batt.cP} kW x 200 EUR/kW, ABB Marine 2022)</p>
                <p>Raccordement quai : ~{fK(batt.gridConnect)} (estimation GASPE selon puissance)</p>
                <p>Ingenierie (8%) : ~{fK(Math.round((batt.costBatt + batt.costCharger) * 0.08))}</p>
                <p>Certification (3%) : ~{fK(Math.round((batt.costBatt + batt.costCharger) * 0.03))}</p>
              </div>
            )}
            {bioEstim && !(batt && batt.kWh > 0 && Object.entries(proj.trajs?.[1]?.fuelMix || {}).some(([k, v]) => ["elec", "h2"].includes(k) && v > 0)) && (
              <div className="p-3 rounded-lg mb-4 text-xs" style={{ background: "#FFF3E0", border: "1px solid #FFB74D" }}>
                <p className="font-bold mb-1" style={{ color: "#E65100" }}>Estimations projet biocarburant (modifiables)</p>
                {bioEstim.tankClean > 0 && <p>Nettoyage cuves : ~{fK(bioEstim.tankClean)} (Ship Universe 2025)</p>}
                {bioEstim.filterUpgrade > 0 && <p>Filtration : ~{fK(bioEstim.filterUpgrade)} (VPS 2024)</p>}
                {bioEstim.sealReplace > 0 && <p>Joints / etancheite FAME : ~{fK(bioEstim.sealReplace)} (DNV 2025)</p>}
                {bioEstim.fuelHeating > 0 && <p>Chauffage carburant FAME : ~{fK(bioEstim.fuelHeating)} (Ship Universe 2025)</p>}
                {bioEstim.engineConv > 0 && <p>Conversion moteur dual-fuel : ~{fK(bioEstim.engineConv)}</p>}
                {bioEstim.tankInstall > 0 && <p>Reservoirs : ~{fK(bioEstim.tankInstall)}</p>}
                {bioEstim.safety > 0 && <p>Securite : ~{fK(bioEstim.safety)}</p>}
                <p>Ingenierie (8%) : ~{fK(bioEstim.ingenierie)}</p>
                <p>Certification : ~{fK(bioEstim.certification)}</p>
              </div>
            )}
            <Cd title="Postes de dépenses éligibles (montants en k€ = milliers d'euros)">
              {ADEME_EXPENSE_CATS.map((cat, i) => (
                <div key={cat.id} className="flex items-center gap-3 mb-2 p-2 rounded" style={{ background: i % 2 ? "#fafafa" : "white" }}>
                  <div className="flex-1">
                    <div className="text-xs font-bold" style={{ color: D }}>{cat.l}</div>
                    <div className="text-xs" style={{ color: "#999" }}>{cat.poste} → {cat.sub} · {cat.ex}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0}
                      value={proj.budget?.[i]?.montant || 0}
                      onChange={e => upd(p => {
                        const budget = [...(p.budget || [])];
                        budget[i] = { ...budget[i], montant: Math.max(0, parseFloat(e.target.value) || 0) };
                        return { ...p, budget };
                      })}
                      className="w-24 text-right border rounded px-2 py-1 text-sm"
                      style={{ borderColor: "#ddd" }} />
                    <span className="text-xs" style={{ color: "#aaa" }}>k€</span>
                  </div>
                </div>
              ))}

              <div className="mt-3 p-3 rounded-lg" style={{ background: D + "08", borderTop: "2px solid " + T }}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm" style={{ color: D }}>TOTAL DÉPENSES DU PROJET</span>
                  <span className="text-lg font-bold" style={{ color: T }}>
                    {fK(proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || 0)}
                  </span>
                </div>
                {(() => {
                  const tot = proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || 0;
                  const minBudget = proj.v.entSize === "GE" ? 1000 : 300;
                  if (tot < minBudget) return (
                    <div className="text-xs mt-1 font-bold" style={{ color: AC }}>
                      ⚠️ Budget minimum : {fK(minBudget)} ({proj.v.entSize === "GE" ? "grande entreprise" : "PME"})
                    </div>
                  );
                  return null;
                })()}
              </div>
            </Cd>

            <Cd title="Surcoût éligible = base de calcul de l'aide" accent={T}>
              <p className="text-xs mb-2" style={{ color: "#888" }}>
                Le surcoût est la différence entre le coût du projet décarboné et le coût du scénario contrefactuel.
              </p>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: T }}>{fK(surcout)}</div>
                <div className="text-xs" style={{ color: "#999" }}>Assiette éligible pour le calcul de l'aide</div>
              </div>
            </Cd>

            <div className="flex justify-between mt-6 mb-6">
              <button onClick={prevStep} className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid #ddd", color: "#888" }}>← Retour</button>
              <button onClick={nextStep} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: T }}>
                Suivant → Calcul de l'aide
              </button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 6 : CALCUL DE L'AIDE                  */}
        {/* ============================================ */}
        {step === 6 && (
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: D }}>📊 Étape 6 · Calcul de l'aide & scoring</h2>
            <p className="text-xs mb-4" style={{ color: "#888" }}>
              Estimation du montant d'aide et simulation de la note ADEME (indicative).
            </p>

            <Cd title="Montant de l'aide estimé" data-protected="true" accent={GR}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs" style={{ color: "#888" }}>Taux applicable</div>
                  <div className="text-2xl font-bold" style={{ color: T }}>{aide.taux}%</div>
                  <div className="text-xs" style={{ color: "#999" }}>{aide.cls === "emissionNulle" ? "Émission nulle" : aide.cls === "propre" ? "Navire propre" : "Efficacité"}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "#888" }}>Surcoût éligible</div>
                  <div className="text-2xl font-bold" style={{ color: D }}>{fK(surcout)}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "#888" }}>Aide estimée</div>
                  <div className="text-2xl font-bold" style={{ color: GR }}>{fK(aide.aide)}</div>
                  <div className="text-xs" style={{ color: "#999" }}>Plafond : 6 000 k€</div>
                </div>
              </div>
              <div className="mt-3 text-xs p-2 rounded" style={{ background: LB }}>
                <span className="font-bold">Régime : </span>{aide.regime}
              </div>
            </Cd>


            <Cd title="Autres aides publiques sollicitées ou obtenues" accent={W}>
              <p className="text-xs mb-2" style={{ color: "#888" }}>
                Exigence CdC : lister toutes les aides publiques sur les 3 dernières années (montants et dispositifs).
                Le cumul ne doit pas dépasser les plafonds du régime d'aide applicable.
              </p>
              <In l="Autres aides publiques sollicitées pour ce projet" v={proj.autresAides || 0}
                onChange={v => upd(p => ({ ...p, autresAides: Number(v) }))}
                u="k€" h="Fonds vert, FEDER, régions, BPI, France 2030... Le total (aide ADEME + autres) ne peut pas dépasser le surcoût éligible." />
              <In l="Nom des dispositifs" v={proj.autresAidesDetail || ""} t="text"
                onChange={v => upd(p => ({ ...p, autresAidesDetail: String(v) }))}
                n="Ex : Fonds vert 150 k€, Région Bretagne 80 k€" />
              {(aide.aide + (proj.autresAides || 0)) > surcout && surcout > 0 && (
                <div className="text-xs p-2 rounded mt-2 font-bold" style={{ background: AC + "15", color: AC }}>
                  Attention : le total des aides ({fK(aide.aide + (proj.autresAides || 0))}) dépasse le surcoût éligible ({fK(surcout)}).
                </div>
              )}
            </Cd>
            {scoring && (
              <Cd title="🎯 Profil de compétitivité ADEME (indicatif)" accent={PU}>
                <p className="text-xs mb-3" style={{ color: "#888" }}>
                  Estimation indicative. Le classement final dépend des autres projets déposés (enveloppe 70 M€ pour ~200 projets candidats, source : GASPE). Les fourchettes ci-dessous situent votre projet par rapport aux ordres de grandeur typiques des opérateurs de proximité.
                </p>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center p-3 rounded-lg" style={{ background: D + "08" }}>
                    <div className="text-2xl font-bold" style={{ color: T }}>{scoring.total.toFixed(0)}</div>
                    <div className="text-xs font-bold" style={{ color: D }}>/ 100 pts</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: GR + "10" }}>
                    <div className="text-lg font-bold" style={{ color: GR }}>{scoring.noteEnviron.toFixed(0)}</div>
                    <div className="text-xs">Environnement</div>
                    <div className="text-xs" style={{ color: "#aaa" }}>/ 45 pts</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: T + "10" }}>
                    <div className="text-lg font-bold" style={{ color: scoring.noteAide < 0 ? AC : T }}>{scoring.noteAide.toFixed(0)}</div>
                    <div className="text-xs">Efficacité aide</div>
                    <div className="text-xs" style={{ color: "#aaa" }}>/ 25 pts</div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: PU + "10" }}>
                    <div className="text-lg font-bold" style={{ color: PU }}>{scoring.noteTechEco.toFixed(0)}</div>
                    <div className="text-xs">Qualité/Résilience</div>
                    <div className="text-xs" style={{ color: "#aaa" }}>/ 30 pts</div>
                  </div>
                </div>

                {/* Ratio €/tCO₂ */}
                <div className="p-3 rounded-lg" style={{
                  background: scoring.ratioEuroParTonne > 200 ? AC + "15" : scoring.ratioEuroParTonne > 100 ? W + "15" : GR + "15"
                }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: D }}>Ratio €/tCO₂ évitée :</span>
                    <span className="text-xl font-bold" style={{
                      color: scoring.ratioEuroParTonne > 200 ? AC : scoring.ratioEuroParTonne > 100 ? W : GR
                    }}>
                      {scoring.ratioEuroParTonne === Infinity ? "∞" : scoring.ratioEuroParTonne + " €/tCO₂"}
                    </span>
                  </div>
                  {scoring.ratioEuroParTonne > 200 && (
                    <div className="text-xs mt-1 font-bold" style={{ color: AC }}>
                      ⚠️ ALERTE : Au-dessus de 200 €/tCO₂, le projet reçoit une note de -5 pts .
                    </div>
                  )}
                </div>
              </Cd>
            )}


            {res && res.length >= 2 && (
              <Cd title="📐 Analyse de sensibilite (3 scenarios)">
                <p className="text-xs mb-2" style={{ color: "#888" }}>
                  Robustesse du projet selon les hypotheses (exigence CdC p.28). Les gains technologiques varient de -30% (degrade) a +max (favorable).
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg" style={{ background: AC + "10" }}>
                    <div className="text-xs font-bold mb-1" style={{ color: AC }}>Degrade (-30%)</div>
                    <div className="text-sm font-bold">{fK(res[1].deg.ccv)}</div>
                    <div className="text-xs" style={{ color: "#999" }}>CCV</div>
                    <div className="text-sm font-bold mt-1">{fmt(Math.round(res[1].deg.co2))} t</div>
                    <div className="text-xs" style={{ color: "#999" }}>CO2 cumule</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: T + "10", border: "2px solid " + T }}>
                    <div className="text-xs font-bold mb-1" style={{ color: T }}>Central (base)</div>
                    <div className="text-sm font-bold">{fK(res[1].base.ccv)}</div>
                    <div className="text-xs" style={{ color: "#999" }}>CCV</div>
                    <div className="text-sm font-bold mt-1">{fmt(Math.round(res[1].base.co2))} t</div>
                    <div className="text-xs" style={{ color: "#999" }}>CO2 cumule</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: GR + "10" }}>
                    <div className="text-xs font-bold mb-1" style={{ color: GR }}>Favorable (max)</div>
                    <div className="text-sm font-bold">{fK(res[1].fav.ccv)}</div>
                    <div className="text-xs" style={{ color: "#999" }}>CCV</div>
                    <div className="text-sm font-bold mt-1">{fmt(Math.round(res[1].fav.co2))} t</div>
                    <div className="text-xs" style={{ color: "#999" }}>CO2 cumule</div>
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: "#999" }}>Source : 3 scenarios CCV (base, gains -30%, gains max). Degradation moteur fossile +1,5%/an (MAN Energy Solutions 2023).</p>
              </Cd>
            )}

            {/* Module incitativité */}
            {res && scoring && aide && (
              <Cd title="📈 Incitativite de l'aide" accent={T}>
                <p className="text-xs mb-3" style={{ color: "#888" }}>
                  Demonstration que le soutien public est necessaire a la realisation du projet (CdC p.29).
                  Comparaison du TRI avant impots avec et sans aide ADEME.
                </p>
                {(() => {
                  // Cash-flows avec aide
                  const cfAvec = [];
                  const cfSans = [];
                  const totI = res[1]?.totI || 0;
                  const aideMontant = aide.aide || 0;
                  const econAn = (res[0]?.base?.fuel?.[0] || 0) - (res[1]?.base?.fuel?.[0] || 0);
                  cfAvec.push(-totI + aideMontant);
                  cfSans.push(-totI);
                  for (let t = 1; t <= 5; t++) {
                    cfAvec.push(econAn);
                    cfSans.push(econAn);
                  }
                  const triAvec = computeTRI(cfAvec);
                  const triSans = computeTRI(cfSans);
                  const incitant = triSans === null || triSans < 5;
                  return (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="p-3 rounded-lg text-center" style={{ background: "#FFF3E0" }}>
                          <p className="text-xs font-bold" style={{ color: "#E65100" }}>TRI sans aide</p>
                          <p className="text-lg font-bold" style={{ color: "#E65100" }}>{triSans !== null ? triSans.toFixed(1) + "%" : "Negatif"}</p>
                        </div>
                        <div className="p-3 rounded-lg text-center" style={{ background: LB }}>
                          <p className="text-xs font-bold" style={{ color: T }}>TRI avec aide ADEME</p>
                          <p className="text-lg font-bold" style={{ color: T }}>{triAvec !== null ? triAvec.toFixed(1) + "%" : "Negatif"}</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg text-xs" style={{ background: incitant ? GR + "10" : AC + "10", border: "1px solid " + (incitant ? GR : AC) }}>
                        <p className="font-bold" style={{ color: incitant ? GR : AC }}>
                          {incitant ? "✓ Effet incitatif demontré" : "⚠ Effet incitatif à argumenter"}
                        </p>
                        <p style={{ color: "#555" }}>
                          {incitant
                            ? "Sans aide, le TRI est insuffisant (" + (triSans !== null ? triSans.toFixed(1) + "%" : "negatif") + ") pour justifier l'investissement. L'aide ADEME (" + fK(aideMontant) + ") rend le projet viable (TRI " + (triAvec !== null ? triAvec.toFixed(1) + "%" : "-") + ")."
                            : "Le TRI sans aide (" + (triSans !== null ? triSans.toFixed(1) + "%" : "-") + ") est deja positif. Il faudra argumenter les contraintes specifiques (captivite avitaillement, DSP, delais reglementaires) pour demontrer la necessite de l'aide."}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </Cd>
            )}

            <div className="flex justify-between mt-6 mb-6">
              <button onClick={prevStep} className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid #ddd", color: "#888" }}>← Retour</button>
              <button onClick={nextStep} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: T }}>
                Suivant → Mon dossier
              </button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 7 : MON DOSSIER                       */}
        {/* ============================================ */}
        {step === 7 && (
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: D }}>📄 Étape 7 · Mon dossier</h2>
            <p className="text-xs mb-4" style={{ color: "#888" }}>
              Votre pré-dossier est prêt. Exportez-le en HTML imprimable, puis complétez les pièces administratives sur la plateforme AGIR.
            </p>

            {/* Résumé complet */}
            <Cd title="Fiche de synthèse du projet" accent={T}>
              <div className="space-y-2 text-sm">
                <div><span className="font-bold">Navire :</span> {proj.v.name || "(non nommé)"} · {VT.find(x => x.id === proj.v.type)?.l}</div>
                <div><span className="font-bold">LOA :</span> {proj.v.loa}m | <span className="font-bold">GT :</span> {proj.v.gt} | <span className="font-bold">Puissance :</span> {proj.v.pP} kW</div>
                <div><span className="font-bold">Classification ADEME :</span> {
                  aide.cls === "emissionNulle" ? "Navire à émission nulle" :
                  aide.cls === "propre" ? "Navire propre" : "Navire plus efficace"
                }</div>
                <div><span className="font-bold">Taille :</span> {proj.v.entSize} | <span className="font-bold">Zone AFR :</span> {proj.v.zoneAFR}</div>
                <div><span className="font-bold">Budget total :</span> {fK(proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || res?.[1]?.totI || 0)}</div>
                <div><span className="font-bold">Aide estimée :</span> {fK(aide.aide)} ({aide.taux}%)</div>
                {scoring && <div><span className="font-bold">CO₂ évité (5 ans) :</span> {fmt(scoring.co2Evite)} tonnes</div>}
                {scoring && <div><span className="font-bold">Ratio :</span> {scoring.ratioEuroParTonne} €/tCO₂</div>}
              </div>
            </Cd>

            {/* Checklist pièces */}
            <Cd title="✅ Checklist des pièces à joindre">
              {([
                ["Annexe 1 · Presentation projet (pre-depot)", true, null],
                ["Annexe 2 · Fiche laureat", false, "https://agirpourlatransition.ademe.fr"],
                ["Annexe 3.a · Descriptif detaille du projet", true, null],
                ["Annexe 3.b · Descriptif du porteur", false, null],
                ["Annexe 4 · Base de donnees des couts", true, null],
                ["Annexe 5 · Grille d'impacts + Empreinte projet", true, "https://base-empreinte.ademe.fr/empreinte-projet"],
                ["Annexe 6 · Elements financiers (TRI, plan financement)", false, null],
                ["Annexe 7 · Attestation sante financiere", false, null],
                ["KBIS de moins de 3 mois", false, "https://www.infogreffe.fr/documents-officiels/demande-kbis.html"],
                ["3 dernieres liasses fiscales", false, "https://www.impots.gouv.fr/professionnel"],
                ["Devis / lettres d'intention fournisseurs", false, null],
                ["Contrat d'avitaillement ou LOI (si carburant alternatif)", false, null],
              ] as [string, boolean, string | null][]).map(([label, auto, url], i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <span>{auto ? "✅" : "⬜"}</span>
                  <span style={{ color: auto ? GR : "#666" }}>{label}</span>
                  {auto && <span className="text-xs px-1 rounded" style={{ background: GR + "20", color: GR, fontSize: 9 }}>Pre-rempli</span>}
                  {url && <a href={url} target="_blank" rel="noopener" style={{ color: T, fontSize: 10, marginLeft: 4 }}>Obtenir →</a>}
                </div>
              ))}
            </Cd>

            {/* Calendrier */}
            <Cd title="📅 Calendrier">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between p-1.5 rounded" style={{ background: LB }}>
                  <span>Prédépôt (réunion ADEME, 45 min)</span>
                  <span className="font-bold" style={{ color: T }}>Avant le 22 juin 2026</span>
                </div>
                <div className="flex justify-between p-1.5 rounded" style={{ background: AC + "10" }}>
                  <span className="font-bold">Dépôt final sur AGIR</span>
                  <span className="font-bold" style={{ color: AC }}>6 juillet 2026 (23h59)</span>
                </div>
                <div className="flex justify-between p-1.5 rounded">
                  <span>Décision ADEME</span>
                  <span>~3 mois après clôture</span>
                </div>
                <div className="flex justify-between p-1.5 rounded">
                  <span>Contractualisation</span>
                  <span>~6 mois après clôture</span>
                </div>
              </div>
            </Cd>

            {/* Contexte réglementaire pré-rédigé */}
            <Cd title="📝 Texte de contexte pré-rédigé (à intégrer dans l'Annexe 3.a)">
              <div className="text-xs p-3 rounded" style={{ background: LB, lineHeight: 1.6 }}>
                Ce projet s'inscrit dans le cadre de l'article 301 de la loi n° 2021-1104 du 22 août 2021
                (Climat et Résilience) et de la Feuille de route de décarbonation de la filière maritime
                française, pilotée par la DGAMPA et le CMF. Il contribue directement aux objectifs de la
                stratégie OMI révisée de 2023 visant la neutralité carbone du transport maritime d'ici 2050,
                avec un point de contrôle intermédiaire de −20% en 2030 par rapport à 2008.
                <br /><br />
                Ce projet correspond à une transition souveraine, ancrée localement : les prestataires
                techniques sont français, le service rendu est un service public visible au quotidien par le
                contribuable, et les retombées économiques (emplois, maintenance, exploitation) bénéficient
                directement au territoire. La compagnie est captive en matière d'opportunités
                d'avitaillement · desserte locale depuis un port secondaire non équipé en combustible
                alternatif · ce qui rend le soutien public d'autant plus déterminant pour permettre
                la transition énergétique.
                <br /><br />
                Le porteur est membre du GASPE (Groupement des Armateurs de Services Publics Maritimes
                de Passages d'Eau), qui représente {memberStats.totalShips} navires et {memberStats.compagnies} compagnies de transport maritime
                de proximité, dont 90% de TPE/PME.
              </div>
            </Cd>


            {/* Liens et actions */}
            <div className="grid grid-cols-2 gap-3 mt-4">

              <a href="https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/catalogue/aap/aides-linvestissement-pour-la-decarbonation-du-transport-et-des-services-maritimes"
                target="_blank" rel="noopener"
                className="text-center py-3 rounded-xl text-white font-bold text-sm"
                style={{ background: T, textDecoration: "none" }}>
                🌐 Plateforme AGIR
              </a>
              <a href="mailto:aap.navires@ademe.fr?cc=colomban@gaspe.fr&subject=Pre-depot%20AAP%20decarbonation%20maritime%20-%20[Nom%20compagnie]%20-%20[Nom%20navire]&body=Bonjour%2C%0A%0ANous%20souhaitons%20solliciter%20un%20echange%20prealable%20concernant%20notre%20projet%20de%20decarbonation%20maritime%20dans%20le%20cadre%20de%20l%27AAP%202026.%0A%0ACompagnie%20%3A%20%0ANavire%20concerne%20%3A%20%0AType%20de%20projet%20%3A%20%0AMontant%20estime%20%3A%20%0A%0ANous%20restons%20a%20votre%20disposition%20pour%20convenir%20d%27un%20creneau.%0A%0ABien%20a%20vous"
                className="text-center py-3 rounded-xl font-bold text-sm"
                style={{ border: "2px solid " + T, color: T, textDecoration: "none" }}>
                ✉️ Contact ADEME
              </a>
            </div>

            <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: T + "10", border: "1px solid " + T + "30" }}>
              <p className="font-bold mb-1">Contact GASPE pour accompagnement :</p>
              <p>Le GASPE accompagne ses adhérents dans le montage de leurs dossiers ADEME.
                Contactez le Délégué Général pour un appui personnalisé sur l'argumentaire
                environnemental, le dimensionnement technique et le positionnement stratégique du dossier.</p>
              <a href="https://gaspe.fr" target="_blank" rel="noopener"
                className="inline-block mt-2 px-3 py-1 rounded font-bold"
                style={{ background: "white", color: D, textDecoration: "none" }}>gaspe.fr</a>
            </div>

            <div className="flex justify-between mt-6 mb-6">
              <button onClick={prevStep} className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid #ddd", color: "#888" }}>← Retour</button>
              <button onClick={() => {
                const vt = VT.find(x => x.id === proj.v.type);
                const cls = classifyVessel(proj.trajs?.[1]?.fuelMix);
                const techList = Object.entries(proj.trajs?.[1]?.techs||{}).filter(([,x])=>x?.a).map(([tid])=>TECHS.find(t=>t.id===tid)?.l).join(', ');
                const mixStr = Object.entries(proj.trajs?.[1]?.fuelMix||{}).filter(([,v])=>v>0).map(([k,v])=>DEF_FUELS.find(f=>f.id===k)?.l+' '+v+'%').join(', ');
                const dateStr = new Date().toLocaleDateString('fr-FR');
                const navName = proj.v.name || proj.name || 'Projet';

                const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Pre-dossier ADEME - ' + navName + '</title>' +
                '<style>' +
                '@page{size:A4;margin:20mm 18mm 25mm 18mm}' +
                '@media print{.no-print{display:none!important}}' +
                'body{font-family:system-ui,-apple-system,sans-serif;font-size:10.5px;color:#1E2D3D;line-height:1.55;margin:0;padding:0}' +
                'h1{font-size:17px;color:#1B9AAA;margin:0 0 4px}' +
                'h2{font-size:12.5px;color:#1E2D3D;margin:18px 0 6px;padding-bottom:3px;border-bottom:1px solid #ddd}' +
                'table{width:100%;border-collapse:collapse;margin:6px 0}' +
                'td,th{border:1px solid #ddd;padding:5px 8px;text-align:left;font-size:10px}' +
                'th{background:#EAF4F7;font-weight:600}' +
                'p{margin:4px 0}' +
                '.hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1B9AAA;padding-bottom:14px;margin-bottom:18px}' +
                '.hdr-logo{height:28px}' +
                '.hdr-right{text-align:right;font-size:9px;color:#999}' +
                '.hdr-title{font-size:9px;color:#666;margin:2px 0 0}' +
                '.ftr{position:fixed;bottom:0;left:0;right:0;padding:8px 18mm;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #1B9AAA;font-size:8px;color:#999}' +
                '.ftr-a{height:16px;margin-right:6px}' +
                '.ftr-right{text-align:right}' +
                '.annexe-title{color:#1B9AAA;font-size:12px;font-weight:700;margin-top:20px;margin-bottom:6px}' +
                '</style></head><body>' +

                // Header
                '<div class="hdr">' +
                '<div><img class="hdr-logo" src="' + GASPE_LOGO + '" style="mix-blend-mode:multiply" />' +
                '<p class="hdr-title">Groupement des Armateurs de Services Publics Maritimes de Passages d\'Eau</p></div>' +
                '<div class="hdr-right">Pre-dossier AAP ADEME 2026<br>Decarbonation maritime<br>' + dateStr + '</div>' +
                '</div>' +

                '<h1>Pre-dossier : ' + navName + '</h1>' +

                // 1. Fiche synthese
                '<h2>1. Fiche de synthese</h2>' +
                '<table><tr><th>Navire</th><td>' + navName + '</td><th>Type</th><td>' + (vt?.l || '-') + '</td></tr>' +
                '<tr><th>LOA</th><td>' + proj.v.loa + ' m</td><th>Jauge</th><td>' + proj.v.gt + ' GT</td></tr>' +
                '<tr><th>Puissance</th><td>' + proj.v.pP + ' kW</td><th>Classification</th><td>' + (cls === 'emissionNulle' ? 'Emission nulle' : cls === 'propre' ? 'Navire propre' : 'Efficacite amelioree') + '</td></tr>' +
                '<tr><th>Taille entreprise</th><td>' + proj.v.entSize + '</td><th>Region</th><td>' + (REGIONS.find(r=>r.id===proj.v.region)?.l || '-') + '</td></tr>' +
                '<tr><th>Cadre exploitation</th><td>' + (({"dsp":"DSP","sp":"Service public","agrement":"Agrement","prive":"Prive"} as Record<string, string>)[proj.v.serviceType || "dsp"] || "DSP") + '</td>' + (Object.entries(proj.trajs?.[1]?.fuelMix || {}).some(([k, v]) => ["elec", "h2"].includes(k) && v > 0) ? '<th>Mode recharge</th><td>' + (proj.v.chargeMode === "overnight" ? "Nuit uniquement" : "Au quai (opportunity)") + '</td>' : '<th></th><td></td>') + '</tr></table>' +

                // 2. Projet
                '<h2>2. Projet de decarbonation</h2>' +
                '<p><b>Technologies :</b> ' + (techList || '-') + '</p>' +
                '<p><b>Mix energetique cible :</b> ' + (mixStr || '-') + '</p>' +

                // 3. Contrefactuel
                '<h2>3. Scenario contrefactuel</h2>' +
                '<p><b>Type :</b> ' + ({"maintien":"Maintien du navire existant","newbuild_fossile":"Construction neuve fossile","reporté":"Investissement reporte","aucun":"Pas de contrefactuel"}[proj.contrefactuel?.type] || '-') + '</p>' +
                '<p><b>Surcout eligible :</b> ' + fK(surcout) + '</p>' +

                // 4. Gains
                '<h2>4. Gains environnementaux (periode : 5 ans)</h2>' +
                (scoring ? '<table><tr><th>CO2 evite</th><td>' + fmt(scoring.co2Evite) + ' t</td><th>Gain relatif</th><td>' + scoring.gainPct + '%</td></tr><tr><th>Ratio aide/tCO2</th><td>' + scoring.ratioEuroParTonne + ' EUR/tCO2</td><th></th><td></td></tr></table>' : '') +

                // 5. Budget
                '<h2>5. Budget previsionnel</h2>' +
                '<table><tr><th>Poste de depense</th><th style="text-align:right">Montant (k EUR)</th></tr>' +
                (proj.budget||[]).filter(b=>b.montant>0).map(b => { const cat = ADEME_EXPENSE_CATS.find(c=>c.id===b.id); return '<tr><td>'+(cat?.l||b.id)+'</td><td style="text-align:right">'+fmt(b.montant)+'</td></tr>'; }).join('') +
                '<tr style="font-weight:bold;background:#EAF4F7"><td>Total</td><td style="text-align:right">' + fmt((proj.budget||[]).reduce((s,b)=>s+(b.montant||0),0)) + '</td></tr></table>' +

                // 6. Aide
                '<h2>6. Aide estimee</h2>' +
                '<table><tr><th>Taux applicable</th><td>' + aide.taux + '%</td><th>Aide estimee</th><td><b>' + fK(aide.aide) + '</b></td></tr>' +
                '<tr><th>Ratio</th><td>' + (scoring?.ratioEuroParTonne || '-') + ' EUR/tCO2</td><th>Regime</th><td>' + aide.regime + '</td></tr></table>' +

                // Annexes
                '<div style="page-break-before:always"></div>' +
                '<div class="annexe-title">ANNEXES</div>' +

                '<h2>Annexe 1 : Do No Significant Harm (DNSH)</h2>' +
                (proj.dnsh||[]).map((d, i) => {
                  const ax = DNSH_AXES[i];
                  let s = ax ? '<p><b>' + ax.l + ' :</b> ' + (d.text || ax.template) + '</p>' : '';
                  if (d.fournisseur) s += '<p style="color:#666;font-style:italic">Fournisseur recyclage : ' + d.fournisseur + '</p>';
                  if (d.certification) s += '<p style="color:#666;font-style:italic">Certification bruit : ' + d.certification + '</p>';
                  if (d.antifouling) s += '<p style="color:#666;font-style:italic">Antifouling : ' + d.antifouling + '</p>';
                  return s;
                }).join('') +

                '<h2>Annexe 2 : Note methodologique GES</h2>' +
                '<table><tr><th>Parametre</th><th>Valeur</th><th>Source</th></tr>' +
                '<tr><td>Facteur emission MDO</td><td>3,206 kgCO2/kg</td><td>IMO MEPC.1/Circ.684</td></tr>' +
                '<tr><td>Densite MDO</td><td>0,85 kg/L</td><td>ISO 8217:2017, grade DMB</td></tr>' +
                '<tr><td>Degradation moteur</td><td>+1,5%/an</td><td>MAN Energy Solutions 2023</td></tr>' +
                '<tr><td>Periode reference</td><td>5 ans</td><td>CdC ADEME 2026, thematique 1</td></tr>' +
                '<tr><td>Batteries kWh</td><td>450 EUR/kWh installe</td><td>Corvus Orca ESS 2024</td></tr>' +
                '</table>' +

                '<h2>Annexe 3 : Ancrage territorial et souverainete</h2>' +
                '<p>Ce projet correspond a une transition souveraine, ancree localement : les prestataires techniques sont francais, le service rendu est un service public visible au quotidien par le contribuable, et les retombees economiques beneficient directement au territoire. La compagnie est captive en matiere d\'avitaillement (desserte locale, port secondaire non equipe en combustible alternatif).</p>' +

                '<h2>Annexe 4 : Aides publiques sollicitees</h2>' +
                '<table><tr><th>Dispositif</th><th style="text-align:right">Montant (k EUR)</th></tr>' +
                '<tr><td>ADEME AAP 2026</td><td style="text-align:right">' + fK(aide.aide) + '</td></tr>' +
                ((proj.autresAides ?? 0) > 0 ? '<tr><td>' + (proj.autresAidesDetail || 'Autres aides') + '</td><td style="text-align:right">' + fK(proj.autresAides ?? 0) + '</td></tr>' : '') +
                '<tr style="font-weight:bold;background:#EAF4F7"><td>Total aides sollicitees</td><td style="text-align:right">' + fK(aide.aide + (proj.autresAides || 0)) + '</td></tr></table>' +

                // Footer fixe
                '<div class="ftr">' +
                '<div style="display:flex;align-items:center"><img class="ftr-a" src="' + GASPE_A_COULEUR + '" /> Localement ancrees. Socialement engagees.</div>' +
                '<div class="ftr-right">Simulateur AAP ADEME 2026 v1.8<br>Document interne - Reproduction interdite<br>' + dateStr + '</div>' +
                '</div>' +

                '</body></html>';

                // Utiliser Blob URL au lieu de about:blank
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const w = window.open(url, '_blank');
                if (w) { w.onload = () => { setTimeout(() => w.print(), 300); }; }
              }}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: PU }}>
                🖨️ Exporter pre-dossier PDF (format A4)
              </button>
            </div>

            {/* Sources et méthodologie */}
            <Cd title="📖 Sources et méthodologie de calcul" data-protected="true">
              <div className="text-xs space-y-2" style={{ color: "#555", lineHeight: 1.6 }}>
                <p className="font-bold" style={{ color: D }}>Scoring ADEME (100 points) · CdC pp. 27-29</p>
                <p>• Efficacité environnementale (45 pts) : quantité CO₂e évitée sur 5 ans (15 pts, comparée au meilleur projet, estimation GASPE : max ~5 000 tCO₂) + gain relatif en % vs scénario de référence (30 pts, formule : 30 × (1 − tCO₂_projet / tCO₂_ref))</p>
                <p>• Efficacité des aides publiques (25 pts) : ratio € aide / tCO₂ évitée. Si ratio {">"} 200 €/tCO₂ → note de −5 . Sinon : 25 × meilleur_ratio / ratio_projet</p>
                <p>• Qualité technico-économique + résilience (30 pts) : TRL (5 pts), réductions hors-GES (5 pts), montage dossier GASPE (10 pts), localisation FR/EEE (10 pts)</p>
                <p className="font-bold mt-3" style={{ color: D }}>Taux d'aide LDACEE · CdC Annexe 2, régime SA.111726</p>
                <p>• Navire émission nulle (≥99% zéro-CO₂) : PE 60% / ME 50% / GE 30%</p>
                <p>• Navire propre (≥25% zéro-CO₂) : PE 50% / ME 40% / GE 20%</p>
                <p>• Efficacité avec contrefactuel : PE 50% / ME 40% / GE 30% (hors AFR), +5% zone c, +15% zone a</p>
                <p>• Efficacité sans contrefactuel : taux divisés par 2</p>
                <p>• Études/conseil : PE 80% / ME 70% / GE 60%</p>
                <p className="font-bold mt-3" style={{ color: D }}>Dimensionnement batteries (dimBatt)</p>
                <p>• Énergie par traversée = P_propulsion × durée × facteur de charge / 0.80 (SoC 10-90%, DNV Pt.6 Ch.2 Sec.1)</p>
                <p>• Contrainte puissance = P_crête / 2C (Corvus Orca ESS, décharge continue 2C max)</p>
                <p>• Chargeur = E_traversée / (temps_quai/60) × 1.1 (ABB Marine 2022)</p>
                <p>• Coût batteries : 450 €/kWh installé maritime (Corvus Orca ESS 2024, incl. BMS, refroidissement, certification BV NR 547), chargeur 200 €/kW</p>
                <p>• Cycles LFP : 5 000 à 80% DoD (Preger et al. 2020, J. Electrochem. Soc. 167)</p>
                <p className="font-bold mt-3" style={{ color: D }}>Émissions</p>
                <p>• CO₂ : 3,206 kgCO₂/kg MDO (IMO MEPC.1/Circ.684)</p>
                <p>• SOx/NOx/PM : IMO GHG Study 2020, ENTEC 2005</p>
                <p>• Prix MDO : 850 €/t (EIA STEO mars 2026, post-crise Iran, Brent ~80-95 $/bbl)</p>
                <p>• Escalade carburant : 4%/an (risque géopolitique structurel post-fermeture Ormuz)</p>
                <p className="font-bold mt-3" style={{ color: D }}>Analyse de sensibilité (robustesse)</p>
                <p>Les résultats CCV sont calculés en 3 scénarios : base (gains technologiques médians), dégradé (gains réduits de 30%), favorable (gains maximaux). L'écart entre les scénarios mesure l'incertitude du projet. Les paramètres sensibles sont : prix carburant (±20%), dégradation batteries (±2 ans sur la durée de vie), facteur de charge (±10%). La dégradation du moteur fossile (+1,5%/an, source MAN Energy Solutions 2023) est intégrée dans le scénario de référence.</p>
                <p className="font-bold mt-3" style={{ color: D }}>Cadre réglementaire</p>
                <p>• AAP ADEME 2026 : CdC publié le 2 avril 2026, clôture 6 juillet 2026</p>
                <p>• Art. 301, loi n° 2021-1104 (Climat et Résilience)</p>
                <p>• Stratégie OMI révisée 2023 (selection par comite : DGAMPA, DGE, DGITM, Direction du Budget, CBCM, ADEME) : neutralité 2050, −20% en 2030</p>
                <p>• Régime SA.111726 (LDACEE), SA.111728 (PME), SA.119559 (AFR)</p>
                <p>• Classification navire : RGEC art. 36 ter (navire propre / émission nulle)</p>
                <p>• DNSH : art. 17, règlement UE 2020/852 (Taxonomie)</p>
              </div>
            </Cd>
          </div>
        )}




        {/* Pied de page */}
        <div className="text-center py-4 mt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src={GASPE_A_COULEUR} alt="" style={{ height: 20, borderRadius: 3 }} />
            <p className="text-xs" style={{ color: "#bbb" }}>
              Localement ancrées. Socialement engagées.
            </p>
          </div>
          <p className="text-xs mt-1" style={{ color: "#ccc" }}>
            v2.0.2 · Simulateur AAP ADEME 2026 · Propulsé par{" "}
            <a href="https://vaiata-dynamics.com/fr/" target="_blank" rel="noopener" style={{ color: T }}>VAIATA Dynamics</a>
          </p>
        </div>
      </div>
    </div>
  );
}
