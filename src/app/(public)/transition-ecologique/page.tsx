"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CollapsibleSources } from "@/components/shared/CollapsibleSources";
import { useScrollReveal } from "@/lib/useScrollReveal";

const ADEME_GUIDES = [
  {
    title: "Cahier des charges AAP 2026",
    description: "Appel a projets ADEME — Decarbonation du transport et des services maritimes. Regles, eligibilite, criteres de notation.",
    href: "/assets/ademe/cahier-des-charges-2026.pdf",
    badge: "Reference",
    variant: "teal" as const,
  },
  {
    title: "Guide de depot",
    description: "Procedure de depot du dossier sur la plateforme ADEME. Etapes, pieces justificatives, calendrier.",
    href: "/assets/ademe/guide-depot.pdf",
    badge: "Pratique",
    variant: "blue" as const,
  },
  {
    title: "Guide de categorisation des depenses",
    description: "Classification des depenses eligibles par poste budgetaire. Equipements, ingenierie, etudes.",
    href: "/assets/ademe/guide-categorisation-depenses.pdf",
    badge: "Budget",
    variant: "blue" as const,
  },
  {
    title: "Guide reglementation aides d'Etat",
    description: "Cadre juridique europeen des aides publiques. Regime LDACEE, RGEC, plafonds et cumuls.",
    href: "/assets/ademe/guide-reglementation-aides-etat.pdf",
    badge: "Juridique",
    variant: "neutral" as const,
  },
];

const KEY_FIGURES = [
  { value: "70", suffix: "M", label: "Budget AAP 2026" },
  { value: "6", suffix: "M", label: "Aide max par projet" },
  { value: "60", suffix: "%", label: "Taux max (PE)" },
  { value: "12", label: "Technologies couvertes" },
];

export default function TransitionEcologiquePage() {
  const ref = useScrollReveal();

  return (
    <>
      <PageHeader
        title="Transition Ecologique"
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Transition Ecologique" },
        ]}
      />

      <div ref={ref} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="reveal mb-10">
          <div className="rounded-2xl gaspe-gradient-animated p-8 text-white overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute right-[-10%] top-[-20%] h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            </div>
            <div className="relative z-10">
              <Badge variant="neutral"><span className="text-white">AAP ADEME 2026</span></Badge>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-3">
                Cap sur la decarbonation du maritime cotier
              </h2>
              <p className="mt-3 text-white/80 max-w-2xl leading-relaxed">
                Navires hybrides, propulsion 100% electrique, biocarburants, renouvellement de flotte accelere :
                les compagnies du GASPE sont pionnieres. L&apos;AAP ADEME 2026 finance jusqu&apos;a 6 M EUR par projet
                pour la decarbonation de vos navires.
              </p>
              <p className="mt-2 text-white/60 text-sm">
                Cloture : 6 juillet 2026 · Budget total : 70 M EUR
              </p>
            </div>
          </div>
        </div>

        {/* Key figures */}
        <div className="reveal stagger-1 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {KEY_FIGURES.map((fig) => (
            <div key={fig.label} className="rounded-xl bg-background border border-border-light p-4 text-center">
              <p className="text-2xl font-bold font-heading text-primary">
                {fig.value}{fig.suffix && <span className="text-lg">{fig.suffix} EUR</span>}
              </p>
              <p className="text-xs text-foreground-muted">{fig.label}</p>
            </div>
          ))}
        </div>

        {/* Simulator embed */}
        <div className="reveal mb-10">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">
            Simulateur de pre-dossier ADEME
          </h2>
          <p className="text-sm text-foreground-muted mb-4">
            Estimez vos aides, calculez votre scoring et preparez votre candidature en 30 minutes.
            Le simulateur couvre l&apos;electrique, le biocarburant, le dual-fuel et l&apos;optimisation operationnelle.
          </p>
          <div className="rounded-2xl border border-border-light overflow-hidden bg-background">
            <iframe
              src="https://colombanatsea.com/simulateur-transition-armateurs-cotiers/"
              className="w-full border-0"
              style={{ height: "85vh", minHeight: "700px" }}
              title="Simulateur AAP ADEME 2026 — GASPE"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
          <p className="mt-2 text-xs text-foreground-muted text-center">
            Simulateur heberge par GASPE · Donnees indicatives, ne se substituent pas a un conseil professionnel
          </p>
        </div>

        {/* Technologies */}
        <div className="reveal mb-10">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">
            Technologies de decarbonation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Electrification complete", gain: "95%", trl: "TRL 9", desc: "Propulsion 100% electrique sur batteries LFP" },
              { name: "Hybridation diesel-electrique", gain: "25%", trl: "TRL 9", desc: "Combinaison diesel et batteries pour les pics de puissance" },
              { name: "HVO / FAME (biocarburant)", gain: "85%", trl: "TRL 9", desc: "Carburants biosources en drop-in ou conversion" },
              { name: "Pile a combustible H2", gain: "90%", trl: "TRL 7", desc: "Hydrogene vert pour les navires hauturiers" },
              { name: "Propulsion velique", gain: "10%", trl: "TRL 8", desc: "Assistance vile sur les traversees longues" },
              { name: "Routage IA", gain: "15%", trl: "TRL 8", desc: "Optimisation maree et courant par intelligence artificielle" },
            ].map((tech) => (
              <Card key={tech.name}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="teal">{tech.gain} CO2</Badge>
                  <Badge variant="neutral">{tech.trl}</Badge>
                </div>
                <CardTitle className="text-sm">{tech.name}</CardTitle>
                <p className="text-xs text-foreground-muted mt-1">{tech.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="reveal mb-10">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">
            Documents de reference AAP ADEME 2026
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ADEME_GUIDES.map((doc) => (
              <a
                key={doc.title}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border-light bg-background p-5 hover:shadow-md hover:border-primary/30 transition-all flex items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-foreground-muted group-hover:bg-surface-teal group-hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{doc.title}</p>
                    <Badge variant={doc.variant}>{doc.badge}</Badge>
                  </div>
                  <p className="text-xs text-foreground-muted">{doc.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Stats from gaspe.fr */}
        <div className="reveal mb-10 rounded-2xl bg-surface border border-border-light p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold font-heading text-primary">90%</p>
              <p className="text-sm text-foreground-muted">des navires construits en France</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-heading text-primary">42</p>
              <p className="text-sm text-foreground-muted">navires en plan de renouvellement d&apos;ici 2040</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-heading text-primary">20M EUR</p>
              <p className="text-sm text-foreground-muted">en maintenance en France / an</p>
            </div>
          </div>
        </div>

        {/* Sources */}
        <CollapsibleSources className="reveal">
          <ul className="space-y-2 text-xs text-foreground-muted leading-relaxed">
            <li>AAP ADEME « Decarbonation du transport et des services maritimes » 2026 — Cahier des charges, 70 M EUR</li>
            <li>Regime SA.111726 (LDACEE), SA.111728 (PME), SA.119559 (AFR)</li>
            <li>Donnees technologies : DNV Pt.6 Ch.2, Corvus Orca ESS 2024, ABB Marine 2022</li>
            <li>Facteurs emission : IMO MEPC.1/Circ.684, RED III (biocarburants)</li>
            <li>Chiffres secteur : GASPE, donnees adherents 2025</li>
          </ul>
        </CollapsibleSources>
      </div>
    </>
  );
}
