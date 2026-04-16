"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

const POSITIONS_KEY = "gaspe_positions";

interface Position {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: "Position" | "Communiqué de presse" | "Actualité";
  date: string;
  coverImageUrl: string;
  published: boolean;
  tags: string[];
  attachmentUrl?: string;
}

function getPositions(): Position[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(POSITIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export default function AdminPositionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>(getPositions);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const filtered = positions.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category === filterCat;
    return matchSearch && matchCat;
  });

  function togglePublish(id: string) {
    const updated = positions.map((p) =>
      p.id === id ? { ...p, published: !p.published } : p
    );
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(updated));
    setPositions(updated);
  }

  function deletePosition(id: string) {
    if (!confirm("Supprimer cet article ?")) return;
    const updated = positions.filter((p) => p.id !== id);
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(updated));
    setPositions(updated);
  }

  const catVariant: Record<string, "teal" | "blue" | "warm"> = {
    Position: "teal",
    "Communiqué de presse": "blue",
    "Actualité": "warm",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Positions &amp; Presse</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {positions.length} article{positions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button href="/admin/positions/new">
          <PlusIcon className="h-4 w-4" />
          Nouvelle position
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1 min-w-[240px] rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">Toutes les cat&eacute;gories</option>
          <option value="Position">Position</option>
          <option value="Communiqu&eacute; de presse">Communiqu&eacute; de presse</option>
          <option value="Actualit&eacute;">Actualit&eacute;</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-12 text-center">
          <h3 className="font-heading text-lg font-semibold text-foreground">Aucun article</h3>
          <p className="mt-2 text-sm text-foreground-muted">Cr&eacute;ez votre premier article.</p>
          <div className="mt-6">
            <Button href="/admin/positions/new" variant="secondary">Cr&eacute;er un article</Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] text-left">
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Titre</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Cat&eacute;gorie</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Tags</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[var(--gaspe-neutral-100)] last:border-0 hover:bg-[var(--gaspe-neutral-50)]/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={catVariant[p.category] || "neutral"}>{p.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-foreground-muted">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map((t) => (
                        <span key={t} className="inline-block rounded bg-surface px-2 py-0.5 text-xs text-foreground-muted">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.published ? "green" : "warm"}>
                      {p.published ? "Publié" : "Brouillon"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePublish(p.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
                      >
                        {p.published ? "Dépublier" : "Publier"}
                      </button>
                      <button
                        onClick={() => deletePosition(p.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
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
