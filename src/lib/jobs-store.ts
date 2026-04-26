/* ------------------------------------------------------------------ */
/*  Jobs Store – dual-mode job management                              */
/*  localStorage (demo) ↔ API/D1 (production)                         */
/* ------------------------------------------------------------------ */

import { publishedJobs, type Job } from "@/data/jobs";
import { apiFetch, isApiMode } from "./api-client";
import { buildHydrosPayload } from "@/lib/hydros-mapping";

const ADMIN_OFFERS_KEY = "gaspe_admin_offers";
const ADHERENT_OFFERS_KEY = "gaspe_adherent_offers";

/* ── localStorage helpers ── */

function getLocalAdminOffers(): Job[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_OFFERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function getLocalAdherentOffers(): Job[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADHERENT_OFFERS_KEY);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adh: any[] = raw ? JSON.parse(raw) : [];
    return adh
      .filter((j) => j.status === "active" || j.published)
      .map((j) => ({
        ...j,
        slug: j.slug || j.id,
        companySlug: j.companySlug || "",
        zone: j.zone || "normandie",
        publishedAt: j.createdAt || new Date().toISOString(),
        published: true,
      } as Job));
  } catch { return []; }
}

function setLocalAdminOffers(jobs: Job[]) {
  localStorage.setItem(ADMIN_OFFERS_KEY, JSON.stringify(jobs));
}

function setLocalAdherentOffers(jobs: Job[]) {
  localStorage.setItem(ADHERENT_OFFERS_KEY, JSON.stringify(jobs));
}

/* ── Public API ── */

/** Get all published jobs (static + localStorage/API) */
export async function getAllPublishedJobs(): Promise<Job[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ jobs?: Job[] }>("/api/jobs");
      const apiJobs = res.jobs ?? [];
      // Merge: API jobs take precedence, then static
      const base = [...publishedJobs];
      base.push(...apiJobs);
      const seen = new Set<string>();
      // API jobs come last so they override static by id
      return base.reverse().filter((j) => {
        if (seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      }).reverse().sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } catch { /* fall through to localStorage */ }
  }

  const base = [...publishedJobs];
  base.push(...getLocalAdminOffers().filter((j) => j.published));
  base.push(...getLocalAdherentOffers());

  const seen = new Set<string>();
  return base.filter((j) => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/** Get ALL offers (published + drafts) – admin only */
export async function getAllOffers(): Promise<Job[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ jobs?: Job[] }>("/api/jobs");
      const apiJobs = res.jobs ?? [];
      return [...publishedJobs, ...apiJobs]
        .filter((j, i, arr) => arr.findIndex((x) => x.id === j.id) === i)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } catch { /* fall through */ }
  }

  return [...publishedJobs, ...getLocalAdminOffers(), ...getLocalAdherentOffers()];
}

/** Create a new job offer */
export async function createJob(job: Partial<Job>): Promise<Job | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ success?: boolean; job?: Job }>("/api/jobs", {
        method: "POST",
        body: JSON.stringify(job),
      });
      return res.job ?? null;
    } catch { return null; }
  }

  // localStorage mode
  const newJob = job as Job;
  const existing = getLocalAdminOffers();
  existing.push(newJob);
  setLocalAdminOffers(existing);
  return newJob;
}

/** Toggle publish status of a job */
export async function toggleJobPublished(id: string): Promise<boolean> {
  if (isApiMode()) {
    try {
      // First get current state
      const res = await apiFetch<{ job?: Job }>(`/api/jobs/${id}`);
      const current = res.job;
      if (!current) return false;
      const updated = await apiFetch<{ success?: boolean }>(`/api/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: !current.published }),
      });
      return !!updated.success;
    } catch { return false; }
  }

  // localStorage mode
  const adminOffers = getLocalAdminOffers();
  const adminIdx = adminOffers.findIndex((j) => j.id === id);
  if (adminIdx >= 0) {
    adminOffers[adminIdx].published = !adminOffers[adminIdx].published;
    setLocalAdminOffers(adminOffers);
    return true;
  }
  const adherentOffers = getLocalAdherentOffers();
  const adhIdx = adherentOffers.findIndex((j) => j.id === id);
  if (adhIdx >= 0) {
    adherentOffers[adhIdx].published = !adherentOffers[adhIdx].published;
    setLocalAdherentOffers(adherentOffers);
    return true;
  }
  // Static job: store toggle override
  const staticJob = publishedJobs.find((j) => j.id === id);
  if (staticJob) {
    adminOffers.push({ ...staticJob, published: !staticJob.published });
    setLocalAdminOffers(adminOffers);
    return true;
  }
  return false;
}

/** Delete a job offer */
export async function deleteJob(id: string): Promise<boolean> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ success?: boolean }>(`/api/jobs/${id}`, { method: "DELETE" });
      return !!res.success;
    } catch { return false; }
  }

  // localStorage mode
  const adminOffers = getLocalAdminOffers().filter((j) => j.id !== id);
  setLocalAdminOffers(adminOffers);
  const adherentOffers = getLocalAdherentOffers().filter((j) => j.id !== id);
  setLocalAdherentOffers(adherentOffers);
  return true;
}

/* ─────────────────────────────────────────────────────────────────────
   Hydros Alumni cross-publication (Lot 8, session 38)
   Câblé après création d'une offre. Silencieux si secrets Worker absents.
───────────────────────────────────────────────────────────────────── */

interface HydrosResult {
  success: boolean;
  hydrosOfferUrl?: string;
  hydrosOfferId?: string;
  error?: string;
}

export async function publishToHydros(job: Parameters<typeof buildHydrosPayload>[0]): Promise<HydrosResult> {
  if (!isApiMode()) {
    return { success: false, error: "Mode API requis pour publier sur Hydros Alumni." };
  }
  const payload = buildHydrosPayload(job);
  try {
    const res = await apiFetch<HydrosResult>("/api/hydros/publish", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
