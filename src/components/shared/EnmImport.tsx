"use client";

import { useState } from "react";
import { useAuth, type User } from "@/lib/auth/AuthContext";
import { apiFetch, isApiMode } from "@/lib/api-client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface EnmSeaService {
  id: string;
  vesselName: string;
  vesselImo: string;
  rank: string;
  category: string;
  startDate: string;
  endDate: string;
}

interface EnmCertificate {
  certId: string;
  title: string;
  enmReference: string;
  status: "valid" | "expired";
  expiryDate?: string;
}

interface EnmMedical {
  visitType?: string;
  lastVisitDate?: string;
  expiryDate?: string;
  decision?: string;
  duration?: string;
  restrictions: string[];
}

interface EnmData {
  seaService: EnmSeaService[];
  certificates: EnmCertificate[];
  medical: EnmMedical;
  enmMarinId?: string;
}

type Step = "credentials" | "loading" | "review" | "done" | "error";

export function EnmImport() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<EnmData | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setStep("loading");
    setError("");

    try {
      if (isApiMode()) {
        const res = await apiFetch<{ success?: boolean; error?: string; data?: EnmData }>("/api/enm/import", {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (res.error) {
          setError(res.error);
          setStep("error");
          return;
        }
        if (res.data) {
          setData(res.data);
          setStep("review");
        }
      } else {
        // Demo mode: simulate import with sample data matching the screenshots
        await new Promise((r) => setTimeout(r, 1500));
        setData({
          enmMarinId: "20105975",
          seaService: [
            { id: "enm-1", startDate: "2017-06-08", endDate: "2017-06-17", vesselName: "ZOURITE", vesselImo: "933184", rank: "LIEUTENANT", category: "11" },
            { id: "enm-2", startDate: "2017-02-01", endDate: "2017-02-12", vesselName: "B EXPLORER 509", vesselImo: "932466", rank: "LIEUTENANT", category: "10" },
            { id: "enm-3", startDate: "2017-01-26", endDate: "2017-01-31", vesselName: "B EXPLORER 509", vesselImo: "932466", rank: "LIEUTENANT", category: "10" },
            { id: "enm-4", startDate: "2017-01-01", endDate: "2017-01-25", vesselName: "VISSOLELA 19E", vesselImo: "924396", rank: "LIEUTENANT", category: "11" },
            { id: "enm-5", startDate: "2016-12-14", endDate: "2016-12-31", vesselName: "VISSOLELA 19E", vesselImo: "924396", rank: "LIEUTENANT", category: "11" },
          ],
          certificates: [
            { certId: "enm-cert-10216913", title: "Brevet de second capitaine 3000 (2016)", enmReference: "10216913", status: "expired", expiryDate: "2021-10-23" },
            { certId: "enm-cert-10138454", title: "Chef de quart de navire de mer", enmReference: "10138454", status: "expired", expiryDate: "2019-11-16" },
            { certId: "enm-cert-10138450", title: "Brevet d'aptitude a l'exploitation des embarcations et radeaux de sauvetage", enmReference: "10138450", status: "valid" },
            { certId: "enm-cert-10091950", title: "Certificat general d'operateur", enmReference: "10091950", status: "expired", expiryDate: "2017-10-18" },
            { certId: "enm-cert-10200675", title: "Certificat d'aptitude a l'exploitation des embarcations (STCW10)", enmReference: "10200675", status: "expired", expiryDate: "2021-03-23" },
            { certId: "enm-cert-10200674", title: "Certificat de formation de base a la securite (STCW10)", enmReference: "10200674", status: "expired", expiryDate: "2021-03-23" },
          ],
          medical: {
            visitType: "Annuelle",
            lastVisitDate: "2017-04-06",
            expiryDate: "2018-04-30",
            decision: "Apte TF/TN avec restriction",
            duration: "12 mois",
            restrictions: ["Port de verres correcteurs"],
          },
        });
        setStep("review");
      }
    } catch {
      setError("Erreur de connexion au portail ENM");
      setStep("error");
    }
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
    setPassword("");
  }

  const inputClass =
    "mt-1 block w-full rounded-xl border border-border-light bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

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

      {/* Already connected */}
      {user?.enmMarinId && step === "credentials" && (
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

      {/* Step 1: Credentials */}
      {step === "credentials" && (
        <Card>
          <form onSubmit={handleConnect} className="space-y-4">
            <p className="text-sm text-foreground-muted">
              Connectez votre compte{" "}
              <a href="https://enm.mes-services.mer.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-[#000091] hover:underline font-medium">
                enm.mes-services.mer.gouv.fr
              </a>
              {" "}pour importer automatiquement vos donnees.
            </p>
            <div>
              <label className="block text-sm font-medium text-foreground">Identifiant ENM (email)</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@example.com"
                autoComplete="username"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Mot de passe ENM</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground-muted">
                Vos identifiants ne sont pas stockes. Ils sont utilises uniquement pour recuperer vos donnees.
              </p>
            </div>
            <Button type="submit">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Importer mes donnees ENM
            </Button>
          </form>
        </Card>
      )}

      {/* Loading */}
      {step === "loading" && (
        <Card>
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--gaspe-teal-600)] border-t-transparent" />
            <p className="text-sm text-foreground-muted">Connexion au portail ENM en cours...</p>
          </div>
        </Card>
      )}

      {/* Error */}
      {step === "error" && (
        <Card>
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button variant="secondary" onClick={() => setStep("credentials")}>Reessayer</Button>
        </Card>
      )}

      {/* Step 2: Review imported data */}
      {step === "review" && data && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Donnees importees</CardTitle>
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
                <p className="text-xs text-foreground-muted">Aucune ligne de service trouvee</p>
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
                <p className="text-xs text-foreground-muted">Aucune donnee d&apos;aptitude medicale trouvee</p>
              )}
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave}>Enregistrer dans mon profil</Button>
            <Button variant="secondary" onClick={() => { setStep("credentials"); setData(null); }}>Annuler</Button>
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
          <Button variant="secondary" className="mt-3" onClick={() => setStep("credentials")}>
            Reimporter
          </Button>
        </Card>
      )}
    </section>
  );
}
