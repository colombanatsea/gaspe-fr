"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";
import { sanitizeHtml } from "@/lib/sanitize-html";

const D = (s: string) => getCmsDefault("ssgm", s);
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ssgmCenters, approvedDoctors, SSGM_REGIONS } from "@/data/ssgm";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { CollapsibleSources } from "@/components/shared/CollapsibleSources";

type ViewTab = "centres" | "medecins";

export default function SSGMPage() {
  const ref = useScrollReveal();
  const [tab, setTab] = useState<ViewTab>("centres");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const introTitle = useCmsContent("ssgm", "intro-title", D("intro-title"));
  const introP1 = useCmsContent("ssgm", "intro-paragraph1", D("intro-paragraph1"));
  const introP2 = useCmsContent("ssgm", "intro-paragraph2", D("intro-paragraph2"));

  const filteredCenters = useMemo(() => {
    return ssgmCenters.filter((c) => {
      if (regionFilter !== "all" && c.region !== regionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.region.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, regionFilter]);

  const filteredDoctors = useMemo(() => {
    return approvedDoctors.filter((d) => {
      if (regionFilter !== "all" && d.region !== regionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.city.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, regionFilter]);

  const metropoleCenters = filteredCenters.filter((c) => !["Martinique", "Guadeloupe", "Guyane", "La Réunion", "Mayotte"].includes(c.region));
  const domTomCenters = filteredCenters.filter((c) => ["Martinique", "Guadeloupe", "Guyane", "La Réunion", "Mayotte"].includes(c.region));

  return (
    <>
      <CmsPageHeader
        pageId="ssgm"
        defaultTitle="SSGM & Médecins Agréés"
        defaultDescription="Services de Santé des Gens de Mer — visites d'aptitude, suivi médical et certificats STCW."
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "SSGM & Médecins Agréés" },
        ]}
      />

      <div ref={ref} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="reveal mb-8 rounded-2xl bg-surface-teal p-6">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {introTitle}
          </h2>
          <div
            className="mt-2 text-sm text-foreground-muted leading-relaxed space-y-2"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(`${introP1}${introP2}`) }}
          />
        </div>

        {/* Stats */}
        <div className="reveal stagger-1 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl bg-background border border-border-light p-4 text-center">
            <p className="text-2xl font-bold font-heading text-primary">{ssgmCenters.length}</p>
            <p className="text-xs text-foreground-muted">Centres SSGM</p>
          </div>
          <div className="rounded-xl bg-background border border-border-light p-4 text-center">
            <p className="text-2xl font-bold font-heading text-primary">{approvedDoctors.length}</p>
            <p className="text-xs text-foreground-muted">Médecins agréés</p>
          </div>
          <div className="rounded-xl bg-background border border-border-light p-4 text-center">
            <p className="text-2xl font-bold font-heading text-primary">{SSGM_REGIONS.length}</p>
            <p className="text-xs text-foreground-muted">Régions couvertes</p>
          </div>
          <div className="rounded-xl bg-background border border-border-light p-4 text-center">
            <p className="text-2xl font-bold font-heading text-primary">5</p>
            <p className="text-xs text-foreground-muted">DOM-TOM</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("centres")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === "centres" ? "bg-primary text-white" : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
            }`}
          >
            Centres SSGM ({filteredCenters.length})
          </button>
          <button
            onClick={() => setTab("medecins")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === "medecins" ? "bg-primary text-white" : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
            }`}
          >
            Médecins agréés ({filteredDoctors.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Rechercher (ville, nom, région...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-xl border border-border-light bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-xl border border-border-light bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Toutes les régions</option>
            {SSGM_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Centres tab */}
        {tab === "centres" && (
          <div className="space-y-8">
            {/* Métropole */}
            {metropoleCenters.length > 0 && (
              <div>
                <h3 className="reveal font-heading text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                  Métropole ({metropoleCenters.length} centres)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metropoleCenters.map((center) => (
                    <Card key={center.id} className="reveal hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-teal text-primary">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm">{center.name}</CardTitle>
                          <p className="text-xs text-foreground-muted mt-0.5">{center.city}, {center.region}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5 text-xs text-foreground-muted">
                        <p>{center.address}</p>
                        <p className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                          </svg>
                          <span className="font-medium text-foreground">{center.phone}</span>
                        </p>
                        {center.email && (
                          <p className="text-primary truncate">{center.email}</p>
                        )}
                        {center.openingHours && (
                          <p className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            {center.openingHours}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* DOM-TOM */}
            {domTomCenters.length > 0 && (
              <div>
                <h3 className="reveal font-heading text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                  Outre-mer ({domTomCenters.length} centres)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {domTomCenters.map((center) => (
                    <Card key={center.id} className="reveal hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 [data-theme=dark]:bg-blue-950/30 [data-theme=dark]:text-blue-400">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm">{center.name}</CardTitle>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="blue">{center.region}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5 text-xs text-foreground-muted">
                        <p>{center.address}</p>
                        <p className="font-medium text-foreground">{center.phone}</p>
                        {center.email && <p className="text-primary truncate">{center.email}</p>}
                        {center.openingHours && <p>{center.openingHours}</p>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredCenters.length === 0 && (
              <p className="text-center py-12 text-foreground-muted">Aucun centre ne correspond à votre recherche.</p>
            )}
          </div>
        )}

        {/* Doctors tab */}
        {tab === "medecins" && (
          <div>
            {filteredDoctors.length === 0 ? (
              <p className="text-center py-12 text-foreground-muted">Aucun médecin ne correspond à votre recherche.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border-light">
                <table className="w-full text-sm">
                  <thead className="bg-surface">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-foreground-muted">Médecin</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground-muted hidden sm:table-cell">Ville</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground-muted hidden md:table-cell">Région</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground-muted hidden lg:table-cell">Jours</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground-muted">Téléphone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="border-t border-border-light/50 hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-foreground-muted sm:hidden">{doc.city}</p>
                        </td>
                        <td className="px-4 py-3 text-foreground-muted hidden sm:table-cell">{doc.city}</td>
                        <td className="px-4 py-3 hidden md:table-cell"><Badge variant="teal">{doc.region}</Badge></td>
                        <td className="px-4 py-3 text-foreground-muted hidden lg:table-cell">{doc.availableDays ?? "—"}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{doc.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sources */}
        <CollapsibleSources className="reveal mt-12">
          <ul className="space-y-2 text-xs text-foreground-muted leading-relaxed">
            <li>Direction des Affaires Maritimes (DAM) — decret n. 2015-1575 du 3 decembre 2015</li>
            <li>Code des transports, articles L5521-1 a L5521-4</li>
            <li>Convention STCW (OMI), Section A-I/9</li>
            <li>Convention du Travail Maritime (MLC 2006), Regle 1.2</li>
            <li>Annuaire des services deconcentres de l&apos;Etat en mer</li>
          </ul>
          <p className="mt-3 text-xs text-foreground-muted italic">
            Coordonnees et horaires indicatifs. Contactez le centre SSGM concerne.
          </p>
        </CollapsibleSources>

        {/* Adherent CTA */}
        <div className="reveal mt-12 rounded-2xl border-2 border-dashed border-primary/30 bg-surface-teal/50 p-8 text-center">
          <h3 className="font-heading text-xl font-bold text-foreground">
            Gérez les visites médicales de vos marins
          </h3>
          <p className="mt-2 text-sm text-foreground-muted max-w-lg mx-auto">
            En tant qu&apos;adhérent GASPE, accédez au suivi des visites médicales de vos équipages :
            calendrier, alertes d&apos;expiration, historique des certificats.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/decouvrir-espace-adherent">
              <Button variant="secondary">Découvrir l&apos;espace adhérent</Button>
            </Link>
            <Link href="/inscription/adherent">
              <Button>Demander mon adhésion</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
