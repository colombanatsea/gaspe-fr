"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { NEWSLETTER_CATEGORIES } from "@/lib/auth/types";
import { isApiMode } from "@/lib/api-client";
import { isStaffOrAdmin } from "@/lib/auth/permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface SubscriberRow {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: "admin" | "adherent" | "candidat";
  status: "pending" | "approved" | "rejected";
  brevo_synced_at?: string | null;
  preferences_updated_at?: string | null;
  // 10 catégories canoniques (colonnes D1 – matchent NEWSLETTER_CATEGORIES)
  info_generales?: number | null;
  ag?: number | null;
  emploi?: number | null;
  formation_opco?: number | null;
  veille_juridique?: number | null;
  veille_sociale?: number | null;
  veille_surete?: number | null;
  veille_data?: number | null;
  veille_environnement?: number | null;
  actualites_gaspe?: number | null;
}

interface LegacyRow {
  email: string;
  subscribed_at?: string;
}

interface ApiResponse {
  users: SubscriberRow[];
  legacy: LegacyRow[];
  counts: Record<string, number>;
  totalUsers: number;
  totalLegacy: number;
  error?: string;
}

const CATEGORY_COL_KEYS = [
  "info_generales",
  "ag",
  "emploi",
  "formation_opco",
  "veille_juridique",
  "veille_sociale",
  "veille_surete",
  "veille_data",
  "veille_environnement",
  "actualites_gaspe",
] as const;

type CategoryKey = (typeof CATEGORY_COL_KEYS)[number];

// Map catégorie D1 key → label court (aligné sur NEWSLETTER_CATEGORIES)
const CATEGORY_LABELS: Record<CategoryKey, string> = {
  info_generales: "Infos Générales",
  ag: "AG",
  emploi: "Emploi",
  formation_opco: "Formation",
  veille_juridique: "Juridique",
  veille_sociale: "Sociale",
  veille_surete: "Sûreté",
  veille_data: "Data",
  veille_environnement: "Environnement",
  actualites_gaspe: "Actualités",
};

type SyncStatus = "synced" | "out-of-sync" | "pending";

function getSyncStatus(u: SubscriberRow): SyncStatus {
  if (!u.brevo_synced_at) return "pending";
  if (u.preferences_updated_at && u.preferences_updated_at > u.brevo_synced_at) return "out-of-sync";
  return "synced";
}

const SYNC_BADGE: Record<SyncStatus, { label: string; tone: string; symbol: string }> = {
  synced:       { label: "Synced",       tone: "text-[var(--gaspe-green-600)]", symbol: "●" },
  "out-of-sync":{ label: "Désynchronisé",tone: "text-[var(--gaspe-warm)]",       symbol: "●" },
  pending:      { label: "Non synchronisé", tone: "text-[var(--gaspe-neutral-400)]", symbol: "○" },
};

function csvEscape(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AdminNewsletterSubscribersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<CategoryKey | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) {
      router.push("/connexion");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) return;
    if (!isApiMode() || !API_URL) {
      startTransition(() => {
        setLoading(false);
        setError("Mode démo : pas d'abonnés à afficher. Activez NEXT_PUBLIC_API_URL pour voir la prod.");
      });
      return;
    }
    const token = localStorage.getItem("gaspe_api_token");
    fetch(`${API_URL}/api/newsletter/subscribers`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError("Erreur réseau lors du chargement des abonnés."))
      .finally(() => setLoading(false));
  }, [user]);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.users.filter((u) => {
      if (filterCategory !== "all" && u[filterCategory] !== 1) return false;
      if (!q) return true;
      const hay = `${u.email} ${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, filterCategory, search]);

  function exportCsv() {
    if (!data) return;
    const headers = ["email", "prenom", "nom", "role", "statut", "brevo_sync", "brevo_synced_at", ...CATEGORY_COL_KEYS];
    const lines = [headers.map(csvEscape).join(",")];
    for (const u of filteredUsers) {
      const row = [
        u.email, u.first_name ?? "", u.last_name ?? "", u.role, u.status,
        getSyncStatus(u), u.brevo_synced_at ?? "",
        ...CATEGORY_COL_KEYS.map((k) => (u[k] === 1 ? "oui" : "non")),
      ];
      lines.push(row.map(csvEscape).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abonnes-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!user || !isStaffOrAdmin(user)) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Abonnés newsletter</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Liste dynamique des inscrits, filtrable par catégorie. Inclut les utilisateurs authentifiés
            (préférences granulaires) et les inscrits publics (email seul).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/newsletter"
            className="text-sm text-foreground-muted hover:text-primary underline"
          >
            ← Envoi rapide
          </Link>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exporter CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl bg-background border border-border-light p-6 text-sm text-foreground-muted">
          Chargement…
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Counts par catégorie */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {NEWSLETTER_CATEGORIES.map((cat) => {
              const count = data.counts[cat.key] ?? 0;
              return (
                <button
                  key={cat.key}
                  onClick={() => setFilterCategory(cat.key as CategoryKey)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    filterCategory === cat.key
                      ? "border-primary bg-surface-teal ring-1 ring-primary"
                      : "border-border-light bg-background hover:border-primary/30"
                  }`}
                >
                  <p className="font-heading text-xl font-bold text-foreground">{count}</p>
                  <p className="mt-0.5 text-xs text-foreground-muted line-clamp-2">{cat.label}</p>
                </button>
              );
            })}
          </div>

          {/* Barre outils */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par email ou nom…"
              className="flex-1 min-w-[200px] rounded-xl border border-border-light bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setFilterCategory("all")}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                filterCategory === "all"
                  ? "bg-primary text-white"
                  : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
              }`}
            >
              Tous ({data.totalUsers})
            </button>
          </div>

          {/* Table utilisateurs */}
          <div className="rounded-2xl bg-background border border-border-light overflow-hidden">
            <div className="border-b border-border-light px-4 py-3">
              <p className="font-heading text-sm font-semibold text-foreground">
                Utilisateurs authentifiés <span className="text-foreground-muted font-normal">({filteredUsers.length} / {data.totalUsers})</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border-light">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Email</th>
                    <th className="px-3 py-2 text-left font-semibold">Nom</th>
                    <th className="px-3 py-2 text-left font-semibold">Rôle</th>
                    <th className="px-2 py-2 text-center font-semibold" title="Statut de synchronisation Brevo">Brevo</th>
                    {CATEGORY_COL_KEYS.map((k) => (
                      <th key={k} className="px-2 py-2 text-center font-semibold text-[11px]" title={CATEGORY_LABELS[k]}>
                        {CATEGORY_LABELS[k]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4 + CATEGORY_COL_KEYS.length} className="px-3 py-6 text-center text-foreground-muted">
                        Aucun abonné ne correspond au filtre.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((u) => {
                    const sync = getSyncStatus(u);
                    const badge = SYNC_BADGE[sync];
                    return (
                    <tr key={u.id} className="border-b border-border-light/60 hover:bg-surface/50">
                      <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                      <td className="px-3 py-2">{[u.first_name, u.last_name].filter(Boolean).join(" ") || "–"}</td>
                      <td className="px-3 py-2">
                        <Badge variant={u.role === "admin" ? "teal" : u.role === "adherent" ? "blue" : "warm"}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-center" title={badge.label}>
                        <span className={`text-base ${badge.tone}`} aria-label={badge.label}>{badge.symbol}</span>
                      </td>
                      {CATEGORY_COL_KEYS.map((k) => (
                        <td key={k} className="px-2 py-2 text-center">
                          {u[k] === 1 ? (
                            <span className="text-[var(--gaspe-green-600)]" aria-label="Abonné">✓</span>
                          ) : (
                            <span className="text-[var(--gaspe-neutral-400)]" aria-label="Non abonné">·</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legacy emails */}
          {data.legacy.length > 0 && (
            <div className="rounded-2xl bg-background border border-border-light overflow-hidden">
              <div className="border-b border-border-light px-4 py-3">
                <p className="font-heading text-sm font-semibold text-foreground">
                  Inscrits publics <span className="text-foreground-muted font-normal">({data.totalLegacy})</span>
                </p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Inscrits via le formulaire du footer, sans préférences granulaires.
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <ul className="divide-y divide-border-light/60">
                  {data.legacy.map((l) => (
                    <li key={l.email} className="px-4 py-2 flex items-center justify-between">
                      <span className="font-mono text-xs">{l.email}</span>
                      {l.subscribed_at && (
                        <span className="text-[11px] text-foreground-muted">
                          {new Date(l.subscribed_at).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
