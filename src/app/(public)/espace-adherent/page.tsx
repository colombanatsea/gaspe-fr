"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const privateDocuments = [
  { title: "PV Assemblée Générale 2025", type: "PV AG", date: "15/12/2025" },
  { title: "Circulaire n°2025-08 - Réglementation IMO", type: "Circulaire", date: "01/11/2025" },
  { title: "Accord branche - Salaires 2026", type: "Accord", date: "20/10/2025" },
  { title: "PV Conseil d'Administration - Octobre 2025", type: "PV CA", date: "15/10/2025" },
  { title: "Circulaire n°2025-07 - Formation STCW", type: "Circulaire", date: "01/09/2025" },
];

const memberDirectory = [
  { name: "Brittany Ferries", contact: "Jean Martin", email: "j.martin@brittanyferries.fr", phone: "02 98 XX XX XX" },
  { name: "Compagnie Océane", contact: "Marie Leroy", email: "m.leroy@oceane.fr", phone: "02 97 XX XX XX" },
  { name: "Corsica Linea", contact: "Pierre Rossi", email: "p.rossi@corsicalinea.com", phone: "04 95 XX XX XX" },
  { name: "La Méridionale", contact: "Sophie Blanc", email: "s.blanc@lameridionale.fr", phone: "04 91 XX XX XX" },
];

export default function EspaceAdherentPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
    }
  }, [user, router]);

  if (!user || user.role !== "adherent") return null;

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Mes offres d'emploi */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Mes offres d&apos;emploi
              </h2>
              <Link href="/espace-adherent/offres">
                <Button variant="secondary">Gérer mes offres</Button>
              </Link>
            </div>
            <Card>
              <p className="text-sm text-foreground-muted py-4 text-center">
                Vous n&apos;avez pas encore publié d&apos;offres d&apos;emploi.
              </p>
              <div className="text-center">
                <Link href="/espace-adherent/offres">
                  <Button variant="primary">Publier une offre</Button>
                </Link>
              </div>
            </Card>
          </section>

          {/* Documents privés */}
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
              Documents privés
            </h2>
            <div className="space-y-3">
              {privateDocuments.map((doc) => (
                <Card key={doc.title} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="neutral">{doc.type}</Badge>
                      <span className="text-xs text-foreground-muted">{doc.date}</span>
                    </div>
                  </div>
                  <button className="shrink-0 text-primary hover:text-primary-hover transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </Card>
              ))}
            </div>
          </section>

          {/* Annuaire des membres */}
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
              Annuaire des membres
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {memberDirectory.map((member) => (
                <Card key={member.name}>
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <CardDescription>{member.contact}</CardDescription>
                  <div className="mt-2 space-y-0.5 text-xs text-foreground-muted">
                    <p>{member.email}</p>
                    <p>{member.phone}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company profile */}
          <Card>
            <CardTitle>Mon entreprise</CardTitle>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Compagnie</p>
                <p className="text-sm font-semibold text-foreground">{user.company ?? "Non renseigné"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Contact</p>
                <p className="text-sm text-foreground">{user.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Email</p>
                <p className="text-sm text-foreground">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Téléphone</p>
                  <p className="text-sm text-foreground">{user.phone}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick links */}
          <Card>
            <CardTitle>Liens rapides</CardTitle>
            <nav className="mt-3 space-y-1">
              {[
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
