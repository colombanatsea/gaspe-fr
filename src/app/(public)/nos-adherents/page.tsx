"use client";

import { useRef, useEffect, useState } from "react";
import { getActiveMembers, type StoredMember } from "@/lib/members-store";
import { MemberMap } from "@/components/map/MemberMap";
import type { MemberMapHandle } from "@/components/map/MemberMap";
import { Badge } from "@/components/ui/Badge";
import { MemberLogo } from "@/components/shared/MemberLogo";
import type { Member } from "@/types";

function MemberRow({
  member,
  onClick,
}: {
  member: Member;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 hover:bg-[var(--gaspe-neutral-50)] transition-colors cursor-pointer"
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
          </p>
        </div>
      </div>
    </button>
  );
}

export default function NosAdherentsPage() {
  const mapRef = useRef<MemberMapHandle>(null);
  const [allMembers, setAllMembers] = useState<StoredMember[]>([]);

  useEffect(() => {
    setAllMembers(getActiveMembers());
  }, []);

  const titul = allMembers.filter((m) => m.category === "titulaire");
  const assoc = allMembers.filter((m) => m.category === "associe");
  const regions = [...new Set(allMembers.map((m) => m.region))].sort();

  function handleMemberClick(member: StoredMember) {
    mapRef.current?.flyToMember(member);
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Map — 70% on desktop */}
      <div className="flex-1 lg:w-[70%]">
        <MemberMap ref={mapRef} members={allMembers} className="h-[50vh] lg:h-full" />
      </div>

      {/* Sidebar — 30% on desktop */}
      <aside className="lg:w-[30%] lg:max-w-md border-l border-border-light bg-background overflow-y-auto">
        {/* Titulaires */}
        <div className="p-4 border-b border-border-light">
          <h1 className="font-heading text-xl font-bold text-foreground">
            Membres Titulaires
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {titul.length} armateurs &middot; {regions.length} régions
          </p>
        </div>

        <div className="divide-y divide-border-light">
          {titul.map((member) => (
            <MemberRow
              key={member.slug}
              member={member}
              onClick={() => handleMemberClick(member)}
            />
          ))}
        </div>

        {/* Associés & Experts */}
        <div className="p-4 border-b border-t border-border-light bg-surface">
          <h2 className="font-heading text-lg font-bold text-foreground">
            Associés &amp; Experts
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {assoc.length} membres
          </p>
        </div>

        <div className="divide-y divide-border-light">
          {assoc.map((member) => (
            <MemberRow
              key={member.slug}
              member={member}
              onClick={() => handleMemberClick(member)}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
