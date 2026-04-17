"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { Formation } from "@/app/(admin)/admin/formations/page";

const FORMATIONS_KEY = "gaspe_formations";

const modalityLabel: Record<string, string> = {
  presentiel: "Présentiel",
  distanciel: "Distanciel",
  hybride: "Hybride",
};

const modalityVariant: Record<string, "teal" | "blue" | "warm"> = {
  presentiel: "teal",
  distanciel: "blue",
  hybride: "warm",
};

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

export default function AdherentFormationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "adherent") router.push("/connexion");
  }, [user, router]);

  const [initialized, setInitialized] = useState(false);
  if (!initialized && user?.role === "adherent") {
    setInitialized(true);
    setFormations(readFormations());
  }

  if (!user || user.role !== "adherent") return null;

  const handleRegister = (formationId: string) => {
    const all = readFormations();
    const idx = all.findIndex((f) => f.id === formationId);
    if (idx >= 0) {
      if (!all[idx].registrations) all[idx].registrations = [];
      if (!all[idx].registrations!.includes(user.id)) {
        all[idx].registrations!.push(user.id);
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

  function renderFormationCard(f: Formation, isRegistered: boolean) {
    const isExpanded = expanded === f.id;
    const isFull = (f.registrations?.length ?? 0) >= f.capacity;

    return (
      <Card key={f.id}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{f.title}</CardTitle>
            <CardDescription>{f.organizer}</CardDescription>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {f.modality && (
              <Badge variant={modalityVariant[f.modality]}>{modalityLabel[f.modality]}</Badge>
            )}
            {isRegistered && <Badge variant="green">Inscrit</Badge>}
          </div>
        </div>

        {f.description && (
          <p className="mt-2 text-sm text-foreground-muted line-clamp-2">{f.description}</p>
        )}

        <div className="mt-3 space-y-1 text-sm text-foreground-muted">
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(f.startDate)}{f.endDate && f.endDate !== f.startDate ? ` – ${formatDate(f.endDate)}` : ""}
          </p>
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {f.location}
          </p>
          {f.duration && (
            <p className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {f.duration}
            </p>
          )}
          <p className="text-xs">{f.registrations?.length ?? 0} / {f.capacity} inscrits — {f.price}</p>
        </div>

        {/* Expand/collapse for schedule + attachments */}
        {((f.schedule && f.schedule.length > 0) || (f.attachments && f.attachments.length > 0)) && (
          <button
            onClick={() => setExpanded(isExpanded ? null : f.id)}
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            {isExpanded ? "Masquer les détails" : "Voir calendrier et documents"}
          </button>
        )}

        {isExpanded && (
          <div className="mt-3 space-y-3 border-t border-[var(--gaspe-neutral-100)] pt-3">
            {f.schedule && f.schedule.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Calendrier</p>
                <div className="space-y-1">
                  {f.schedule.map((day, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs rounded-lg bg-[var(--gaspe-neutral-50)] px-3 py-2">
                      <span className="font-medium text-foreground w-24 shrink-0">{formatDate(day.date)}</span>
                      {day.location && <span className="text-foreground-muted">{day.location}</span>}
                      {day.visioLink && (
                        <a href={day.visioLink} target="_blank" rel="noopener noreferrer" className="text-[var(--gaspe-blue-600)] hover:underline ml-auto">
                          Rejoindre la visio
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {f.attachments && f.attachments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Documents joints</p>
                <div className="space-y-1">
                  {f.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.data}
                      download={att.name}
                      className="flex items-center gap-2 text-xs rounded-lg bg-[var(--gaspe-neutral-50)] px-3 py-2 text-primary hover:underline"
                    >
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {att.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-3">
          {isRegistered ? (
            <button
              onClick={() => handleUnregister(f.id)}
              className="rounded-lg border-2 border-red-300 px-4 py-2 text-sm font-heading font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              Se désinscrire
            </button>
          ) : isFull ? (
            <Badge variant="warm">Complet</Badge>
          ) : (
            <Button onClick={() => handleRegister(f.id)}>S&apos;inscrire</Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/espace-adherent" className="text-sm text-primary hover:underline mb-1 inline-block">
          &larr; Retour à l&apos;espace adhérent
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Formations</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Découvrez les formations disponibles et gérez vos inscriptions.
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
            {myFormations.map((f) => renderFormationCard(f, true))}
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
          </Card>
        ) : availableFormations.length === 0 ? (
          <Card>
            <p className="text-center py-6 text-foreground-muted">
              Vous êtes inscrit à toutes les formations disponibles.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableFormations.map((f) => renderFormationCard(f, false))}
          </div>
        )}
      </section>
    </div>
  );
}
