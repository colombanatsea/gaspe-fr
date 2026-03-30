"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Formation {
  id: string;
  title: string;
  date: string;
  location: string;
  duration: string;
  capacity: number;
  organizer: string;
  description: string;
  registrations: string[];
}

const FORMATIONS_KEY = "gaspe_formations";

function readFormations(): Formation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FORMATIONS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeFormations(formations: Formation[]) {
  localStorage.setItem(FORMATIONS_KEY, JSON.stringify(formations));
}

export default function CandidatFormationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formations, setFormations] = useState<Formation[]>([]);

  useEffect(() => {
    if (!user || user.role !== "candidat") {
      router.push("/connexion");
      return;
    }
    setFormations(readFormations());
  }, [user, router]);

  if (!user || user.role !== "candidat") return null;

  const handleRegister = (formationId: string) => {
    const all = readFormations();
    const idx = all.findIndex((f) => f.id === formationId);
    if (idx >= 0) {
      if (!all[idx].registrations) all[idx].registrations = [];
      if (!all[idx].registrations.includes(user.id)) {
        all[idx].registrations.push(user.id);
        writeFormations(all);
        setFormations(readFormations());
      }
    }
  };

  const handleUnregister = (formationId: string) => {
    const all = readFormations();
    const idx = all.findIndex((f) => f.id === formationId);
    if (idx >= 0) {
      all[idx].registrations = (all[idx].registrations ?? []).filter((id) => id !== user.id);
      writeFormations(all);
      setFormations(readFormations());
    }
  };

  const myFormations = formations.filter((f) => f.registrations?.includes(user.id));
  const availableFormations = formations.filter((f) => !f.registrations?.includes(user.id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/espace-candidat" className="text-sm text-primary hover:underline mb-1 inline-block">
          &larr; Retour à l&apos;espace candidat
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Formations</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Découvrez les formations disponibles et inscrivez-vous.
        </p>
      </div>

      {/* My registrations */}
      {myFormations.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
            Mes inscriptions
            <Badge variant="teal" className="ml-2">{myFormations.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myFormations.map((f) => (
              <Card key={f.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                    <CardDescription>{f.organizer}</CardDescription>
                  </div>
                  <Badge variant="green">Inscrit</Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-foreground-muted">
                  <p className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {f.date}
                  </p>
                  <p className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {f.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {f.duration}
                  </p>
                  <p className="text-xs">{f.registrations?.length ?? 0} / {f.capacity} inscrits</p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => handleUnregister(f.id)}
                    className="rounded-lg border-2 border-red-300 px-4 py-2 text-sm font-heading font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Se désinscrire
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Available formations */}
      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
          Formations disponibles
        </h2>
        {availableFormations.length === 0 && myFormations.length === 0 ? (
          <Card>
            <p className="text-center py-6 text-foreground-muted">
              Aucune formation disponible pour le moment.
            </p>
            <p className="text-center text-sm text-foreground-muted">
              Les formations sont organisées par le GASPE et ses partenaires. Revenez bientôt.
            </p>
          </Card>
        ) : availableFormations.length === 0 ? (
          <Card>
            <p className="text-center py-6 text-foreground-muted">
              Vous êtes inscrit à toutes les formations disponibles.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableFormations.map((f) => {
              const isFull = (f.registrations?.length ?? 0) >= f.capacity;
              return (
                <Card key={f.id}>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription>{f.organizer}</CardDescription>
                  {f.description && (
                    <p className="mt-2 text-sm text-foreground-muted">{f.description}</p>
                  )}
                  <div className="mt-3 space-y-1 text-sm text-foreground-muted">
                    <p className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {f.date}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {f.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {f.duration}
                    </p>
                    <p className="text-xs">{f.registrations?.length ?? 0} / {f.capacity} inscrits</p>
                  </div>
                  <div className="mt-4">
                    {isFull ? (
                      <Badge variant="warm">Complet</Badge>
                    ) : (
                      <Button onClick={() => handleRegister(f.id)}>S&apos;inscrire</Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
