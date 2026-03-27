"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type User, type UserRole } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";

const roleBadge: Record<UserRole, { label: string; variant: "teal" | "blue" | "warm" | "green" | "neutral" }> = {
  admin: { label: "Admin", variant: "teal" },
  adherent: { label: "Adhérent", variant: "blue" },
  candidat: { label: "Candidat", variant: "warm" },
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  adherent: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  candidat: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
};

export default function AdminComptesPage() {
  const { user, getAllUsers, approveUser, rejectUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | UserRole>("all");
  const [search, setSearch] = useState("");

  const refresh = useCallback(() => {
    setUsers(getAllUsers());
  }, [getAllUsers]);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/connexion"); return; }
    refresh();
  }, [user, router, refresh]);

  const handleApprove = (id: string) => { approveUser(id); refresh(); };
  const handleReject = (id: string) => {
    if (confirm("Supprimer ce compte ? Cette action est irréversible.")) {
      rejectUser(id);
      refresh();
    }
  };

  const filtered = users
    .filter((u) => filter === "all" || u.role === filter)
    .filter((u) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.company ?? "").toLowerCase().includes(s);
    });

  const pendingCount = users.filter((u) => u.role === "adherent" && !u.approved).length;

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Gestion des comptes</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {users.length} compte{users.length > 1 ? "s" : ""}
            {pendingCount > 0 && (
              <span className="ml-2 text-[var(--gaspe-warm-500)] font-semibold">
                — {pendingCount} en attente
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un compte..."
            className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white pl-10 pr-4 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
          />
        </div>
      </div>

      {/* Role filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "admin", "adherent", "candidat"] as const).map((f) => {
          const count = f === "all" ? users.length : users.filter((u) => u.role === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
                filter === f
                  ? "bg-[var(--gaspe-teal-600)] text-white shadow-sm"
                  : "bg-white border border-[var(--gaspe-neutral-200)] text-foreground-muted hover:bg-[var(--gaspe-neutral-50)]"
              }`}
            >
              {f === "all" ? "Tous" : roleBadge[f].label}
              <span className={`text-xs rounded-lg px-1.5 py-0.5 font-bold ${
                filter === f ? "bg-white/20 text-white" : "bg-[var(--gaspe-neutral-100)] text-foreground-muted"
              }`}>
                {count}
              </span>
              {f === "adherent" && pendingCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-[var(--gaspe-warm-400)] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* User table */}
      <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_120px_140px_160px] gap-4 px-6 py-3 bg-[var(--gaspe-neutral-50)] border-b border-[var(--gaspe-neutral-200)] text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          <span>Utilisateur</span>
          <span>Rôle</span>
          <span>Statut</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center py-12 text-foreground-muted">Aucun compte trouvé.</p>
        ) : (
          <div className="divide-y divide-[var(--gaspe-neutral-100)]">
            {filtered.map((u) => (
              <div key={u.id} className="px-6 py-4 flex flex-col sm:grid sm:grid-cols-[1fr_120px_140px_160px] gap-3 sm:gap-4 sm:items-center hover:bg-[var(--gaspe-neutral-50)]/50 transition-colors">
                {/* User info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gaspe-neutral-100)] text-[var(--gaspe-neutral-500)]">
                    {roleIcons[u.role]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-semibold text-foreground truncate">{u.name}</p>
                    <p className="text-xs text-foreground-muted truncate">{u.email}</p>
                    {u.company && (
                      <p className="text-xs text-foreground-muted truncate">{u.company}</p>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div>
                  <Badge variant={roleBadge[u.role].variant}>{roleBadge[u.role].label}</Badge>
                </div>

                {/* Status */}
                <div>
                  {u.role === "adherent" && !u.approved ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gaspe-warm-500)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--gaspe-warm-400)] animate-pulse" />
                      En attente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gaspe-green-500)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--gaspe-green-400)]" />
                      Actif
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:justify-end">
                  {u.role === "adherent" && !u.approved && (
                    <>
                      <button
                        onClick={() => handleApprove(u.id)}
                        className="rounded-lg bg-[var(--gaspe-teal-600)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        Refuser
                      </button>
                    </>
                  )}
                  {u.role !== "admin" && u.approved !== false && (
                    <button
                      onClick={() => handleReject(u.id)}
                      className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
