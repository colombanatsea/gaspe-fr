"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  isPrivate: boolean;
  fileUrl?: string;
}

const DOCUMENTS_KEY = "gaspe_documents";

const CATEGORIES = ["Tous", "Institutionnels", "Social", "R\u00e9glementaire", "Rapports"];

const categoryVariant: Record<string, "teal" | "blue" | "warm" | "green" | "neutral"> = {
  Institutionnels: "teal",
  Social: "blue",
  "R\u00e9glementaire": "warm",
  Rapports: "green",
};

function readDocuments(): Document[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DOCUMENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function AdherentDocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
      return;
    }
    setDocuments(readDocuments());
  }, [user, router]);

  if (!user || user.role !== "adherent") return null;

  const filtered = documents.filter((doc) => {
    if (selectedCategory !== "Tous" && doc.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.description?.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/espace-adherent" className="text-sm text-primary hover:underline mb-1 inline-block">
          &larr; Retour \u00e0 l&apos;espace adh\u00e9rent
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Acc\u00e9dez aux documents institutionnels et r\u00e9glementaires r\u00e9serv\u00e9s aux adh\u00e9rents.
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un document..."
            className="block w-full rounded-lg border border-border-light bg-background pl-10 pr-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-heading font-semibold transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-white"
                  : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-center py-6 text-foreground-muted">
            {documents.length === 0
              ? "Aucun document disponible pour le moment. Les documents sont ajout\u00e9s par l\u2019administrateur."
              : "Aucun document ne correspond \u00e0 vos crit\u00e8res de recherche."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <Card key={doc.id} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">{doc.title}</CardTitle>
                {doc.description && (
                  <CardDescription>{doc.description}</CardDescription>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant={categoryVariant[doc.category] ?? "neutral"}>
                    {doc.category}
                  </Badge>
                  {doc.isPrivate && (
                    <Badge variant="warm">Priv\u00e9</Badge>
                  )}
                  <span className="text-xs text-foreground-muted">{doc.date}</span>
                </div>
              </div>
              <button
                className="shrink-0 flex items-center gap-1 text-primary hover:text-primary-hover transition-colors text-sm font-heading font-semibold"
                title="T\u00e9l\u00e9charger"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
