"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { getActiveMembers, type StoredMember } from "@/lib/members-store";
import { MemberMap } from "@/components/map/MemberMap";
import type { MemberMapHandle } from "@/components/map/MemberMap";
import { Badge } from "@/components/ui/Badge";
import { MemberLogo } from "@/components/shared/MemberLogo";
import { haversineDistance, getCurrentPosition, RADIUS_OPTIONS } from "@/lib/geo";

function MemberRow({
  member,
  distance,
  onClick,
}: {
  member: StoredMember;
  distance?: number;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-0">
      <button
        onClick={onClick}
        className="flex-1 text-left p-4 hover:bg-[var(--gaspe-neutral-50)] transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <MemberLogo logoUrl={member.logoUrl} name={member.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading text-sm font-semibold text-foreground leading-tight">
                {member.name}
              </h3>
              <div className="flex gap-1.5 shrink-0">
                {distance !== undefined && (
                  <span className="text-[10px] font-semibold text-[var(--gaspe-teal-600)] bg-[var(--gaspe-teal-50)] rounded-full px-2 py-0.5">
                    {distance < 1 ? "<1" : Math.round(distance)} km
                  </span>
                )}
                {member.territory === "dom-tom" && (
                  <Badge variant="blue" className="text-[10px]">
                    Outre-mer
                  </Badge>
                )}
              </div>
            </div>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {member.city} &middot; {member.region}
            </p>
          </div>
        </div>
      </button>
      <Link
        href={`/nos-adherents/${member.slug}`}
        className="shrink-0 p-3 text-foreground-muted hover:text-[var(--gaspe-teal-600)] transition-colors"
        title="Voir la fiche entreprise"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </div>
  );
}

export default function NosAdherentsPage() {
  const mapRef = useRef<MemberMapHandle>(null);
  const [allMembers, setAllMembers] = useState<StoredMember[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState<number>(100);
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setAllMembers(getActiveMembers());
  }, []);

  async function handleGeolocate() {
    setGeoError("");
    setGeoLoading(true);
    try {
      const pos = await getCurrentPosition();
      setUserPos(pos);
      setGeoEnabled(true);
    } catch (err) {
      setGeoError((err as Error).message);
    } finally {
      setGeoLoading(false);
    }
  }

  function disableGeo() {
    setGeoEnabled(false);
    setUserPos(null);
  }

  // Compute distances and filter
  type MemberWithDist = StoredMember & { distance?: number };
  let displayMembers: MemberWithDist[] = allMembers;

  if (geoEnabled && userPos) {
    displayMembers = allMembers
      .map((m) => ({
        ...m,
        distance: haversineDistance(userPos[0], userPos[1], m.latitude, m.longitude),
      }))
      .filter((m) => m.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase();
    displayMembers = displayMembers.filter(
      (m) => m.name.toLowerCase().includes(q) || m.region.toLowerCase().includes(q) || m.city.toLowerCase().includes(q)
    );
  }

  const titul = displayMembers.filter((m) => m.category === "titulaire");
  const assoc = displayMembers.filter((m) => m.category === "associe");
  const regions = [...new Set(allMembers.map((m) => m.region))].sort();

  function handleMemberClick(member: StoredMember) {
    mapRef.current?.flyToMember(member);
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Map — 70% on desktop */}
      <div className="flex-1 lg:w-[70%]">
        <MemberMap
          ref={mapRef}
          members={geoEnabled ? displayMembers : allMembers}
          className="h-[50vh] lg:h-full"
        />
      </div>

      {/* Sidebar — 30% on desktop */}
      <aside className="lg:w-[30%] lg:max-w-md border-l border-border-light bg-background overflow-y-auto">
        {/* Search + Geo controls */}
        <div className="p-4 border-b border-border-light space-y-3">
          <h1 className="font-heading text-xl font-bold text-foreground">
            Nos adhérents
          </h1>
          <p className="text-sm text-foreground-muted">
            {allMembers.length} membres &middot; {regions.length} régions
          </p>

          {/* Search */}
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white pl-10 pr-4 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            />
          </div>

          {/* Geolocation */}
          <div className="flex items-center gap-2 flex-wrap">
            {!geoEnabled ? (
              <button
                onClick={handleGeolocate}
                disabled={geoLoading}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-[var(--gaspe-teal-600)] bg-[var(--gaspe-teal-50)] hover:bg-[var(--gaspe-teal-100)] transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {geoLoading ? "Localisation..." : "Autour de moi"}
              </button>
            ) : (
              <>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="rounded-xl border border-[var(--gaspe-teal-200)] bg-[var(--gaspe-teal-50)] px-3 py-2 text-sm font-semibold text-[var(--gaspe-teal-600)] focus:outline-none"
                >
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r} km</option>
                  ))}
                </select>
                <span className="text-xs text-[var(--gaspe-teal-600)] font-medium">
                  {displayMembers.length} membre{displayMembers.length !== 1 ? "s" : ""} trouvé{displayMembers.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={disableGeo}
                  className="rounded-lg px-2.5 py-1.5 text-xs text-foreground-muted hover:text-red-500 transition-colors"
                >
                  Désactiver
                </button>
              </>
            )}
          </div>
          {geoError && (
            <p className="text-xs text-red-500">{geoError}</p>
          )}
        </div>

        {/* Titulaires */}
        {titul.length > 0 && (
          <>
            <div className="p-4 border-b border-border-light bg-[var(--gaspe-neutral-50)]">
              <h2 className="font-heading text-base font-bold text-foreground">
                Titulaires
                <span className="ml-2 text-sm font-normal text-foreground-muted">{titul.length}</span>
              </h2>
            </div>
            <div className="divide-y divide-border-light">
              {titul.map((member) => (
                <MemberRow
                  key={member.slug}
                  member={member}
                  distance={geoEnabled ? (member as MemberWithDist).distance : undefined}
                  onClick={() => handleMemberClick(member)}
                />
              ))}
            </div>
          </>
        )}

        {/* Associés */}
        {assoc.length > 0 && (
          <>
            <div className="p-4 border-b border-t border-border-light bg-surface">
              <h2 className="font-heading text-base font-bold text-foreground">
                Associés &amp; Experts
                <span className="ml-2 text-sm font-normal text-foreground-muted">{assoc.length}</span>
              </h2>
            </div>
            <div className="divide-y divide-border-light">
              {assoc.map((member) => (
                <MemberRow
                  key={member.slug}
                  member={member}
                  distance={geoEnabled ? (member as MemberWithDist).distance : undefined}
                  onClick={() => handleMemberClick(member)}
                />
              ))}
            </div>
          </>
        )}

        {displayMembers.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-foreground-muted">
              Aucun membre trouvé{geoEnabled ? ` dans un rayon de ${radius} km` : ""}.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
