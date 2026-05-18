"use client";

/**
 * /offres/export?id=X — fiche export PDF / DOCX d'une offre d'emploi.
 *
 * Mêmes principes que /admin/campagnes/attestation (session 50) : route Client
 * Component avec rendu printable, CSS @media print, bouton « Télécharger PDF »
 * via window.print() et bouton « Télécharger DOCX » via lib docx (lazy import).
 *
 * Auth gate côté client :
 *  - admin / staff → toujours OK
 *  - adhérent → user.company === job.company (recruteur de sa propre offre)
 *  - sinon → redirige vers /connexion
 *
 * Layout : header avec logo GASPE à gauche + logo compagnie à droite,
 * baseline « Plateforme emploi du transport maritime côtier », titre offre,
 * bloc méta-données, sections (Description / Profil / Conditions),
 * encart contact, footer institutionnel avec URL fiche publique.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import { getAllOffers } from "@/lib/jobs-store";
import { members } from "@/data/members";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { exportJobToDocx } from "@/lib/job-export-docx";
import { SITE_URL } from "@/lib/constants";
import { type Job } from "@/data/jobs";

function ExportInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const id = params.get("id") ?? "";

  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [generatingDocx, setGeneratingDocx] = useState(false);

  const member = useMemo(
    () => (job ? members.find((m) => m.slug === job.companySlug || m.name === job.company) : undefined),
    [job],
  );

  useEffect(() => {
    if (!id) {
      setJob(null);
      return;
    }
    getAllOffers().then((list) => {
      const found = list.find((j) => j.id === id || j.slug === id);
      setJob(found ?? null);
    });
  }, [id]);

  useEffect(() => {
    if (job === undefined) return;
    if (!user) {
      router.replace(`/connexion?next=${encodeURIComponent(`/offres/export?id=${id}`)}`);
      return;
    }
    if (!job) return;
    const isOwnerAdherent = !!user.company && user.company === job.company;
    if (!isStaffOrAdmin(user) && !isOwnerAdherent) {
      router.replace("/espace-adherent");
    }
  }, [user, job, router, id]);

  if (job === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-[var(--gaspe-neutral-200)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--gaspe-neutral-200)]" />
          <div className="h-32 w-full rounded bg-[var(--gaspe-neutral-100)]" />
        </div>
      </div>
    );
  }
  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Offre introuvable</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          L&apos;identifiant <code className="rounded bg-[var(--gaspe-neutral-100)] px-1.5 py-0.5">{id || "(vide)"}</code> ne correspond à aucune offre publiée.
        </p>
        <Link href="/admin/offres" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          ← Retour aux offres
        </Link>
      </div>
    );
  }

  const publicUrl = `${SITE_URL}/nos-compagnies-recrutent/${job.slug}`;
  const contactName = job.contactName ?? [job.contactFirstName, job.contactLastName].filter(Boolean).join(" ");
  const deadlineFmt = job.applicationDeadline
    ? new Date(job.applicationDeadline).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  async function handleDownloadDocx() {
    if (!job) return;
    setGeneratingDocx(true);
    try {
      await exportJobToDocx({ job, member, publicUrl });
    } finally {
      setGeneratingDocx(false);
    }
  }

  return (
    <>
      {/* Toolbar masqué à l'impression */}
      <div className="print:hidden sticky top-0 z-20 border-b border-border-light bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin/offres" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            ← Retour
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              <DownloadIcon className="h-4 w-4" />
              Télécharger (PDF)
            </button>
            <button
              onClick={handleDownloadDocx}
              disabled={generatingDocx}
              className="inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-teal transition-colors disabled:opacity-60"
            >
              <DownloadIcon className="h-4 w-4" />
              {generatingDocx ? "Génération…" : "Télécharger (.docx)"}
            </button>
          </div>
        </div>
      </div>

      <div id="export-sheet" className="mx-auto max-w-5xl bg-white px-6 py-10 sm:px-10">
        {/* Header logos */}
        <header className="flex items-start justify-between gap-6 pb-4 border-b-2 border-primary">
          <div className="flex flex-col gap-1">
            <div className="relative h-10 w-32">
              <Image
                src="/assets/brand/logo-gaspe.png"
                alt="GASPE"
                fill
                sizes="128px"
                className="object-contain object-left"
                unoptimized
              />
            </div>
            <p className="text-[11px] italic text-foreground-muted">
              Plateforme emploi du transport maritime côtier
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {member?.logoUrl ? (
              <div className="relative h-14 w-24">
                <Image
                  src={member.logoUrl}
                  alt={job.company}
                  fill
                  sizes="96px"
                  className="object-contain object-right"
                  unoptimized
                />
              </div>
            ) : (
              <p className="font-heading text-base font-bold text-foreground">{job.company}</p>
            )}
            <p className="text-[11px] text-foreground-muted">{job.company}</p>
          </div>
        </header>

        {/* Titre et compagnie */}
        <section className="mt-6">
          <h1 className="font-heading text-3xl font-bold text-foreground leading-tight">{job.title}</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            {job.company} · {job.location}
          </p>
        </section>

        {/* Méta-données en table 2 colonnes */}
        <section className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <MetaRow label="Type de contrat" value={job.contractType} />
          <MetaRow label="Catégorie" value={job.category} />
          {job.brevet && <MetaRow label="Brevet / niveau" value={job.brevet} />}
          {job.salaryRange && <MetaRow label="Rémunération" value={job.salaryRange} />}
          {job.startDate && <MetaRow label="Prise de poste" value={job.startDate} />}
          {deadlineFmt && <MetaRow label="Date limite" value={deadlineFmt} />}
          {job.reference && <MetaRow label="Référence" value={job.reference} />}
          {job.handiAccessible && <MetaRow label="Accessibilité" value="Offre handi-accueillante" />}
        </section>

        {/* Sections */}
        <Section title="Description du poste" html={job.description} />
        <Section title="Profil recherché" html={job.profile} />
        <Section title="Conditions" html={job.conditions} />

        {/* Contact */}
        {(job.contactEmail || job.contactPhone || job.applicationUrl) && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="font-heading text-lg font-bold text-primary mb-2">Contact & candidature</h2>
            <div className="space-y-1 text-sm text-foreground">
              {contactName && <p className="font-semibold">{contactName}</p>}
              {job.contactEmail && (
                <p>
                  <span className="text-foreground-muted">Email :</span> {job.contactEmail}
                </p>
              )}
              {job.contactPhone && (
                <p>
                  <span className="text-foreground-muted">Téléphone :</span> {job.contactPhone}
                </p>
              )}
              {job.applicationUrl && (
                <p className="break-all">
                  <span className="text-foreground-muted">Candidature en ligne :</span> {job.applicationUrl}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Footer institutionnel */}
        <footer className="mt-10 pt-4 border-t border-border-light text-[11px] italic text-foreground-muted space-y-0.5">
          <p>
            Offre publiée sur le portail emploi du GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d&apos;Eau.
          </p>
          <p>
            Fiche en ligne :{" "}
            <span className="not-italic font-medium text-foreground">{publicUrl}</span>
          </p>
          <p>Contact GASPE : contact@gaspe.fr · gaspe.fr</p>
        </footer>
      </div>

      {/* CSS @media print */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.2cm;
          }
          body {
            background: #fff !important;
          }
          aside,
          nav,
          header[class*="site"],
          footer[class*="site"],
          .admin-sidebar,
          .print\\:hidden {
            display: none !important;
          }
          #export-sheet {
            max-width: 100% !important;
            padding: 0 !important;
          }
          h1, h2, h3, h4 {
            page-break-after: avoid;
          }
          section, article {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="text-xs font-semibold uppercase tracking-wider text-foreground-muted self-center">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </>
  );
}

function Section({ title, html }: { title: string; html?: string }) {
  if (!html || !html.trim()) return null;
  return (
    <section className="mt-7 break-inside-avoid">
      <h2 className="font-heading text-lg font-bold text-primary mb-2">{title}</h2>
      <div
        className="prose prose-sm max-w-none
          prose-headings:font-heading prose-headings:text-foreground prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1
          prose-p:my-1.5 prose-p:text-foreground prose-p:leading-relaxed
          prose-li:text-foreground prose-li:my-0.5
          prose-strong:text-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    </section>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

export default function JobExportPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12" />}>
      <ExportInner />
    </Suspense>
  );
}
