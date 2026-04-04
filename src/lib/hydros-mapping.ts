/* ------------------------------------------------------------------ */
/*  Hydros Alumni — Mapping GASPE → AlumnForce dropdown IDs            */
/*  Used for cross-publication on hydros-alumni.org                     */
/* ------------------------------------------------------------------ */

export const HYDROS_CONTRACT_TYPE: Record<string, string> = {
  'CDI': '3000295',
  'CDD': '3000296',
  'Stage': '3000297',
  'Alternance': '3000297',
  'Saisonnier': '3000296',
  'Autres': '3000299',
};

export const HYDROS_POSITION: Record<string, string> = {
  'Pont': '3000209',
  'Machine': '3000210',
  'Technique': '3000214',
  'Personnel hôtelier': '3000299',
  'Personnel à terre': '3000203',
  'Direction': '3000197',
  'Autre': '3000299',
};

export const HYDROS_BEGIN: Record<string, string> = {
  'Immédiat': '3000409',
  'Non précisé': '3000410',
  'Janvier': '3000411',
  'Février': '3000412',
  'Mars': '3000413',
  'Avril': '3000414',
  'Mai': '3000415',
  'Juin': '3000416',
  'Juillet': '3000417',
  'Août': '3000418',
  'Septembre': '3000419',
  'Octobre': '3000420',
  'Novembre': '3000421',
  'Décembre': '3000422',
};

export const HYDROS_FIXED = {
  SECTOR_TRANSPORTS: '3000381',
  REMOTE_ON_SITE: '3000432',
  DEFAULT_BEGIN: '3000409', // Immédiat
} as const;

/**
 * Build the payload for Hydros Alumni publication.
 * Returns an object ready to be sent to POST /api/hydros/publish.
 */
export function buildHydrosPayload(job: {
  title: string;
  description: string;
  profile: string;
  conditions: string;
  company: string;
  companyDescription?: string;
  location: string;
  contractType: string;
  category: string;
  startDate?: string;
  expiresAt?: string;
  reference?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail: string;
  contactPhone?: string;
  applicationUrl?: string;
  handiAccessible?: boolean;
}) {
  const expiresFormatted = job.expiresAt
    ? new Date(job.expiresAt).toLocaleDateString('fr-FR')
    : new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');

  return {
    title: job.title,
    description: job.description,
    profile: job.profile,
    conditions: job.conditions,
    companyName: job.company,
    companyDescription: job.companyDescription || `${job.company}, compagnie maritime adhérente du GASPE, basée en France.`,
    location: job.location,
    reference: job.reference,

    // Mapped IDs
    contractTypeId: HYDROS_CONTRACT_TYPE[job.contractType] ?? HYDROS_CONTRACT_TYPE['Autres'],
    positionId: HYDROS_POSITION[job.category] ?? HYDROS_POSITION['Autre'],
    beginId: HYDROS_BEGIN[job.startDate ?? 'Immédiat'] ?? HYDROS_FIXED.DEFAULT_BEGIN,
    sectorId: HYDROS_FIXED.SECTOR_TRANSPORTS,
    remoteId: HYDROS_FIXED.REMOTE_ON_SITE,

    expiresAt: expiresFormatted,
    handiAccessible: job.handiAccessible ?? false,

    // Contact
    contactFirstName: job.contactFirstName ?? '',
    contactLastName: job.contactLastName ?? '',
    contactEmail: job.contactEmail,
    contactPhone: job.contactPhone,
    applicationUrl: job.applicationUrl,
  };
}
