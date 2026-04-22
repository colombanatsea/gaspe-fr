"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { NEWSLETTER_CATEGORIES } from "@/lib/auth/types";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";

const DCms = (s: string) => getCmsDefault("decouvrir-espace-adherent", s);

/* ──────────────────────────────────────────────
   Fake data for demonstration
   ────────────────────────────────────────────── */

const DEMO_COMPANY = {
  name: "Compagnie Maritime Demo",
  role: "Dirigeant",
  city: "Saint-Malo",
  region: "Bretagne",
  email: "contact@compagnie-demo.fr",
  phone: "02 99 00 00 00",
  employees: 45,
  ships: 3,
  membershipStatus: "paid" as const,
  logo: null,
  vessels: [
    { name: "L'Émeraude", imo: "9876543", size: "499 UMS" },
    { name: "Le Corsaire", imo: "9876544", size: "200 UMS" },
    { name: "Île de Cézembre", imo: "9876545", size: "75 UMS" },
  ],
};

const DEMO_OFFERS = [
  {
    id: "1",
    title: "Capitaine 3000 UMS",
    location: "Saint-Malo",
    contractType: "CDI",
    category: "Pont",
    status: "active",
    applications: 5,
    publishedAt: "2026-03-15",
  },
  {
    id: "2",
    title: "Chef Mécanicien 750 kW",
    location: "Saint-Malo",
    contractType: "CDI",
    category: "Machine",
    status: "active",
    applications: 3,
    publishedAt: "2026-03-20",
  },
  {
    id: "3",
    title: "Matelot Pont – Saison 2026",
    location: "Dinard",
    contractType: "Saisonnier",
    category: "Pont",
    status: "draft",
    applications: 0,
    publishedAt: null,
  },
];

const DEMO_FORMATIONS = [
  {
    id: "1",
    title: "STCW – Recyclage sécurité de base",
    organizer: "CEFCM",
    category: "Sécurité",
    modality: "Présentiel",
    date: "14-18 avril 2026",
    location: "Concarneau",
    duration: "5 jours",
    price: "1 200 €",
    capacity: 12,
    enrolled: 8,
    registered: true,
  },
  {
    id: "2",
    title: "Formation SST – Sauveteur Secouriste du Travail",
    organizer: "AFPA Maritime",
    category: "Sécurité",
    modality: "Présentiel",
    date: "5-6 mai 2026",
    location: "Saint-Nazaire",
    duration: "2 jours",
    price: "450 €",
    capacity: 15,
    enrolled: 15,
    registered: false,
  },
  {
    id: "3",
    title: "Gestion d'équipage & droit social maritime",
    organizer: "GASPE Académie",
    category: "Management",
    modality: "Distanciel",
    date: "22 mai 2026",
    location: "Visioconférence",
    duration: "1 jour",
    price: "Gratuit adhérents",
    capacity: 50,
    enrolled: 12,
    registered: false,
  },
];

const DEMO_DOCUMENTS = [
  { title: "Convention Collective CCN 3228", category: "Social", date: "2026-01-15" },
  { title: "Rapport AG 2025", category: "Institutionnel", date: "2025-12-10" },
  { title: "Guide STCW 2025 – Brevets et équivalences", category: "Réglementaire", date: "2025-11-20" },
  { title: "Barème cotisations 2026", category: "Institutionnel", date: "2026-01-05" },
  { title: "Note ENIM – Mise à jour régimes", category: "Social", date: "2026-02-01" },
];

const DEMO_TEAM = [
  { name: "Jean Dupont", email: "jean.dupont@compagnie-demo.fr", role: "Dirigeant", primary: true, approved: true },
  { name: "Marie Martin", email: "marie.martin@compagnie-demo.fr", role: "Exploitation", primary: false, approved: true },
  { name: "Pierre Leroy", email: "pierre.leroy@compagnie-demo.fr", role: "Paie", primary: false, approved: true },
];

const DEMO_ANNUAIRE = [
  { name: "BreizhGo Penn Ar Bed", city: "Brest", region: "Bretagne", category: "titulaire", ships: 6 },
  { name: "Compagnie Yeu Continent", city: "Fromentine", region: "Pays de la Loire", category: "titulaire", ships: 3 },
  { name: "Direction des Transports Maritimes de la Gironde", city: "Le Verdon-sur-Mer", region: "Nouvelle-Aquitaine", category: "titulaire", ships: 3 },
  { name: "SNC Transrades", city: "Marseille", region: "PACA", category: "titulaire", ships: 7 },
  { name: "Karu'Ferry", city: "Petit-Bourg", region: "Guadeloupe", category: "titulaire", ships: 1 },
];

const DEMO_APPLICATIONS = [
  { candidate: "Lucas Bernard", offer: "Capitaine 3000 UMS", status: "interview", date: "2026-03-18" },
  { candidate: "Emma Petit", offer: "Capitaine 3000 UMS", status: "shortlisted", date: "2026-03-20" },
  { candidate: "Hugo Moreau", offer: "Chef Mécanicien 750 kW", status: "viewed", date: "2026-03-22" },
  { candidate: "Chloé Durand", offer: "Capitaine 3000 UMS", status: "pending", date: "2026-03-25" },
  { candidate: "Nathan Robert", offer: "Chef Mécanicien 750 kW", status: "pending", date: "2026-03-28" },
];

const DEMO_MEDICAL_VISITS = [
  { sailor: "Thomas Kervarrec", role: "Capitaine", type: "Renouvellement d'aptitude", date: "2026-01-15", expiry: "2028-01-15", status: "completed" as const, doctor: "Dr. Anne Petit" },
  { sailor: "Yann Le Goff", role: "Chef Mécanicien", type: "Certificat STCW", date: "2025-11-20", expiry: "2026-05-20", status: "expiring_soon" as const, doctor: "Dr. Philippe Martin" },
  { sailor: "Loïc Briand", role: "Matelot", type: "Renouvellement d'aptitude", date: "2024-06-10", expiry: "2026-06-10", status: "expiring_soon" as const, doctor: "Dr. Anne Petit" },
  { sailor: "Nolwenn Cariou", role: "Matelot", type: "Aptitude initiale", date: "2025-09-01", expiry: "2027-09-01", status: "completed" as const, doctor: "Dr. Philippe Martin" },
  { sailor: "Julien Masson", role: "Matelot saisonnier", type: "Visite de reprise", date: "2026-04-10", expiry: undefined, status: "scheduled" as const, doctor: "Dr. Anne Petit" },
];

const medicalStatusConfig: Record<string, { label: string; variant: "green" | "warm" | "neutral" | "teal" }> = {
  scheduled: { label: "Planifiée", variant: "teal" },
  completed: { label: "Valide", variant: "green" },
  expiring_soon: { label: "Expire bientôt", variant: "warm" },
  expired: { label: "Expirée", variant: "neutral" },
};

const statusConfig: Record<string, { label: string; variant: "teal" | "blue" | "warm" | "green" | "neutral" }> = {
  pending: { label: "Envoyée", variant: "neutral" },
  viewed: { label: "Vue", variant: "blue" },
  shortlisted: { label: "Présélectionné", variant: "teal" },
  interview: { label: "Entretien", variant: "warm" },
  accepted: { label: "Acceptée", variant: "green" },
  rejected: { label: "Refusée", variant: "neutral" },
};

/* ──────────────────────────────────────────────
   Demo page sections
   ────────────────────────────────────────────── */

type DemoTab = "dashboard" | "offres" | "formations" | "documents" | "annuaire" | "equipe" | "visites" | "preferences";

const TABS: { key: DemoTab; label: string }[] = [
  { key: "dashboard", label: "Tableau de bord" },
  { key: "offres", label: "Offres d'emploi" },
  { key: "formations", label: "Formations" },
  { key: "visites", label: "Visites médicales" },
  { key: "documents", label: "Documents" },
  { key: "annuaire", label: "Annuaire" },
  { key: "equipe", label: "Mon équipe" },
  { key: "preferences", label: "Préférences" },
];

function DemoBanner() {
  const bannerTitle = useCmsContent("decouvrir-espace-adherent", "banner-title", DCms("banner-title"));
  const bannerDescription = useCmsContent("decouvrir-espace-adherent", "banner-description", DCms("banner-description"));
  const ctaButton = useCmsContent("decouvrir-espace-adherent", "adhesion-cta-button", DCms("adhesion-cta-button"));
  return (
    <div className="rounded-2xl bg-gradient-to-r from-[var(--gaspe-teal-600)] to-[var(--gaspe-teal-700)] p-6 text-white mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="neutral">
              <span className="text-white">Mode Découverte</span>
            </Badge>
          </div>
          <h2 className="font-heading text-xl font-bold">{bannerTitle}</h2>
          <p className="mt-1 text-white/80 text-sm">
            {bannerDescription}
          </p>
        </div>
        <Link href="/inscription/adherent">
          <Button className="bg-white text-[var(--gaspe-teal-700)] hover:bg-white/90 whitespace-nowrap">
            {ctaButton}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function AdhesionCTA({ variant = "default" }: { variant?: "default" | "inline" | "card" }) {
  if (variant === "inline") {
    return (
      <p className="text-sm text-foreground-muted mt-4">
        Intéressé ?{" "}
        <Link href="/inscription/adherent" className="font-semibold text-primary hover:underline">
          Demander votre adhésion →
        </Link>
      </p>
    );
  }

  if (variant === "card") {
    const ctaTitle = getCmsDefault("decouvrir-espace-adherent", "adhesion-cta-title");
    const ctaDescription = getCmsDefault("decouvrir-espace-adherent", "adhesion-cta-description");
    return (
      <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-surface-teal/50 p-6 text-center">
        <p className="font-heading text-lg font-semibold text-foreground">{ctaTitle || "Prêt à rejoindre le GASPE ?"}</p>
        <p className="mt-1 text-sm text-foreground-muted">
          {ctaDescription || "Accédez à l'annuaire, aux documents privés, à la gestion d'offres d'emploi et bien plus."}
        </p>
        <Link href="/inscription/adherent" className="inline-block mt-4">
          <Button>Demander mon adhésion</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl bg-surface-teal p-4 flex items-center justify-between gap-4 flex-wrap">
      <p className="text-sm text-foreground">
        <span className="font-semibold">Accédez à ces fonctionnalités</span> en devenant adhérent du GASPE.
      </p>
      <Link href="/inscription/adherent">
        <Button>Devenir adhérent</Button>
      </Link>
    </div>
  );
}

/* ── Dashboard Tab ── */
function DashboardTab() {
  const dashboardCards = [
    { title: "Mes offres d'emploi", count: 3, desc: "2 offres actives", color: "teal" },
    { title: "Mes formations", count: 1, desc: "3 formations disponibles", color: "teal" },
    { title: "Documents privés", count: 5, desc: "Documents institutionnels et réglementaires", color: "teal" },
    { title: "Annuaire membres", count: null, desc: "Répertoire complet des adhérents", color: "teal" },
    { title: "Visites médicales", count: 5, desc: "Suivi des aptitudes de vos marins", color: "teal" },
    { title: "Mon équipe", count: 3, desc: "Contacts de votre compagnie", color: "teal" },
    { title: "Préférences", count: null, desc: "Gérer vos newsletters", color: "teal" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-background p-4 shadow-sm border-l-[3px] border-l-[var(--gaspe-teal-600)]">
            <p className="text-2xl font-bold font-heading text-foreground">2</p>
            <p className="text-sm text-foreground-muted">Offres actives</p>
          </div>
          <div className="rounded-lg bg-background p-4 shadow-sm border-l-[3px] border-l-[var(--gaspe-blue-600)]">
            <p className="text-2xl font-bold font-heading text-foreground">8</p>
            <p className="text-sm text-foreground-muted">Candidatures reçues</p>
          </div>
          <div className="rounded-lg bg-background p-4 shadow-sm border-l-[3px] border-l-[var(--gaspe-green-300)]">
            <p className="text-2xl font-bold font-heading text-foreground">85%</p>
            <p className="text-sm text-foreground-muted">Profil complété</p>
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dashboardCards.map((card) => (
            <Card key={card.title} className="hover:shadow-md transition-shadow cursor-default">
              <div className="flex items-start gap-4">
                <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-teal text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect width="20" height="14" x="2" y="7" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    {card.count !== null && <Badge variant="teal">{card.count}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">{card.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <div className="flex items-start justify-between">
            <CardTitle>Mon entreprise</CardTitle>
            <span className="text-xs text-foreground-muted italic">Démo</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-teal border border-border-light">
                <span className="font-heading text-sm font-bold text-primary">C</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{DEMO_COMPANY.name}</p>
                <Badge variant="teal">{DEMO_COMPANY.role}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Contact</p>
              <p className="text-sm text-foreground">Jean Dupont</p>
              <p className="text-xs text-foreground-muted">jean.dupont@compagnie-demo.fr</p>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Adhésion</p>
              <Badge variant="green">Payée</Badge>
            </div>
          </div>
        </Card>

        <AdhesionCTA variant="card" />
      </div>
    </div>
  );
}

/* ── Offres Tab ── */
function OffresTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Mes offres d&apos;emploi</h2>
          <p className="text-sm text-foreground-muted">Créez et gérez vos offres, suivez les candidatures.</p>
        </div>
        <Button disabled className="opacity-60 cursor-not-allowed">+ Nouvelle offre</Button>
      </div>

      {/* Offers table */}
      <div className="overflow-x-auto rounded-2xl border border-border-light">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted">Titre</th>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted hidden sm:table-cell">Contrat</th>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted hidden md:table-cell">Catégorie</th>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted">Statut</th>
              <th className="px-4 py-3 text-right font-medium text-foreground-muted">Candidatures</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_OFFERS.map((offer) => (
              <tr key={offer.id} className="border-t border-border-light/50">
                <td className="px-4 py-3 font-medium text-foreground">{offer.title}</td>
                <td className="px-4 py-3 hidden sm:table-cell"><Badge variant="blue">{offer.contractType}</Badge></td>
                <td className="px-4 py-3 hidden md:table-cell text-foreground-muted">{offer.category}</td>
                <td className="px-4 py-3">
                  <Badge variant={offer.status === "active" ? "green" : "neutral"}>
                    {offer.status === "active" ? "Active" : "Brouillon"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">{offer.applications}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Applications pipeline */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-3">Candidatures récentes</h3>
        <div className="space-y-2">
          {DEMO_APPLICATIONS.map((app, i) => (
            <div key={i} className="rounded-xl border border-border-light bg-background p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{app.candidate}</p>
                <p className="text-xs text-foreground-muted">{app.offer} – {app.date}</p>
              </div>
              <Badge variant={statusConfig[app.status]?.variant ?? "neutral"}>
                {statusConfig[app.status]?.label ?? app.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <AdhesionCTA variant="inline" />
    </div>
  );
}

/* ── Formations Tab ── */
function FormationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">Formations</h2>
        <p className="text-sm text-foreground-muted">Inscriptions aux formations maritimes et professionnelles.</p>
      </div>

      {/* My registrations */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Mes inscriptions</h3>
        {DEMO_FORMATIONS.filter((f) => f.registered).map((f) => (
          <Card key={f.id} className="mb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <Badge variant="green">Inscrit</Badge>
                </div>
                <p className="text-sm text-foreground-muted mt-1">{f.organizer} – {f.date}</p>
                <p className="text-xs text-foreground-muted">{f.location} – {f.duration} – {f.price}</p>
              </div>
              <Badge variant="teal">{f.category}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Available */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Formations disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_FORMATIONS.filter((f) => !f.registered).map((f) => (
            <Card key={f.id}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="teal">{f.category}</Badge>
                <Badge variant={f.enrolled >= f.capacity ? "warm" : "green"}>
                  {f.enrolled >= f.capacity ? "Complet" : `${f.capacity - f.enrolled} places`}
                </Badge>
              </div>
              <CardTitle className="text-base">{f.title}</CardTitle>
              <p className="text-sm text-foreground-muted mt-1">{f.organizer}</p>
              <div className="mt-3 space-y-1 text-xs text-foreground-muted">
                <p>{f.date} – {f.location}</p>
                <p>{f.duration} – {f.price}</p>
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-border-light">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min((f.enrolled / f.capacity) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1">{f.enrolled}/{f.capacity} inscrits</p>
                </div>
              </div>
              <Button disabled className="mt-3 w-full opacity-60 cursor-not-allowed text-sm">
                {f.enrolled >= f.capacity ? "Liste d'attente" : "S'inscrire"}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <AdhesionCTA />
    </div>
  );
}

/* ── Documents Tab ── */
function DocumentsTab() {
  const categories = ["Tous", "Institutionnel", "Social", "Réglementaire"];
  const [filter, setFilter] = useState("Tous");
  const filtered = filter === "Tous" ? DEMO_DOCUMENTS : DEMO_DOCUMENTS.filter((d) => d.category === filter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">Documents privés</h2>
        <p className="text-sm text-foreground-muted">Documents institutionnels réservés aux adhérents.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === cat
                ? "bg-primary text-white"
                : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((doc, i) => (
          <div key={i} className="rounded-xl border border-border-light bg-background p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-muted">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{doc.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="blue">{doc.category}</Badge>
                  <span className="text-xs text-foreground-muted">{doc.date}</span>
                </div>
              </div>
            </div>
            <Button disabled className="opacity-60 cursor-not-allowed text-xs">Télécharger</Button>
          </div>
        ))}
      </div>

      <AdhesionCTA variant="inline" />
    </div>
  );
}

/* ── Annuaire Tab ── */
function AnnuaireTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">Annuaire des adhérents</h2>
        <p className="text-sm text-foreground-muted">Retrouvez les coordonnées de toutes les compagnies membres du GASPE.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_ANNUAIRE.map((m, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-teal border border-border-light">
                <span className="font-heading text-sm font-bold text-primary">{m.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                <p className="text-xs text-foreground-muted">{m.city}, {m.region}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={m.category === "titulaire" ? "teal" : "blue"}>
                {m.category === "titulaire" ? "Titulaire" : "Associé"}
              </Badge>
              <span className="text-xs text-foreground-muted">{m.ships} navires</span>
            </div>
          </Card>
        ))}

        {/* Placeholder for more */}
        <div className="rounded-2xl border-2 border-dashed border-border-light bg-surface/50 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold text-foreground-muted">+22</p>
          <p className="text-sm text-foreground-muted">autres adherents GASPE</p>
        </div>
      </div>

      <AdhesionCTA />
    </div>
  );
}

/* ── Equipe Tab ── */
function EquipeTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">Mon équipe</h2>
        <p className="text-sm text-foreground-muted">Gérez les contacts de votre compagnie et invitez de nouveaux collaborateurs.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border-light">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted">Nom</th>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted">Email</th>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted hidden sm:table-cell">Fonction</th>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_TEAM.map((member, i) => (
              <tr key={i} className="border-t border-border-light/50">
                <td className="px-4 py-3 font-medium text-foreground">
                  {member.name}
                  {member.primary && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      Responsable
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-foreground-muted">{member.email}</td>
                <td className="px-4 py-3 text-foreground-muted hidden sm:table-cell">{member.role}</td>
                <td className="px-4 py-3">
                  <Badge variant={member.primary ? "teal" : "neutral"}>
                    {member.primary ? "Responsable" : "Contact"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite section */}
      <Card>
        <CardTitle>Inviter un collaborateur</CardTitle>
        <p className="text-sm text-foreground-muted mt-1">
          En tant que responsable, invitez vos collaborateurs à rejoindre l&apos;espace GASPE de votre compagnie.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input disabled placeholder="Email" className="rounded-xl border border-border-light bg-surface px-3 py-2 text-sm opacity-60" />
          <input disabled placeholder="Nom (optionnel)" className="rounded-xl border border-border-light bg-surface px-3 py-2 text-sm opacity-60" />
          <Button disabled className="opacity-60 cursor-not-allowed">Envoyer l&apos;invitation</Button>
        </div>
      </Card>

      <AdhesionCTA variant="inline" />
    </div>
  );
}

/* ── Visites Médicales Tab ── */
function VisitesTab() {
  const expiring = DEMO_MEDICAL_VISITS.filter((v) => v.status === "expiring_soon").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Visites médicales</h2>
          <p className="text-sm text-foreground-muted">Suivi des aptitudes médicales de vos marins.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/ssgm">
            <Button variant="secondary">Annuaire SSGM</Button>
          </Link>
          <Button disabled className="opacity-60 cursor-not-allowed">+ Ajouter</Button>
        </div>
      </div>

      {expiring > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 [data-theme=dark]:bg-red-950/30 [data-theme=dark]:border-red-800 [data-theme=dark]:text-red-400">
          {expiring} visite{expiring > 1 ? "s" : ""} expire{expiring > 1 ? "nt" : ""} dans moins de 60 jours
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-background border border-border-light p-3 text-center">
          <p className="text-xl font-bold font-heading text-foreground">{DEMO_MEDICAL_VISITS.length}</p>
          <p className="text-xs text-foreground-muted">Total</p>
        </div>
        <div className="rounded-xl bg-background border border-border-light p-3 text-center">
          <p className="text-xl font-bold font-heading text-green-600">{DEMO_MEDICAL_VISITS.filter((v) => v.status === "completed").length}</p>
          <p className="text-xs text-foreground-muted">Valides</p>
        </div>
        <div className="rounded-xl bg-background border border-border-light p-3 text-center">
          <p className="text-xl font-bold font-heading text-amber-600">{expiring}</p>
          <p className="text-xs text-foreground-muted">Expirent bientôt</p>
        </div>
        <div className="rounded-xl bg-background border border-border-light p-3 text-center">
          <p className="text-xl font-bold font-heading text-primary">{DEMO_MEDICAL_VISITS.filter((v) => v.status === "scheduled").length}</p>
          <p className="text-xs text-foreground-muted">Planifiées</p>
        </div>
      </div>

      {/* Visits list */}
      <div className="space-y-3">
        {DEMO_MEDICAL_VISITS.map((visit, i) => {
          const sConfig = medicalStatusConfig[visit.status];
          return (
            <div key={i} className="rounded-xl border border-border-light bg-background p-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{visit.sailor}</p>
                  <span className="text-xs text-foreground-muted">– {visit.role}</span>
                  <Badge variant={sConfig.variant}>{sConfig.label}</Badge>
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  {visit.type} – {visit.date}
                  {visit.expiry && <> – Expire le {visit.expiry}</>}
                </p>
                <p className="text-xs text-foreground-muted">{visit.doctor}</p>
              </div>
            </div>
          );
        })}
      </div>

      <AdhesionCTA variant="inline" />
    </div>
  );
}

/* ── Preferences Tab ── */
function PreferencesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">Préférences newsletter</h2>
        <p className="text-sm text-foreground-muted">Choisissez les catégories de newsletter que vous souhaitez recevoir.</p>
      </div>

      <div className="space-y-3">
        {NEWSLETTER_CATEGORIES.map((cat, i) => (
          <div key={cat.key} className="rounded-xl border border-border-light bg-background p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{cat.label}</p>
              {cat.adherentOnly && <Badge variant="blue">Réservé adhérents</Badge>}
            </div>
            <button
              className={`relative h-6 w-11 rounded-full transition-colors ${
                i < 4 ? "bg-primary" : "bg-border-light"
              }`}
              disabled
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  i < 4 ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <AdhesionCTA variant="card" />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────── */

export default function DecouvrirEspaceAdherentPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>("dashboard");

  return (
    <>
      <CmsPageHeader
        pageId="decouvrir-espace-adherent"
        defaultTitle="Découvrir l'Espace Adhérent"
        defaultDescription="Aperçu complet des fonctionnalités réservées aux adhérents du GASPE."
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Découvrir l'espace adhérent" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DemoBanner />

        {/* Tab navigation */}
        <div className="mb-8 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max border-b border-border-light pb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-background border border-border-light border-b-background text-primary -mb-px"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "offres" && <OffresTab />}
        {activeTab === "formations" && <FormationsTab />}
        {activeTab === "visites" && <VisitesTab />}
        {activeTab === "documents" && <DocumentsTab />}
        {activeTab === "annuaire" && <AnnuaireTab />}
        {activeTab === "equipe" && <EquipeTab />}
        {activeTab === "preferences" && <PreferencesTab />}
      </div>
    </>
  );
}
