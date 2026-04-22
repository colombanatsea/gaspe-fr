/**
 * Certifications maritimes françaises – hiérarchie STCW.
 * Source : Code des transports, Convention STCW, Affaires Maritimes.
 *
 * Chaque certification a un champ `supersedes` indiquant quels brevets
 * inférieurs elle couvre (un Capitaine 3000 satisfait un poste Capitaine 500).
 */

export interface MaritimeCertification {
  id: string;
  label: string;
  shortLabel: string;
  stcwCode?: string;
  category: "pont" | "machine" | "securite" | "medical" | "specialise";
  validityYears: number; // 0 = permanent
  supersedes: string[]; // IDs of lower certifications this one covers
  description?: string;
}

export const CERTIFICATION_CATEGORIES = [
  { id: "pont" as const, label: "Pont (Navigation)" },
  { id: "machine" as const, label: "Machine (Mécanique)" },
  { id: "securite" as const, label: "Sécurité" },
  { id: "medical" as const, label: "Médical" },
  { id: "specialise" as const, label: "Spécialisé" },
] as const;

export const maritimeCertifications: MaritimeCertification[] = [
  // ═══════════════════════════════════════
  //  PONT (Navigation / Deck)
  // ═══════════════════════════════════════
  {
    id: "patron-nav-cotiere",
    label: "Patron de Navigation Côtière",
    shortLabel: "Patron côtier",
    category: "pont",
    validityYears: 5,
    supersedes: [],
    description: "Commandement de petits navires en navigation côtière.",
  },
  {
    id: "capitaine-200",
    label: "Capitaine 200",
    shortLabel: "Cap. 200",
    stcwCode: "STCW II/3",
    category: "pont",
    validityYears: 5,
    supersedes: ["patron-nav-cotiere"],
    description: "Commandement de navires <200 UMS en navigation côtière.",
  },
  {
    id: "capitaine-500",
    label: "Capitaine 500",
    shortLabel: "Cap. 500",
    stcwCode: "STCW II/3",
    category: "pont",
    validityYears: 5,
    supersedes: ["capitaine-200", "patron-nav-cotiere"],
    description: "Commandement de navires <500 UMS.",
  },
  {
    id: "capitaine-3000",
    label: "Capitaine 3000",
    shortLabel: "Cap. 3000",
    stcwCode: "STCW II/2",
    category: "pont",
    validityYears: 5,
    supersedes: ["capitaine-500", "capitaine-200", "patron-nav-cotiere"],
    description: "Commandement de navires <3000 UMS.",
  },
  {
    id: "capitaine-illimite",
    label: "Capitaine – Brevet illimité",
    shortLabel: "Cap. illimité",
    stcwCode: "STCW II/2",
    category: "pont",
    validityYears: 5,
    supersedes: ["capitaine-3000", "capitaine-500", "capitaine-200", "patron-nav-cotiere"],
    description: "Commandement de tout navire, toute jauge, toute navigation.",
  },
  {
    id: "lieutenant-long-cours",
    label: "Lieutenant au Long Cours",
    shortLabel: "Lt. long cours",
    stcwCode: "STCW II/2",
    category: "pont",
    validityYears: 5,
    supersedes: ["capitaine-500", "capitaine-200"],
    description: "Second du capitaine sur navires de toute jauge.",
  },

  // ═══════════════════════════════════════
  //  MACHINE (Engine)
  // ═══════════════════════════════════════
  {
    id: "mecanicien-250",
    label: "Mécanicien 250 kW",
    shortLabel: "Méca. 250",
    category: "machine",
    validityYears: 5,
    supersedes: [],
    description: "Conduite d'installations machine <250 kW.",
  },
  {
    id: "mecanicien-750",
    label: "Mécanicien 750 kW",
    shortLabel: "Méca. 750",
    stcwCode: "STCW III/1",
    category: "machine",
    validityYears: 5,
    supersedes: ["mecanicien-250"],
    description: "Conduite d'installations machine <750 kW.",
  },
  {
    id: "mecanicien-3000",
    label: "Mécanicien 3000 kW",
    shortLabel: "Méca. 3000",
    stcwCode: "STCW III/1",
    category: "machine",
    validityYears: 5,
    supersedes: ["mecanicien-750", "mecanicien-250"],
    description: "Conduite d'installations machine <3000 kW.",
  },
  {
    id: "chef-mecanicien-3000",
    label: "Chef Mécanicien 3000 kW",
    shortLabel: "Chef méca. 3000",
    stcwCode: "STCW III/3",
    category: "machine",
    validityYears: 5,
    supersedes: ["mecanicien-3000", "mecanicien-750", "mecanicien-250"],
    description: "Responsabilité des installations machine <3000 kW.",
  },
  {
    id: "chef-mecanicien-8000",
    label: "Chef Mécanicien 8000 kW",
    shortLabel: "Chef méca. 8000",
    stcwCode: "STCW III/2",
    category: "machine",
    validityYears: 5,
    supersedes: ["chef-mecanicien-3000", "mecanicien-3000", "mecanicien-750", "mecanicien-250"],
    description: "Responsabilité des installations machine <8000 kW.",
  },
  {
    id: "chef-mecanicien-illimite",
    label: "Chef Mécanicien – Brevet illimité",
    shortLabel: "Chef méca. illimité",
    stcwCode: "STCW III/2",
    category: "machine",
    validityYears: 5,
    supersedes: ["chef-mecanicien-8000", "chef-mecanicien-3000", "mecanicien-3000", "mecanicien-750", "mecanicien-250"],
    description: "Responsabilité de toute installation machine, toute puissance.",
  },
  {
    id: "oelt",
    label: "Officier Électronicien (OELT)",
    shortLabel: "OELT",
    stcwCode: "STCW III/6",
    category: "machine",
    validityYears: 5,
    supersedes: [],
    description: "Maintenance des systèmes électroniques et électriques à bord.",
  },

  // ═══════════════════════════════════════
  //  SÉCURITÉ (Safety)
  // ═══════════════════════════════════════
  {
    id: "cfbs",
    label: "Certificat de Formation de Base à la Sécurité (CFBS)",
    shortLabel: "CFBS",
    stcwCode: "STCW VI/1",
    category: "securite",
    validityYears: 5,
    supersedes: [],
    description: "Formation obligatoire pour tout personnel embarqué : incendie, survie, premiers secours.",
  },
  {
    id: "caeers",
    label: "Certificat d'Aptitude à l'Exploitation des Embarcations et Radeaux de Sauvetage",
    shortLabel: "CAEERS",
    stcwCode: "STCW VI/2",
    category: "securite",
    validityYears: 5,
    supersedes: [],
    description: "Mise en œuvre des engins de sauvetage.",
  },
  {
    id: "lutte-incendie-avancee",
    label: "Lutte Incendie Avancée",
    shortLabel: "Incendie avancé",
    stcwCode: "STCW VI/3",
    category: "securite",
    validityYears: 5,
    supersedes: [],
    description: "Techniques avancées de lutte contre l'incendie à bord.",
  },
  {
    id: "sso",
    label: "Agent de Sûreté du Navire (SSO)",
    shortLabel: "SSO",
    stcwCode: "STCW VI/5",
    category: "securite",
    validityYears: 5,
    supersedes: [],
    description: "Responsabilité sûreté à bord (Code ISPS).",
  },
  {
    id: "ism-audit",
    label: "Auditeur Interne ISM",
    shortLabel: "ISM Audit",
    category: "securite",
    validityYears: 0,
    supersedes: [],
    description: "Conduite d'audits internes Code ISM.",
  },
  {
    id: "premiers-secours-mer",
    label: "Premiers Secours en Mer (PSMer)",
    shortLabel: "PSMer",
    category: "securite",
    validityYears: 5,
    supersedes: [],
    description: "Gestes d'urgence, DEA, hypothermie, noyade, évacuation sanitaire.",
  },

  // ═══════════════════════════════════════
  //  MÉDICAL
  // ═══════════════════════════════════════
  {
    id: "aptitude-medicale",
    label: "Certificat d'Aptitude Médicale à la Navigation",
    shortLabel: "Aptitude médicale",
    category: "medical",
    validityYears: 2, // 1 an après 55 ans
    supersedes: [],
    description: "Aptitude physique requise pour tout embarquement. Renouvelable tous les 2 ans (1 an après 55 ans).",
  },

  // ═══════════════════════════════════════
  //  SPÉCIALISÉ
  // ═══════════════════════════════════════
  {
    id: "cro",
    label: "Certificat de Capacité - Opérateur Radio (CRO)",
    shortLabel: "CRO",
    stcwCode: "STCW IV/2",
    category: "specialise",
    validityYears: 0,
    supersedes: [],
    description: "Exploitation des équipements radio SMDSM.",
  },
  {
    id: "cgo-petrolier",
    label: "Certificat de Gestion des Opérations – Pétrolier",
    shortLabel: "CGO Pétrolier",
    category: "specialise",
    validityYears: 5,
    supersedes: [],
    description: "Opérations de cargaison sur navires pétroliers.",
  },
  {
    id: "cgo-chimiquiers",
    label: "Certificat de Gestion des Opérations – Chimiquiers",
    shortLabel: "CGO Chimiquiers",
    category: "specialise",
    validityYears: 5,
    supersedes: [],
    description: "Opérations de cargaison sur navires chimiquiers.",
  },
  {
    id: "formation-passagers",
    label: "Formation Navires à Passagers",
    shortLabel: "Passagers",
    stcwCode: "STCW V/2",
    category: "specialise",
    validityYears: 5,
    supersedes: [],
    description: "Gestion de foule, sûreté passagers, procédures d'urgence sur navires à passagers.",
  },
];

/** Get a certification by its ID. */
export function getCertificationById(id: string): MaritimeCertification | undefined {
  return maritimeCertifications.find((c) => c.id === id);
}

/** Check if certId satisfies the requirement (directly or via supersedes chain). */
export function certSatisfiesRequirement(certId: string, requiredCertId: string): boolean {
  if (certId === requiredCertId) return true;
  const cert = getCertificationById(certId);
  return cert?.supersedes.includes(requiredCertId) ?? false;
}

/** Get all certifications grouped by category. */
export function getCertificationsByCategory(): Record<string, MaritimeCertification[]> {
  const grouped: Record<string, MaritimeCertification[]> = {};
  for (const cat of CERTIFICATION_CATEGORIES) {
    grouped[cat.id] = maritimeCertifications.filter((c) => c.category === cat.id);
  }
  return grouped;
}
