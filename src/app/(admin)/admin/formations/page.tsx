"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
  targetAudience: string;
  prerequisites: string;
  price: string;
  contactEmail: string;
  status: "open" | "closed" | "full";
}

function getFormations(): Formation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FORMATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export default function AdminFormationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    setFormations(getFormations());
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const filtered = formations.filter(
    (f) =>
      !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.organizer.toLowerCase().includes(search.toLowerCase())
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
      const nextStatus: Record<string, Formation["status"]> = {
        open: "closed",
        closed: "full",
        full: "open",
      };
      return { ...f, status: nextStatus[f.status] || "open" };
    });
    localStorage.setItem(FORMATIONS_KEY, JSON.stringify(updated));
    setFormations(updated);
  }

  const statusVariant: Record<string, "green" | "warm" | "neutral"> = {
    open: "green",
    closed: "warm",
    full: "neutral",
  };
  const statusLabel: Record<string, string> = {
    open: "Ouverte",
    closed: "Ferm\u00e9e",
    full: "Compl\u00e8te",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Formations</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {formations.length} formation{formations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button href="/admin/formations/new">
          <PlusIcon className="h-4 w-4" />
          Nouvelle formation
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1 min-w-[240px] rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border-light bg-background p-12 text-center">
          <h3 className="font-heading text-lg font-semibold text-foreground">Aucune formation</h3>
          <p className="mt-2 text-sm text-foreground-muted">Cr&eacute;ez la premi&egrave;re formation.</p>
          <div className="mt-6">
            <Button href="/admin/formations/new" variant="secondary">Cr&eacute;er une formation</Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-light bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light text-left">
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Titre</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Organisateur</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Date</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Lieu</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Capacit&eacute;</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Statut</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-border-light last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium text-foreground">{f.title}</td>
                  <td className="px-4 py-3 text-foreground-muted">{f.organizer}</td>
                  <td className="px-4 py-3 text-foreground-muted">{formatDate(f.startDate)}</td>
                  <td className="px-4 py-3 text-foreground-muted">{f.location}</td>
                  <td className="px-4 py-3 text-foreground-muted">{f.capacity} places</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[f.status]}>{statusLabel[f.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(f.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-surface-teal transition-colors"
                      >
                        Changer statut
                      </button>
                      <button
                        onClick={() => deleteFormation(f.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
