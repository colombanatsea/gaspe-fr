/* ------------------------------------------------------------------ */
/*  Validation annuelle store – squelette dual-mode (session 45)       */
/*                                                                     */
/*  Backend pret (workers/api.ts session 45). UI prevue session 46+.   */
/*  Cote demo (localStorage), on ne persiste PAS l'historique : on     */
/*  retourne des structures vides + on log les soumissions, pour ne    */
/*  pas masquer l'absence de stockage local credible.                  */
/* ------------------------------------------------------------------ */

import { apiFetch, isApiMode } from "./api-client";
import type {
  CampaignDashboard,
  ValidationCampaign,
  ValidationHistoryEntry,
  ValidationSubmitItem,
  ValidationSubmitResult,
} from "@/types/validation";

/** Liste les campagnes (admin/staff). */
export async function listCampaigns(): Promise<{
  campaigns: ValidationCampaign[];
  current: ValidationCampaign | null;
}> {
  if (!isApiMode()) {
    return { campaigns: [], current: null };
  }
  return apiFetch<{ campaigns: ValidationCampaign[]; current: ValidationCampaign | null }>(
    "/api/campaigns",
  );
}

/** Cree une nouvelle campagne (admin/staff). */
export async function createCampaign(input: {
  targetYear: number;
  targetDate?: string;
  notes?: string;
  status?: "draft" | "open";
}): Promise<{ success: boolean; campaign: ValidationCampaign | null }> {
  if (!isApiMode()) {
    return {
      success: false,
      campaign: null,
    };
  }
  return apiFetch("/api/campaigns", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Met a jour une campagne (statut, dates, notes). */
export async function updateCampaign(
  id: number,
  input: { status?: "draft" | "open" | "closed"; targetDate?: string | null; notes?: string | null },
): Promise<{ success: boolean; campaign: ValidationCampaign | null }> {
  if (!isApiMode()) {
    return { success: false, campaign: null };
  }
  return apiFetch(`/api/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Recupere le dashboard d'une campagne. */
export async function getCampaignDashboard(id: number): Promise<CampaignDashboard | null> {
  if (!isApiMode()) return null;
  return apiFetch<CampaignDashboard>(`/api/campaigns/${id}/dashboard`);
}

/** Historique des validations d'une compagnie. */
export async function listValidationsForOrg(
  slug: string,
): Promise<{ organizationId: string; history: ValidationHistoryEntry[] }> {
  if (!isApiMode()) {
    return { organizationId: "", history: [] };
  }
  return apiFetch(`/api/organizations/${encodeURIComponent(slug)}/validations`);
}

/** Soumet N items de validation atomiquement pour une compagnie. */
export async function submitValidations(
  slug: string,
  items: ValidationSubmitItem[],
): Promise<ValidationSubmitResult> {
  if (!isApiMode()) {
    // Demo mode : on ne persiste pas, on confirme la reception.
    return {
      success: true,
      validated: items.length,
      targetYear: new Date().getUTCFullYear(),
    };
  }
  return apiFetch<ValidationSubmitResult>(
    `/api/organizations/${encodeURIComponent(slug)}/validations`,
    {
      method: "POST",
      body: JSON.stringify({ items }),
    },
  );
}
