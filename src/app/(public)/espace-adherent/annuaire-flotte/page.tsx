"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CollegeBadge } from "@/components/shared/CollegeBadge";
import { ProfileCompletenessCard } from "@/components/shared/ProfileCompletenessCard";
import { computeProfileCompleteness } from "@/lib/profile-completeness";
import { getAllFleets, getFleet } from "@/lib/fleet-store";
import { members } from "@/data/members";
import { CREW_BREVETS } from "@/types";
import type { FleetVessel, Member, CrewBrevetKey } from "@/types";

type Row = {
  vessel: FleetVessel;
  member: Member;
};

const LENGTH_BUCKETS = [
  { key: "all", label: "Toutes longueurs", min: 0, max: Infinity },
  { key: "small", label: "< 25 m", min: 0, max: 25 },
  { key: "medium", label: "25 – 50 m", min: 25, max: 50 },
  { key: "large", label: "50 – 100 m", min: 50, max: 100 },
  { key: "xl", label: "> 100 m", min: 100, max: Infinity },
];

const PASSENGER_BUCKETS = [
  { key: "all", label: "Toutes capacités", min: 0, max: Infinity },
  { key: "p100", label: "< 100", min: 0, max: 100 },
  { key: "p500", label: "100 – 500", min: 100, max: 500 },
  { key: "p1000", label: "500 – 1000", min: 500, max: 1000 },
  { key: "p1000plus", label: "> 1000", min: 1000, max: Infinity },
];

export default function AnnuaireFlottePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [myFleet, setMyFleet] = useState<FleetVessel[]>([]);
  const [allFleets, setAllFleets] = useState<Record<string, FleetVessel[]>>({});
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [lengthBucket, setLengthBucket] = useState<string>("all");
  const [passengerBucket, setPassengerBucket] = useState<string>("all");
  const [brevetFilter, setBrevetFilter] = useState<CrewBrevetKey | "all">("all");
  const [fuelFilter, setFuelFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
      return;
    }
    let cancelled = false;
    void (async () => {
      const member = members.find((m) => m.name === user.company);
      if (member) {
        const f = await getFleet(member.slug);
        if (!cancelled) setMyFleet(f);
      }
      const all = await getAllFleets();
      if (!cancelled) {
        setAllFleets(all);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, router]);

  const myMember = useMemo(() => members.find((m) => m.name === user?.company), [user?.company]);
  const completeness = useMemo(() => computeProfileCompleteness({
    user: {
      company: user?.company,
      companyDescription: user?.companyDescription,
      companyLogo: user?.companyLogo,
      companyEmail: user?.companyEmail,
      companyPhone: user?.companyPhone,
      companyAddress: user?.companyAddress,
      companyLinkedinUrl: user?.companyLinkedinUrl,
    },
    member: myMember,
    fleet: myFleet,
    college: myMember?.college,
    org: { employeeCount: myMember?.employeeCount, revenue: undefined },
  }), [user, myMember, myFleet]);

  const allRows: Row[] = useMemo(() => {
    const rows: Row[] = [];
    for (const [slug, fleet] of Object.entries(allFleets)) {
      const m = members.find((x) => x.slug === slug);
      if (!m) continue;
      // Exclure ses propres navires (pas d'intérêt à les voir ici)
      if (m.slug === myMember?.slug) continue;
      for (const v of fleet) rows.push({ vessel: v, member: m });
    }
    return rows;
  }, [allFleets, myMember?.slug]);

  const fuelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRows) if (r.vessel.fuelType) set.add(r.vessel.fuelType);
    return ["all", ...Array.from(set).sort()];
  }, [allRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const lenBucket = LENGTH_BUCKETS.find((b) => b.key === lengthBucket) ?? LENGTH_BUCKETS[0];
    const paxBucket = PASSENGER_BUCKETS.find((b) => b.key === passengerBucket) ?? PASSENGER_BUCKETS[0];
    return allRows.filter((r) => {
      if (q) {
        const haystack = `${r.vessel.name} ${r.vessel.imo ?? ""} ${r.vessel.type ?? ""} ${r.member.name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (companyFilter !== "all" && r.member.slug !== companyFilter) return false;
      if (lenBucket.key !== "all") {
        const l = r.vessel.length ?? 0;
        if (l < lenBucket.min || l >= lenBucket.max) return false;
      }
      if (paxBucket.key !== "all") {
        const p = r.vessel.passengerCapacity ?? 0;
        if (p < paxBucket.min || p >= paxBucket.max) return false;
      }
      if (brevetFilter !== "all") {
        const n = r.vessel.crewByBrevet?.[brevetFilter] ?? 0;
        if (n <= 0) return false;
      }
      if (fuelFilter !== "all") {
        if (r.vessel.fuelType !== fuelFilter) return false;
      }
      return true;
    });
  }, [allRows, search, companyFilter, lengthBucket, passengerBucket, brevetFilter, fuelFilter]);

  if (!user || user.role !== "adherent") return null;

  /* ── Gating screen ── */
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-foreground-muted">Chargement de votre profil…</p>
      </div>
    );
  }

  if (!completeness.isComplete) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Annuaire flotte cross-compagnies</h1>
          <p className="text-foreground-muted">
            Cette section est réservée aux adhérents ayant complété leur profil à 100%. C&apos;est une condition de réciprocité — pour consulter les données des autres, il faut partager les vôtres.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--gaspe-warm-200)] bg-[var(--gaspe-warm-50)] p-5 mb-6">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 mt-0.5 text-[var(--gaspe-warm-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-1">
                Plus que {completeness.missingPct}% pour débloquer l&apos;annuaire flotte.
              </p>
              <p className="text-xs text-foreground-muted">
                Votre <strong>chiffre d&apos;affaires reste strictement confidentiel</strong> et n&apos;est jamais partagé. Seuls les champs descriptifs (caractéristiques navires, brevets équipage, données environnementales) sont mutualisés entre adhérents au sein de cet annuaire.
              </p>
            </div>
          </div>
        </div>

        <ProfileCompletenessCard result={completeness} />

        <div className="mt-6 text-center">
          <Button href="/espace-adherent">Retour au tableau de bord</Button>
        </div>
      </div>
    );
  }

  /* ── Annuaire (gated 100%) ── */
  const totalShown = filtered.length;
  const totalAll = allRows.length;
  const companies = members
    .filter((m) => m.college !== "C" && m.slug !== myMember?.slug)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
          <h1 className="font-heading text-2xl font-bold text-foreground">Annuaire flotte cross-compagnies</h1>
          <Badge variant="green">🎉 Profil complet</Badge>
        </div>
        <p className="text-sm text-foreground-muted max-w-3xl">
          Recherchez parmi les <strong>{totalAll} navires</strong> déclarés par les autres adhérents. Filtrez par compagnie, taille, capacité passagers, brevets équipage requis, ou type de carburant. Ces données sont mises à jour par chaque armateur via son espace adhérent.
        </p>
      </div>

      {/* Filtres */}
      <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Recherche libre</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, IMO, type, compagnie…"
              className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Compagnie</label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            >
              <option value="all">Toutes les compagnies</option>
              {companies.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Carburant</label>
            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            >
              {fuelOptions.map((f) => <option key={f} value={f}>{f === "all" ? "Tous carburants" : f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Longueur</label>
            <select
              value={lengthBucket}
              onChange={(e) => setLengthBucket(e.target.value)}
              className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            >
              {LENGTH_BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Capacité passagers</label>
            <select
              value={passengerBucket}
              onChange={(e) => setPassengerBucket(e.target.value)}
              className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            >
              {PASSENGER_BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Brevet équipage requis</label>
            <select
              value={brevetFilter}
              onChange={(e) => setBrevetFilter(e.target.value as CrewBrevetKey | "all")}
              className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            >
              <option value="all">Tous brevets</option>
              {CREW_BREVETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-foreground-muted">{totalShown} navire{totalShown > 1 ? "s" : ""} affiché{totalShown > 1 ? "s" : ""} sur {totalAll}</p>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--gaspe-neutral-200)] bg-white p-8 text-center text-sm text-foreground-muted">
          Aucun navire ne correspond à ces critères. Élargissez votre recherche.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => <FleetRow key={`${r.member.slug}-${r.vessel.id ?? r.vessel.name}`} row={r} />)}
        </div>
      )}
    </div>
  );
}

function FleetRow({ row }: { row: Row }) {
  const v = row.vessel;
  const m = row.member;
  return (
    <Link
      href={`/nos-adherents/${m.slug}#flotte`}
      className="block rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4 hover:border-[var(--gaspe-teal-200)] hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-heading text-sm font-semibold text-foreground truncate">{v.name}</p>
            {v.type && <Badge variant="neutral">{v.type}</Badge>}
            <CollegeBadge college={m.college} compact />
          </div>
          <p className="text-xs text-foreground-muted">{m.name}{v.operatingLine ? ` · ${v.operatingLine}` : ""}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground-muted shrink-0">
          {v.length !== undefined && <span><strong className="text-foreground">{v.length}</strong> m</span>}
          {v.passengerCapacity !== undefined && <span><strong className="text-foreground">{v.passengerCapacity}</strong> pax</span>}
          {v.fuelType && <span>{v.fuelType}</span>}
        </div>
      </div>
    </Link>
  );
}
