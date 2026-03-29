"use client";

import { useRef } from "react";
import Link from "next/link";
import { members, titulaires, associes } from "@/data/members";
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
