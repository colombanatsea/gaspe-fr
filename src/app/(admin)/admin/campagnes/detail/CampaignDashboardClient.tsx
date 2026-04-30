"use client";

import { useEffect, useState, startTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import { getCampaignDashboard } from "@/lib/validation-store";
import type { CampaignDashboard } from "@/types/validation";

type SortKey = "name" | "vessels" | "fully";
type SortDir = "asc" | "desc";

export default function CampaignDashboardClient({ id }: { id: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<CampaignDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "fully">("all");
  const [sortKey, setSortKey] = useState<SortKey>("fully");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) {
      router.push("/connexion");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const result = await getCampaignDashboard(id);
        if (cancelled) return;
        startTransition(() => {
          setData(result);
          setLoading(false);
        });
      } catch {
        if (!cancelled) startTransition(() => setLoading(false));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, router, id]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.rows];
    if (filter === "pending") rows = rows.filter((r) => !r.fullyValidated);
    else if (filter === "fully") rows = rows.filter((r) => r.fullyValidated);
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.organizationName.localeCompare(b.organizationName, "fr");
      else if (sortKey === "vessels") cmp = a.vesselsValidated - b.vesselsValidated;
      else cmp = (a.fullyValidated ? 1 : 0) - (b.fullyValidated ? 1 : 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [data, filter, sortKey, sortDir]);

  if (!user || !isStaffOrAdmin(user)) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <p className="text-sm text-foreground-muted">Chargement...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/admin/campagnes" className="text-sm text-foreground-muted hover:text-primary">
          ← Retour aux campagnes
        </Link>
        <Card className="mt-4">
          <p className="py-4 text-sm text-foreground-muted">
            Campagne introuvable ou inaccessible.
          </p>
        </Card>
      </div>
    );
  }

  const { campaign, summary } = data;
  const completionPct =
    summary.orgsTotal > 0
      ? Math.round((summary.orgsFullyValidated / summary.orgsTotal) * 100)
      : 0;
  const vesselsPct =
    summary.vesselsTotal > 0
      ? Math.round((summary.vesselsValidated / summary.vesselsTotal) * 100)
      : 0;

  // Mailto retardataires : compagnies non fully + email titulaire connu
  const lateEmails = data.rows
    .filter((r) => !r.fullyValidated && r.titulaireEmail)
    .map((r) => r.titulaireEmail!)
    .filter((e, i, arr) => arr.indexOf(e) === i);
  const mailtoLate = `mailto:?bcc=${encodeURIComponent(lateEmails.join(","))}&subject=${encodeURIComponent(`Validation annuelle ACF ${campaign.targetYear} - relance`)}&body=${encodeURIComponent(`Bonjour,\n\nLa campagne de validation annuelle ${campaign.targetYear} est en cours. Votre compagnie n'a pas encore confirme ses donnees.\n\nMerci de vous connecter sur l'espace adherent et de valider votre profil + votre flotte avant la deadline.\n\nLien direct : https://gaspe-fr.pages.dev/espace-adherent/validation\n\nCordialement,\nL'equipe ACF`)}`;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href="/admin/campagnes" className="text-sm text-foreground-muted hover:text-primary">
        ← Retour aux campagnes
      </Link>
      <div className="mt-2 mb-6 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Tableau de bord – Campagne {campaign.targetYear}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Statut : <Badge variant={campaign.status === "open" ? "teal" : "neutral"}>{campaign.status}</Badge>
            {campaign.targetDate && ` · deadline ${new Date(campaign.targetDate).toLocaleDateString("fr-FR")}`}
          </p>
        </div>
        {lateEmails.length > 0 && (
          <Button variant="primary" href={mailtoLate}>
            Relancer {lateEmails.length} retardataire{lateEmails.length > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          label="Compagnies validees"
          value={`${summary.orgsFullyValidated}/${summary.orgsTotal}`}
          subtitle={`${completionPct}% du total`}
          accent="teal"
        />
        <SummaryCard
          label="En attente"
          value={String(summary.orgsTotal - summary.orgsFullyValidated)}
          subtitle="profil ou navires manquants"
          accent="warm"
        />
        <SummaryCard
          label="Navires valides"
          value={`${summary.vesselsValidated}/${summary.vesselsTotal}`}
          subtitle={`${vesselsPct}% de la flotte`}
          accent="blue"
        />
        <SummaryCard
          label="Emails titulaires"
          value={String(lateEmails.length)}
          subtitle="contacts a relancer"
          accent="neutral"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-semibold text-foreground-muted">Filtrer :</span>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Toutes ({data.rows.length})
        </FilterChip>
        <FilterChip
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        >
          En attente ({data.rows.filter((r) => !r.fullyValidated).length})
        </FilterChip>
        <FilterChip active={filter === "fully"} onClick={() => setFilter("fully")}>
          Validees ({summary.orgsFullyValidated})
        </FilterChip>
      </div>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--gaspe-neutral-100)] text-foreground-muted">
            <tr>
              <SortHeader active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")}>
                Compagnie
              </SortHeader>
              <th className="px-3 py-2 text-center font-heading text-xs uppercase tracking-wider">
                Profil
              </th>
              <SortHeader active={sortKey === "vessels"} dir={sortDir} onClick={() => toggleSort("vessels")}>
                Navires
              </SortHeader>
              <SortHeader active={sortKey === "fully"} dir={sortDir} onClick={() => toggleSort("fully")}>
                Etat
              </SortHeader>
              <th className="px-3 py-2 text-left font-heading text-xs uppercase tracking-wider">
                Contact
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-foreground-muted">
                  Aucune compagnie pour ce filtre.
                </td>
              </tr>
            )}
            {filteredRows.map((row) => (
              <tr
                key={row.organizationId}
                className="border-t border-[var(--gaspe-neutral-200)] hover:bg-[var(--gaspe-teal-50)]"
              >
                <td className="px-3 py-3">
                  <Link
                    href={`/nos-adherents/${row.slug}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {row.organizationName}
                  </Link>
                </td>
                <td className="px-3 py-3 text-center">
                  {row.profileValidated ? (
                    <span className="text-[var(--gaspe-teal-700)]" aria-label="Profil valide">
                      ✓
                    </span>
                  ) : (
                    <span className="text-[var(--gaspe-warm-700)]" aria-label="Profil en attente">
                      ✗
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {row.vesselsTotal === 0 ? (
                    <span className="text-foreground-muted text-xs">aucun navire</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {row.vesselsValidated}/{row.vesselsTotal}
                      </span>
                      <div className="h-2 w-20 bg-[var(--gaspe-neutral-200)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--gaspe-teal-500)]"
                          style={{
                            width: `${(row.vesselsValidated / row.vesselsTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  {row.fullyValidated ? (
                    <Badge variant="green">Validee</Badge>
                  ) : (
                    <Badge variant="warm">En attente</Badge>
                  )}
                </td>
                <td className="px-3 py-3">
                  {row.titulaireEmail ? (
                    <a
                      href={`mailto:${row.titulaireEmail}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {row.titulaireEmail}
                    </a>
                  ) : (
                    <span className="text-xs text-foreground-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  subtitle: string;
  accent: "teal" | "warm" | "blue" | "neutral";
}) {
  const borderClass = {
    teal: "border-l-[var(--gaspe-teal-500)]",
    warm: "border-l-[var(--gaspe-warm-500)]",
    blue: "border-l-[var(--gaspe-blue-500)]",
    neutral: "border-l-[var(--gaspe-neutral-400)]",
  }[accent];
  return (
    <div className={`rounded-lg bg-background p-4 shadow-sm border-l-[3px] ${borderClass}`}>
      <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
      <p className="text-sm text-foreground">{label}</p>
      <p className="text-xs text-foreground-muted mt-1">{subtitle}</p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold font-heading transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        active
          ? "bg-[var(--gaspe-teal-600)] text-white"
          : "bg-[var(--gaspe-neutral-100)] text-foreground hover:bg-[var(--gaspe-neutral-200)]"
      }`}
    >
      {children}
    </button>
  );
}

function SortHeader({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <th className="px-3 py-2 text-left font-heading text-xs uppercase tracking-wider">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Trier par ${children} (${active ? (dir === "asc" ? "croissant" : "decroissant") : "non actif"})`}
        aria-pressed={active}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        <span aria-hidden="true" className="text-xs">
          {active ? (dir === "asc" ? "▲" : "▼") : "—"}
        </span>
      </button>
    </th>
  );
}
