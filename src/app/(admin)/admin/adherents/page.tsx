"use client";

/* ──────────────────────────────────────────────────────────────────────────
 *  /admin/adherents – page de fusion (session 40)
 *  Remplace /admin/organisations + /admin/membres
 *
 *  Source de vérité : API /api/organizations (mode prod) — fallback localStorage
 *  Listing API-first inspiré de /admin/organisations, avec contacts inline.
 *  Filtres : recherche, catégorie, collège A/B/C, CCN 3228, statut, cotisation.
 *  Actions : modifier (modal CRUD), archiver/restaurer via PATCH.
 *
 *  Modal :
 *    - Champs PATCH-able (mode prod) : email, phone, address, websiteUrl,
 *      logoUrl, description, employeeCount, shipCount, college, social3228,
 *      membershipStatus, archived. Cf. handleUpdateOrganization workers/api.ts.
 *    - Champs seed-only : name, slug, city, region, lat/lng, territory,
 *      category — read-only en mode prod, éditables en mode demo via
 *      saveMembers() (members-store localStorage).
 * ────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { CollegeBadge } from "@/components/shared/CollegeBadge";
import type { Organization, MembershipStatus, User } from "@/lib/auth/types";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import {
  getStoredMembers,
  saveMembers,
  toggleMemberArchived,
  type StoredMember,
} from "@/lib/members-store";
import { isApiMode, apiFetch } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const membershipBadge: Record<MembershipStatus, { label: string; variant: "green" | "warm" | "neutral" }> = {
  paid: { label: "Payée", variant: "green" },
  pending: { label: "En cours", variant: "warm" },
  due: { label: "Due", variant: "neutral" },
};

const categoryBadge: Record<string, { label: string; variant: "teal" | "blue" }> = {
  titulaire: { label: "Titulaire", variant: "teal" },
  associe: { label: "Associé", variant: "blue" },
};

interface OrgRow extends Organization {
  contacts: User[];
  /** Présent uniquement quand on retombe sur les données locales (members-store). */
  archivedLocal?: boolean;
}

type CategoryFilter = "all" | "titulaire" | "associe";
type StatusFilter = "active" | "archived" | "all";
type CollegeFilter = "all" | "A" | "B" | "C";
type Social3228Filter = "all" | "yes" | "no";
type MembershipFilter = "all" | MembershipStatus;
type ViewMode = "expanded" | "compact";

export default function AdminAdherentsPage() {
  const { user, getAllUsers } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [collegeFilter, setCollegeFilter] = useState<CollegeFilter>("all");
  const [social3228Filter, setSocial3228Filter] = useState<Social3228Filter>("all");
  const [membershipFilter, setMembershipFilter] = useState<MembershipFilter>("all");
  const [view, setView] = useState<ViewMode>("expanded");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Modal state ──
  const [editing, setEditing] = useState<OrgRow | null>(null);
  const [saving, setSaving] = useState(false);

  /** Tente l'API d'abord (sole source pour college/social3228/membershipStatus
   *  côté admin) ; retombe sur le store localStorage sinon. */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let orgs: Organization[] = [];

      if (API_URL) {
        const token = typeof window !== "undefined" ? localStorage.getItem("gaspe_api_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/organizations?include_archived=1`, { headers });
        if (res.ok) {
          const data = (await res.json()) as { organizations: Organization[] };
          orgs = data.organizations;
        }
      }

      // Fallback : on ré-hydrate à partir des membres seedés en local.
      // C'est le mode démo — les flags college/social3228 viennent de members.ts.
      if (orgs.length === 0) {
        const stored = await getStoredMembers();
        orgs = stored.map((m: StoredMember) => ({
          id: m.slug,
          slug: m.slug,
          name: m.name,
          category: m.category,
          college: m.college,
          social3228: m.social3228,
          territory: m.territory,
          region: m.region,
          city: m.city,
          latitude: m.latitude,
          longitude: m.longitude,
          logoUrl: m.logoUrl,
          websiteUrl: m.websiteUrl,
          description: m.description,
          employeeCount: m.employeeCount,
          shipCount: m.shipCount,
          // archived est porté par le store local en mode demo
          archived: m.archived ?? false,
        } as Organization & { archived?: boolean }));
      }

      const users = await getAllUsers();
      const adherents = users.filter((u) => u.role === "adherent");

      const merged: OrgRow[] = orgs.map((org) => ({
        ...org,
        contacts: adherents
          .filter((u) => u.organizationId === org.id || u.company === org.name)
          .sort((a, b) => Number(b.isPrimary ?? false) - Number(a.isPrimary ?? false)),
      }));

      merged.sort((a, b) => a.name.localeCompare(b.name));
      setRows(merged);
    } finally {
      setLoading(false);
    }
  }, [getAllUsers]);

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) {
      router.push("/connexion");
      return;
    }
    void fetchData();
  }, [user, router, fetchData]);

  const filtered = useMemo(() => {
    return rows.filter((org) => {
      // Statut archivé — l'API renvoie `archived: boolean` quand include_archived=1
      const isArchived = (org as Organization & { archived?: boolean }).archived === true;
      if (statusFilter === "active" && isArchived) return false;
      if (statusFilter === "archived" && !isArchived) return false;

      if (categoryFilter !== "all" && org.category !== categoryFilter) return false;
      if (collegeFilter !== "all" && org.college !== collegeFilter) return false;
      if (social3228Filter === "yes" && org.social3228 !== true) return false;
      if (social3228Filter === "no" && org.social3228 === true) return false;
      if (membershipFilter !== "all" && org.membershipStatus !== membershipFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        return (
          org.name.toLowerCase().includes(q) ||
          org.city?.toLowerCase().includes(q) ||
          org.region?.toLowerCase().includes(q) ||
          org.contacts.some(
            (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
          )
        );
      }
      return true;
    });
  }, [rows, statusFilter, categoryFilter, collegeFilter, social3228Filter, membershipFilter, search]);

  // Stats : on compte sur l'ensemble actif (non-archivé) pour les chiffres clés
  const activeRows = rows.filter((r) => !(r as Organization & { archived?: boolean }).archived);
  const stats = useMemo(() => ({
    total: activeRows.length,
    titulaires: activeRows.filter((o) => o.category === "titulaire").length,
    associes: activeRows.filter((o) => o.category === "associe").length,
    collegeA: activeRows.filter((o) => o.college === "A").length,
    collegeB: activeRows.filter((o) => o.college === "B").length,
    collegeC: activeRows.filter((o) => o.college === "C").length,
    social3228: activeRows.filter((o) => o.social3228 === true).length,
    archived: rows.length - activeRows.length,
    contacts: rows.reduce((sum, o) => sum + o.contacts.length, 0),
  }), [activeRows, rows]);

  /** Sauvegarde modal : PATCH les champs API-éditables, et applique les
   *  champs seed-only au store local en mode demo. */
  async function handleSave(form: EditFormState) {
    if (!editing) return;
    setSaving(true);
    try {
      // 1) Champs supportés par PATCH /api/organizations/:id
      // On envoie systématiquement tous les champs editable : `undefined` ou `""`
      // → `null` côté DB. Ça permet à l'admin de clear un collège ou une cotisation
      // (sans cette normalisation, sélectionner "— Non renseigné —" laisserait
      // la valeur précédente intacte).
      const patchPayload: Record<string, unknown> = {};
      const patchKeys: (keyof EditFormState)[] = [
        "email",
        "phone",
        "address",
        "websiteUrl",
        "logoUrl",
        "description",
        "employeeCount",
        "shipCount",
        "membershipStatus",
        "college",
      ];
      for (const k of patchKeys) {
        const v = form[k];
        patchPayload[k] = v === undefined || v === "" ? null : v;
      }
      // social3228 est un booléen — toujours présent
      patchPayload.social3228 = form.social3228;

      if (isApiMode()) {
        try {
          await apiFetch(`/api/organizations/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(patchPayload),
          });
        } catch {
          alert("Échec de la mise à jour côté API.");
          setSaving(false);
          return;
        }
      } else {
        // Mode demo : on persiste tout dans members-store (incluant les seed-only)
        const list = await getStoredMembers();
        const idx = list.findIndex((m) => m.slug === editing.slug);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            name: form.name,
            city: form.city,
            region: form.region,
            latitude: form.latitude,
            longitude: form.longitude,
            territory: form.territory,
            category: form.category,
            college: form.college,
            social3228: form.social3228,
            email: form.email || undefined,
            phone: form.phone || undefined,
            address: form.address || undefined,
            websiteUrl: form.websiteUrl || undefined,
            logoUrl: form.logoUrl || undefined,
            description: form.description || undefined,
            employeeCount: form.employeeCount,
            shipCount: form.shipCount,
            membershipStatus: form.membershipStatus,
          } as StoredMember;
          saveMembers(list);
        }
      }

      setEditing(null);
      void fetchData();
    } finally {
      setSaving(false);
    }
  }

  /** Archive/désarchive via PATCH API (mode prod) ou via store local (demo). */
  async function handleToggleArchive(org: OrgRow) {
    const isArchived = (org as Organization & { archived?: boolean }).archived === true;
    const verb = isArchived ? "Restaurer" : "Archiver";
    if (!confirm(`${verb} ${org.name} ?`)) return;

    if (isApiMode()) {
      try {
        await apiFetch(`/api/organizations/${org.id}`, {
          method: "PATCH",
          body: JSON.stringify({ archived: isArchived ? 0 : 1 }),
        });
      } catch {
        alert("Échec de la mise à jour côté API. Vérifie ta connexion.");
        return;
      }
    } else {
      await toggleMemberArchived(org.slug);
    }
    void fetchData();
  }

  if (!user || !isStaffOrAdmin(user)) return null;

  return (
    <div className="space-y-6">
      {/* ───── Header + actions ───── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Adhérents</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {filtered.length} compagnie{filtered.length > 1 ? "s" : ""} affichée
            {filtered.length > 1 ? "s" : ""} – {stats.contacts} contact{stats.contacts > 1 ? "s" : ""} au total
            {stats.archived > 0 && (
              <span className="text-foreground-muted"> – {stats.archived} archivée{stats.archived > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>

        {/* Toggle vue */}
        <div className="inline-flex rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-1">
          <button
            onClick={() => setView("expanded")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === "expanded"
                ? "bg-[var(--gaspe-teal-600)] text-white"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Détaillée
          </button>
          <button
            onClick={() => setView("compact")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === "compact"
                ? "bg-[var(--gaspe-teal-600)] text-white"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Tableau
          </button>
        </div>
      </div>

      {/* ───── Stats cards ───── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total actif" value={stats.total} />
        <StatCard label="Titulaires" value={stats.titulaires} accent="teal" />
        <StatCard label="Associés" value={stats.associes} accent="blue" />
        <StatCard label="Collège A" value={stats.collegeA} hint="Publics" />
        <StatCard label="Collège B" value={stats.collegeB} hint="Privés" />
        <StatCard label="Collège C" value={stats.collegeC} hint="Experts" />
        <StatCard label="CCN 3228" value={stats.social3228} hint="Vote NAO" accent="warm" />
      </div>

      {/* ───── Filtres ───── */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          type="text"
          placeholder="Rechercher (nom, ville, contact…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lg:col-span-2 rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-foreground-muted/60 focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]"
        >
          <option value="all">Tous types</option>
          <option value="titulaire">Titulaires</option>
          <option value="associe">Associés</option>
        </select>

        <select
          value={collegeFilter}
          onChange={(e) => setCollegeFilter(e.target.value as CollegeFilter)}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]"
        >
          <option value="all">Tous collèges</option>
          <option value="A">A — Publics</option>
          <option value="B">B — Privés</option>
          <option value="C">C — Experts</option>
        </select>

        <select
          value={social3228Filter}
          onChange={(e) => setSocial3228Filter(e.target.value as Social3228Filter)}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]"
        >
          <option value="all">CCN 3228 ?</option>
          <option value="yes">Soumis 3228</option>
          <option value="no">Non soumis</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]"
        >
          <option value="active">Actifs</option>
          <option value="archived">Archivés</option>
          <option value="all">Tous statuts</option>
        </select>

        <select
          value={membershipFilter}
          onChange={(e) => setMembershipFilter(e.target.value as MembershipFilter)}
          className="lg:col-start-6 rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]"
        >
          <option value="all">Toutes cotisations</option>
          <option value="paid">Payées</option>
          <option value="pending">En cours</option>
          <option value="due">Dues</option>
        </select>
      </div>

      {/* ───── Liste ───── */}
      {loading ? (
        <div className="py-12 text-center text-foreground-muted">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white py-12 text-center text-foreground-muted">
          Aucune compagnie ne correspond à vos critères.
        </div>
      ) : view === "expanded" ? (
        <ExpandedList
          rows={filtered}
          expandedId={expandedId}
          onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
          onArchive={handleToggleArchive}
          onEdit={(org) => setEditing(org)}
        />
      ) : (
        <CompactTable
          rows={filtered}
          onArchive={handleToggleArchive}
          onEdit={(org) => setEditing(org)}
        />
      )}

      {editing && (
        <EditModal
          org={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ───── StatCard ───── */
function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: "teal" | "blue" | "warm";
}) {
  const accentColor =
    accent === "teal"
      ? "text-[var(--gaspe-teal-600)]"
      : accent === "blue"
        ? "text-[var(--gaspe-blue-600)]"
        : accent === "warm"
          ? "text-[var(--gaspe-warm-600)]"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
      <p className={`font-heading text-2xl font-bold ${accentColor}`}>{value}</p>
      <p className="text-xs text-foreground-muted">{label}</p>
      {hint && <p className="text-[10px] text-foreground-muted/70">{hint}</p>}
    </div>
  );
}

/* ───── Vue détaillée ───── */
function ExpandedList({
  rows,
  expandedId,
  onToggleExpand,
  onArchive,
  onEdit,
}: {
  rows: OrgRow[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onArchive: (org: OrgRow) => void;
  onEdit: (org: OrgRow) => void;
}) {
  return (
    <div className="space-y-3">
      {rows.map((org) => {
        const isExpanded = expandedId === org.id;
        const primary = org.contacts.find((c) => c.isPrimary);
        const isArchived = (org as Organization & { archived?: boolean }).archived === true;
        return (
          <div
            key={org.id}
            className={`overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md ${
              isArchived ? "border-[var(--gaspe-neutral-200)] opacity-70" : "border-[var(--gaspe-neutral-200)]"
            }`}
          >
            <button
              onClick={() => onToggleExpand(org.id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gaspe-teal-50)] font-heading text-sm font-bold text-[var(--gaspe-teal-600)]">
                {org.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-heading text-sm font-semibold text-foreground">{org.name}</h3>
                  {org.category && categoryBadge[org.category] && (
                    <Badge variant={categoryBadge[org.category].variant}>{categoryBadge[org.category].label}</Badge>
                  )}
                  <CollegeBadge college={org.college} social3228={org.social3228} compact />
                  {org.membershipStatus && membershipBadge[org.membershipStatus] && (
                    <Badge variant={membershipBadge[org.membershipStatus].variant}>
                      Cotisation {membershipBadge[org.membershipStatus].label.toLowerCase()}
                    </Badge>
                  )}
                  {isArchived && <Badge variant="neutral">Archivée</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {[org.city, org.region].filter(Boolean).join(", ") || "–"}
                  {org.contacts.length > 0 && (
                    <> – {org.contacts.length} contact{org.contacts.length > 1 ? "s" : ""}</>
                  )}
                  {primary && <> – Resp. : {primary.name}</>}
                </p>
              </div>

              <svg
                className={`h-5 w-5 shrink-0 text-foreground-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {isExpanded && (
              <div className="space-y-4 border-t border-[var(--gaspe-neutral-200)] px-5 py-4">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  {org.email && (
                    <Field label="Email" value={org.email} />
                  )}
                  {org.phone && <Field label="Tél" value={org.phone} />}
                  {org.websiteUrl && <Field label="Site" value={org.websiteUrl} />}
                  {org.address && <Field label="Adresse" value={org.address} />}
                  {(org.employeeCount || org.shipCount) && (
                    <Field
                      label="Effectifs"
                      value={[
                        org.employeeCount && `${org.employeeCount} collaborateurs`,
                        org.shipCount && `${org.shipCount} navires`,
                      ]
                        .filter(Boolean)
                        .join(" – ")}
                    />
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    Contacts ({org.contacts.length})
                  </h4>
                  {org.contacts.length === 0 ? (
                    <p className="text-sm italic text-foreground-muted">Aucun contact enregistré.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--gaspe-neutral-200)] text-left">
                            <th className="pb-2 font-medium text-foreground-muted">Nom</th>
                            <th className="pb-2 font-medium text-foreground-muted">Email</th>
                            <th className="hidden pb-2 font-medium text-foreground-muted sm:table-cell">Fonction</th>
                            <th className="hidden pb-2 font-medium text-foreground-muted md:table-cell">Rôle</th>
                            <th className="hidden pb-2 font-medium text-foreground-muted md:table-cell">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {org.contacts.map((c) => (
                            <tr key={c.id} className="border-b border-[var(--gaspe-neutral-200)]/50 last:border-0">
                              <td className="py-2 text-foreground">
                                {c.name}
                                {c.isPrimary && (
                                  <span className="ml-1.5 inline-flex items-center rounded-full bg-[var(--gaspe-teal-50)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--gaspe-teal-600)]">
                                    Titulaire
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-foreground-muted">{c.email}</td>
                              <td className="hidden py-2 text-foreground-muted sm:table-cell">{c.companyRole ?? "–"}</td>
                              <td className="hidden py-2 md:table-cell">
                                <Badge variant={c.isPrimary ? "teal" : "neutral"}>
                                  {c.isPrimary ? "Titulaire" : "Contact"}
                                </Badge>
                              </td>
                              <td className="hidden py-2 md:table-cell">
                                <Badge variant={c.approved ? "green" : "warm"}>
                                  {c.approved ? "Actif" : "En attente"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {!isArchived && (
                    <button
                      onClick={() => onEdit(org)}
                      className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:border-[var(--gaspe-teal-200)] hover:bg-[var(--gaspe-teal-50)] hover:text-[var(--gaspe-teal-600)]"
                    >
                      Modifier
                    </button>
                  )}
                  <button
                    onClick={() => onArchive(org)}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      isArchived
                        ? "bg-[var(--gaspe-teal-600)] text-white hover:bg-[var(--gaspe-teal-700)] border-transparent"
                        : "border-[var(--gaspe-neutral-200)] text-foreground-muted hover:border-[var(--gaspe-warm-200)] hover:bg-[var(--gaspe-warm-50)] hover:text-[var(--gaspe-warm-600)]"
                    }`}
                  >
                    {isArchived ? "Restaurer" : "Archiver"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-foreground-muted">{label} :</span>{" "}
      <span className="text-foreground">{value}</span>
    </div>
  );
}

/* ───── Vue compacte (tableau) ───── */
function CompactTable({
  rows,
  onArchive,
  onEdit,
}: {
  rows: OrgRow[];
  onArchive: (org: OrgRow) => void;
  onEdit: (org: OrgRow) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white">
      <div className="hidden grid-cols-[1.4fr_120px_140px_90px_70px_70px_140px_90px_140px] gap-3 border-b border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted lg:grid">
        <span>Compagnie</span>
        <span>Ville</span>
        <span>Région</span>
        <span>Catégorie</span>
        <span>Coll.</span>
        <span>3228</span>
        <span>Cotisation</span>
        <span>Contacts</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-[var(--gaspe-neutral-100)]">
        {rows.map((org) => {
          const isArchived = (org as Organization & { archived?: boolean }).archived === true;
          return (
            <div
              key={org.id}
              className={`flex flex-col gap-2 px-5 py-3 lg:grid lg:grid-cols-[1.4fr_120px_140px_90px_70px_70px_140px_90px_140px] lg:items-center lg:gap-3 ${
                isArchived ? "bg-[var(--gaspe-neutral-50)] opacity-70" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-foreground">{org.name}</p>
                {org.websiteUrl && (
                  <a
                    href={org.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-[var(--gaspe-teal-600)] hover:underline"
                  >
                    {org.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
              </div>
              <span className="truncate text-sm text-foreground">{org.city ?? "–"}</span>
              <span className="truncate text-sm text-foreground-muted">{org.region ?? "–"}</span>
              <span>
                {org.category && categoryBadge[org.category] ? (
                  <Badge variant={categoryBadge[org.category].variant}>
                    {categoryBadge[org.category].label}
                  </Badge>
                ) : (
                  "–"
                )}
              </span>
              <span className="text-sm text-foreground">{org.college ?? "–"}</span>
              <span className="text-sm text-foreground">{org.social3228 ? "✓" : "–"}</span>
              <span>
                {org.membershipStatus ? (
                  <Badge variant={membershipBadge[org.membershipStatus].variant}>
                    {membershipBadge[org.membershipStatus].label}
                  </Badge>
                ) : (
                  <span className="text-sm text-foreground-muted">–</span>
                )}
              </span>
              <span className="text-sm text-foreground">{org.contacts.length}</span>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {!isArchived && (
                  <button
                    onClick={() => onEdit(org)}
                    className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:border-[var(--gaspe-teal-200)] hover:bg-[var(--gaspe-teal-50)] hover:text-[var(--gaspe-teal-600)]"
                  >
                    Modifier
                  </button>
                )}
                <button
                  onClick={() => onArchive(org)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isArchived
                      ? "border-transparent bg-[var(--gaspe-teal-600)] text-white hover:bg-[var(--gaspe-teal-700)]"
                      : "border-[var(--gaspe-neutral-200)] text-foreground-muted hover:border-[var(--gaspe-warm-200)] hover:bg-[var(--gaspe-warm-50)] hover:text-[var(--gaspe-warm-600)]"
                  }`}
                >
                  {isArchived ? "Restaurer" : "Archiver"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───── Modal d'édition ─────
 *  Tous les champs s'affichent ; en mode API, les champs seed-only (name, slug,
 *  city, region, lat/lng, territory, category) sont en lecture seule avec un
 *  hint explicite. */
type EditFormState = {
  // seed (API: read-only)
  name: string;
  slug: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  territory: "metropole" | "dom-tom";
  category: "titulaire" | "associe";
  // PATCH-able
  email: string;
  phone: string;
  address: string;
  websiteUrl: string;
  logoUrl: string;
  description: string;
  employeeCount: number | undefined;
  shipCount: number | undefined;
  membershipStatus: MembershipStatus | undefined;
  college: "A" | "B" | "C" | undefined;
  social3228: boolean;
};

function orgToForm(org: Organization & { archived?: boolean }): EditFormState {
  return {
    name: org.name,
    slug: org.slug,
    city: org.city ?? "",
    region: org.region ?? "",
    latitude: org.latitude ?? 0,
    longitude: org.longitude ?? 0,
    territory: org.territory ?? "metropole",
    category: org.category,
    email: org.email ?? "",
    phone: org.phone ?? "",
    address: org.address ?? "",
    websiteUrl: org.websiteUrl ?? "",
    logoUrl: org.logoUrl ?? "",
    description: org.description ?? "",
    employeeCount: org.employeeCount,
    shipCount: org.shipCount,
    membershipStatus: org.membershipStatus,
    college: org.college,
    social3228: org.social3228 === true,
  };
}

function EditModal({
  org,
  saving,
  onClose,
  onSave,
}: {
  org: OrgRow;
  saving: boolean;
  onClose: () => void;
  onSave: (form: EditFormState) => void;
}) {
  const [form, setForm] = useState<EditFormState>(() => orgToForm(org));
  const apiMode = isApiMode();

  function update<K extends keyof EditFormState>(key: K, value: EditFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)] disabled:bg-[var(--gaspe-neutral-50)] disabled:text-foreground-muted disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white shadow-xl">
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[var(--gaspe-neutral-200)] bg-white px-6 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Modifier {org.name}</h2>
            <p className="text-xs text-foreground-muted">
              {apiMode
                ? "Mode prod – les champs seed (nom, ville, coordonnées, catégorie) sont en lecture seule."
                : "Mode démo – tous les champs sont éditables (persistance localStorage)."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-[var(--gaspe-neutral-100)]"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <Section title="Identité (seed)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field2 label="Nom">
                <input className={inputClass} value={form.name} disabled={apiMode}
                  onChange={(e) => update("name", e.target.value)} />
              </Field2>
              <Field2 label="Slug">
                <input className={inputClass} value={form.slug} disabled={apiMode}
                  onChange={(e) => update("slug", e.target.value)} />
              </Field2>
              <Field2 label="Ville">
                <input className={inputClass} value={form.city} disabled={apiMode}
                  onChange={(e) => update("city", e.target.value)} />
              </Field2>
              <Field2 label="Région">
                <input className={inputClass} value={form.region} disabled={apiMode}
                  onChange={(e) => update("region", e.target.value)} />
              </Field2>
              <Field2 label="Latitude">
                <input type="number" step="any" className={inputClass} value={form.latitude} disabled={apiMode}
                  onChange={(e) => update("latitude", parseFloat(e.target.value) || 0)} />
              </Field2>
              <Field2 label="Longitude">
                <input type="number" step="any" className={inputClass} value={form.longitude} disabled={apiMode}
                  onChange={(e) => update("longitude", parseFloat(e.target.value) || 0)} />
              </Field2>
              <Field2 label="Territoire">
                <select className={inputClass} value={form.territory} disabled={apiMode}
                  onChange={(e) => update("territory", e.target.value as "metropole" | "dom-tom")}>
                  <option value="metropole">Hexagone</option>
                  <option value="dom-tom">Outre-mer</option>
                </select>
              </Field2>
              <Field2 label="Catégorie">
                <select className={inputClass} value={form.category} disabled={apiMode}
                  onChange={(e) => update("category", e.target.value as "titulaire" | "associe")}>
                  <option value="titulaire">Titulaire</option>
                  <option value="associe">Associé</option>
                </select>
              </Field2>
            </div>
          </Section>

          <Section title="Gouvernance ACF (admin)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field2 label="Collège">
                <select
                  className={inputClass}
                  value={form.college ?? ""}
                  onChange={(e) =>
                    update("college", e.target.value ? (e.target.value as "A" | "B" | "C") : undefined)
                  }
                >
                  <option value="">— Non renseigné —</option>
                  <option value="A">A — Opérateurs publics</option>
                  <option value="B">B — Opérateurs privés</option>
                  <option value="C">C — Experts / Collectivités</option>
                </select>
              </Field2>
              <Field2 label="Soumis CCN 3228">
                <label className="flex items-center gap-2 rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.social3228}
                    onChange={(e) => update("social3228", e.target.checked)}
                    className="h-4 w-4 accent-[var(--gaspe-teal-600)]"
                  />
                  <span>Vote NAO et mandats sociaux</span>
                </label>
              </Field2>
              <Field2 label="Cotisation">
                <select
                  className={inputClass}
                  value={form.membershipStatus ?? ""}
                  onChange={(e) =>
                    update(
                      "membershipStatus",
                      e.target.value ? (e.target.value as MembershipStatus) : undefined,
                    )
                  }
                >
                  <option value="">— Non renseigné —</option>
                  <option value="paid">Payée</option>
                  <option value="pending">En cours</option>
                  <option value="due">Due</option>
                </select>
              </Field2>
            </div>
          </Section>

          <Section title="Contact">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field2 label="Email">
                <input type="email" className={inputClass} value={form.email}
                  onChange={(e) => update("email", e.target.value)} />
              </Field2>
              <Field2 label="Téléphone">
                <input className={inputClass} value={form.phone}
                  onChange={(e) => update("phone", e.target.value)} />
              </Field2>
              <Field2 label="Adresse">
                <input className={inputClass} value={form.address}
                  onChange={(e) => update("address", e.target.value)} />
              </Field2>
              <Field2 label="Site web">
                <input className={inputClass} value={form.websiteUrl} placeholder="https://…"
                  onChange={(e) => update("websiteUrl", e.target.value)} />
              </Field2>
            </div>
          </Section>

          <Section title="Présentation">
            <div className="space-y-4">
              <Field2 label="URL du logo">
                <input className={inputClass} value={form.logoUrl}
                  onChange={(e) => update("logoUrl", e.target.value)} placeholder="/assets/logos/…" />
              </Field2>
              <Field2 label="Description">
                <textarea
                  className={inputClass + " min-h-[80px] resize-y"}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                />
              </Field2>
            </div>
          </Section>

          <Section title="Effectifs & flotte">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field2 label="Nombre de collaborateurs">
                <input
                  type="number"
                  className={inputClass}
                  value={form.employeeCount ?? ""}
                  onChange={(e) =>
                    update("employeeCount", e.target.value ? parseInt(e.target.value, 10) : undefined)
                  }
                />
              </Field2>
              <Field2 label="Nombre de navires">
                <input
                  type="number"
                  className={inputClass}
                  value={form.shipCount ?? ""}
                  onChange={(e) =>
                    update("shipCount", e.target.value ? parseInt(e.target.value, 10) : undefined)
                  }
                />
              </Field2>
            </div>
          </Section>
        </div>

        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-[var(--gaspe-neutral-200)] bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--gaspe-neutral-200)] px-5 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[var(--gaspe-neutral-50)]"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            className="rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--gaspe-teal-700)] disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">{title}</h3>
      {children}
    </div>
  );
}

function Field2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}
