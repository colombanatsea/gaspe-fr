"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, COMPANY_ROLES, type User } from "@/lib/auth/AuthContext";
import { getActiveMembers, type StoredMember } from "@/lib/members-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MemberLogo } from "@/components/shared/MemberLogo";
import { haversineDistance, getUserPosition, RADIUS_OPTIONS } from "@/lib/geolocation";

type Tab = "members" | "peers";
type ViewMode = "grid" | "list";
type FilterCategory = "Tous" | "Titulaires" | "Associés";

const categoryMap: Record<FilterCategory, string | null> = {
  Tous: null,
  Titulaires: "titulaire",
  "Associés": "associe",
};

export default function AdherentAnnuairePage() {
  const { user, getAllUsers } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("Tous");
  const [view, setView] = useState<ViewMode>("grid");
  const [peerRoleFilter, setPeerRoleFilter] = useState<string>("mine");
  const [peers, setPeers] = useState<User[]>([]);
  const [members, setMembers] = useState<StoredMember[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [geoRadius, setGeoRadius] = useState(100);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
    }
  }, [user, router]);

  useEffect(() => {
    async function load() {
      const allUsers = await getAllUsers();
      const adherents = allUsers.filter(
        (u) => u.role === "adherent" && u.approved && !u.archived && u.id !== user!.id
      );
      setPeers(adherents);
      setMembers(await getActiveMembers());
    }
    if (user && user.role === "adherent") load();
  }, [user, getAllUsers]);

  async function handleGeolocate() {
    setGeoLoading(true);
    try {
      const geo = await getUserPosition();
      setUserPos([geo.latitude, geo.longitude]);
      setGeoEnabled(true);
    } catch { /* silent */ }
    setGeoLoading(false);
  }

  if (!user || user.role !== "adherent") return null;

  // Members tab filtering with optional geolocation
  type MemberWithDist = StoredMember & { distance?: number };
  let geoMembers: MemberWithDist[] = [...members].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  if (geoEnabled && userPos) {
    geoMembers = geoMembers
      .map((m) => ({ ...m, distance: haversineDistance(userPos[0], userPos[1], m.latitude, m.longitude) }))
      .filter((m) => m.distance! <= geoRadius)
      .sort((a, b) => a.distance! - b.distance!);
  }

  const filteredMembers = geoMembers.filter((m) => {
    const catFilter = categoryMap[filter];
    if (catFilter && m.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.region.toLowerCase().includes(q) || m.city.toLowerCase().includes(q);
    }
    return true;
  });

  // Peers tab filtering
  const filteredPeers = peers.filter((p) => {
    if (peerRoleFilter === "mine") {
      if (!user.companyRole || !p.companyRole) return false;
      if (p.companyRole !== user.companyRole) return false;
    } else if (peerRoleFilter !== "all") {
      if (p.companyRole !== peerRoleFilter) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || (p.company ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const myRoleLabel = COMPANY_ROLES.find((r) => r.value === user.companyRole)?.label;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/espace-adherent" className="text-sm text-primary hover:underline mb-1 inline-block">
          &larr; Retour à l&apos;espace adhérent
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Annuaire</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Répertoire des adhérents et contacts entre pairs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--gaspe-neutral-200)]">
        <button
          onClick={() => setTab("members")}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === "members"
              ? "border-[var(--gaspe-teal-600)] text-[var(--gaspe-teal-600)]"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          Compagnies ({members.length})
        </button>
        <button
          onClick={() => setTab("peers")}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === "peers"
              ? "border-[var(--gaspe-teal-600)] text-[var(--gaspe-teal-600)]"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          Contacts par rôle
          {user.companyRole && myRoleLabel && (
            <span className="ml-1.5 text-xs bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-600)] rounded-full px-2 py-0.5">
              {myRoleLabel}
            </span>
          )}
        </button>
      </div>

      {/* Search bar (shared) */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "members" ? "Rechercher par nom ou région..." : "Rechercher par nom, email ou compagnie..."}
              className="block w-full rounded-lg border border-border-light bg-background pl-10 pr-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {tab === "members" && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setView("grid")}
                className={`rounded-lg border border-border-light p-2.5 transition-colors ${view === "grid" ? "bg-primary text-white" : "text-foreground-muted hover:bg-surface"}`}
                title="Vue grille"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-lg border border-border-light p-2.5 transition-colors ${view === "list" ? "bg-primary text-white" : "text-foreground-muted hover:bg-surface"}`}
                title="Vue liste"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Geolocation for members tab */}
        {tab === "members" && (
          <div className="flex items-center gap-2 flex-wrap">
            {!geoEnabled ? (
              <button onClick={handleGeolocate} disabled={geoLoading} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] bg-[var(--gaspe-teal-50)] hover:bg-[var(--gaspe-teal-100)] transition-colors disabled:opacity-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                {geoLoading ? "..." : "Autour de moi"}
              </button>
            ) : (
              <>
                <select value={geoRadius} onChange={(e) => setGeoRadius(Number(e.target.value))} className="rounded-lg border border-[var(--gaspe-teal-200)] bg-[var(--gaspe-teal-50)] px-2 py-1 text-xs font-semibold text-[var(--gaspe-teal-600)]">
                  {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} km</option>)}
                </select>
                <span className="text-xs text-[var(--gaspe-teal-600)]">{filteredMembers.length} résultat{filteredMembers.length !== 1 ? "s" : ""}</span>
                <button onClick={() => { setGeoEnabled(false); setUserPos(null); }} className="text-xs text-foreground-muted hover:text-red-500">×</button>
              </>
            )}
          </div>
        )}

        {/* Category filters for members */}
        {tab === "members" && (
          <div className="flex flex-wrap gap-2">
            {(["Tous", "Titulaires", "Associés"] as FilterCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-heading font-semibold transition-colors ${
                  filter === cat
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="flex items-center text-sm text-foreground-muted ml-2">
              {filteredMembers.length} résultat{filteredMembers.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Role filters for peers */}
        {tab === "peers" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPeerRoleFilter("mine")}
              className={`rounded-full px-4 py-1.5 text-sm font-heading font-semibold transition-colors ${
                peerRoleFilter === "mine"
                  ? "bg-primary text-white"
                  : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
              }`}
            >
              Mon rôle {myRoleLabel ? `(${myRoleLabel})` : ""}
            </button>
            <button
              onClick={() => setPeerRoleFilter("all")}
              className={`rounded-full px-4 py-1.5 text-sm font-heading font-semibold transition-colors ${
                peerRoleFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
              }`}
            >
              Tous les rôles
            </button>
            {COMPANY_ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setPeerRoleFilter(r.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-heading font-semibold transition-colors ${
                  peerRoleFilter === r.value
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
                }`}
              >
                {r.label}
              </button>
            ))}
            <span className="flex items-center text-sm text-foreground-muted ml-2">
              {filteredPeers.length} contact{filteredPeers.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ============ MEMBERS TAB ============ */}
      {tab === "members" && (
        <>
          {filteredMembers.length === 0 ? (
            <Card>
              <p className="text-center py-6 text-foreground-muted">Aucun membre ne correspond à vos critères.</p>
            </Card>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <Card key={member.slug} className="flex flex-col">
                  <div className="flex items-start gap-3">
                    <MemberLogo logoUrl={member.logoUrl} name={member.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm leading-tight">{member.name}</CardTitle>
                      <p className="text-xs text-foreground-muted mt-0.5">{member.city}, {member.region}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Badge variant={member.category === "titulaire" ? "teal" : "blue"}>
                      {member.category === "titulaire" ? "Titulaire" : "Associé"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-foreground-muted">
                    {member.websiteUrl && (
                      <a href={member.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        Site web
                      </a>
                    )}
                    {member.employeeCount && <span>{member.employeeCount} employés</span>}
                    {member.shipCount && <span>{member.shipCount} navire{member.shipCount > 1 ? "s" : ""}</span>}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <Card key={member.slug} className="flex items-center gap-4">
                  <MemberLogo logoUrl={member.logoUrl} name={member.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-semibold text-sm text-foreground">{member.name}</span>
                      <Badge variant={member.category === "titulaire" ? "teal" : "blue"}>
                        {member.category === "titulaire" ? "Titulaire" : "Associé"}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground-muted">{member.city}, {member.region}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-foreground-muted">
                    {member.websiteUrl && (
                      <a href={member.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Site web</a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============ PEERS TAB ============ */}
      {tab === "peers" && (
        <>
          {!user.companyRole && peerRoleFilter === "mine" && (
            <div className="mb-4 rounded-xl border border-[var(--gaspe-warm-200)] bg-[var(--gaspe-warm-50)] p-4">
              <p className="text-sm text-[var(--gaspe-warm-700)]">
                Vous n&apos;avez pas encore défini votre rôle dans la compagnie.{" "}
                <Link href="/espace-adherent/profil" className="font-semibold underline">
                  Complétez votre profil
                </Link>{" "}
                pour voir vos pairs.
              </p>
            </div>
          )}

          {filteredPeers.length === 0 ? (
            <Card>
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--gaspe-teal-50)]">
                  <svg className="h-6 w-6 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                </div>
                <p className="text-sm text-foreground-muted">Aucun contact trouvé pour ce filtre.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeers.map((peer) => {
                const peerRoleLabel = COMPANY_ROLES.find((r) => r.value === peer.companyRole)?.label;
                return (
                  <Card key={peer.id} className="flex flex-col">
                    <div className="flex items-start gap-3">
                      {peer.companyLogo ? (
                        <Image src={peer.companyLogo} alt={`Logo ${peer.company ?? peer.name}`} width={40} height={40} loading="lazy" className="h-10 w-10 rounded-lg object-contain border border-[var(--gaspe-neutral-200)]" unoptimized />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-neutral-200)]">
                          <span className="font-heading text-sm font-bold text-[var(--gaspe-teal-600)]">
                            {peer.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-sm font-semibold text-foreground truncate">{peer.name}</p>
                        <p className="text-xs text-foreground-muted truncate">{peer.company ?? "–"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {peerRoleLabel && <Badge variant="teal">{peerRoleLabel}</Badge>}
                      {peer.membershipStatus && (
                        <Badge variant={peer.membershipStatus === "paid" ? "green" : "neutral"}>
                          {peer.membershipStatus === "paid" ? "À jour" : "Adhésion due"}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-foreground-muted">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                        <a href={`mailto:${peer.email}`} className="text-primary hover:underline">{peer.email}</a>
                      </div>
                      {peer.phone && (
                        <div className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                          </svg>
                          <span>{peer.phone}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
