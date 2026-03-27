"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

const FORMATIONS_KEY = "gaspe_formations";

interface Formation {
  id: string;
  title: string;
  description: string;
  organizer: string;
  startDate: string;
  endDate: string;
  location: string;
  duration: string;
  capacity: number;
  enrolled?: number;
  targetAudience: string;
  prerequisites: string;
  price: string;
  contactEmail: string;
  status: "open" | "closed" | "full";
}

const SEED_FORMATIONS: Formation[] = [
  {
    id: "form-cfbs",
    title: "Certificat de Formation de Base à la Sécurité (CFBS)",
    description: "Formation réglementaire obligatoire pour tout personnel embarqué. Inclut lutte incendie, survie en mer, premiers secours et sécurité individuelle.",
    organizer: "ENSM — École Nationale Supérieure Maritime",
    startDate: "2026-05-12",
    endDate: "2026-05-16",
    location: "Le Havre",
    duration: "5 jours (35h)",
    capacity: 20,
    enrolled: 14,
    targetAudience: "Tout personnel navigant",
    prerequisites: "Aptitude médicale à la navigation",
    price: "1 200 €",
    contactEmail: "formation@ensm.fr",
    status: "open",
  },
  {
    id: "form-capitaine-200",
    title: "Brevet de Capitaine 200",
    description: "Formation au commandement de navires de moins de 200 UMS en navigation côtière. Réglementation, navigation, manœuvre, météo, anglais maritime.",
    organizer: "ENSM — Le Havre",
    startDate: "2026-06-02",
    endDate: "2026-07-11",
    location: "Le Havre",
    duration: "6 semaines",
    capacity: 16,
    enrolled: 16,
    targetAudience: "Officiers pont",
    prerequisites: "12 mois de navigation effective, CFBS valide",
    price: "4 500 €",
    contactEmail: "formation@ensm.fr",
    status: "full",
  },
  {
    id: "form-mecanicien-750",
    title: "Brevet de Mécanicien 750 kW",
    description: "Formation à la conduite et la maintenance des installations machine de navires jusqu'à 750 kW. Moteurs diesel, systèmes hydrauliques, électricité bord.",
    organizer: "ENSM — Marseille",
    startDate: "2026-09-15",
    endDate: "2026-10-24",
    location: "Marseille",
    duration: "6 semaines",
    capacity: 14,
    enrolled: 8,
    targetAudience: "Officiers machine",
    prerequisites: "6 mois de navigation, CFBS valide",
    price: "4 200 €",
    contactEmail: "formation@ensm.fr",
    status: "open",
  },
  {
    id: "form-ism",
    title: "Audit interne ISM / ISPS",
    description: "Méthodologie d'audit interne du Code ISM (gestion de la sécurité) et du Code ISPS (sûreté maritime). Préparation aux inspections FSI.",
    organizer: "Bureau Veritas Marine",
    startDate: "2026-04-22",
    endDate: "2026-04-24",
    location: "Paris (en ligne possible)",
    duration: "3 jours (21h)",
    capacity: 25,
    enrolled: 11,
    targetAudience: "DPA, responsables sécurité, capitaines",
    prerequisites: "Connaissance du Code ISM",
    price: "1 800 €",
    contactEmail: "marine.training@bureauveritas.com",
    status: "open",
  },
  {
    id: "form-transition-energetique",
    title: "Transition énergétique des flottes maritimes",
    description: "Panorama des solutions de décarbonation : GNL, hydrogène, propulsion vélique, hybridation électrique. Retours d'expérience et feuille de route IMO 2050.",
    organizer: "GASPE / Cluster Maritime Français",
    startDate: "2026-11-18",
    endDate: "2026-11-19",
    location: "Nantes",
    duration: "2 jours (14h)",
    capacity: 40,
    enrolled: 22,
    targetAudience: "Dirigeants, responsables techniques, ingénieurs navals",
    prerequisites: "Aucun",
    price: "Gratuit pour les adhérents GASPE",
    contactEmail: "contact@gaspe.fr",
    status: "open",
  },
  {
    id: "form-secours-mer",
    title: "Recyclage Premiers Secours en Mer (PSMer)",
    description: "Recyclage obligatoire tous les 5 ans. Gestes d'urgence, utilisation du DEA, hypothermie, noyade, évacuation sanitaire héliportée.",
    organizer: "Croix-Rouge Maritime",
    startDate: "2026-06-16",
    endDate: "2026-06-17",
    location: "Brest",
    duration: "2 jours (14h)",
    capacity: 18,
    enrolled: 18,
    targetAudience: "Tout personnel navigant (recyclage)",
    prerequisites: "CFBS ou PSMer initial",
    price: "650 €",
    contactEmail: "maritime@croix-rouge.fr",
    status: "full",
  },
  {
    id: "form-management-equipes",
    title: "Management d'équipage et leadership maritime",
    description: "Communication à bord, gestion des conflits, leadership en situation d'urgence, BRM (Bridge Resource Management). Conforme STCW 2010.",
    organizer: "CNAM Maritime",
    startDate: "2026-10-06",
    endDate: "2026-10-08",
    location: "Saint-Malo",
    duration: "3 jours (21h)",
    capacity: 12,
    enrolled: 5,
    targetAudience: "Capitaines, seconds capitaines, chefs mécaniciens",
    prerequisites: "Expérience de commandement",
    price: "2 100 €",
    contactEmail: "maritime@cnam.fr",
    status: "open",
  },
  {
    id: "form-ccn-3228",
    title: "Convention Collective Nationale 3228 — Mise à jour",
    description: "Séminaire sur les évolutions de la CCN 3228 applicable au transport maritime de passagers. Grilles salariales, congés, régime ENIM, accords de branche récents.",
    organizer: "GASPE",
    startDate: "2026-05-19",
    endDate: "2026-05-19",
    location: "Paris — Siège GASPE",
    duration: "1 jour (7h)",
    capacity: 50,
    enrolled: 31,
    targetAudience: "DRH, responsables paie, dirigeants adhérents",
    prerequisites: "Aucun",
    price: "Gratuit pour les adhérents GASPE",
    contactEmail: "contact@gaspe.fr",
    status: "open",
  },
];

function getFormations(): Formation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FORMATIONS_KEY);
  if (!raw) {
    // Seed on first load
    localStorage.setItem(FORMATIONS_KEY, JSON.stringify(SEED_FORMATIONS));
    return SEED_FORMATIONS;
  }
  return JSON.parse(raw);
}

export default function AdminFormationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/connexion"); return; }
    setFormations(getFormations());
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const filtered = formations.filter(
    (f) => !search || f.title.toLowerCase().includes(search.toLowerCase()) || f.organizer.toLowerCase().includes(search.toLowerCase()),
  );

  function deleteFormation(id: string) {
    if (!confirm("Supprimer cette formation ?")) return;
    const updated = formations.filter((f) => f.id !== id);
    localStorage.setItem(FORMATIONS_KEY, JSON.stringify(updated));
    setFormations(updated);
  }

  function toggleStatus(id: string) {
    const updated = formations.map((f) => {
      if (f.id !== id) return f;
      const next: Record<string, Formation["status"]> = { open: "closed", closed: "full", full: "open" };
      return { ...f, status: next[f.status] || "open" };
    });
    localStorage.setItem(FORMATIONS_KEY, JSON.stringify(updated));
    setFormations(updated);
  }

  const statusVariant: Record<string, "green" | "warm" | "neutral"> = { open: "green", closed: "warm", full: "neutral" };
  const statusLabel: Record<string, string> = { open: "Ouverte", closed: "Fermée", full: "Complète" };

  const openCount = formations.filter((f) => f.status === "open").length;
  const fullCount = formations.filter((f) => f.status === "full").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Formations</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {formations.length} formation{formations.length !== 1 ? "s" : ""}
            {openCount > 0 && <span className="text-[var(--gaspe-green-500)]"> — {openCount} ouverte{openCount > 1 ? "s" : ""}</span>}
            {fullCount > 0 && <span className="text-foreground-muted"> — {fullCount} complète{fullCount > 1 ? "s" : ""}</span>}
          </p>
        </div>
        <Link
          href="/admin/formations/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvelle formation
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre ou organisateur..."
          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white pl-10 pr-4 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        />
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gaspe-teal-50)]">
            <svg className="h-7 w-7 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Aucune formation</h3>
          <p className="mt-2 text-sm text-foreground-muted">Créez la première formation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((f) => {
            const enrolled = f.enrolled ?? 0;
            const pct = f.capacity > 0 ? Math.round((enrolled / f.capacity) * 100) : 0;

            return (
              <div key={f.id} className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6 hover:border-[var(--gaspe-teal-200)] transition-colors">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-heading text-sm font-semibold text-foreground leading-tight">{f.title}</h3>
                  <Badge variant={statusVariant[f.status]}>{statusLabel[f.status]}</Badge>
                </div>

                <p className="text-xs text-foreground-muted mb-4 line-clamp-2">{f.description}</p>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="flex items-center gap-1.5 text-foreground-muted">
                    <svg className="h-3.5 w-3.5 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    {formatDate(f.startDate)}
                  </div>
                  <div className="flex items-center gap-1.5 text-foreground-muted">
                    <svg className="h-3.5 w-3.5 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    {f.location}
                  </div>
                  <div className="text-foreground-muted">{f.duration}</div>
                  <div className="text-foreground-muted font-medium">{f.price}</div>
                </div>

                {/* Capacity bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-foreground-muted">{enrolled}/{f.capacity} inscrits</span>
                    <span className="text-[10px] font-semibold text-foreground-muted">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--gaspe-neutral-100)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-[var(--gaspe-warm-400)]" : pct >= 75 ? "bg-[var(--gaspe-warm-300)]" : "bg-[var(--gaspe-teal-400)]"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-[var(--gaspe-neutral-100)]">
                  <button
                    onClick={() => toggleStatus(f.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
                  >
                    Changer statut
                  </button>
                  <button
                    onClick={() => deleteFormation(f.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
