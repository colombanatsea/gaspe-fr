/* ------------------------------------------------------------------ */
/*  Certifications STCW – Catalogue structuré                          */
/*  Standards of Training, Certification and Watchkeeping (OMI)        */
/*                                                                     */
/*  Sources :                                                          */
/*  - Convention STCW 1978 amendée (OMI), chapitres II à VIII          */
/*  - Code STCW, parties A (obligatoire) et B (recommandations)        */
/*  - Arrêté du 26 juillet 2013 (formation professionnelle maritime)   */
/*  - Direction des Affaires Maritimes (DAM), référentiel brevets      */
/* ------------------------------------------------------------------ */

export type STCWCategory = "pont" | "machine" | "securite" | "radio";

export interface STCWCertification {
  code: string;
  frenchName: string;
  englishName: string;
  category: STCWCategory;
  stcwRef: string;
  powerOrTonnage?: string;
  validityYears: number;
  prerequisites: string[];
  description: string;
}

export const STCW_CERTIFICATIONS: STCWCertification[] = [
  // Pont
  {
    code: "CAP200",
    frenchName: "Capitaine 200",
    englishName: "Master 200 GT",
    category: "pont",
    stcwRef: "STCW II/3",
    powerOrTonnage: "≤ 200 UMS",
    validityYears: 5,
    prerequisites: ["CFBS", "CRO", "Certificat médical maritime"],
    description: "Commandement de navires de jauge brute ≤ 200 UMS en navigation côtière.",
  },
  {
    code: "CAP500",
    frenchName: "Capitaine 500",
    englishName: "Master 500 GT",
    category: "pont",
    stcwRef: "STCW II/2",
    powerOrTonnage: "≤ 500 UMS",
    validityYears: 5,
    prerequisites: ["Capitaine 200", "24 mois de navigation", "CGO"],
    description: "Commandement de navires de jauge brute ≤ 500 UMS, toutes navigations.",
  },
  {
    code: "CAP3000",
    frenchName: "Capitaine 3000",
    englishName: "Master 3000 GT",
    category: "pont",
    stcwRef: "STCW II/2",
    powerOrTonnage: "≤ 3000 UMS",
    validityYears: 5,
    prerequisites: ["Capitaine 500", "36 mois de navigation", "Anglais maritime"],
    description: "Commandement de navires de jauge brute ≤ 3000 UMS.",
  },
  {
    code: "CAPILL",
    frenchName: "Capitaine illimité",
    englishName: "Master Unlimited",
    category: "pont",
    stcwRef: "STCW II/2",
    powerOrTonnage: "Illimité",
    validityYears: 5,
    prerequisites: ["Capitaine 3000", "36 mois de navigation supplémentaires"],
    description: "Commandement de tout navire, sans limitation de jauge.",
  },
  {
    code: "LT",
    frenchName: "Lieutenant",
    englishName: "Officer in charge of a navigational watch",
    category: "pont",
    stcwRef: "STCW II/1",
    validityYears: 5,
    prerequisites: ["CFBS", "CRO", "12 mois de navigation"],
    description: "Officier de quart à la passerelle, second du capitaine.",
  },
  {
    code: "MATELOT",
    frenchName: "Certificat de matelot pont",
    englishName: "Able Seafarer Deck",
    category: "pont",
    stcwRef: "STCW II/5",
    validityYears: 5,
    prerequisites: ["CFBS"],
    description: "Qualification de matelot de pont pour la veille et les manœuvres.",
  },

  // Machine
  {
    code: "MEC250",
    frenchName: "Mécanicien 250 kW",
    englishName: "Engineer Officer 250 kW",
    category: "machine",
    stcwRef: "STCW III/1",
    powerOrTonnage: "≤ 250 kW",
    validityYears: 5,
    prerequisites: ["CFBS", "Formation mécanicien"],
    description: "Conduite de la machine sur navires de puissance ≤ 250 kW.",
  },
  {
    code: "MEC750",
    frenchName: "Mécanicien 750 kW",
    englishName: "Engineer Officer 750 kW",
    category: "machine",
    stcwRef: "STCW III/1",
    powerOrTonnage: "≤ 750 kW",
    validityYears: 5,
    prerequisites: ["Mécanicien 250 kW", "12 mois de navigation"],
    description: "Conduite et maintenance des installations machine ≤ 750 kW.",
  },
  {
    code: "CM3000",
    frenchName: "Chef mécanicien 3000 kW",
    englishName: "Chief Engineer Officer 3000 kW",
    category: "machine",
    stcwRef: "STCW III/3",
    powerOrTonnage: "≤ 3000 kW",
    validityYears: 5,
    prerequisites: ["Mécanicien 750 kW", "24 mois de navigation"],
    description: "Responsable des installations machine sur navires ≤ 3000 kW.",
  },
  {
    code: "CM8000",
    frenchName: "Chef mécanicien 8000 kW",
    englishName: "Chief Engineer Officer 8000 kW",
    category: "machine",
    stcwRef: "STCW III/2",
    powerOrTonnage: "≤ 8000 kW",
    validityYears: 5,
    prerequisites: ["Chef mécanicien 3000 kW", "24 mois de navigation"],
    description: "Responsable des installations machine sur navires ≤ 8000 kW.",
  },
  {
    code: "CMILL",
    frenchName: "Chef mécanicien illimité",
    englishName: "Chief Engineer Officer Unlimited",
    category: "machine",
    stcwRef: "STCW III/2",
    powerOrTonnage: "Illimité",
    validityYears: 5,
    prerequisites: ["Chef mécanicien 8000 kW", "24 mois de navigation"],
    description: "Responsable machine sans limitation de puissance.",
  },

  // Sécurité
  {
    code: "CFBS",
    frenchName: "Certificat de formation de base à la sécurité",
    englishName: "Basic Safety Training",
    category: "securite",
    stcwRef: "STCW VI/1",
    validityYears: 5,
    prerequisites: [],
    description: "Formation obligatoire : survie, lutte incendie, premiers secours, sécurité personnelle.",
  },
  {
    code: "PSMER",
    frenchName: "Premiers secours en mer",
    englishName: "Medical First Aid",
    category: "securite",
    stcwRef: "STCW VI/4",
    validityYears: 5,
    prerequisites: ["CFBS"],
    description: "Formation aux premiers secours spécifiques au milieu maritime.",
  },
  {
    code: "ISM",
    frenchName: "Code ISM – Gestion de la sécurité",
    englishName: "ISM Code – Safety Management",
    category: "securite",
    stcwRef: "STCW A-I/14",
    validityYears: 5,
    prerequisites: ["CFBS"],
    description: "Code international de gestion de la sécurité à bord.",
  },
  {
    code: "ISPS",
    frenchName: "Agent de sûreté du navire",
    englishName: "Ship Security Officer",
    category: "securite",
    stcwRef: "STCW VI/5",
    validityYears: 5,
    prerequisites: ["CFBS"],
    description: "Formation à la sûreté maritime selon le code ISPS.",
  },
  {
    code: "ENGINS",
    frenchName: "Conduite des engins de sauvetage",
    englishName: "Proficiency in Survival Craft",
    category: "securite",
    stcwRef: "STCW VI/2",
    validityYears: 5,
    prerequisites: ["CFBS"],
    description: "Mise à l'eau et conduite des embarcations et radeaux de sauvetage.",
  },
  {
    code: "LUTTE_INCENDIE",
    frenchName: "Lutte incendie avancée",
    englishName: "Advanced Fire Fighting",
    category: "securite",
    stcwRef: "STCW VI/3",
    validityYears: 5,
    prerequisites: ["CFBS"],
    description: "Techniques avancées de lutte contre l'incendie à bord.",
  },

  // Radio
  {
    code: "CRO",
    frenchName: "Certificat restreint d'opérateur",
    englishName: "Restricted Operator Certificate",
    category: "radio",
    stcwRef: "STCW IV/2",
    validityYears: 0,
    prerequisites: [],
    description: "Utilisation des équipements radioélectriques du SMDSM en zone A1.",
  },
  {
    code: "CGO",
    frenchName: "Certificat général d'opérateur",
    englishName: "General Operator Certificate",
    category: "radio",
    stcwRef: "STCW IV/2",
    validityYears: 0,
    prerequisites: ["CRO"],
    description: "Utilisation de tous les équipements radioélectriques du SMDSM.",
  },
  {
    code: "ECDIS",
    frenchName: "ECDIS – Cartes électroniques",
    englishName: "Electronic Chart Display and Information System",
    category: "radio",
    stcwRef: "STCW A-II/1",
    validityYears: 5,
    prerequisites: ["Certificat de matelot pont"],
    description: "Utilisation des systèmes de visualisation des cartes électroniques.",
  },
  {
    code: "RADAR",
    frenchName: "Radar et APRA",
    englishName: "Radar and ARPA",
    category: "radio",
    stcwRef: "STCW A-II/1",
    validityYears: 5,
    prerequisites: ["Certificat de matelot pont"],
    description: "Utilisation du radar et de l'aide de pointage radar automatique.",
  },
];

export const STCW_CATEGORY_LABELS: Record<STCWCategory, string> = {
  pont: "Pont",
  machine: "Machine",
  securite: "Sécurité",
  radio: "Radiocommunications",
};

/** Match candidate certifications text against a job's brevet requirement */
export function matchCertifications(
  candidateCerts: string,
  jobBrevet: string | undefined
): { matched: boolean; score: number } {
  if (!jobBrevet || !candidateCerts) return { matched: false, score: 0 };

  const certs = candidateCerts.toLowerCase();
  const brevet = jobBrevet.toLowerCase();

  // Direct match
  if (certs.includes(brevet)) return { matched: true, score: 100 };

  // Try matching STCW codes
  const jobCert = STCW_CERTIFICATIONS.find(
    (c) =>
      brevet.includes(c.frenchName.toLowerCase()) ||
      brevet.includes(c.code.toLowerCase()) ||
      brevet.includes(c.stcwRef.toLowerCase())
  );

  if (jobCert) {
    // Check if candidate has this exact cert
    if (
      certs.includes(jobCert.frenchName.toLowerCase()) ||
      certs.includes(jobCert.code.toLowerCase())
    ) {
      return { matched: true, score: 100 };
    }

    // Check if candidate has a higher cert in same category
    const sameCatCerts = STCW_CERTIFICATIONS.filter(
      (c) => c.category === jobCert.category
    );
    const jobIdx = sameCatCerts.indexOf(jobCert);
    for (let i = jobIdx + 1; i < sameCatCerts.length; i++) {
      if (
        certs.includes(sameCatCerts[i].frenchName.toLowerCase()) ||
        certs.includes(sameCatCerts[i].code.toLowerCase())
      ) {
        return { matched: true, score: 90 };
      }
    }

    // Partial keyword match
    const keywords = brevet.split(/[\s,()]+/).filter((w) => w.length > 3);
    const matchCount = keywords.filter((w) => certs.includes(w)).length;
    if (matchCount > 0) {
      return { matched: true, score: Math.round((matchCount / keywords.length) * 70) };
    }
  }

  // Fallback keyword match
  const words = brevet.split(/[\s,()]+/).filter((w) => w.length > 3);
  const hits = words.filter((w) => certs.includes(w)).length;
  if (hits > 0) return { matched: true, score: Math.round((hits / words.length) * 60) };

  return { matched: false, score: 0 };
}
