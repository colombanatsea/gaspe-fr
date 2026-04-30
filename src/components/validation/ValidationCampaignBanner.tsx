"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import { listCampaigns, listValidationsForOrg } from "@/lib/validation-store";
import { isApiMode } from "@/lib/api-client";
import { members } from "@/data/members";
import { getFleet } from "@/lib/fleet-store";
import type { ValidationCampaign, CampaignUrgency } from "@/types/validation";

/**
 * Calcule l'urgence visuelle d'une campagne ouverte.
 * Logique alignee sur deriveCampaignUrgency cote Worker (helpers purs).
 */
function deriveUrgency(campaign: ValidationCampaign): CampaignUrgency {
  if (campaign.status === "draft") return "draft";
  if (campaign.status === "closed") return "closed";
  if (!campaign.targetDate) return "open";
  const targetMs = new Date(campaign.targetDate).getTime();
  if (Number.isNaN(targetMs)) return "open";
  const nowMs = Date.now();
  if (nowMs > targetMs) return "overdue";
  const dueSoonThreshold = targetMs - 14 * 86_400_000;
  if (nowMs >= dueSoonThreshold) return "due-soon";
  return "open";
}

const URGENCY_STYLES: Record<CampaignUrgency, { bg: string; border: string; icon: string; label: string }> = {
  open: {
    bg: "bg-[var(--gaspe-teal-50)]",
    border: "border-[var(--gaspe-teal-300)]",
    icon: "text-[var(--gaspe-teal-700)]",
    label: "Validation annuelle ouverte",
  },
  "due-soon": {
    bg: "bg-[var(--gaspe-warm-100)]",
    border: "border-[var(--gaspe-warm-400)]",
    icon: "text-[var(--gaspe-warm-700)]",
    label: "Deadline approche",
  },
  overdue: {
    bg: "bg-red-50",
    border: "border-red-400",
    icon: "text-red-700",
    label: "Validation en retard",
  },
  draft: { bg: "", border: "", icon: "", label: "" },
  closed: { bg: "", border: "", icon: "", label: "" },
};

interface BannerProps {
  /** Slug de la compagnie de l'utilisateur connecte. */
  orgSlug: string;
}

export function ValidationCampaignBanner({ orgSlug }: BannerProps) {
  const [campaign, setCampaign] = useState<ValidationCampaign | null>(null);
  const [hasPending, setHasPending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isApiMode()) {
      startTransition(() => setLoaded(true));
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { current } = await listCampaigns();
        if (cancelled || !current || current.status !== "open") {
          startTransition(() => {
            setCampaign(null);
            setLoaded(true);
          });
          return;
        }
        // Compagnie eligible : on regarde si tout est deja valide pour target_year
        const { history } = await listValidationsForOrg(orgSlug);
        const targetYear = current.targetYear;
        const profileValidated = history.some(
          (h) => h.itemType === "profile" && h.targetYear >= targetYear,
        );
        const validatedVesselIds = new Set(
          history
            .filter((h) => h.itemType === "vessel" && h.targetYear >= targetYear)
            .map((h) => h.itemId),
        );
        const fleet = await getFleet(orgSlug).catch(() => []);
        const allVesselsValidated = fleet.every((v) =>
          v.id ? validatedVesselIds.has(v.id) : false,
        );
        if (cancelled) return;
        startTransition(() => {
          setCampaign(current);
          setHasPending(!profileValidated || !allVesselsValidated);
          setLoaded(true);
        });
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setCampaign(null);
            setLoaded(true);
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgSlug]);

  if (!loaded || !campaign || !hasPending) return null;

  const urgency = deriveUrgency(campaign);
  if (urgency === "draft" || urgency === "closed") return null;
  const styles = URGENCY_STYLES[urgency];
  const targetDateStr = campaign.targetDate
    ? new Date(campaign.targetDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={`mb-6 rounded-xl border-2 ${styles.border} ${styles.bg} p-4 sm:p-5`}
      role="alert"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`shrink-0 ${styles.icon}`} aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 sm:h-7 sm:w-7"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm sm:text-base text-foreground">
            {styles.label} – {campaign.targetYear}
          </p>
          <p className="mt-1 text-sm text-foreground-muted leading-relaxed">
            {urgency === "overdue" && (
              <>La deadline du {targetDateStr} est passee. </>
            )}
            {urgency === "due-soon" && targetDateStr && (
              <>Plus que jusqu&apos;au {targetDateStr} pour valider. </>
            )}
            Confirmez ou mettez a jour les donnees de votre compagnie et
            de votre flotte pour l&apos;annee {campaign.targetYear}.
          </p>
          <Link
            href="/espace-adherent/validation"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--gaspe-teal-600)] px-4 py-2 font-heading text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gaspe-teal-600)] focus-visible:ring-offset-2"
          >
            Valider mes donnees {campaign.targetYear}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper qui resout le slug de la compagnie depuis le user connecte
 * et delegue au banner. Renvoie null si pas de compagnie.
 */
export function ValidationCampaignBannerForUser({
  companyName,
}: {
  companyName: string | undefined;
}) {
  if (!companyName) return null;
  const member = members.find((m) => m.name === companyName);
  if (!member) return null;
  return <ValidationCampaignBanner orgSlug={member.slug} />;
}
