// Helpers purs pour la feature "Validation annuelle des donnees adherents".
// Aucune dependance D1 / fetch / Request : 100 % logique metier testable
// en isolation. Voir docs/VALIDATION-ANNUELLE-FEATURE.md pour la spec.

export type ValidationItemType = "profile" | "vessel";
export type CampaignStatus = "draft" | "open" | "closed";
export type CampaignUrgency =
  | "draft"
  | "open"
  | "due-soon"
  | "overdue"
  | "closed";

export interface ValidationCampaignRow {
  id: number;
  target_year: number;
  opened_at: string | null;
  target_date: string | null;
  closed_at: string | null;
  status: CampaignStatus;
  created_by: string | null;
  notes: string | null;
}

/** Tout objet portant un last_validated_year (cache projete migration 0028). */
export interface ValidatableItem {
  last_validated_year: number | null;
}

/** Vrai si l'item a ete valide pour l'annee cible (ou plus recente). */
export function isItemValidatedForYear(
  item: ValidatableItem,
  targetYear: number,
): boolean {
  const last = item.last_validated_year;
  if (last === null || last === undefined) return false;
  return last >= targetYear;
}

/** Compteur d'items valides parmi une liste, pour rendu dashboard. */
export function countValidatedItems(
  items: readonly ValidatableItem[],
  targetYear: number,
): { validated: number; total: number; percentage: number } {
  const total = items.length;
  if (total === 0) return { validated: 0, total: 0, percentage: 0 };
  const validated = items.filter((i) => isItemValidatedForYear(i, targetYear))
    .length;
  return {
    validated,
    total,
    percentage: Math.round((validated / total) * 100),
  };
}

/**
 * Niveau d'urgence visuel d'une campagne, pour bandeau adherent et dashboard.
 * - draft / closed : etat literal de la campagne
 * - overdue : passe la target_date
 * - due-soon : dans la fenetre J-`dueSoonDays` avant target_date
 * - open : avant la fenetre due-soon (ou pas de target_date)
 *
 * `nowMs` est injectable pour faciliter les tests deterministes.
 */
export function deriveCampaignUrgency(
  campaign: Pick<ValidationCampaignRow, "status" | "target_date">,
  nowMs: number = Date.now(),
  dueSoonDays: number = 14,
): CampaignUrgency {
  if (campaign.status === "draft") return "draft";
  if (campaign.status === "closed") return "closed";
  if (!campaign.target_date) return "open";
  const targetMs = new Date(campaign.target_date).getTime();
  if (Number.isNaN(targetMs)) return "open";
  if (nowMs > targetMs) return "overdue";
  const dueSoonThreshold = targetMs - dueSoonDays * 86_400_000;
  if (nowMs >= dueSoonThreshold) return "due-soon";
  return "open";
}

/**
 * Resout l'annee cible pour une nouvelle validation.
 * - Si une campagne est ouverte, on adopte son target_year (validation
 *   pendant la fenetre officielle).
 * - Sinon, on prend l'annee courante (validation hors campagne, autorisee).
 */
export function resolveTargetYear(
  openCampaign: Pick<ValidationCampaignRow, "target_year"> | null,
  nowDate: Date = new Date(),
): number {
  if (openCampaign) return openCampaign.target_year;
  return nowDate.getUTCFullYear();
}

// ────────────────────────────────────────────────────────────────────────────
// Snapshots : structures serialisees stockees dans validation_history.snapshot_json
// ────────────────────────────────────────────────────────────────────────────

export interface OrgProfileSnapshot {
  email: string | null;
  phone: string | null;
  address: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  employeeCount: number | null;
  shipCount: number | null;
}

/** Construit un snapshot du profil organisation a partir d'une ligne D1. */
export function buildProfileSnapshot(row: {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  description?: string | null;
  employee_count?: number | null;
  ship_count?: number | null;
}): OrgProfileSnapshot {
  return {
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    websiteUrl: row.website_url ?? null,
    logoUrl: row.logo_url ?? null,
    description: row.description ?? null,
    employeeCount: row.employee_count ?? null,
    shipCount: row.ship_count ?? null,
  };
}

export interface VesselSnapshot {
  id: string;
  name: string;
  imo: string | null;
  type: string | null;
  flag: string | null;
  yearBuilt: number | null;
  passengerCapacity: number | null;
  vehicleCapacity: number | null;
  freightCapacity: number | null;
  grossTonnage: number | null;
  crewByBrevet: Record<string, number> | null;
}

/**
 * Snapshot d'un navire. Parse defensivement le JSON crew_by_brevet et filtre
 * les paires invalides (non numeriques ou <= 0).
 */
export function buildVesselSnapshot(row: {
  id: string;
  name: string;
  imo?: string | null;
  type?: string | null;
  flag?: string | null;
  year_built?: number | null;
  passenger_capacity?: number | null;
  vehicle_capacity?: number | null;
  freight_capacity?: number | null;
  gross_tonnage?: number | null;
  crew_by_brevet?: string | null;
}): VesselSnapshot {
  let crewByBrevet: Record<string, number> | null = null;
  if (row.crew_by_brevet) {
    try {
      const parsed = JSON.parse(row.crew_by_brevet);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const cleaned: Record<string, number> = {};
        for (const [key, val] of Object.entries(
          parsed as Record<string, unknown>,
        )) {
          const n = typeof val === "number" ? val : Number(val);
          if (Number.isFinite(n) && n > 0) cleaned[key] = Math.floor(n);
        }
        if (Object.keys(cleaned).length > 0) crewByBrevet = cleaned;
      }
    } catch {
      /* JSON malforme, on laisse null */
    }
  }
  return {
    id: row.id,
    name: row.name,
    imo: row.imo ?? null,
    type: row.type ?? null,
    flag: row.flag ?? null,
    yearBuilt: row.year_built ?? null,
    passengerCapacity: row.passenger_capacity ?? null,
    vehicleCapacity: row.vehicle_capacity ?? null,
    freightCapacity: row.freight_capacity ?? null,
    grossTonnage: row.gross_tonnage ?? null,
    crewByBrevet,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Parsing de l'input POST /api/organizations/:slug/validations
// ────────────────────────────────────────────────────────────────────────────

export interface ValidationRequestItem {
  type: ValidationItemType;
  id?: string;
  unchanged: boolean;
  data?: Record<string, unknown>;
}

export class ValidationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationInputError";
  }
}

const MAX_ITEMS_PER_REQUEST = 200;

/**
 * Valide et normalise le tableau `items` du body POST. Throw
 * `ValidationInputError` (HTTP 400 cote Worker) si invalide.
 */
export function parseValidationItems(raw: unknown): ValidationRequestItem[] {
  if (!Array.isArray(raw)) {
    throw new ValidationInputError("Champ 'items' doit etre un tableau");
  }
  if (raw.length === 0) {
    throw new ValidationInputError("Au moins un item a valider");
  }
  if (raw.length > MAX_ITEMS_PER_REQUEST) {
    throw new ValidationInputError(
      `Trop d'items (max ${MAX_ITEMS_PER_REQUEST} par requete)`,
    );
  }
  const out: ValidationRequestItem[] = [];
  const seenVesselIds = new Set<string>();
  let profileSeen = false;
  for (let i = 0; i < raw.length; i++) {
    const it = raw[i];
    if (!it || typeof it !== "object") {
      throw new ValidationInputError(`items[${i}] : objet attendu`);
    }
    const o = it as Record<string, unknown>;
    if (o.type !== "profile" && o.type !== "vessel") {
      throw new ValidationInputError(
        `items[${i}].type doit etre 'profile' ou 'vessel'`,
      );
    }
    if (o.type === "profile") {
      if (profileSeen) {
        throw new ValidationInputError(
          `items[${i}] : profile en double (un seul profil par requete)`,
        );
      }
      profileSeen = true;
    } else {
      if (!o.id || typeof o.id !== "string" || o.id.trim().length === 0) {
        throw new ValidationInputError(
          `items[${i}].id (vessel) requis et non vide`,
        );
      }
      if (seenVesselIds.has(o.id)) {
        throw new ValidationInputError(
          `items[${i}] : vessel id '${o.id}' en double`,
        );
      }
      seenVesselIds.add(o.id);
    }
    out.push({
      type: o.type,
      id: typeof o.id === "string" ? o.id : undefined,
      unchanged: o.unchanged === true,
      data:
        typeof o.data === "object" && o.data !== null
          ? (o.data as Record<string, unknown>)
          : undefined,
    });
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Vue admin : agrege la progression d'une campagne
// ────────────────────────────────────────────────────────────────────────────

export interface DashboardOrgRow {
  organizationId: string;
  organizationName: string;
  slug: string;
  profileLastValidatedYear: number | null;
  vessels: ValidatableItem[];
  titulaireEmail: string | null;
}

export interface DashboardOrgSummary {
  organizationId: string;
  organizationName: string;
  slug: string;
  profileValidated: boolean;
  vesselsValidated: number;
  vesselsTotal: number;
  fullyValidated: boolean;
  titulaireEmail: string | null;
}

/** Projette une ligne brute en resume cote dashboard pour l'annee cible. */
export function summarizeOrgForDashboard(
  row: DashboardOrgRow,
  targetYear: number,
): DashboardOrgSummary {
  const profileValidated = (row.profileLastValidatedYear ?? 0) >= targetYear;
  const vesselsTotal = row.vessels.length;
  const vesselsValidated = row.vessels.filter((v) =>
    isItemValidatedForYear(v, targetYear),
  ).length;
  return {
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    slug: row.slug,
    profileValidated,
    vesselsValidated,
    vesselsTotal,
    fullyValidated:
      profileValidated &&
      (vesselsTotal === 0 || vesselsValidated === vesselsTotal),
    titulaireEmail: row.titulaireEmail,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Diff Y-o-Y entre deux snapshots (session 47)
// ────────────────────────────────────────────────────────────────────────────

export type DiffStatus = "added" | "removed" | "modified" | "unchanged";

export interface DiffEntry {
  field: string;
  before: unknown;
  after: unknown;
  status: DiffStatus;
}

export interface DiffOptions {
  /** Inclure les champs unchanged dans le resultat. Defaut : false. */
  includeUnchanged?: boolean;
  /** Champs a ignorer (ex. identifiants stables). Defaut : ["id"]. */
  excludeFields?: readonly string[];
}

const DEFAULT_EXCLUDE: readonly string[] = ["id"];

/** Comparaison structurelle defensive (gere null, types, objets/arrays). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  // Stringify ordre-deterministe pour les objets simples (snapshots).
  // OK pour nos snapshots qui sont des Records<string, primitives ou Record<string, number>>.
  return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = sortKeys((value as Record<string, unknown>)[k]);
      return acc;
    }, {});
}

/**
 * Compare deux snapshots cote-a-cote (typiquement annee N vs N-1) et renvoie
 * la liste des champs qui ont change. Tri : modified > added > removed >
 * unchanged, puis ordre alphabetique. `null` ou `undefined` cote `before`
 * = "added" ; cote `after` = "removed" ; sinon equality structurelle.
 */
export function diffSnapshots(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  options: DiffOptions = {},
): DiffEntry[] {
  const beforeObj = before ?? {};
  const afterObj = after ?? {};
  const exclude = new Set(options.excludeFields ?? DEFAULT_EXCLUDE);
  const allFields = new Set([
    ...Object.keys(beforeObj),
    ...Object.keys(afterObj),
  ]);
  const result: DiffEntry[] = [];
  for (const field of allFields) {
    if (exclude.has(field)) continue;
    const b = beforeObj[field] ?? null;
    const a = afterObj[field] ?? null;
    let status: DiffStatus;
    if (b === null && a === null) status = "unchanged";
    else if (b === null && a !== null) status = "added";
    else if (b !== null && a === null) status = "removed";
    else if (deepEqual(b, a)) status = "unchanged";
    else status = "modified";

    if (status === "unchanged" && !options.includeUnchanged) continue;
    result.push({ field, before: b, after: a, status });
  }
  const order: Record<DiffStatus, number> = {
    modified: 0,
    added: 1,
    removed: 2,
    unchanged: 3,
  };
  result.sort((x, y) => {
    if (order[x.status] !== order[y.status]) {
      return order[x.status] - order[y.status];
    }
    return x.field.localeCompare(y.field);
  });
  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// Cron triggers : decision a envoyer un email J-14 / J+0 (session 51)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Vrai si on doit envoyer un email "deadline approche" pour une campagne
 * ouverte aujourd'hui : `target_date - dueSoonDays <= now < target_date`.
 *
 * Le cron tourne quotidiennement → la fenetre est large (jusqu'au jour J).
 * L'idempotence est assuree cote Worker via la table validation_email_sent
 * (UNIQUE (campaign_id, notification_type)).
 *
 * `nowMs` injectable pour tests deterministes.
 */
export function shouldNotifyDueSoon(
  campaign: Pick<ValidationCampaignRow, "status" | "target_date">,
  nowMs: number = Date.now(),
  dueSoonDays: number = 14,
): boolean {
  if (campaign.status !== "open") return false;
  if (!campaign.target_date) return false;
  const targetMs = new Date(campaign.target_date).getTime();
  if (Number.isNaN(targetMs)) return false;
  // Apres la deadline -> c'est plus du due-soon, c'est de l'overdue
  if (nowMs > targetMs) return false;
  const dueSoonThreshold = targetMs - dueSoonDays * 86_400_000;
  return nowMs >= dueSoonThreshold;
}

/**
 * Vrai si on doit envoyer un email "deadline atteinte" : la deadline est
 * passee de moins de `graceDays` jours (fenetre de tolerance pour le cron
 * qui tourne 1 fois par jour). Au-dela, on considere que le rappel a deja
 * ete envoye et on ne spam pas.
 *
 * `nowMs` injectable pour tests deterministes.
 */
export function shouldNotifyOverdue(
  campaign: Pick<ValidationCampaignRow, "status" | "target_date">,
  nowMs: number = Date.now(),
  graceDays: number = 1,
): boolean {
  if (campaign.status !== "open") return false;
  if (!campaign.target_date) return false;
  const targetMs = new Date(campaign.target_date).getTime();
  if (Number.isNaN(targetMs)) return false;
  if (nowMs < targetMs) return false; // pas encore depasse
  return nowMs <= targetMs + graceDays * 86_400_000;
}
