import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JobDetailActions } from "@/components/jobs/JobDetailActions";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { jobs } from "@/data/jobs";
import { members } from "@/data/members";
import { formatDate } from "@/lib/utils";
import { ScrollRevealWrapper } from "@/components/shared/ScrollRevealWrapper";
import { JobMatchScore } from "@/components/jobs/JobMatchScore";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return jobs
    .filter((j) => j.published)
    .map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = jobs.find((j) => j.slug === slug && j.published);
  if (!job) return { title: "Offre introuvable" };

  return {
    title: `${job.title} - ${job.company}`,
    description: `Offre d'emploi : ${job.title} chez ${job.company} à ${job.location}. ${job.contractType}.`,
    openGraph: {
      title: `${job.title} - ${job.company} | GASPE`,
      description: `${job.contractType} — ${job.location}. ${job.salaryRange ?? ""}`.trim(),
      type: "article",
      url: `https://gaspe-fr.pages.dev/nos-compagnies-recrutent/${slug}`,
    },
  };
}

const contractBadgeVariant: Record<string, "teal" | "blue" | "warm" | "green" | "neutral"> = {
  CDI: "teal",
  CDD: "blue",
  Saisonnier: "warm",
};

const categoryBadgeVariant: Record<string, "teal" | "blue" | "warm" | "green" | "neutral"> = {
  Pont: "blue",
  Machine: "neutral",
  Technique: "green",
};

// Maritime job images from Unsplash
const JOB_IMAGES: Record<string, string> = {
  Machine: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80&auto=format",
  Pont: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80&auto=format",
  Technique: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80&auto=format",
};

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = jobs.find((j) => j.slug === slug && j.published);

  if (!job) notFound();

  const member = members.find((m) => m.slug === job.companySlug);
  const jobImage = JOB_IMAGES[job.category] ?? JOB_IMAGES.Pont;

  const mailtoSubject = encodeURIComponent(`Candidature : ${job.title}`);
  const mailtoBody = encodeURIComponent(
    `Bonjour,\n\nJe souhaite postuler à l'offre "${job.title}" publiée sur le site du GASPE.\n\nCordialement,`,
  );
  const mailtoHref = `mailto:${job.contactEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  // JSON-LD structured data for JobPosting
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description.replace(/<[^>]+>/g, "").trim(),
    datePosted: job.publishedAt,
    employmentType: job.contractType === "CDI" ? "FULL_TIME" : job.contractType === "CDD" ? "TEMPORARY" : "SEASONAL",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: member?.websiteUrl ?? undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "FR" },
    },
    ...(job.salaryMin ? {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "EUR",
        value: { "@type": "QuantitativeValue", value: job.salaryMin, unitText: "MONTH" },
      },
    } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[var(--gaspe-neutral-900)]">
        <div className="absolute inset-0">
          <img src={jobImage} alt={`${job.title} — ${job.company}`} className="h-full w-full object-cover opacity-30" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--gaspe-neutral-900)] via-[var(--gaspe-neutral-900)]/70 to-transparent" />
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm" aria-label="Fil d'Ariane">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="text-white/50 hover:text-white/80 transition-colors">Accueil</Link></li>
              <li className="flex items-center gap-1.5">
                <span className="text-white/30">/</span>
                <Link href="/nos-compagnies-recrutent" className="text-white/50 hover:text-white/80 transition-colors">Recrutement</Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-white/30">/</span>
                <span className="text-[var(--gaspe-teal-400)] truncate max-w-[200px]">{job.title}</span>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap gap-3 mb-4">
            <Badge variant={contractBadgeVariant[job.contractType] ?? "neutral"}>
              {job.contractType}
            </Badge>
            <Badge variant={categoryBadgeVariant[job.category] ?? "neutral"}>
              {job.category}
            </Badge>
          </div>

          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl leading-tight">
            {job.title}
          </h1>
          <p className="mt-3 text-lg text-white/60">
            {job.company} — {job.location}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full h-auto" preserveAspectRatio="none">
            <path d="M0 48h1440V24C1200 0 960 40 720 24S240 0 0 24z" fill="var(--color-surface)" />
          </svg>
        </div>
      </div>

      <ScrollRevealWrapper className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          {/* Main content */}
          <div className="space-y-8">
            {/* Description */}
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-8 reveal">
              <div
                className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }}
              />
            </div>

            {/* Profile */}
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-8 reveal stagger-2">
              <div
                className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.profile) }}
              />
            </div>

            {/* Conditions */}
            <div className="rounded-2xl bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-teal-100)] p-8 reveal stagger-3">
              <div
                className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.conditions) }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-20 h-fit reveal stagger-1">
            {/* Apply card */}
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6 shadow-sm">
              <h3 className="font-heading text-base font-semibold text-foreground mb-4">
                Postuler à cette offre
              </h3>
              <Button href={mailtoHref} variant="primary" className="w-full justify-center py-3.5 text-base shadow-sm">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                Postuler par email
              </Button>
              {job.contactName && (
                <p className="mt-4 text-xs text-foreground-muted text-center">
                  Contact : {job.contactName}
                </p>
              )}
            </div>

            {/* Candidate actions */}
            <JobDetailActions jobSlug={job.slug} />

            {/* Score matching (candidats only) */}
            <JobMatchScore
              job={{
                title: job.title,
                category: job.category,
                zone: job.zone,
                contractType: job.contractType,
                brevet: job.brevet,
              }}
            />

            {/* Job details card */}
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                Détails de l&apos;offre
              </h3>
              <dl className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[var(--gaspe-teal-600)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <div>
                    <dt className="text-xs text-foreground-muted">Lieu</dt>
                    <dd className="text-sm font-medium text-foreground">{job.location}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[var(--gaspe-teal-600)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <div>
                    <dt className="text-xs text-foreground-muted">Contrat</dt>
                    <dd className="text-sm font-medium text-foreground">{job.contractType}</dd>
                  </div>
                </div>
                {job.salaryRange && (
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-[var(--gaspe-warm-500)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <div>
                      <dt className="text-xs text-foreground-muted">Rémunération</dt>
                      <dd className="text-sm font-medium text-foreground">{job.salaryRange}</dd>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-foreground-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <div>
                    <dt className="text-xs text-foreground-muted">Publiée le</dt>
                    <dd className="text-sm font-medium text-foreground">{formatDate(job.publishedAt)}</dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Company card */}
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                L&apos;entreprise
              </h3>
              <div className="flex items-center gap-3 mb-4">
                {member?.logoUrl ? (
                  <div className="h-12 w-12 rounded-xl bg-white border border-[var(--gaspe-neutral-200)] flex items-center justify-center overflow-hidden p-1">
                    <img src={member.logoUrl} alt={job.company} loading="lazy" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-teal-100)] flex items-center justify-center">
                    <span className="font-heading text-lg font-bold text-[var(--gaspe-teal-600)]">
                      {job.company.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">{job.company}</p>
                  <p className="text-xs text-foreground-muted">{job.location}</p>
                </div>
              </div>
              {member?.websiteUrl && (
                <a
                  href={member.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] transition-colors font-medium"
                >
                  Visiter le site web
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              )}
            </div>

            {/* Toolkit encart */}
            <div className="rounded-2xl bg-[var(--gaspe-teal-600)]/5 border border-[var(--gaspe-teal-400)]/20 p-5">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-2">Boîte à outils</h3>
              <ul className="space-y-1.5 text-sm">
                {job.brevet && (
                  <li>
                    <Link href="/boite-a-outils#classifications" className="text-[var(--gaspe-teal-600)] hover:underline">
                      Classifications & brevets requis
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/boite-a-outils#grilles-salariales" className="text-[var(--gaspe-teal-600)] hover:underline">
                    Grilles salariales CCN 3228
                  </Link>
                </li>
                <li>
                  <Link href="/boite-a-outils#simulateur-salaire" className="text-[var(--gaspe-teal-600)] hover:underline">
                    Simulateur de salaire
                  </Link>
                </li>
                <li>
                  <Link href="/formations" className="text-[var(--gaspe-teal-600)] hover:underline">
                    Formations maritimes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Back link */}
            <Link
              href="/nos-compagnies-recrutent"
              className="flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Toutes les offres
            </Link>
          </div>
        </div>
      </ScrollRevealWrapper>
    </>
  );
}
