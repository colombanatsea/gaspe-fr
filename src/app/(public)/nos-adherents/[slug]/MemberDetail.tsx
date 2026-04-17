"use client";

import { useState } from "react";
import Link from "next/link";
import { members } from "@/data/members";
import { publishedJobs } from "@/data/jobs";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import type { Vessel } from "@/lib/auth/AuthContext";

/* ---------- Adherent profile data from localStorage ---------- */

interface AdherentProfile {
  companyDescription?: string;
  companyLogo?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyRole?: string;
  companyLinkedinUrl?: string;
  vessels?: Vessel[];
}

function getAdherentProfile(memberName: string): AdherentProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("gaspe_users");
    if (!raw) return null;
    const users = JSON.parse(raw) as Record<string, unknown>[];
    const adherent = users.find(
      (u) =>
        u.role === "adherent" &&
        u.approved === true &&
        u.archived !== true &&
        typeof u.company === "string" &&
        (u.company as string).toLowerCase() === memberName.toLowerCase()
    );
    if (!adherent) return null;
    return {
      companyDescription: adherent.companyDescription as string | undefined,
      companyLogo: adherent.companyLogo as string | undefined,
      companyAddress: adherent.companyAddress as string | undefined,
      companyEmail: adherent.companyEmail as string | undefined,
      companyPhone: adherent.companyPhone as string | undefined,
      companyRole: adherent.companyRole as string | undefined,
      companyLinkedinUrl: adherent.companyLinkedinUrl as string | undefined,
      vessels: adherent.vessels as Vessel[] | undefined,
    };
  } catch {
    return null;
  }
}

/* ---------- Page component ---------- */

export function MemberDetail({ slug }: { slug: string }) {
  const member = members.find((m) => m.slug === slug);
  const [profile] = useState<AdherentProfile | null>(() =>
    member ? getAdherentProfile(member.name) : null
  );

  if (!member) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Membre introuvable
        </h1>
        <Link
          href="/nos-adherents"
          className="text-[var(--gaspe-teal-600)] hover:underline"
        >
          Retour aux adherents
        </Link>
      </div>
    );
  }

  const description =
    profile?.companyDescription ||
    member.description ||
    `Membre du GASPE depuis sa creation, ${member.name} est un acteur majeur du transport maritime de proximite base a ${member.city} (${member.region}).`;

  const companyJobs = publishedJobs.filter(
    (j) => j.companySlug === member.slug
  );
  const vessels = profile?.vessels ?? [];
  const logoUrl = profile?.companyLogo || member.logoUrl;
  const territoryLabel =
    member.territory === "dom-tom" ? "Outre-mer" : "Metropole";

  return (
    <>
      <PageHeader
        title={member.name}
        breadcrumbs={[
          { label: "Nos adherents", href: "/nos-adherents" },
          { label: member.name },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero row: logo + basic info */}
        <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Logo */}
          <div className="shrink-0">
            {logoUrl ? (
              <div className="h-20 w-20 rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] flex items-center justify-center overflow-hidden p-2">
                <img
                  src={logoUrl}
                  alt={member.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-neutral-200)] flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--gaspe-teal-600)]">
                  {member.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {member.name}
              </h2>
              <Badge
                variant={member.category === "titulaire" ? "teal" : "blue"}
              >
                {member.category === "titulaire" ? "Titulaire" : "Associe"}
              </Badge>
            </div>
            <p className="mt-1 text-foreground-muted">
              {member.city} &middot; {member.region}
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left column — 2/3 */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <section>
              <h3 className="font-heading text-xl font-bold text-foreground mb-4">
                Presentation
              </h3>
              <div className="prose prose-neutral max-w-none text-foreground-muted leading-relaxed">
                <p>{description}</p>
              </div>
            </section>

            {/* Flotte */}
            {vessels.length > 0 && (
              <section>
                <h3 className="font-heading text-xl font-bold text-foreground mb-4">
                  Flotte
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {vessels.map((vessel) => (
                    <div
                      key={vessel.id}
                      className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-5 gaspe-card-hover"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gaspe-teal-50)]">
                          <svg
                            className="h-5 w-5 text-[var(--gaspe-teal-600)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 17h1l1-5h14l1 5h1M5 17l-2 4h18l-2-4M12 3v4m-4 0h8"
                            />
                          </svg>
                        </div>
                        <h4 className="font-heading font-semibold text-foreground">
                          {vessel.name}
                        </h4>
                      </div>
                      <dl className="space-y-1 text-sm text-foreground-muted">
                        {vessel.imo && (
                          <div className="flex justify-between">
                            <dt className="font-medium">IMO</dt>
                            <dd>{vessel.imo}</dd>
                          </div>
                        )}
                        {vessel.ums && (
                          <div className="flex justify-between">
                            <dt className="font-medium">UMS</dt>
                            <dd>{vessel.ums}</dd>
                          </div>
                        )}
                        {vessel.size && (
                          <div className="flex justify-between">
                            <dt className="font-medium">Taille</dt>
                            <dd>{vessel.size}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Offres d'emploi */}
            {companyJobs.length > 0 && (
              <section>
                <h3 className="font-heading text-xl font-bold text-foreground mb-4">
                  Offres d&apos;emploi
                </h3>
                <div className="space-y-3">
                  {companyJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/nos-compagnies-recrutent/${job.slug}`}
                      className="block rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-5 gaspe-card-hover transition-colors hover:border-[var(--gaspe-teal-200)]"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="font-heading font-semibold text-foreground">
                            {job.title}
                          </h4>
                          <p className="mt-1 text-sm text-foreground-muted">
                            {job.location}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={
                              job.contractType === "CDI"
                                ? "green"
                                : job.contractType === "CDD"
                                ? "blue"
                                : "warm"
                            }
                          >
                            {job.contractType}
                          </Badge>
                          <Badge variant="neutral">{job.category}</Badge>
                        </div>
                      </div>
                      {job.salaryRange && (
                        <p className="mt-2 text-sm text-[var(--gaspe-teal-600)] font-medium">
                          {job.salaryRange}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {companyJobs.length === 0 && (
              <section>
                <h3 className="font-heading text-xl font-bold text-foreground mb-4">
                  Offres d&apos;emploi
                </h3>
                <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-8 text-center">
                  <p className="text-foreground-muted">
                    Aucune offre d&apos;emploi publiee pour le moment.
                  </p>
                  <Link
                    href="/nos-compagnies-recrutent"
                    className="mt-3 inline-block text-sm font-medium text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] hover:underline"
                  >
                    Voir toutes les offres
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar — 1/3 */}
          <div className="space-y-6">
            {/* Informations card */}
            <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                Informations
              </h3>
              <dl className="space-y-3 text-sm">
                {member.websiteUrl && (
                  <div>
                    <dt className="font-medium text-foreground-muted">
                      Site web
                    </dt>
                    <dd className="mt-0.5">
                      <a
                        href={member.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] hover:underline break-all"
                      >
                        {member.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </dd>
                  </div>
                )}
                {profile?.companyLinkedinUrl && (
                  <div>
                    <dt className="font-medium text-foreground-muted">
                      LinkedIn
                    </dt>
                    <dd className="mt-0.5">
                      <a
                        href={profile.companyLinkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] hover:underline"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"/>
                        </svg>
                        Page entreprise
                      </a>
                    </dd>
                  </div>
                )}
                {member.employeeCount && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-foreground-muted">
                      Collaborateurs
                    </dt>
                    <dd className="font-semibold text-foreground">
                      {member.employeeCount}
                    </dd>
                  </div>
                )}
                {member.shipCount && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-foreground-muted">
                      Navires
                    </dt>
                    <dd className="font-semibold text-foreground">
                      {member.shipCount}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="font-medium text-foreground-muted">
                    Territoire
                  </dt>
                  <dd>
                    <Badge
                      variant={
                        member.territory === "dom-tom" ? "blue" : "neutral"
                      }
                    >
                      {territoryLabel}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-foreground-muted">
                    Categorie
                  </dt>
                  <dd>
                    <Badge
                      variant={
                        member.category === "titulaire" ? "teal" : "blue"
                      }
                    >
                      {member.category === "titulaire"
                        ? "Titulaire"
                        : "Associe"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Contact card */}
            <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                Contact
              </h3>
              {profile?.companyEmail ||
              profile?.companyPhone ||
              profile?.companyAddress ? (
                <dl className="space-y-3 text-sm">
                  {profile.companyEmail && (
                    <div>
                      <dt className="font-medium text-foreground-muted">
                        Email
                      </dt>
                      <dd className="mt-0.5">
                        <a
                          href={`mailto:${profile.companyEmail}`}
                          className="text-[var(--gaspe-teal-600)] hover:underline break-all"
                        >
                          {profile.companyEmail}
                        </a>
                      </dd>
                    </div>
                  )}
                  {profile.companyPhone && (
                    <div>
                      <dt className="font-medium text-foreground-muted">
                        Telephone
                      </dt>
                      <dd className="mt-0.5">
                        <a
                          href={`tel:${profile.companyPhone}`}
                          className="text-[var(--gaspe-teal-600)] hover:underline"
                        >
                          {profile.companyPhone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {profile.companyAddress && (
                    <div>
                      <dt className="font-medium text-foreground-muted">
                        Adresse
                      </dt>
                      <dd className="mt-0.5 text-foreground">
                        {profile.companyAddress}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-foreground-muted">
                  Contactez le GASPE pour plus d&apos;informations.
                </p>
              )}
            </div>

            {/* Localisation card */}
            <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                Localisation
              </h3>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gaspe-teal-50)]">
                  <svg
                    className="h-5 w-5 text-[var(--gaspe-teal-600)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-foreground">{member.city}</p>
                  <p className="text-foreground-muted">{member.region}</p>
                </div>
              </div>
            </div>

            {/* Retour link */}
            <Link
              href="/nos-adherents"
              className="flex items-center gap-2 rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-5 py-3 text-sm font-medium text-[var(--gaspe-teal-600)] transition-colors hover:bg-[var(--gaspe-teal-50)] hover:border-[var(--gaspe-teal-200)]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Retour aux adherents
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
