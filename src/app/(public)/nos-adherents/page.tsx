"use client";

import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import { members, titulaires, associes } from "@/data/members";
import { MemberMap } from "@/components/map/MemberMap";
import type { MemberMapHandle } from "@/components/map/MemberMap";
import { Badge } from "@/components/ui/Badge";
import { MemberLogo } from "@/components/shared/MemberLogo";
import { getUserPosition, haversineDistance, formatDistance, type GeoPosition } from "@/lib/geolocation";
import type { Member } from "@/types";

function MemberRow({
  member,
  onClick,
  distance,
}: {
  member: Member;
  onClick: () => void;
  distance?: string | null;
}) {
  return (
    <div className="flex items-center gap-1 hover:bg-[var(--gaspe-neutral-50)] transition-colors">
      <button
        onClick={onClick}
        className="flex-1 text-left p-4 cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <MemberLogo logoUrl={member.logoUrl} name={member.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading text-sm font-semibold text-foreground leading-tight">
                {member.name}
              </h3>
              {member.territory === "dom-tom" && (
                <Badge variant="blue" className="shrink-0 text-[10px]">
                  Outre-mer
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {member.city} &middot; {member.region}
              {distance && <span className="ml-1 text-[var(--gaspe-teal-600)] font-medium">· {distance}</span>}
            </p>
          </div>
        </div>
      </button>
      <Link
        href={`/nos-adherents/${member.slug}`}
        className="shrink-0 p-3 text-foreground-muted hover:text-[var(--gaspe-teal-600)] transition-colors"
        title={`Fiche ${member.name}`}
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
  const regions = [...new Set(members.map((m) => m.region))].sort();
  const [userPos, setUserPos] = useState<GeoPosition | null>(null);
  const [geoError, setGeoError] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const sortedTitulaires = useMemo(() => {
    if (!userPos) return titulaires;
    return [...titulaires].sort(
      (a, b) =>
        haversineDistance(userPos.latitude, userPos.longitude, a.latitude, a.longitude) -
        haversineDistance(userPos.latitude, userPos.longitude, b.latitude, b.longitude)
    );
  }, [userPos]);

  const sortedAssocies = useMemo(() => {
    if (!userPos) return associes;
    return [...associes].sort(
      (a, b) =>
        haversineDistance(userPos.latitude, userPos.longitude, a.latitude, a.longitude) -
        haversineDistance(userPos.latitude, userPos.longitude, b.latitude, b.longitude)
    );
  }, [userPos]);

  function getMemberDistance(member: Member): string | null {
    if (!userPos) return null;
    return formatDistance(haversineDistance(userPos.latitude, userPos.longitude, member.latitude, member.longitude));
  }

  async function handleGeolocate() {
    setGeoLoading(true);
    setGeoError("");
    try {
      const pos = await getUserPosition();
      setUserPos(pos);
      mapRef.current?.flyToMember({ latitude: pos.latitude, longitude: pos.longitude, slug: "", name: "", city: "", region: "", territory: "metropole", category: "titulaire" } as Member);
    } catch (err: unknown) {
      setGeoError(err instanceof Error ? err.message : "Erreur de géolocalisation");
    } finally {
      setGeoLoading(false);
    }
  }

  function handleMemberClick(member: Member) {
    mapRef.current?.flyToMember(member);
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Map — 70% on desktop */}
      <div className="flex-1 lg:w-[70%]">
        <MemberMap ref={mapRef} members={members} className="h-[50vh] lg:h-full" />
      </div>

      {/* Sidebar — 30% on desktop */}
      <aside className="lg:w-[30%] lg:max-w-md border-l border-border-light bg-background overflow-y-auto">
        {/* Geolocation button */}
        <div className="p-4 border-b border-border-light">
          <button
            onClick={handleGeolocate}
            disabled={geoLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {geoLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            )}
            {userPos ? "Autour de moi ✓" : "Autour de moi"}
          </button>
          {geoError && <p className="mt-2 text-xs text-red-500">{geoError}</p>}
          {userPos && !geoError && (
            <p className="mt-2 text-xs text-[var(--gaspe-teal-600)]">Trié par distance depuis votre position</p>
          )}
        </div>

        {/* Titulaires */}
        <div className="p-4 border-b border-border-light">
          <h1 className="font-heading text-xl font-bold text-foreground">
            Membres Titulaires
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {titulaires.length} armateurs &middot; {regions.length} régions
          </p>
        </div>

        <div className="divide-y divide-border-light">
          {sortedTitulaires.map((member) => (
            <MemberRow
              key={member.slug}
              member={member}
              onClick={() => handleMemberClick(member)}
              distance={getMemberDistance(member)}
            />
          ))}
        </div>

        {/* Associés & Experts */}
        <div className="p-4 border-b border-t border-border-light bg-surface">
          <h2 className="font-heading text-lg font-bold text-foreground">
            Associés &amp; Experts
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {associes.length} membres
          </p>
        </div>

        <div className="divide-y divide-border-light">
          {sortedAssocies.map((member) => (
            <MemberRow
              key={member.slug}
              member={member}
              onClick={() => handleMemberClick(member)}
              distance={getMemberDistance(member)}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
