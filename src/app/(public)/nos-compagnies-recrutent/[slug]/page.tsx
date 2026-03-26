import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { jobs } from "@/data/jobs";
import { members } from "@/data/members";
import { formatDate } from "@/lib/utils";

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

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = jobs.find((j) => j.slug === slug && j.published);

  if (!job) notFound();

  const member = members.find((m) => m.slug === job.companySlug);

  const mailtoSubject = encodeURIComponent(`Candidature : ${job.title}`);
  const mailtoBody = encodeURIComponent(
    `Bonjour,\n\nJe souhaite postuler à l'offre "${job.title}" publiée sur le site du GASPE.\n\nCordialement,`,
  );
  const mailtoHref = `mailto:${job.contactEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <>
      <PageHeader
        title={job.title}
        description={`${job.company} — ${job.location}`}
        breadcrumbs={[
          { label: "Nos Compagnies Recrutent", href: "/nos-compagnies-recrutent" },
          { label: job.title },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Meta bar */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Badge variant={contractBadgeVariant[job.contractType] ?? "neutral"}>
            {job.contractType}
          </Badge>
          <Badge variant={categoryBadgeVariant[job.category] ?? "neutral"}>
            {job.category}
          </Badge>
          {job.salaryRange && (
            <span className="text-sm font-medium text-foreground-muted">
              {job.salaryRange}
            </span>
          )}
          <span className="text-sm text-foreground-muted">
            Publiée le {formatDate(job.publishedAt)}
          </span>
        </div>

        {/* Company info */}
        <div className="mb-8 rounded-lg border border-border-light bg-surface p-5">
          <div className="flex flex-wrap items-center gap-4">
            {member?.logoUrl && (
              <img
                src={member.logoUrl}
                alt={job.company}
                className="h-12 w-auto object-contain"
              />
            )}
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                {job.company}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {job.location}
                </span>
                {member?.websiteUrl && (
                  <a
                    href={member.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Site web
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <section className="mb-8">
          <div
            className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground max-w-none"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </section>

        {/* Profile */}
        <section className="mb-8 rounded-lg bg-surface p-6">
          <div
            className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground max-w-none"
            dangerouslySetInnerHTML={{ __html: job.profile }}
          />
        </section>

        {/* Conditions */}
        <section className="mb-10">
          <div
            className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground max-w-none"
            dangerouslySetInnerHTML={{ __html: job.conditions }}
          />
        </section>

        {/* Contact info */}
        {job.contactName && (
          <p className="mb-4 text-sm text-foreground-muted">
            <strong className="text-foreground">Contact :</strong> {job.contactName} —{" "}
            <a href={`mailto:${job.contactEmail}`} className="text-primary hover:underline">
              {job.contactEmail}
            </a>
          </p>
        )}

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-4">
          <Button href={mailtoHref} variant="primary">
            Postuler par email
          </Button>
          <Link
            href="/nos-compagnies-recrutent"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour aux offres
          </Link>
        </div>
      </div>
    </>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
