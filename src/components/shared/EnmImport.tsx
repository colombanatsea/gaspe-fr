"use client";

import { useState } from "react";
import { useAuth, type User } from "@/lib/auth/AuthContext";
import { parseEnmText, type ParsedEnmData } from "@/lib/enm-parser";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Step = "paste" | "loading" | "review" | "done" | "error";

const ENM_PAGES = [
  { label: "Lignes de service", path: "/fr/univers-marin/pmr/lignes-de-service" },
  { label: "Mes titres et brevets", path: "/fr/univers-marin/pmr/mes-titres" },
  { label: "Aptitude médicale", path: "/fr/univers-marin/pmr/aptitude-medicale" },
];

export function EnmImport() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<Step>("paste");
  const [pastedText, setPastedText] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<ParsedEnmData | null>(null);

  function handleParse() {
    if (!pastedText.trim()) {
      setError("Veuillez coller le contenu de vos pages ENM.");
      setStep("error");
      return;
    }

    setStep("loading");
    setError("");

    // Parse on next tick to show loading state
    setTimeout(() => {
      try {
        const parsed = parseEnmText(pastedText);
        if (parsed.seaService.length === 0 && parsed.certificates.length === 0 && !parsed.medical.decision) {
          setError("Aucune donnee trouvee dans le texte colle. Assurez-vous de copier le contenu complet des pages ENM (Ctrl+A puis Ctrl+C sur chaque page).");
          setStep("error");
          return;
        }
        setData(parsed);
        setStep("review");
      } catch {
        setError("Erreur lors de l'analyse du texte. Verifiez le contenu colle.");
        setStep("error");
      }
    }, 500);
  }

  function handleSave() {
    if (!user || !data) return;

    const seaService = data.seaService.map((s) => ({
      ...s,
      source: "enm_csv" as const,
    }));

    const structuredCertifications = data.certificates.map((c) => ({
      certId: c.certId,
      title: c.title,
      enmReference: c.enmReference,
      status: c.status,
      expiryDate: c.expiryDate,
    }));

    updateUser({
      ...user,
      seaService: [...(user.seaService ?? []), ...seaService],
      structuredCertifications: [...(user.structuredCertifications ?? []), ...structuredCertifications],
      medicalAptitude: data.medical,
      enmMarinId: data.enmMarinId,
    } as User);

    setStep("done");
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#000091]/10">
          <svg className="h-5 w-5 text-[#000091]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.122a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.34 8.374" />
          </svg>
        </div>
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Portail du marin (ENM)</h2>
          <p className="text-xs text-foreground-muted">
            Importez vos lignes de service, brevets et aptitude medicale depuis l&apos;Espace Numerique Maritime
          </p>
        </div>
      </div>

      {/* Already imported */}
      {user?.enmMarinId && step === "paste" && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">
              Compte ENM connecte &mdash; N° marin {user.enmMarinId}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              {(user.seaService ?? []).filter((s) => s.source === "enm_csv").length} lignes de service
              &middot; {(user.structuredCertifications ?? []).length} titres
              {user.medicalAptitude?.decision && <> &middot; Aptitude : {user.medicalAptitude.decision}</>}
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Instructions + paste */}
      {step === "paste" && (
        <Card>
          <div className="space-y-4">
            {/* FranceConnect instructions */}
            <div className="rounded-xl bg-[#000091]/5 border border-[#000091]/15 p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Comment importer vos donnees :</p>
              <ol className="text-sm text-foreground-muted space-y-2 list-decimal list-inside">
                <li>
                  Connectez-vous a l&apos;ENM via FranceConnect :{" "}
                  <a
                    href="https://enm.mes-services.mer.gouv.fr/fr/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#000091] font-medium hover:underline"
                  >
                    enm.mes-services.mer.gouv.fr
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </li>
                <li>Ouvrez chacune de ces pages :</li>
              </ol>
              <div className="mt-2 ml-6 space-y-1">
                {ENM_PAGES.map((page) => (
                  <a
                    key={page.path}
                    href={`https://enm.mes-services.mer.gouv.fr${page.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#000091] hover:underline py-0.5"
                  >
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    {page.label}
                  </a>
                ))}
              </div>
              <ol className="text-sm text-foreground-muted space-y-2 list-decimal list-inside mt-2" start={3}>
                <li>Sur chaque page, faites <kbd className="rounded bg-[var(--gaspe-neutral-200)] px-1.5 py-0.5 text-xs font-mono">Ctrl+A</kbd> puis <kbd className="rounded bg-[var(--gaspe-neutral-200)] px-1.5 py-0.5 text-xs font-mono">Ctrl+C</kbd></li>
                <li>Collez tout le contenu dans le champ ci-dessous</li>
              </ol>
            </div>

            {/* Paste area */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Contenu copie depuis l&apos;ENM
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Collez ici le contenu de vos pages ENM (lignes de service, titres, aptitude medicale)...&#10;&#10;Vous pouvez coller le contenu des 3 pages dans ce meme champ."
                rows={8}
                className="w-full rounded-xl border border-border-light bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
              <p className="mt-1 text-xs text-foreground-muted">
                Collez le contenu des 3 pages dans ce champ. Le systeme detectera automatiquement les lignes de service, brevets et aptitude medicale.
              </p>
            </div>

            <Button onClick={handleParse} disabled={!pastedText.trim()}>
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Analyser et importer
            </Button>
          </div>
        </Card>
      )}

      {/* Loading */}
      {step === "loading" && (
        <Card>
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--gaspe-teal-600)] border-t-transparent" />
            <p className="text-sm text-foreground-muted">Analyse du contenu en cours...</p>
          </div>
        </Card>
      )}

      {/* Error */}
      {step === "error" && (
        <Card>
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button variant="secondary" onClick={() => setStep("paste")}>Reessayer</Button>
        </Card>
      )}

      {/* Step 2: Review imported data */}
      {step === "review" && data && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Donnees detectees</CardTitle>
              {data.enmMarinId && (
                <Badge variant="teal">N° marin {data.enmMarinId}</Badge>
              )}
            </div>

            {/* Sea service */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h1l1-5h14l1 5h1M5 17l-2 4h18l-2-4" />
                </svg>
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
                      {data.seaService.slice(0, 10).map((s) => (
                        <tr key={s.id} className="border-t border-border-light">
                          <td className="px-3 py-1.5 text-foreground-muted whitespace-nowrap">
                            {new Date(s.startDate).toLocaleDateString("fr-FR")} — {new Date(s.endDate).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-3 py-1.5 font-medium text-foreground">{s.vesselName} <span className="text-foreground-muted">({s.vesselImo})</span></td>
                          <td className="px-3 py-1.5 text-foreground">{s.rank}</td>
                          <td className="px-3 py-1.5 text-foreground-muted">{s.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.seaService.length > 10 && (
                    <p className="px-3 py-2 text-xs text-foreground-muted bg-surface">+ {data.seaService.length - 10} autres lignes</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-foreground-muted">Aucune ligne de service detectee</p>
              )}
            </div>

            {/* Certificates */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
                Titres et brevets ({data.certificates.length})
              </h4>
              <div className="space-y-2">
                {data.certificates.map((c) => (
                  <div key={c.certId} className="flex items-center justify-between rounded-lg border border-border-light px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-foreground-muted">N° {c.enmReference}</p>
                    </div>
                    <Badge variant={c.status === "valid" ? "green" : "neutral"}>
                      {c.status === "valid" ? "Valide" : "Expire"}
                    </Badge>
                  </div>
                ))}
                {data.certificates.length === 0 && (
                  <p className="text-xs text-foreground-muted">Aucun titre detecte</p>
                )}
              </div>
            </div>

            {/* Medical */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
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
                    {data.medical.lastVisitDate && (
                      <p>Derniere visite : {new Date(data.medical.lastVisitDate).toLocaleDateString("fr-FR")}</p>
                    )}
                    {data.medical.expiryDate && (
                      <p>Validite : {new Date(data.medical.expiryDate).toLocaleDateString("fr-FR")}</p>
                    )}
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
                <p className="text-xs text-foreground-muted">Aucune donnee d&apos;aptitude medicale detectee</p>
              )}
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave}>Enregistrer dans mon profil</Button>
            <Button variant="secondary" onClick={() => { setStep("paste"); setData(null); }}>Modifier</Button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <Card>
          <div className="flex items-center gap-3 text-green-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <div>
              <p className="text-sm font-semibold">Donnees ENM importees avec succes</p>
              <p className="text-xs text-green-600">
                Votre profil a ete mis a jour avec vos lignes de service, brevets et aptitude medicale.
              </p>
            </div>
          </div>
          <Button variant="secondary" className="mt-3" onClick={() => { setStep("paste"); setPastedText(""); setData(null); }}>
            Reimporter
          </Button>
        </Card>
      )}
    </section>
  );
}
