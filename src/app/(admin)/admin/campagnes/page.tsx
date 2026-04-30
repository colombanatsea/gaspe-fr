"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import { isApiMode } from "@/lib/api-client";
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
} from "@/lib/validation-store";
import type { ValidationCampaign, CampaignStatus, CampaignUrgency } from "@/types/validation";

function deriveUrgency(c: ValidationCampaign): CampaignUrgency {
  if (c.status === "draft") return "draft";
  if (c.status === "closed") return "closed";
  if (!c.targetDate) return "open";
  const targetMs = new Date(c.targetDate).getTime();
  if (Number.isNaN(targetMs)) return "open";
  const nowMs = Date.now();
  if (nowMs > targetMs) return "overdue";
  if (nowMs >= targetMs - 14 * 86_400_000) return "due-soon";
  return "open";
}

const URGENCY_BADGE: Record<CampaignUrgency, { variant: "teal" | "warm" | "neutral" | "green"; label: string }> = {
  draft: { variant: "neutral", label: "Brouillon" },
  open: { variant: "teal", label: "Ouverte" },
  "due-soon": { variant: "warm", label: "Deadline proche" },
  overdue: { variant: "warm", label: "En retard" },
  closed: { variant: "green", label: "Cloturee" },
};

export default function AdminCampagnesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<ValidationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { campaigns } = await listCampaigns();
    setCampaigns(campaigns);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) {
      router.push("/connexion");
      return;
    }
    startTransition(() => {
      void refresh();
    });
  }, [user, router, refresh]);

  if (!user || !isStaffOrAdmin(user)) return null;

  async function handleCreate(input: {
    targetYear: number;
    targetDate?: string;
    notes?: string;
    status?: "draft" | "open";
  }) {
    const res = await createCampaign(input);
    if (res.success) {
      setShowForm(false);
      await refresh();
    } else {
      alert("Echec de la creation. Une campagne existe peut-etre deja pour cette annee.");
    }
  }

  async function handleStatusChange(c: ValidationCampaign, newStatus: CampaignStatus) {
    const labels: Record<CampaignStatus, string> = {
      draft: "remettre en brouillon",
      open: "ouvrir aux adherents",
      closed: "cloturer",
    };
    if (!confirm(`Confirmer : ${labels[newStatus]} la campagne ${c.targetYear} ?`)) return;
    const res = await updateCampaign(c.id, { status: newStatus });
    if (res.success) await refresh();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Campagnes de validation annuelle
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Une campagne par annee : profil et flotte de chaque compagnie. Pas
            d&apos;auto-fermeture, vous clotureez manuellement quand le quorum est atteint.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Nouvelle campagne</Button>
        )}
      </div>

      {!isApiMode() && (
        <Card className="mb-6">
          <p className="py-2 text-sm text-foreground-muted">
            Mode demo : la creation et la mise a jour de campagnes ne sont pas
            persistees. Connexion API requise pour la production.
          </p>
        </Card>
      )}

      {showForm && (
        <div className="mb-6">
          <CreateCampaignForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-foreground-muted">Chargement...</p>
      ) : campaigns.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-foreground-muted">
            Aucune campagne pour le moment. Creez la premiere campagne pour
            l&apos;annee en cours afin de declencher le banner et la page
            de validation cote adherent.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <CampaignRow key={c.id} campaign={c} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignRow({
  campaign,
  onStatusChange,
}: {
  campaign: ValidationCampaign;
  onStatusChange: (c: ValidationCampaign, newStatus: CampaignStatus) => void;
}) {
  const urgency = deriveUrgency(campaign);
  const badge = URGENCY_BADGE[urgency];
  const targetDateStr = campaign.targetDate
    ? new Date(campaign.targetDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const openedAtStr =
    campaign.openedAt && new Date(campaign.openedAt).getTime() > 0
      ? new Date(campaign.openedAt).toLocaleDateString("fr-FR")
      : null;
  const closedAtStr = campaign.closedAt
    ? new Date(campaign.closedAt).toLocaleDateString("fr-FR")
    : null;

  return (
    <Card topAccent>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <CardTitle className="text-base">Campagne {campaign.targetYear}</CardTitle>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-foreground-muted mt-2">
            {targetDateStr && <span>Deadline {targetDateStr}</span>}
            {openedAtStr && <span>· Ouverte le {openedAtStr}</span>}
            {closedAtStr && <span>· Cloturee le {closedAtStr}</span>}
          </div>
          {campaign.notes && (
            <p className="mt-2 text-sm text-foreground-muted italic">{campaign.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {campaign.status === "draft" && (
            <Button
              variant="primary"
              className="!px-3 !py-2 !text-xs"
              onClick={() => onStatusChange(campaign, "open")}
            >
              Ouvrir
            </Button>
          )}
          {campaign.status === "open" && (
            <Button
              variant="secondary"
              className="!px-3 !py-2 !text-xs"
              onClick={() => onStatusChange(campaign, "closed")}
            >
              Cloturer
            </Button>
          )}
          {(campaign.status === "open" || campaign.status === "closed") && (
            <Link
              href={`/admin/campagnes/detail?id=${campaign.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary px-3 py-2 font-heading text-xs font-semibold text-primary hover:bg-surface-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Tableau de bord
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

interface CreateCampaignFormProps {
  onSubmit: (input: {
    targetYear: number;
    targetDate?: string;
    notes?: string;
    status?: "draft" | "open";
  }) => void;
  onCancel: () => void;
}

function CreateCampaignForm({ onSubmit, onCancel }: CreateCampaignFormProps) {
  const currentYear = new Date().getUTCFullYear();
  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetDate, setTargetDate] = useState(`${currentYear}-03-31`);
  const [notes, setNotes] = useState("");
  const [openImmediately, setOpenImmediately] = useState(true);

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";
  const labelClass = "block text-xs font-medium text-foreground-muted mb-1";

  return (
    <Card>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
        Nouvelle campagne
      </h2>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            targetYear,
            targetDate: targetDate || undefined,
            notes: notes.trim() || undefined,
            status: openImmediately ? "open" : "draft",
          });
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="campaign-year">
              Annee cible
            </label>
            <input
              id="campaign-year"
              type="number"
              min={2020}
              max={2100}
              required
              className={inputClass}
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-foreground-muted">
              Ex. 2027 pour la campagne lancee debut 2027.
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="campaign-target-date">
              Deadline molle (optionnelle)
            </label>
            <input
              id="campaign-target-date"
              type="date"
              className={inputClass}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-foreground-muted">
              Bascule en bandeau orange J-14, rouge apres. Pas de fermeture auto.
            </p>
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="campaign-notes">
            Notes internes (optionnelles)
          </label>
          <textarea
            id="campaign-notes"
            className={inputClass}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex. priorites annuelles, contexte particulier, contacts ADF..."
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={openImmediately}
            onChange={(e) => setOpenImmediately(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-primary focus:ring-primary"
          />
          Ouvrir immediatement aux adherents (sinon : creee en brouillon)
        </label>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            Creer la campagne
          </Button>
        </div>
      </form>
    </Card>
  );
}
