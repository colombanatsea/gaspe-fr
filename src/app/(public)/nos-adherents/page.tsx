"use client";

import { useRef } from "react";
import { members, titulaires, associes } from "@/data/members";
import { MemberMap } from "@/components/map/MemberMap";
import type { MemberMapHandle } from "@/components/map/MemberMap";
import { Badge } from "@/components/ui/Badge";
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
      className="w-full text-left p-4 hover:bg-surface transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {member.logoUrl ? (
          <div className="shrink-0 w-10 h-10 rounded bg-white border border-border-light flex items-center justify-center overflow-hidden">
            <img
              src={member.logoUrl}
              alt={member.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="shrink-0 w-10 h-10 rounded bg-[var(--gaspe-teal-50)] border border-border-light flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--gaspe-teal-600)]">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
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
  const regions = [...new Set(members.map((m) => m.region))].sort();

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
          {titulaires.map((member) => (
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
            {associes.length} membres
          </p>
        </div>

        <div className="divide-y divide-border-light">
          {associes.map((member) => (
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
