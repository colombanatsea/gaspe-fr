"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { CollegeBadge } from "@/components/shared/CollegeBadge";
import type { Organization, MembershipStatus, User } from "@/lib/auth/types";
import { isStaffOrAdmin } from "@/lib/auth/permissions";

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

interface OrgWithContacts extends Organization {
  contacts: User[];
}

export default function AdminOrganisationsPage() {
  const { user, getAllUsers } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgWithContacts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "titulaire" | "associe">("all");
  const [membershipFilter, setMembershipFilter] = useState<"all" | MembershipStatus>("all");
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch organizations
      let organizations: Organization[] = [];

      if (API_URL) {
        const token = localStorage.getItem("gaspe_api_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/api/organizations`, { headers });
        if (res.ok) {
          const data = await res.json() as { organizations: Organization[] };
          organizations = data.organizations;
        }
      }

      // Fetch users for contact mapping
      const users = await getAllUsers();
      const adherents = users.filter((u) => u.role === "adherent");

      // If no API orgs, build from user data
      if (organizations.length === 0) {
        const companyMap = new Map<string, User[]>();
        for (const u of adherents) {
          const key = u.company ?? "Sans compagnie";
          if (!companyMap.has(key)) companyMap.set(key, []);
          companyMap.get(key)!.push(u);
        }

        const builtOrgs: OrgWithContacts[] = Array.from(companyMap.entries()).map(([name, contacts]) => ({
          id: name.toLowerCase().replace(/\s+/g, "-"),
          slug: name.toLowerCase().replace(/\s+/g, "-"),
          name,
          category: "titulaire" as const,
          contacts: contacts.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)),
        }));

        setOrgs(builtOrgs.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        // Map users to orgs by organizationId or company name
        const orgWithContacts: OrgWithContacts[] = organizations.map((org) => ({
          ...org,
          contacts: adherents
            .filter((u) => u.organizationId === org.id || u.company === org.name)
            .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)),
        }));

        setOrgs(orgWithContacts.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [getAllUsers]);

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) { router.push("/connexion"); return; }
    fetchData();
  }, [user, router, fetchData]);

  if (!user || !isStaffOrAdmin(user)) return null;

  const filtered = orgs.filter((org) => {
    if (categoryFilter !== "all" && org.category !== categoryFilter) return false;
    if (membershipFilter !== "all" && org.membershipStatus !== membershipFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        org.name.toLowerCase().includes(q) ||
        org.city?.toLowerCase().includes(q) ||
        org.region?.toLowerCase().includes(q) ||
        org.contacts.some((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalContacts = filtered.reduce((sum, org) => sum + org.contacts.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Organisations</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {filtered.length} compagnie{filtered.length > 1 ? "s" : ""} – {totalContacts} contact{totalContacts > 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Rechercher (compagnie, ville, contact...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-border-light bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "all" | "titulaire" | "associe")}
          className="rounded-xl border border-border-light bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Tous types</option>
          <option value="titulaire">Titulaires</option>
          <option value="associe">Associés</option>
        </select>
        <select
          value={membershipFilter}
          onChange={(e) => setMembershipFilter(e.target.value as "all" | MembershipStatus)}
          className="rounded-xl border border-border-light bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Toutes cotisations</option>
          <option value="paid">Payées</option>
          <option value="pending">En cours</option>
          <option value="due">Dues</option>
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-background border border-border-light p-4">
          <p className="text-2xl font-bold text-foreground">{orgs.length}</p>
          <p className="text-xs text-foreground-muted">Compagnies</p>
        </div>
        <div className="rounded-xl bg-background border border-border-light p-4">
          <p className="text-2xl font-bold text-foreground">{orgs.filter((o) => o.category === "titulaire").length}</p>
          <p className="text-xs text-foreground-muted">Titulaires</p>
        </div>
        <div className="rounded-xl bg-background border border-border-light p-4">
          <p className="text-2xl font-bold text-foreground">{orgs.filter((o) => o.category === "associe").length}</p>
          <p className="text-xs text-foreground-muted">Associés</p>
        </div>
        <div className="rounded-xl bg-background border border-border-light p-4">
          <p className="text-2xl font-bold text-foreground">{orgs.reduce((sum, o) => sum + o.contacts.length, 0)}</p>
          <p className="text-xs text-foreground-muted">Contacts</p>
        </div>
      </div>

      {/* Organisation list */}
      {loading ? (
        <div className="text-center py-12 text-foreground-muted">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-foreground-muted">
          {search || categoryFilter !== "all" || membershipFilter !== "all"
            ? "Aucune compagnie ne correspond à vos critères."
            : "Aucune organisation enregistrée."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((org) => {
            const isExpanded = expandedOrg === org.id;
            const primary = org.contacts.find((c) => c.isPrimary);

            return (
              <div key={org.id} className="rounded-2xl bg-background border border-border-light overflow-hidden transition-shadow hover:shadow-md">
                {/* Org header */}
                <button
                  onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  {/* Logo or initial */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-teal text-primary font-heading font-bold text-sm">
                    {org.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading text-sm font-semibold text-foreground truncate">{org.name}</h3>
                      {org.category && categoryBadge[org.category] && (
                        <Badge variant={categoryBadge[org.category].variant}>{categoryBadge[org.category].label}</Badge>
                      )}
                      <CollegeBadge college={org.college} social3228={org.social3228} />
                      {org.membershipStatus && membershipBadge[org.membershipStatus] && (
                        <Badge variant={membershipBadge[org.membershipStatus].variant}>
                          Cotisation {membershipBadge[org.membershipStatus].label.toLowerCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {[org.city, org.region].filter(Boolean).join(", ") || "–"}
                      {org.contacts.length > 0 && (
                        <> – {org.contacts.length} contact{org.contacts.length > 1 ? "s" : ""}</>
                      )}
                      {primary && <> – Resp. : {primary.name}</>}
                    </p>
                  </div>

                  {/* Expand chevron */}
                  <svg
                    className={`h-5 w-5 text-foreground-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border-light px-5 py-4 space-y-4">
                    {/* Org info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {org.email && (
                        <div>
                          <span className="text-foreground-muted">Email :</span>{" "}
                          <span className="text-foreground">{org.email}</span>
                        </div>
                      )}
                      {org.phone && (
                        <div>
                          <span className="text-foreground-muted">Tél :</span>{" "}
                          <span className="text-foreground">{org.phone}</span>
                        </div>
                      )}
                      {org.websiteUrl && (
                        <div>
                          <span className="text-foreground-muted">Site :</span>{" "}
                          <span className="text-foreground">{org.websiteUrl}</span>
                        </div>
                      )}
                      {org.address && (
                        <div>
                          <span className="text-foreground-muted">Adresse :</span>{" "}
                          <span className="text-foreground">{org.address}</span>
                        </div>
                      )}
                      {(org.employeeCount || org.shipCount) && (
                        <div>
                          {org.employeeCount && <span className="text-foreground">{org.employeeCount} collaborateurs</span>}
                          {org.employeeCount && org.shipCount && <span className="text-foreground-muted"> – </span>}
                          {org.shipCount && <span className="text-foreground">{org.shipCount} navires</span>}
                        </div>
                      )}
                    </div>

                    {/* Contacts table */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        Contacts ({org.contacts.length})
                      </h4>
                      {org.contacts.length === 0 ? (
                        <p className="text-sm text-foreground-muted italic">Aucun contact enregistré.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border-light text-left">
                                <th className="pb-2 font-medium text-foreground-muted">Nom</th>
                                <th className="pb-2 font-medium text-foreground-muted">Email</th>
                                <th className="pb-2 font-medium text-foreground-muted hidden sm:table-cell">Fonction</th>
                                <th className="pb-2 font-medium text-foreground-muted hidden md:table-cell">Rôle</th>
                                <th className="pb-2 font-medium text-foreground-muted hidden md:table-cell">Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              {org.contacts.map((c) => (
                                <tr key={c.id} className="border-b border-border-light/50 last:border-0">
                                  <td className="py-2 text-foreground">
                                    {c.name}
                                    {c.isPrimary && (
                                      <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                        Titulaire
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 text-foreground-muted">{c.email}</td>
                                  <td className="py-2 text-foreground-muted hidden sm:table-cell">{c.companyRole ?? "–"}</td>
                                  <td className="py-2 hidden md:table-cell">
                                    <Badge variant={c.isPrimary ? "teal" : "neutral"}>
                                      {c.isPrimary ? "Titulaire" : "Contact"}
                                    </Badge>
                                  </td>
                                  <td className="py-2 hidden md:table-cell">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
