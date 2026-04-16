"use client";

import { useState, useCallback } from "react";
import { useAuth, type User } from "@/lib/auth/AuthContext";
import { parseEnmText, type ParsedEnmData } from "@/lib/enm-parser";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type WizardStep = 1 | 2 | 3 | 4;

const ENM_LOGIN = "https://enm.mes-services.mer.gouv.fr/fr/login";
const ENM_PAGES = [
  { id: "service", label: "Lignes de service", path: "/fr/univers-marin/pmr/lignes-de-service", icon: "ship", color: "teal" },
  { id: "titres", label: "Titres et brevets", path: "/fr/univers-marin/pmr/mes-titres", icon: "cert", color: "blue" },
  { id: "medical", label: "Aptitude médicale", path: "/fr/univers-marin/pmr/aptitude-medicale", icon: "heart", color: "green" },
] as const;

const STEP_LABELS = [
  "Connexion FranceConnect",
  "Copier vos données",
  "Coller et analyser",
  "Vérifier et enregistrer",
];

function StepIcon({ id }: { id: string }) {
  switch (id) {
    case "ship":
      return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 17h1l1-5h14l1 5h1M5 17l-2 4h18l-2-4" /></svg>;
    case "cert":
      return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>;
    case "heart":
      return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>;
    default:
      return null;
  }
}

export function EnmImport() {
  const { user, updateUser } = useAuth();
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [pastedText, setPastedText] = useState("");
  const [data, setData] = useState<ParsedEnmData | null>(null);
  const [copiedPages, setCopiedPages] = useState<Set<string>>(new Set());

  const preview = pastedText.trim() ? parseEnmText(pastedText) : null;
  const detectedCount = (preview?.seaService.length ?? 0) + (preview?.certificates.length ?? 0) + (preview?.medical.decision ? 1 : 0);

  const handleAnalyze = useCallback(() => {
    if (!pastedText.trim()) return;
    const parsed = parseEnmText(pastedText);
    setData(parsed);
    setWizardStep(4);
  }, [pastedText]);

  function handleSave() {
    if (!user || !data) return;
    updateUser({
      ...user,
      seaService: [...(user.seaService ?? []), ...data.seaService.map((s) => ({ ...s, source: "enm_csv" as const }))],
      structuredCertifications: [...(user.structuredCertifications ?? []), ...data.certificates.map((c) => ({
        certId: c.certId, title: c.title, enmReference: c.enmReference, status: c.status, expiryDate: c.expiryDate,
      }))],
      medicalAptitude: data.medical,
      enmMarinId: data.enmMarinId,
    } as User);
    setWizardStep(1);
    setPastedText("");
    setData(null);
    setCopiedPages(new Set());
  }

  // Already imported — show summary
  if (user?.enmMarinId && wizardStep === 1) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">Portail du marin (ENM)</h2>
            <p className="text-xs text-green-600">
              Donnees importees &mdash; N° marin {user.enmMarinId}
              &middot; {(user.seaService ?? []).filter((s) => s.source === "enm_csv").length} lignes de service
              &middot; {(user.structuredCertifications ?? []).length} titres
              {user.medicalAptitude?.decision && <> &middot; {user.medicalAptitude.decision}</>}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setWizardStep(1)}>
          Reimporter mes donnees
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#000091]/10">
          <svg className="h-5 w-5 text-[#000091]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.122a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.34 8.374" />
          </svg>
        </div>
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Importer depuis le Portail du marin</h2>
          <p className="text-xs text-foreground-muted">4 etapes simples pour recuperer vos donnees ENM</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full transition-colors ${s <= wizardStep ? "bg-[var(--gaspe-teal-600)]" : "bg-[var(--gaspe-neutral-200)]"}`} />
            <span className={`text-[10px] ${s === wizardStep ? "font-semibold text-[var(--gaspe-teal-600)]" : "text-foreground-muted"}`}>
              {STEP_LABELS[s - 1]}
            </span>
          </div>
        ))}
      </div>

      {/* ══════ STEP 1: FranceConnect ══════ */}
      {wizardStep === 1 && (
        <Card>
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#000091]/10">
              <span className="text-2xl font-bold text-[#000091]">FC</span>
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Connectez-vous au portail ENM</p>
              <p className="text-sm text-foreground-muted mt-1 max-w-md mx-auto">
                L&apos;Espace Numerique Maritime utilise FranceConnect. Cliquez ci-dessous pour vous connecter, puis revenez ici.
              </p>
            </div>
            <a
              href={ENM_LOGIN}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#000091] px-6 py-3 text-sm font-semibold text-white hover:bg-[#000091]/90 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Se connecter via FranceConnect
            </a>
            <div className="pt-2">
              <button
                onClick={() => setWizardStep(2)}
                className="text-sm text-primary font-medium hover:underline"
              >
                Je suis connecte, etape suivante &rarr;
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ══════ STEP 2: Copy data ══════ */}
      {wizardStep === 2 && (
        <Card>
          <CardTitle className="mb-4">Ouvrez et copiez chaque page</CardTitle>
          <p className="text-sm text-foreground-muted mb-4">
            Cliquez sur chaque page ci-dessous, puis faites{" "}
            <kbd className="rounded bg-[var(--gaspe-neutral-200)] px-1.5 py-0.5 text-xs font-mono">Ctrl+A</kbd>{" "}
            (tout selectionner) et{" "}
            <kbd className="rounded bg-[var(--gaspe-neutral-200)] px-1.5 py-0.5 text-xs font-mono">Ctrl+C</kbd>{" "}
            (copier).
          </p>

          <div className="space-y-3">
            {ENM_PAGES.map((page) => {
              const isCopied = copiedPages.has(page.id);
              return (
                <div key={page.id} className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${isCopied ? "border-green-300 bg-green-50" : "border-border-light"}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isCopied ? "bg-green-200 text-green-700" : `bg-[var(--gaspe-${page.color}-50)] text-[var(--gaspe-${page.color}-600)]`}`}>
                    {isCopied ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : (
                      <StepIcon id={page.icon} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{page.label}</p>
                    <p className="text-xs text-foreground-muted">Ctrl+A puis Ctrl+C sur cette page</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://enm.mes-services.mer.gouv.fr${page.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[var(--gaspe-neutral-100)] px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-[var(--gaspe-neutral-200)] transition-colors"
                    >
                      Ouvrir
                    </a>
                    <button
                      onClick={() => setCopiedPages((prev) => new Set([...prev, page.id]))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${isCopied ? "bg-green-200 text-green-800" : "bg-[var(--gaspe-teal-600)] text-white hover:bg-[var(--gaspe-teal-700)]"}`}
                    >
                      {isCopied ? "Copie !" : "J'ai copie"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setWizardStep(1)} className="text-sm text-foreground-muted hover:underline">&larr; Retour</button>
            <Button onClick={() => setWizardStep(3)}>
              Etape suivante : coller
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>
        </Card>
      )}

      {/* ══════ STEP 3: Paste ══════ */}
      {wizardStep === 3 && (
        <Card>
          <CardTitle className="mb-4">Collez vos donnees ENM</CardTitle>
          <p className="text-sm text-foreground-muted mb-3">
            Faites <kbd className="rounded bg-[var(--gaspe-neutral-200)] px-1.5 py-0.5 text-xs font-mono">Ctrl+V</kbd> dans le champ ci-dessous. Vous pouvez coller les 3 pages d&apos;un coup.
          </p>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Collez ici le contenu copie depuis vos pages ENM..."
            rows={8}
            autoFocus
            className="w-full rounded-xl border border-border-light bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          />

          {/* Live detection feedback */}
          {pastedText.trim() && (
            <div className="mt-3 rounded-lg bg-surface p-3 flex flex-wrap gap-3">
              <span className="text-xs text-foreground-muted">Detecte :</span>
              <Badge variant={preview?.seaService.length ? "teal" : "neutral"}>
                {preview?.seaService.length ?? 0} ligne{(preview?.seaService.length ?? 0) > 1 ? "s" : ""} de service
              </Badge>
              <Badge variant={preview?.certificates.length ? "blue" : "neutral"}>
                {preview?.certificates.length ?? 0} brevet{(preview?.certificates.length ?? 0) > 1 ? "s" : ""}
              </Badge>
              <Badge variant={preview?.medical.decision ? "green" : "neutral"}>
                {preview?.medical.decision ? "Aptitude med." : "Pas d'aptitude"}
              </Badge>
              {preview?.enmMarinId && <Badge variant="teal">N° {preview.enmMarinId}</Badge>}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <button onClick={() => setWizardStep(2)} className="text-sm text-foreground-muted hover:underline">&larr; Retour</button>
            <Button onClick={handleAnalyze} disabled={detectedCount === 0}>
              Analyser ({detectedCount} element{detectedCount > 1 ? "s" : ""})
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>
        </Card>
      )}

      {/* ══════ STEP 4: Review & Save ══════ */}
      {wizardStep === 4 && data && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Verification des donnees</CardTitle>
              {data.enmMarinId && <Badge variant="teal">N° marin {data.enmMarinId}</Badge>}
            </div>

            {/* Sea service */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <StepIcon id="ship" />
                Lignes de service ({data.seaService.length})
              </h4>
              {data.seaService.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border-light">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface text-left">
                        <th className="px-3 py-2 font-medium text-foreground-muted">Periode</th>
                        <th className="px-3 py-2 font-medium text-foreground-muted">Navire</th>
                        <th className="px-3 py-2 font-medium text-foreground-muted">Fonction</th>
                        <th className="px-3 py-2 font-medium text-foreground-muted">Cat.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.seaService.map((s) => (
                        <tr key={s.id} className="border-t border-border-light">
                          <td className="px-3 py-1.5 text-foreground-muted whitespace-nowrap">
                            {new Date(s.startDate).toLocaleDateString("fr-FR")} — {new Date(s.endDate).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-3 py-1.5 font-medium text-foreground">{s.vesselName} {s.vesselImo && <span className="text-foreground-muted">({s.vesselImo})</span>}</td>
                          <td className="px-3 py-1.5 text-foreground">{s.rank}</td>
                          <td className="px-3 py-1.5 text-foreground-muted">{s.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-foreground-muted italic">Aucune ligne de service detectee. Avez-vous copie la page &laquo; Lignes de service &raquo; ?</p>
              )}
            </div>

            {/* Certificates */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <StepIcon id="cert" />
                Titres et brevets ({data.certificates.length})
              </h4>
              {data.certificates.length > 0 ? (
                <div className="space-y-2">
                  {data.certificates.map((c) => (
                    <div key={c.certId} className="flex items-center justify-between rounded-lg border border-border-light px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.title}</p>
                        {c.enmReference && <p className="text-xs text-foreground-muted">N° {c.enmReference}</p>}
                      </div>
                      <Badge variant={c.status === "valid" ? "green" : "neutral"}>
                        {c.status === "valid" ? "Valide" : "Expire"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground-muted italic">Aucun titre detecte. Avez-vous copie la page &laquo; Mes titres &raquo; ?</p>
              )}
            </div>

            {/* Medical */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <StepIcon id="heart" />
                Aptitude medicale
              </h4>
              {data.medical.decision ? (
                <div className="rounded-lg border border-border-light p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={data.medical.expiryDate && new Date(data.medical.expiryDate) < new Date() ? "neutral" : "green"}>
                      {data.medical.expiryDate && new Date(data.medical.expiryDate) < new Date() ? "Expiree" : "Valide"}
                    </Badge>
                    <span className="text-sm text-foreground">{data.medical.decision}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-foreground-muted">
                    {data.medical.lastVisitDate && <p>Derniere visite : {new Date(data.medical.lastVisitDate).toLocaleDateString("fr-FR")}</p>}
                    {data.medical.expiryDate && <p>Validite : {new Date(data.medical.expiryDate).toLocaleDateString("fr-FR")}</p>}
                    {data.medical.duration && <p>Duree : {data.medical.duration}</p>}
                  </div>
                  {data.medical.restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {data.medical.restrictions.map((r) => (
                        <span key={r} className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-foreground-muted italic">Aucune donnee medicale detectee. Avez-vous copie la page &laquo; Aptitude medicale &raquo; ?</p>
              )}
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <button onClick={() => setWizardStep(3)} className="text-sm text-foreground-muted hover:underline">&larr; Modifier le texte</button>
            <Button onClick={handleSave}>
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Enregistrer dans mon profil
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
