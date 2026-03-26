"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type User, type UserRole } from "@/lib/auth/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const roleBadge: Record<UserRole, { label: string; variant: "teal" | "blue" | "warm" | "green" | "neutral" }> = {
  admin: { label: "Admin", variant: "teal" },
  adherent: { label: "Adhérent", variant: "blue" },
  candidat: { label: "Candidat", variant: "warm" },
};

export default function AdminComptesPage() {
  const { user, getAllUsers, approveUser, rejectUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | UserRole>("all");

  const refresh = useCallback(() => {
    setUsers(getAllUsers());
  }, [getAllUsers]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    refresh();
  }, [user, router, refresh]);

  const handleApprove = (id: string) => {
    approveUser(id);
    refresh();
  };

  const handleReject = (id: string) => {
    if (confirm("Supprimer ce compte ? Cette action est irréversible.")) {
      rejectUser(id);
      refresh();
    }
  };

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);
  const pendingCount = users.filter((u) => u.role === "adherent" && !u.approved).length;

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Gestion des comptes</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {users.length} compte{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
          {pendingCount > 0 && (
            <span className="ml-2 text-amber-600 font-medium">
              ({pendingCount} en attente de validation)
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "admin", "adherent", "candidat"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-background border border-border-light text-foreground-muted hover:bg-surface"
            }`}
          >
            {f === "all" ? "Tous" : roleBadge[f].label}
            {f === "adherent" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-900">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="space-y-3">
        {filtered.map((u) => (
          <Card key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-semibold text-foreground">{u.name}</span>
                <Badge variant={roleBadge[u.role].variant}>{roleBadge[u.role].label}</Badge>
                {u.role === "adherent" && !u.approved && (
                  <Badge variant="warm">En attente</Badge>
                )}
              </div>
              <p className="text-sm text-foreground-muted mt-0.5">{u.email}</p>
              {u.company && (
                <p className="text-sm text-foreground-muted">{u.company}</p>
              )}
            </div>

            {u.role === "adherent" && !u.approved && (
              <div className="flex gap-2 shrink-0">
                <Button variant="primary" onClick={() => handleApprove(u.id)}>
                  Approuver
                </Button>
                <Button variant="secondary" onClick={() => handleReject(u.id)}>
                  Refuser
                </Button>
              </div>
            )}

            {u.role !== "admin" && u.approved !== false && (
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" onClick={() => handleReject(u.id)}>
                  Supprimer
                </Button>
              </div>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <p className="text-center py-8 text-foreground-muted">Aucun compte trouvé.</p>
        )}
      </div>
    </div>
  );
}
