import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { formations } from "@/data/formations";
import { ScrollRevealWrapper } from "@/components/shared/ScrollRevealWrapper";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return formations.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const formation = formations.find((f) => f.slug === slug);
  if (!formation) return { title: "Formation introuvable" };

  return {
    title: `${formation.title} — Formation`,
    description: formation.description,
  };
}

const categoryBadge: Record<string, "teal" | "blue" | "warm" | "green" | "neutral"> = {
  sécurité: "warm",
  brevets: "teal",
  management: "blue",
  réglementaire: "green",
  technique: "neutral",
};

function statusLabel(status: string) {
  if (status === "full") return { text: "Complet", variant: "warm" as const };
  if (status === "open") return { text: "Places disponibles", variant: "green" as const };
  return { text: "Fermé", variant: "neutral" as const };
}

export default async function FormationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const formation = formations.find((f) => f.slug === slug);

  if (!formation) notFound();

  const st = statusLabel(formation.status);
  const capacityPct = Math.min((formation.enrolled / formation.capacity) * 100, 100);

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden bg-[var(--gaspe-neutral-900)]">
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
                <Link href="/formations" className="text-white/50 hover:text-white/80 transition-colors">Formations</Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-white/30">/</span>
                <span className="text-[var(--gaspe-teal-400)] truncate max-w-[200px]">{formation.title}</span>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap gap-3 mb-4">
            <Badge variant={categoryBadge[formation.category] ?? "neutral"}>
              {formation.category}
            </Badge>
            <Badge variant={st.variant}>{st.text}</Badge>
          </div>

          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl leading-tight">
            {formation.title}
          </h1>
          <p className="mt-3 text-lg text-white/60">
            {formation.organizer} — {formation.location}
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
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-8 reveal">
              <h2 className="font-heading text-xl font-bold text-foreground mb-4">Présentation</h2>
              <p className="text-foreground-muted leading-relaxed">{formation.description}</p>
            </div>

            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-8 reveal stagger-2">
              <div
                className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 max-w-none"
                dangerouslySetInnerHTML={{ __html: formation.content }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-20 h-fit reveal stagger-1">
            {/* Enroll card */}
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6 shadow-sm">
              <h3 className="font-heading text-base font-semibold text-foreground mb-4">
                S&apos;inscrire
              </h3>

              {/* Capacity */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-foreground-muted">{formation.enrolled}/{formation.capacity} inscrits</span>
                  <span className="font-semibold text-foreground">{Math.round(capacityPct)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--gaspe-neutral-200)]">
                  <div
                    className={`h-2 rounded-full transition-all ${capacityPct >= 100 ? "bg-[var(--gaspe-warm-500)]" : "bg-primary"}`}
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>
              </div>

              <a
                href={`mailto:${formation.contactEmail}?subject=${encodeURIComponent(`Inscription : ${formation.title}`)}`}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors shadow-sm ${
                  formation.status === "full"
                    ? "bg-[var(--gaspe-neutral-300)] text-foreground-muted cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-hover"
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                {formation.status === "full" ? "Complet — liste d'attente" : "S'inscrire par email"}
              </a>
            </div>

            {/* Details card */}
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                Informations pratiques
              </h3>
              <dl className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <div>
                    <dt className="text-xs text-foreground-muted">Dates</dt>
                    <dd className="text-sm font-medium text-foreground">
                      {formatDate(formation.startDate)}
                      {formation.startDate !== formation.endDate && ` — ${formatDate(formation.endDate)}`}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <div>
                    <dt className="text-xs text-foreground-muted">Durée</dt>
                    <dd className="text-sm font-medium text-foreground">{formation.duration}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <div>
                    <dt className="text-xs text-foreground-muted">Lieu</dt>
                    <dd className="text-sm font-medium text-foreground">{formation.location}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[var(--gaspe-warm-500)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <div>
                    <dt className="text-xs text-foreground-muted">Tarif</dt>
                    <dd className="text-sm font-medium text-foreground">{formation.price}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-foreground-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                  <div>
                    <dt className="text-xs text-foreground-muted">Public visé</dt>
                    <dd className="text-sm font-medium text-foreground">{formation.targetAudience}</dd>
                  </div>
                </div>

                {formation.prerequisites !== "Aucun" && (
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-foreground-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <div>
                      <dt className="text-xs text-foreground-muted">Prérequis</dt>
                      <dd className="text-sm font-medium text-foreground">{formation.prerequisites}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Back link */}
            <Link
              href="/formations"
              className="flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Toutes les formations
            </Link>
          </div>
        </div>
      </ScrollRevealWrapper>
    </>
  );
}
