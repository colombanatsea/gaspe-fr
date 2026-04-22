"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { CollapsibleSources } from "@/components/shared/CollapsibleSources";
import { Badge } from "@/components/ui/Badge";
import { useScrollReveal } from "@/lib/useScrollReveal";
import {
  TOOLKIT_SECTIONS,
  CLASSIFICATION_LEVELS,
  SALARY_GRID_NAO_2026,
  SALARY_NOTES,
  INDEMNITES_NAO_2026,
  ENIM_RATES,
  ENIM_TOTAL_EMPLOYER_RATE,
  ENIM_TOTAL_EMPLOYEE_RATE,
  LEAVE_RULES,
  BRANCH_AGREEMENTS,
  SALARY_DISCLAIMER,
  LAST_UPDATED,
  CATEGORY_LABELS,
  EMPLOYER_GUIDES,
  EMPLOYER_GUIDE_CATEGORIES,
  CCN3228_FAQ,
  type ServiceCategory,
} from "@/data/ccn3228";
import { FAQJsonLd } from "@/components/shared/SEOJsonLd";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const fmtPct = (n: number) => `${n.toFixed(2).replace(".", ",")} %`;

const CATEGORIES: ServiceCategory[] = ["pont", "machine", "services"];

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function SectionIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className ?? "h-5 w-5";
  switch (icon) {
    case "banknote":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      );
    case "shield":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      );
    case "document":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
    case "list":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      );
    case "calculator":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM5.25 20.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      );
    case "briefcase":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Disclaimer banner                                                  */
/* ------------------------------------------------------------------ */

function Disclaimer() {
  return (
    <div className="mb-6 rounded-xl border border-[var(--gaspe-teal-400)]/20 bg-[var(--gaspe-teal-600)]/5 p-4 text-sm text-foreground-muted">
      <p className="flex items-start gap-2">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        {SALARY_DISCLAIMER}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Grilles salariales                                        */
/* ------------------------------------------------------------------ */

function GrillesSalariales() {
  return (
    <div>
      <Disclaimer />

      {/* NAO 2026 salary grid */}
      <div className="reveal mb-8">
        <h3 className="font-heading text-lg font-bold text-foreground mb-1">
          Grille salariale NAO 2026
        </h3>
        <p className="text-sm text-foreground-muted mb-4">
          Navires armes au Cabotage National et Navigation cotiere (UMS / tonnage du navire arme)
        </p>
        <div className="overflow-x-auto rounded-xl border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--gaspe-teal-600)]/5 text-left">
                <th className="sticky left-0 z-10 bg-[var(--gaspe-teal-600)]/5 px-4 py-3 font-heading font-semibold text-foreground">
                  Fonction
                </th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground text-right whitespace-nowrap">
                  Salaire mensuel
                </th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground text-right whitespace-nowrap">
                  Taux horaire
                </th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground text-right whitespace-nowrap">
                  Taux HS (25 %)
                </th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground text-right whitespace-nowrap">
                  Prime fin d&apos;annee
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {SALARY_GRID_NAO_2026.map((entry, i) => (
                <tr key={i} className="hover:bg-[var(--gaspe-neutral-50)] transition-colors [data-theme=dark]:hover:bg-white/5">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-3 font-medium text-foreground">
                    {entry.fonction}
                    {entry.enim && (
                      <span className="block text-xs text-foreground-muted">{entry.enim} ENIM</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums font-semibold">
                    {fmt.format(entry.salaireMensuel)}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground-muted tabular-nums">
                    {fmt.format(entry.tauxHoraire)}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground-muted tabular-nums">
                    {fmt.format(entry.tauxHS)}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground-muted tabular-nums">
                    {fmt.format(entry.primeFinAnnee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indemnites */}
      <div className="reveal mb-8">
        <h3 className="font-heading text-base font-bold text-foreground mb-3">
          Indemnites et frais
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border-light bg-background p-4">
            <p className="text-sm text-foreground-muted">Indemnite journaliere de nourriture</p>
            <p className="text-lg font-bold font-heading text-foreground">{fmt.format(INDEMNITES_NAO_2026.nourritureJournaliere)}</p>
          </div>
          <div className="rounded-xl border border-border-light bg-background p-4">
            <p className="text-sm text-foreground-muted">Nourriture en deplacement</p>
            <p className="text-lg font-bold font-heading text-foreground">{fmt.format(INDEMNITES_NAO_2026.nourritureDeplacement)}</p>
          </div>
          <div className="rounded-xl border border-border-light bg-background p-4">
            <p className="text-sm text-foreground-muted">Logement par jour</p>
            <p className="text-lg font-bold font-heading text-foreground">{fmt.format(INDEMNITES_NAO_2026.logementParJour)}</p>
          </div>
          <div className="rounded-xl border border-border-light bg-background p-4">
            <p className="text-sm text-foreground-muted">Frais divers par jour</p>
            <p className="text-lg font-bold font-heading text-foreground">{fmt.format(INDEMNITES_NAO_2026.fraisDiversParJour)}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="reveal rounded-xl bg-surface-teal p-5">
        <h4 className="font-heading text-sm font-semibold text-foreground mb-2">Notes reglementaires</h4>
        <ol className="space-y-2 text-xs text-foreground-muted leading-relaxed list-decimal list-inside">
          {SALARY_NOTES.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Congés et repos                                           */
/* ------------------------------------------------------------------ */

function CongesRepos() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {LEAVE_RULES.map((rule, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} className="reveal gaspe-card gaspe-card-hover rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left cursor-pointer"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gaspe-teal-600)]/10 text-[var(--gaspe-teal-600)]">
                  <SectionIcon icon="calendar" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold text-foreground">{rule.type}</h3>
                  <p className="text-xs text-foreground-muted mt-0.5">{rule.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="teal" className="hidden sm:inline-flex">{rule.duration}</Badge>
                <svg
                  className={`h-5 w-5 text-foreground-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <div className="border-t border-border-light px-4 pb-4 pt-3">
                <Badge variant="teal" className="mb-2 sm:hidden">{rule.duration}</Badge>
                <p className="text-sm text-foreground-muted leading-relaxed">{rule.details}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Régime ENIM                                               */
/* ------------------------------------------------------------------ */

function RegimeENIM() {
  return (
    <div>
      <div className="reveal gaspe-card rounded-xl p-5 mb-6">
        <h3 className="font-heading text-base font-bold text-foreground mb-2">
          Qu&apos;est-ce que l&apos;ENIM ?
        </h3>
        <p className="text-sm text-foreground-muted leading-relaxed">
          L&apos;Etablissement National des Invalides de la Marine (ENIM), devenu la Caisse des Gens de Mer,
          est le regime de securite sociale specifique aux marins professionnels. Il couvre la maladie,
          la maternite, l&apos;invalidite, les accidents du travail et la retraite (via la Caisse de Retraite des Marins, CRM).
          Les cotisations sont assises sur les salaires forfaitaires ENIM, distincts des salaires reels.
          Le taux AT/MP varie par entreprise selon la sinistralite.
        </p>
      </div>

      <div className="reveal overflow-x-auto rounded-xl border border-border-light">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--gaspe-teal-600)]/5 text-left">
              <th className="px-4 py-3 font-heading font-semibold text-foreground">Cotisation</th>
              <th className="px-4 py-3 font-heading font-semibold text-foreground text-right">Part employeur</th>
              <th className="px-4 py-3 font-heading font-semibold text-foreground text-right">Part salarié</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {ENIM_RATES.map((rate, i) => (
              <tr key={i} className="hover:bg-[var(--gaspe-neutral-50)] transition-colors">
                <td className="px-4 py-3 text-foreground">{rate.label}</td>
                <td className="px-4 py-3 text-right text-foreground-muted tabular-nums">{fmtPct(rate.employerRate)}</td>
                <td className="px-4 py-3 text-right text-foreground-muted tabular-nums">{fmtPct(rate.employeeRate)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--gaspe-teal-600)]/20 bg-[var(--gaspe-teal-600)]/5 font-semibold">
              <td className="px-4 py-3 font-heading text-foreground">Total</td>
              <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmtPct(ENIM_TOTAL_EMPLOYER_RATE)}</td>
              <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmtPct(ENIM_TOTAL_EMPLOYEE_RATE)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-4 text-xs text-foreground-muted">
        Taux indicatifs, bareme ENIM 2025/2026. Taux AT/MP : moyenne de branche, varie selon l&apos;entreprise.
        CSG et CRDS assises sur 98,25 % du brut. La CRM (retraite) remplace AGIRC-ARRCO pour les gens de mer.
        Source : Caisse des Gens de Mer, decret 2023-1329.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Accords de branche                                        */
/* ------------------------------------------------------------------ */

function AccordsBranche() {
  return (
    <div className="space-y-4">
      {BRANCH_AGREEMENTS.map((accord, i) => (
        <div key={i} className="reveal gaspe-card gaspe-card-hover rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-heading text-sm font-bold text-foreground">{accord.title}</h3>
            <Badge variant={accord.status === "en vigueur" ? "green" : "warm"} className="shrink-0">
              {accord.status === "en vigueur" ? "En vigueur" : "En négociation"}
            </Badge>
          </div>
          <p className="text-xs text-foreground-muted mb-2">{accord.date}</p>
          <p className="text-sm text-foreground-muted leading-relaxed">{accord.summary}</p>
        </div>
      ))}
      <div className="reveal mt-6 text-center">
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gaspe-teal-600)]/40 focus:ring-offset-2"
        >
          <SectionIcon icon="document" className="h-4 w-4" />
          Consulter tous les documents
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Classifications                                           */
/* ------------------------------------------------------------------ */

function Classifications() {
  return (
    <div>
      {CATEGORIES.map((cat) => {
        const levels = CLASSIFICATION_LEVELS.filter((l) => l.category === cat);
        return (
          <div key={cat} className="reveal mb-8">
            <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gaspe-teal-600)]/10 text-[var(--gaspe-teal-600)]">
                {cat === "pont" ? "⚓" : cat === "machine" ? "⚙️" : "🎫"}
              </span>
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {levels.map((lvl) => (
                <div key={lvl.level} className="gaspe-card gaspe-card-hover rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--gaspe-teal-600)] text-white text-xs font-bold font-heading">
                      {lvl.level}
                    </span>
                    <h4 className="font-heading text-sm font-bold text-foreground">{lvl.label}</h4>
                  </div>
                  <p className="text-xs text-foreground-muted mb-3 leading-relaxed">{lvl.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {lvl.requiredCertificates.map((cert) => (
                      <Badge key={cert} variant="neutral" className="text-[10px]">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Simulateur salaire                                        */
/* ------------------------------------------------------------------ */

function SimulateurSalaire() {
  const [selectedIdx, setSelectedIdx] = useState<number | "">("");

  const entry = selectedIdx !== "" ? SALARY_GRID_NAO_2026[selectedIdx] : null;

  const result = useMemo(() => {
    if (!entry) return null;
    const gross = entry.salaireMensuel;
    const employeeContrib = Math.round(gross * (ENIM_TOTAL_EMPLOYEE_RATE / 100));
    const estimatedNet = gross - employeeContrib;
    const annualGross = gross * 12 + entry.primeFinAnnee;
    const hourlyNet = Math.round((estimatedNet / 151.67) * 100) / 100;
    return { gross, employeeContrib, estimatedNet, annualGross, annualPremium: entry.primeFinAnnee, hourlyNet, tauxHoraire: entry.tauxHoraire, tauxHS: entry.tauxHS };
  }, [entry]);

  const selectCls =
    "w-full rounded-xl border border-border-light bg-surface px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gaspe-teal-600)]/40 focus:border-[var(--gaspe-teal-600)] transition-colors";

  return (
    <div>
      <Disclaimer />

      <div className="reveal gaspe-card rounded-xl p-6">
        <h3 className="font-heading text-base font-bold text-foreground mb-4">
          Selectionnez une fonction
        </h3>

        <div>
          <label htmlFor="sim-fonction" className="block text-xs font-semibold text-foreground-muted mb-1.5">Fonction (grille NAO 2026)</label>
          <select
            id="sim-fonction"
            className={selectCls}
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">— Choisir une fonction —</option>
            {SALARY_GRID_NAO_2026.map((entry, i) => (
              <option key={i} value={i}>{entry.fonction}</option>
            ))}
          </select>
        </div>
      </div>

      {result && (
        <div className="reveal mt-6 rounded-xl border-2 border-[var(--gaspe-teal-600)]/30 bg-[var(--gaspe-teal-600)]/5 p-6">
          <h3 className="font-heading text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <SectionIcon icon="calculator" className="h-5 w-5 text-[var(--gaspe-teal-600)]" />
            Estimation salariale — {entry?.fonction}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ResultCard label="Brut mensuel" value={fmt.format(result.gross)} highlight />
            <ResultCard label="Cotisations salarie" value={`- ${fmt.format(result.employeeContrib)}`} sublabel={`(${fmtPct(ENIM_TOTAL_EMPLOYEE_RATE)})`} />
            <ResultCard label="Net estime" value={fmt.format(result.estimatedNet)} highlight />
            <ResultCard label="Brut annuel" value={fmt.format(result.annualGross)} sublabel={`dont ${fmt.format(result.annualPremium)} de prime`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mt-4">
            <ResultCard label="Taux horaire" value={fmt.format(result.tauxHoraire)} sublabel="Base 151,67 h/mois" />
            <ResultCard label="Taux HS (25 %)" value={fmt.format(result.tauxHS)} />
            <ResultCard label="Net horaire estime" value={fmt.format(result.hourlyNet)} />
          </div>
          {entry?.enim && (
            <p className="mt-3 text-xs text-foreground-muted text-center">{entry.enim} ENIM</p>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-4 text-center">
      <p className="text-xs font-semibold text-foreground-muted mb-1">{label}</p>
      <p className={`font-heading text-xl font-bold ${highlight ? "text-[var(--gaspe-teal-600)]" : "text-foreground"}`}>
        {value}
      </p>
      {sublabel && <p className="mt-0.5 text-[10px] text-foreground-muted">{sublabel}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Guides employeur                                          */
/* ------------------------------------------------------------------ */

const GUIDE_CATEGORY_ICONS: Record<string, string> = {
  embauche: "💼",
  formation: "🎓",
  social: "🛡️",
  reglementation: "📋",
};

function GuidesEmployeur() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = Object.entries(EMPLOYER_GUIDE_CATEGORIES);
  const filtered =
    activeCategory === "all"
      ? EMPLOYER_GUIDES
      : EMPLOYER_GUIDES.filter((g) => g.category === activeCategory);

  return (
    <div>
      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeCategory === "all"
              ? "bg-[var(--gaspe-teal-600)] text-white"
              : "bg-white text-foreground-muted hover:bg-[var(--gaspe-teal-600)]/10 border border-border-light"
          }`}
        >
          Tout ({EMPLOYER_GUIDES.length})
        </button>
        {categories.map(([key, label]) => {
          const count = EMPLOYER_GUIDES.filter((g) => g.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeCategory === key
                  ? "bg-[var(--gaspe-teal-600)] text-white"
                  : "bg-white text-foreground-muted hover:bg-[var(--gaspe-teal-600)]/10 border border-border-light"
              }`}
            >
              {GUIDE_CATEGORY_ICONS[key]} {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Guide cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((guide) => (
          <a
            key={guide.id}
            href={guide.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="reveal gaspe-card gaspe-card-hover rounded-xl p-5 group block"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gaspe-teal-600)]/10 text-lg">
                {GUIDE_CATEGORY_ICONS[guide.category]}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-sm font-bold text-foreground group-hover:text-[var(--gaspe-teal-600)] transition-colors">
                  {guide.title}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">{EMPLOYER_GUIDE_CATEGORIES[guide.category]}</p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-foreground-muted group-hover:text-[var(--gaspe-teal-600)] transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
            <p className="text-sm text-foreground-muted leading-relaxed mb-3">
              {guide.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {guide.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="neutral" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
              <span className="text-[10px] text-foreground-muted">{guide.source}</span>
            </div>
          </a>
        ))}
      </div>

      {/* CTA vers recrutement */}
      <div className="reveal mt-8 rounded-xl border-2 border-dashed border-[var(--gaspe-teal-400)]/30 bg-[var(--gaspe-teal-600)]/5 p-6 text-center">
        <p className="font-heading text-base font-bold text-foreground mb-2">
          Vous recrutez ?
        </p>
        <p className="text-sm text-foreground-muted mb-4">
          Consultez les offres en cours de nos adhérents ou publiez votre propre annonce depuis votre espace adhérent.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/nos-compagnies-recrutent"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
          >
            Voir les offres
          </Link>
          <Link
            href="/espace-adherent/offres"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--gaspe-teal-600)] px-5 py-2.5 text-sm font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-600)]/5 transition-colors"
          >
            Publier une offre
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Tab Navigation                                             */
/* ------------------------------------------------------------------ */

function SectionNav({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="mb-8 -mx-4 px-4 overflow-x-auto" aria-label="Sections de la boîte à outils">
      <div className="flex gap-2 min-w-max" role="tablist">
        {TOOLKIT_SECTIONS.map((section) => {
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(section.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold font-heading whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--gaspe-teal-600)] text-white shadow-md"
                  : "bg-white text-foreground-muted hover:bg-[var(--gaspe-teal-600)]/10 hover:text-[var(--gaspe-teal-600)] border border-border-light"
              }`}
            >
              <SectionIcon icon={section.icon} className="h-4 w-4" />
              <span className="hidden sm:inline">{section.label}</span>
              <span className="sm:hidden">
                {section.label.length > 12 ? section.label.split(" ")[0] : section.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Active Section Content                                             */
/* ------------------------------------------------------------------ */

function SectionContent({ activeId }: { activeId: string }) {
  switch (activeId) {
    case "grilles-salariales":
      return <GrillesSalariales />;
    case "conges-repos":
      return <CongesRepos />;
    case "regime-enim":
      return <RegimeENIM />;
    case "accords-branche":
      return <AccordsBranche />;
    case "classifications":
      return <Classifications />;
    case "simulateur-salaire":
      return <SimulateurSalaire />;
    case "guides-employeur":
      return <GuidesEmployeur />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BoiteAOutilsPage() {
  const ref = useScrollReveal();
  const [activeSection, setActiveSection] = useState(TOOLKIT_SECTIONS[0].id);
  const currentSection = TOOLKIT_SECTIONS.find((s) => s.id === activeSection);

  // Deep-link : active l'onglet demandé par le hash (`#guides-employeur`, etc.)
  // Synchronisé à l'hydratation + sur les navigations hashchange.
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const target = TOOLKIT_SECTIONS.find((s) => s.id === hash);
      if (target) setActiveSection(target.id);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  // Reflète l'onglet actif dans le hash pour que le deep link reste partageable
  // (sans ajouter d'entrée à l'historique de navigation).
  const handleSelect = (id: string) => {
    setActiveSection(id);
    if (typeof window !== "undefined" && window.location.hash !== `#${id}`) {
      history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <>
      <FAQJsonLd items={[...CCN3228_FAQ]} />
      <CmsPageHeader
        pageId="boite-a-outils"
        defaultTitle="Boîte à outils CCN 3228"
        defaultDescription="Convention Collective Nationale du personnel navigant des passages d'eau — grilles salariales, classifications, congés, régime ENIM et simulateur."
        breadcrumbs={[{ label: "Boîte à outils" }]}
      />

      <div ref={ref} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Section tabs */}
        <SectionNav activeId={activeSection} onSelect={handleSelect} />

        {/* Section header */}
        {currentSection && (
          <div className="reveal mb-6">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {currentSection.label}
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">{currentSection.description}</p>
          </div>
        )}

        {/* Section content */}
        <div role="tabpanel" aria-label={currentSection?.label}>
          <SectionContent activeId={activeSection} />
        </div>

        {/* Sources */}
        <CollapsibleSources className="reveal mt-12">
          <ul className="space-y-2 text-xs text-foreground-muted leading-relaxed">
            <li>Convention Collective Nationale du personnel navigant des entreprises de passages d&apos;eau (CCN 3228, IDCC 3228) — Legifrance, Journal officiel</li>
            <li>Grilles salariales et classifications : avenant salarial CCN 3228, NAO 2026</li>
            <li>Taux ENIM : baremes officiels publies par la Caisse des Gens de Mer</li>
            <li>Droits a conges : articles du Code des transports (Livre V, titre V) et CCN 3228</li>
            <li>Guides employeur : fiches pratiques GASPE elaborees a partir de la CCN 3228 et du Code du travail maritime</li>
          </ul>
          <p className="mt-3 text-xs text-foreground-muted italic">
            Ces informations sont fournies a titre indicatif et ne constituent pas un conseil juridique.
          </p>
        </CollapsibleSources>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-foreground-muted">
          <p>Dernière mise à jour : {LAST_UPDATED} · Source : CCN 3228 (IDCC 3228)</p>
          <p className="mt-1">
            Pour toute question, contactez le{" "}
            <Link href="/contact" className="text-[var(--gaspe-teal-600)] hover:underline">
              secrétariat du GASPE
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
