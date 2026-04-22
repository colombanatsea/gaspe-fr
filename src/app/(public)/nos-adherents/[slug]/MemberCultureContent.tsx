"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { members } from "@/data/members";
import { publishedJobs, type Job } from "@/data/jobs";
import { MemberLogo } from "@/components/shared/MemberLogo";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useScrollReveal } from "@/lib/useScrollReveal";

/* ------------------------------------------------------------------ */
/*  Culture themes                                                     */
/* ------------------------------------------------------------------ */

const CULTURE_THEMES = [
  {
    title: "Ancrage territorial",
    description:
      "Notre compagnie est profondément enracinée dans son territoire. Nous participons activement à la vie locale et au désenclavement des îles et presqu'îles que nous desservons.",
    icon: "anchor",
  },
  {
    title: "Engagement environnemental",
    description:
      "La transition écologique est au cœur de notre stratégie. Nous investissons dans des navires à faible empreinte carbone et des pratiques de navigation responsable.",
    icon: "leaf",
  },
  {
    title: "Développement des compétences",
    description:
      "Nous accompagnons nos collaborateurs dans leur parcours professionnel avec des formations continues, des passerelles entre métiers et un management de proximité.",
    icon: "academic",
  },
  {
    title: "Service public maritime",
    description:
      "En tant que délégataire de service public, nous garantissons la continuité territoriale et l'accessibilité des liaisons maritimes pour tous les usagers.",
    icon: "ship",
  },
];

function CultureIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className ?? "h-6 w-6";
  switch (icon) {
    case "anchor":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21V3m0 18c-1.5 0-4-1.5-4-4m4 4c1.5 0 4-1.5 4-4M12 3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
      );
    case "leaf":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c4-4 8-8 8-14-6 0-10 4-14 8m6 6c-4-4-8-8-8-14 6 0 10 4 14 8" />
        </svg>
      );
    case "academic":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
      );
    case "ship":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 18.75c2.25 1.5 4.5 1.5 6 0s3.75-1.5 6 0 3.75 1.5 6 0M3 14.25c2.25 1.5 4.5 1.5 6 0s3.75-1.5 6 0 3.75 1.5 6 0M12 3v9m-3-3 3 3 3-3" />
        </svg>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

export function MemberCultureContent({ slug }: { slug: string }) {
  const member = members.find((m) => m.slug === slug);
  if (!member) notFound();

  const ref = useScrollReveal();
  const memberJobs = publishedJobs.filter(
    (j: Job) =>
      j.company.toLowerCase().includes(member.name.split(" ")[0].toLowerCase()) ||
      j.companySlug === member.slug
  );

  return (
    <>
      <PageHeader
        title={member.name}
        description={`${member.city} · ${member.region} – ${member.category === "titulaire" ? "Membre titulaire" : "Membre associé"} du GASPE`}
        breadcrumbs={[
          { label: "Nos Adhérents", href: "/nos-adherents" },
          { label: member.name },
        ]}
      />

      <div ref={ref} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company identity */}
            <section className="reveal gaspe-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <MemberLogo
                  logoUrl={member.logoUrl}
                  name={member.name}
                  className="h-16 w-16 rounded-xl object-contain bg-white border border-border-light p-2"
                />
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    {member.name}
                  </h2>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {member.city}, {member.region}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={member.category === "titulaire" ? "teal" : "blue"}>
                      {member.category === "titulaire" ? "Titulaire" : "Associé"}
                    </Badge>
                    {member.territory === "dom-tom" && (
                      <Badge variant="warm">Outre-mer</Badge>
                    )}
                  </div>
                </div>
              </div>
              {member.description && (
                <p className="mt-4 text-sm text-foreground-muted leading-relaxed">
                  {member.description}
                </p>
              )}
            </section>

            {/* Stats */}
            {(member.employeeCount || member.shipCount) && (
              <section className="reveal">
                <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                  Chiffres clés
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {member.employeeCount && (
                    <div className="gaspe-card rounded-xl p-4 text-center">
                      <p className="font-heading text-2xl font-bold text-[var(--gaspe-teal-600)]">
                        {member.employeeCount}
                      </p>
                      <p className="text-xs text-foreground-muted mt-1">Collaborateurs</p>
                    </div>
                  )}
                  {member.shipCount && (
                    <div className="gaspe-card rounded-xl p-4 text-center">
                      <p className="font-heading text-2xl font-bold text-[var(--gaspe-teal-600)]">
                        {member.shipCount}
                      </p>
                      <p className="text-xs text-foreground-muted mt-1">Navires</p>
                    </div>
                  )}
                  <div className="gaspe-card rounded-xl p-4 text-center">
                    <p className="font-heading text-2xl font-bold text-[var(--gaspe-teal-600)]">
                      {member.category === "titulaire" ? "DSP" : "Expert"}
                    </p>
                    <p className="text-xs text-foreground-muted mt-1">
                      {member.category === "titulaire" ? "Service public" : "Secteur maritime"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Culture & values */}
            <section className="reveal">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                Culture &amp; engagements
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {CULTURE_THEMES.map((theme, i) => (
                  <div
                    key={theme.title}
                    className={`gaspe-card gaspe-card-hover rounded-xl p-5 reveal stagger-${i + 1}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gaspe-teal-600)]/10 text-[var(--gaspe-teal-600)]">
                        <CultureIcon icon={theme.icon} className="h-5 w-5" />
                      </span>
                      <h4 className="font-heading text-sm font-bold text-foreground">
                        {theme.title}
                      </h4>
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      {theme.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Job offers */}
            {memberJobs.length > 0 && (
              <section className="reveal">
                <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                  Offres d&apos;emploi en cours
                </h3>
                <div className="space-y-3">
                  {memberJobs.map((job: Job) => (
                    <Link
                      key={job.id}
                      href={`/nos-compagnies-recrutent/${job.slug}`}
                      className="block gaspe-card gaspe-card-hover rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-heading text-sm font-semibold text-foreground">
                            {job.title}
                          </h4>
                          <p className="text-xs text-foreground-muted mt-0.5">
                            {job.location} · {job.contractType}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="neutral">{job.category}</Badge>
                          <svg className="h-4 w-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="gaspe-card rounded-2xl p-5 reveal">
              <h3 className="font-heading text-sm font-bold text-foreground mb-4">
                Informations
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-foreground-muted">Localisation</dt>
                  <dd className="font-medium text-foreground">{member.city}, {member.region}</dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground-muted">Territoire</dt>
                  <dd className="font-medium text-foreground">
                    {member.territory === "metropole" ? "Hexagone" : "Outre-mer"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground-muted">Statut</dt>
                  <dd className="font-medium text-foreground">
                    {member.category === "titulaire" ? "Membre titulaire" : "Membre associé"}
                  </dd>
                </div>
              </dl>
              {member.websiteUrl && (
                <a
                  href={member.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Visiter le site web
                </a>
              )}
            </div>

            {/* CCN info */}
            <div className="rounded-2xl bg-gradient-to-br from-[var(--gaspe-neutral-900)] to-[var(--gaspe-teal-900)] p-5 text-white reveal">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gaspe-teal-400)] mb-2">
                Convention collective
              </p>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                Les salariés de cette compagnie sont couverts par la CCN 3228 (IDCC 3228) des passages d&apos;eau.
              </p>
              <Link
                href="/boite-a-outils"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--gaspe-teal-400)] hover:text-[var(--gaspe-teal-300)] transition-colors"
              >
                Boîte à outils CCN
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>

            {/* Back to map */}
            <Link
              href="/nos-adherents"
              className="flex items-center gap-2 rounded-xl border border-border-light px-4 py-3 text-sm font-medium text-foreground-muted hover:text-foreground hover:border-[var(--gaspe-teal-600)]/30 transition-colors reveal"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Retour à la carte des adhérents
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
