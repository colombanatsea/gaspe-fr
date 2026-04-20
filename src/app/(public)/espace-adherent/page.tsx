"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const OFFERS_KEY = "gaspe_adherent_offers";
const FORMATIONS_KEY = "gaspe_formations";
const DOCUMENTS_KEY = "gaspe_documents";

export default function EspaceAdherentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [offersCount, setOffersCount] = useState(0);
  const [activeOffersCount, setActiveOffersCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [formationsCount, setFormationsCount] = useState(0);
  const [myFormationsCount, setMyFormationsCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "adherent") router.push("/connexion");
  }, [user, router]);

  const [initialized, setInitialized] = useState(false);
  if (!initialized && user?.role === "adherent") {
    setInitialized(true);
    try {
      const offers = JSON.parse(localStorage.getItem(OFFERS_KEY) ?? "[]");
      const myOffers = offers.filter((o: { ownerId: string }) => o.ownerId === user.id);
      setOffersCount(myOffers.length);
      setActiveOffersCount(myOffers.filter((o: { status: string }) => o.status === "active").length);
      const allApplications = myOffers.reduce((acc: number, o: { applications?: number }) => acc + (o.applications ?? 0), 0);
      setApplicationsCount(allApplications);
    } catch { /* empty */ }
    try {
      const formations = JSON.parse(localStorage.getItem(FORMATIONS_KEY) ?? "[]");
      setFormationsCount(formations.length);
      const myRegistrations = formations.filter((f: { registrations?: string[] }) =>
        f.registrations?.includes(user.id)
      );
      setMyFormationsCount(myRegistrations.length);
    } catch { /* empty */ }
    try {
      const documents = JSON.parse(localStorage.getItem(DOCUMENTS_KEY) ?? "[]");
      setDocumentsCount(documents.length);
    } catch { /* empty */ }
  }

  if (!user || user.role !== "adherent") return null;

  // Profile completion (weighted — same logic as profil page)
  const profileWeights = [
    { filled: !!user.name, weight: 10 },
    { filled: !!user.email, weight: 10 },
    { filled: !!user.phone, weight: 5 },
    { filled: !!user.company, weight: 10 },
    { filled: !!user.companyRole, weight: 15 },
    { filled: !!user.companyDescription, weight: 15 },
    { filled: !!user.companyEmail, weight: 5 },
    { filled: !!user.companyPhone, weight: 5 },
    { filled: !!user.companyAddress, weight: 10 },
    { filled: !!user.companyLogo, weight: 5 },
    { filled: (user.vessels ?? []).length > 0, weight: 10 },
  ];
  const totalWeight = profileWeights.reduce((s, w) => s + w.weight, 0);
  const filledWeight = profileWeights.reduce((s, w) => s + (w.filled ? w.weight : 0), 0);
  const profileCompletion = Math.round((filledWeight / totalWeight) * 100);

  const dashboardCards = [
    {
      title: "Mes offres d'emploi",
      count: offersCount,
      href: "/espace-adherent/offres",
      description: `${activeOffersCount} offre${activeOffersCount !== 1 ? "s" : ""} active${activeOffersCount !== 1 ? "s" : ""}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      title: "Mes formations",
      count: myFormationsCount,
      href: "/espace-adherent/formations",
      description: `${formationsCount} formation${formationsCount !== 1 ? "s" : ""} disponible${formationsCount !== 1 ? "s" : ""}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
    {
      title: "Documents privés",
      count: documentsCount,
      href: "/espace-adherent/documents",
      description: "Documents institutionnels et réglementaires",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      title: "Annuaire membres",
      count: null,
      href: "/espace-adherent/annuaire",
      description: "Répertoire complet des adhérents",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "Visites médicales",
      count: null,
      href: "/espace-adherent/visites-medicales",
      description: "Suivi des aptitudes de vos marins",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          <path d="M12 14h.01M8 14h.01M16 14h.01M12 18h.01M8 18h.01M16 18h.01" />
        </svg>
      ),
    },
    {
      title: "Mon équipe",
      count: null,
      href: "/espace-adherent/equipe",
      description: "Contacts de votre compagnie",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
    },
    {
      title: "Préférences",
      count: null,
      href: "/espace-adherent/preferences",
      description: "Gérer vos newsletters et notifications",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Espace Adhérent
        </h1>
        <p className="mt-1 text-foreground-muted">
          Bienvenue, <span className="font-semibold text-foreground">{user.name}</span>
          {user.company && (
            <> — <span className="text-primary font-medium">{user.company}</span></>
          )}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg bg-background p-4 shadow-sm border-l-[3px] border-l-[var(--gaspe-teal-600)]">
          <p className="text-2xl font-bold font-heading text-foreground">{activeOffersCount}</p>
          <p className="text-sm text-foreground-muted">Offres actives</p>
        </div>
        <div className="rounded-lg bg-background p-4 shadow-sm border-l-[3px] border-l-[var(--gaspe-blue-600)]">
          <p className="text-2xl font-bold font-heading text-foreground">{applicationsCount}</p>
          <p className="text-sm text-foreground-muted">Candidatures reçues</p>
        </div>
        <div className="rounded-lg bg-background p-4 shadow-sm border-l-[3px] border-l-[var(--gaspe-green-300)]">
          <p className="text-2xl font-bold font-heading text-foreground">{profileCompletion}%</p>
          <p className="text-sm text-foreground-muted">Profil complété</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Dashboard cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dashboardCards.map((card) => (
              <Link key={card.href} href={card.href} className="block group">
                <Card className="hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-teal text-primary">
                      {card.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {card.title}
                        </CardTitle>
                        {card.count !== null && (
                          <Badge variant="teal">{card.count}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-foreground-muted">{card.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company profile */}
          <Card>
            <div className="flex items-start justify-between">
              <CardTitle>Mon entreprise</CardTitle>
              <Link href="/espace-adherent/profil" className="text-xs font-semibold text-primary hover:underline">
                Modifier
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                {user.companyLogo ? (
                  <Image src={user.companyLogo} alt={`Logo ${user.company ?? ""}`} width={40} height={40} unoptimized loading="lazy" className="h-10 w-10 rounded-lg object-contain border border-[var(--gaspe-neutral-200)]" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-neutral-200)]">
                    <span className="font-heading text-sm font-bold text-[var(--gaspe-teal-600)]">{(user.company ?? "?").charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.company ?? "Non renseigné"}</p>
                  {user.companyRole && (
                    <Badge variant="teal">{user.companyRole.charAt(0).toUpperCase() + user.companyRole.slice(1)}</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Contact</p>
                <p className="text-sm text-foreground">{user.name}</p>
                <p className="text-xs text-foreground-muted">{user.email}</p>
              </div>
              {user.membershipStatus && (
                <div>
                  <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Adhésion</p>
                  <Badge variant={user.membershipStatus === "paid" ? "green" : user.membershipStatus === "pending" ? "warm" : "neutral"}>
                    {user.membershipStatus === "paid" ? "Payée" : user.membershipStatus === "pending" ? "En cours" : "Due"}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Quick links */}
          <Card>
            <CardTitle>Liens rapides</CardTitle>
            <nav className="mt-3 space-y-1">
              {[
                { label: "SSGM & Médecins agréés", href: "/ssgm" },
                { label: "Offres d'emploi", href: "/nos-compagnies-recrutent" },
                { label: "Documents publics", href: "/documents" },
                { label: "Agenda", href: "/agenda" },
                { label: "Contact GASPE", href: "/contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </Card>
        </div>
      </div>
    </div>
  );
}
