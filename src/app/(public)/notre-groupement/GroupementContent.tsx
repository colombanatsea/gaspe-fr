"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { CollapsibleSources } from "@/components/shared/CollapsibleSources";
import { getActiveMembers, type StoredMember } from "@/lib/members-store";
import { MemberLogo } from "@/components/shared/MemberLogo";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";
import { sanitizeHtml } from "@/lib/sanitize-html";

const PAGE_ID = "notre-groupement";
const D = (sectionId: string) => getCmsDefault(PAGE_ID, sectionId);

function parseList<T>(json: string): T[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Icon mapping for engagements (by color key)
const ENGAGEMENT_ICONS: Record<string, { icon: React.ReactElement; color: string; bgColor: string }> = {
  teal: {
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>,
    color: "var(--gaspe-teal-600)", bgColor: "var(--gaspe-teal-50)",
  },
  green: {
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>,
    color: "var(--gaspe-green-500)", bgColor: "var(--gaspe-green-50)",
  },
  blue: {
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>,
    color: "var(--gaspe-blue-600)", bgColor: "var(--gaspe-blue-50)",
  },
  warm: {
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>,
    color: "var(--gaspe-warm-500)", bgColor: "var(--gaspe-warm-50)",
  },
};

interface TimelineItem { year: string; title: string; description: string }
interface EngagementItem { title: string; description: string; color: string }
interface BureauMember { name: string; role: string; company: string; href: string }

export function GroupementContent() {
  const ref = useScrollReveal();
  const [memberFilter, setMemberFilter] = useState<"all" | "titulaire" | "associe">("all");
  const [members, setMembers] = useState<StoredMember[]>([]);

  useEffect(() => {
    getActiveMembers().then(setMembers);
  }, []);

  const filtered = memberFilter === "all" ? members : members.filter((m) => m.category === memberFilter);
  const titulaires = members.filter((m) => m.category === "titulaire");
  const associes = members.filter((m) => m.category === "associe");

  // CMS-editable content with defaults as fallbacks
  const adherentsEyebrow = useCmsContent(PAGE_ID, "adherents-eyebrow", D("adherents-eyebrow"));
  const adherentsTitle = useCmsContent(PAGE_ID, "adherents-title", D("adherents-title"));
  const adherentsSubtitleTmpl = useCmsContent(PAGE_ID, "adherents-subtitle-template", D("adherents-subtitle-template"));
  const timelineBadge = useCmsContent(PAGE_ID, "timeline-badge", D("timeline-badge"));
  const timelineTitle = useCmsContent(PAGE_ID, "timeline-title", D("timeline-title"));
  const timelineIntro = useCmsContent(PAGE_ID, "timeline-intro", D("timeline-intro"));
  const missionEyebrow = useCmsContent(PAGE_ID, "mission-eyebrow", D("mission-eyebrow"));
  const missionTitle = useCmsContent(PAGE_ID, "mission-title", D("mission-title"));
  const missionDescription = useCmsContent(PAGE_ID, "mission-description", D("mission-description"));
  const missionBullets = useCmsContent(PAGE_ID, "mission-bullets", D("mission-bullets"));
  const missionStatYears = useCmsContent(PAGE_ID, "mission-stat-years", D("mission-stat-years"));
  const missionStatLabel = useCmsContent(PAGE_ID, "mission-stat-label", D("mission-stat-label"));
  const missionStatDescription = useCmsContent(PAGE_ID, "mission-stat-description", D("mission-stat-description"));
  const engagementsEyebrow = useCmsContent(PAGE_ID, "engagements-eyebrow", D("engagements-eyebrow"));
  const engagementsTitle = useCmsContent(PAGE_ID, "engagements-title", D("engagements-title"));
  const bureauEyebrow = useCmsContent(PAGE_ID, "bureau-eyebrow", D("bureau-eyebrow"));
  const bureauTitle = useCmsContent(PAGE_ID, "bureau-title", D("bureau-title"));
  const bureauSubtitle = useCmsContent(PAGE_ID, "bureau-subtitle", D("bureau-subtitle"));

  // CMS-editable lists
  const timelineJson = useCmsContent(PAGE_ID, "timeline-items", D("timeline-items"));
  const engagementsJson = useCmsContent(PAGE_ID, "engagements-items", D("engagements-items"));
  const bureauJson = useCmsContent(PAGE_ID, "bureau-members", D("bureau-members"));
  const timeline = parseList<TimelineItem>(timelineJson);
  const engagements = parseList<EngagementItem>(engagementsJson);
  const bureauMembers = parseList<BureauMember>(bureauJson);

  return (
    <div ref={ref}>
      {/* 1. Nos Adherents */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-10">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-600)] mb-3">
              {adherentsEyebrow}
            </p>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {members.length} {adherentsTitle}
            </h2>
            <p className="mt-3 text-foreground-muted max-w-2xl mx-auto">
              {titulaires.length} membres titulaires et {associes.length} {adherentsSubtitleTmpl}
            </p>
          </div>

          {/* Filters */}
          <div className="flex justify-center gap-2 mb-8">
            {[
              { key: "all" as const, label: `Tous (${members.length})` },
              { key: "titulaire" as const, label: `Titulaires (${titulaires.length})` },
              { key: "associe" as const, label: `Associes (${associes.length})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setMemberFilter(f.key)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  memberFilter === f.key
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Members grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((member) => (
              <Link
                key={member.slug}
                href={`/nos-adherents/${member.slug}`}
                className="group rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-4 text-center hover:shadow-md hover:border-[var(--gaspe-teal-200)] transition-all"
              >
                <div className="flex justify-center mb-3">
                  <MemberLogo logoUrl={member.logoUrl} name={member.name} size="md" />
                </div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {member.name}
                </p>
                <p className="text-[10px] text-foreground-muted mt-0.5">{member.city}</p>
              </Link>
            ))}
          </div>

          {/* CTA carte interactive */}
          <div className="mt-10 reveal">
            <Link
              href="/nos-adherents"
              className="group block rounded-2xl bg-gradient-to-r from-[var(--gaspe-teal-600)] to-[var(--gaspe-teal-700)] p-6 sm:p-8 text-white hover:shadow-xl transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold">Carte interactive</p>
                    <p className="text-sm text-white/70 mt-0.5">
                      Visualisez nos {members.length} compagnies sur la carte de France et Outre-mer
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                  Voir la carte
                  <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Timeline - 75 ans */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="reveal mb-12">
            <Badge variant="teal" className="mb-4">{timelineBadge}</Badge>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {timelineTitle}
            </h2>
            <div
              className="mt-3 max-w-3xl text-foreground-muted leading-relaxed [&>p]:m-0"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(timelineIntro) }}
            />
          </div>

          <div className="relative mt-16">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--gaspe-teal-600)] via-[var(--gaspe-teal-300)] to-[var(--gaspe-neutral-200)] hidden sm:block" />
            <div className="space-y-10 sm:space-y-12">
              {timeline.map((item, i) => (
                <div key={item.year} className={`reveal stagger-${i + 1} sm:flex items-start gap-8`}>
                  <div className="hidden sm:flex shrink-0 relative z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gaspe-teal-600)] text-white shadow-lg shadow-[var(--gaspe-teal-600)]/30">
                      <span className="font-heading text-xs font-bold">{item.year.slice(-2)}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6 sm:p-8 gaspe-card-hover flex-1">
                    <span className="inline-block sm:hidden font-heading text-xs font-bold text-[var(--gaspe-teal-600)] mb-2">{item.year}</span>
                    <p className="hidden sm:block font-heading text-sm font-bold text-[var(--gaspe-teal-600)] mb-1">{item.year}</p>
                    <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                    <div
                      className="mt-2 text-sm text-foreground-muted leading-relaxed [&>p]:m-0"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.description) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mission */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="reveal">
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-600)] mb-3">
                {missionEyebrow}
              </p>
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl mb-6">
                {missionTitle}
              </h2>
              <div
                className="text-foreground-muted leading-relaxed mb-8 [&>p]:m-0"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(missionDescription) }}
              />
              <div
                className="space-y-4 [&>ul]:space-y-4 [&>ul>li]:flex [&>ul>li]:gap-3 [&>ul>li]:items-start [&>ul>li]:text-foreground-muted [&>ul>li]:before:content-[''] [&>ul>li]:before:mt-1.5 [&>ul>li]:before:h-1.5 [&>ul>li]:before:w-1.5 [&>ul>li]:before:shrink-0 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-[var(--gaspe-teal-600)]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(missionBullets) }}
              />
            </div>

            <div className="reveal stagger-2">
              <div className="relative rounded-2xl gaspe-gradient-animated p-8 sm:p-10 text-white overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute right-[-20%] top-[-20%] h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute left-[-10%] bottom-[-10%] h-32 w-32 rounded-full bg-white/5 blur-xl" />
                </div>
                <div className="relative z-10">
                  <p className="font-heading text-6xl font-bold mb-2">{missionStatYears}</p>
                  <p className="text-white/90 font-heading text-lg font-semibold">
                    {missionStatLabel}
                  </p>
                  <div
                    className="mt-4 text-sm text-white/70 leading-relaxed [&>p]:m-0"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(missionStatDescription) }}
                  />
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/15 backdrop-blur-sm p-4">
                      <p className="font-heading text-2xl font-bold">27</p>
                      <p className="text-xs text-white/70">Compagnies</p>
                    </div>
                    <div className="rounded-xl bg-white/15 backdrop-blur-sm p-4">
                      <p className="font-heading text-2xl font-bold">1 494</p>
                      <p className="text-xs text-white/70">Marins francais</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Engagements */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-12">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-600)] mb-3">
              {engagementsEyebrow}
            </p>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {engagementsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {engagements.map((eng, i) => {
              const iconConfig = ENGAGEMENT_ICONS[eng.color] ?? ENGAGEMENT_ICONS.teal;
              return (
                <div
                  key={eng.title || i}
                  className={`reveal-scale stagger-${Math.min(i + 1, 6)} group rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] hover:border-[var(--gaspe-teal-200)] p-8 gaspe-card-hover`}
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 group-hover:scale-110"
                    style={{ backgroundColor: iconConfig.bgColor, color: iconConfig.color }}
                  >
                    {iconConfig.icon}
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground mb-2">
                    {eng.title}
                  </h3>
                  <p className="text-sm text-foreground-muted leading-relaxed">
                    {eng.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Bureau */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-12">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-600)] mb-3">
              {bureauEyebrow}
            </p>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {bureauTitle}
            </h2>
            <p className="mt-2 text-foreground-muted">
              {bureauSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bureauMembers.map((member, i) => (
              <a
                key={member.name || i}
                href={member.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`reveal-scale stagger-${Math.min(i + 1, 6)} group rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6 gaspe-card-hover overflow-hidden relative block`}
              >
                <div className="absolute top-0 left-0 right-0 h-1 gaspe-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gaspe-teal-50)] to-[var(--gaspe-blue-50)] border border-[var(--gaspe-neutral-200)]">
                    <span className="font-heading text-sm font-bold text-[var(--gaspe-teal-600)]">
                      {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                      {member.name}
                    </p>
                    <Badge variant="teal" className="mt-1.5">
                      {member.role}
                    </Badge>
                    {member.company && member.company.trim() && (
                      <p className="mt-2 text-sm text-foreground-muted">
                        {member.company}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <CollapsibleSources>
          <ul className="space-y-2 text-xs text-foreground-muted leading-relaxed">
            <li>Statuts du GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d&apos;Eau, association loi 1901 fondee en 1951</li>
            <li>Donnees compagnies adherentes : declarations des membres au secretariat du GASPE (effectifs, flotte, territoires desservis)</li>
            <li>Composition du Bureau : election lors de l&apos;Assemblee Generale du GASPE</li>
            <li>Chiffres cles (compagnies, collaborateurs, navires, passagers) : consolidation annuelle GASPE — Donnees 2025</li>
          </ul>
        </CollapsibleSources>
      </section>
    </div>
  );
}
