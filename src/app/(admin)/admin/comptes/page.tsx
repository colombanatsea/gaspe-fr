"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type User, type UserRole, type MembershipStatus, COMPANY_ROLES } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { ALL_STAFF_PERMISSIONS, STAFF_PERMISSION_LABELS, type StaffPermission } from "@/lib/auth/types";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import { useModalA11y } from "@/lib/useModalA11y";
import { ApiAuthStore } from "@/lib/auth/api-auth-store";
import { isApiMode } from "@/lib/api-client";

const roleBadge: Record<UserRole, { label: string; variant: "teal" | "blue" | "warm" | "green" | "neutral" }> = {
  admin: { label: "Admin", variant: "teal" },
  staff: { label: "Staff GASPE", variant: "teal" },
  adherent: { label: "Adhérent", variant: "blue" },
  candidat: { label: "Candidat", variant: "warm" },
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  staff: (
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

const membershipBadge: Record<MembershipStatus, { label: string; variant: "green" | "warm" | "neutral" }> = {
  paid: { label: "Payée", variant: "green" },
  pending: { label: "En cours", variant: "warm" },
  due: { label: "Due", variant: "neutral" },
};

type FilterMode = "all" | UserRole | "archived";

export default function AdminComptesPage() {
  const { user, getAllUsers, approveUser, rejectUser, updateUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<"all" | MembershipStatus>("all");
  const [staffEditing, setStaffEditing] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    const all = await getAllUsers();
    setUsers(all);
  }, [getAllUsers]);

  // C9 — master admin actions. Visibles uniquement si le user connecté
  // est lui-même master admin ET seulement en mode API (les flags
  // is_master_admin sont en DB).
  const isCurrentUserMaster = user?.isMasterAdmin === true && isApiMode();

  async function handlePromoteAdmin(u: User) {
    if (!confirm(`Promouvoir « ${u.name} » (${u.email}) en admin ? Il aura toutes les permissions.`)) return;
    const res = await ApiAuthStore.promoteAdmin(u.id);
    if (!res.success) {
      alert(`Échec : ${res.error ?? "erreur inconnue"}`);
      return;
    }
    await refresh();
  }

  async function handleDemoteAdmin(u: User) {
    if (!confirm(`Rétrograder « ${u.name} » en staff ? Ses permissions seront effacées.`)) return;
    const res = await ApiAuthStore.demoteAdmin(u.id);
    if (!res.success) {
      alert(`Échec : ${res.error ?? "erreur inconnue"}`);
      return;
    }
    await refresh();
  }

  async function handleTransferMaster(u: User) {
    if (!confirm(
      `⚠️ TRANSFERT DU RÔLE MASTER ADMIN\n\n` +
      `Vous allez transférer votre rôle de master admin à :\n` +
      `${u.name} (${u.email})\n\n` +
      `Vous deviendrez admin secondaire et ne pourrez plus :\n` +
      `- Promouvoir/rétrograder d'autres admins\n` +
      `- Transférer à nouveau ce rôle\n\n` +
      `Action IRRÉVERSIBLE depuis votre compte. Confirmer ?`
    )) return;
    if (!confirm(`Dernière confirmation : transférer le master admin à « ${u.name} » ?`)) return;
    const res = await ApiAuthStore.transferMaster(u.id);
    if (!res.success) {
      alert(`Échec : ${res.error ?? "erreur inconnue"}`);
      return;
    }
    alert(`Transfert effectué. ${u.name} est désormais master admin.`);
    await refresh();
  }

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) { router.push("/connexion"); return; }
    startTransition(() => { void refresh(); });
  }, [user, router, refresh]);

  const handleApprove = async (id: string) => { approveUser(id); await refresh(); };
  const handleReject = async (id: string) => {
    if (confirm("Supprimer ce compte ? Cette action est irréversible.")) {
      rejectUser(id);
      await refresh();
    }
  };

  function handleSetMembership(u: User, status: MembershipStatus) {
    updateUser({ ...u, membershipStatus: status });
    refresh();
  }

  function handleArchive(u: User) {
    if (!confirm(`Archiver ${u.name} (${u.company}) ? L'adhérent perdra son accès et sera retiré du marquee et de la carte.`)) return;
    updateUser({ ...u, archived: true, approved: false });
    refresh();
  }

  function handleUnarchive(u: User) {
    updateUser({ ...u, archived: false, approved: true });
    refresh();
  }

  async function handleEditEmail(u: User) {
    const next = window.prompt(`Modifier l'email de ${u.name} (actuel : ${u.email})`, u.email);
    if (!next || next.trim() === "" || next.trim() === u.email) return;
    const trimmed = next.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      alert("Email invalide. Format attendu : prenom@domaine.fr");
      return;
    }
    const res = await ApiAuthStore.adminUpdateUserEmail(u.id, trimmed);
    if (!res.success) {
      alert(`Échec : ${res.error ?? "erreur inconnue"}`);
      return;
    }
    await refresh();
  }

  const [createOpen, setCreateOpen] = useState(false);

  const filtered = users
    .filter((u) => {
      if (filter === "archived") return u.archived;
      if (filter === "all") return !u.archived;
      return u.role === filter && !u.archived;
    })
    .filter((u) => {
      if (membershipFilter !== "all" && u.role === "adherent") {
        const ms = u.membershipStatus ?? "due";
        return ms === membershipFilter;
      }
      return true;
    })
    .filter((u) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.company ?? "").toLowerCase().includes(s);
    });

  const pendingCount = users.filter((u) => u.role === "adherent" && !u.approved && !u.archived).length;
  const archivedCount = users.filter((u) => u.archived).length;
  const adherentCount = users.filter((u) => u.role === "adherent" && !u.archived).length;
  const paidCount = users.filter((u) => u.role === "adherent" && !u.archived && u.membershipStatus === "paid").length;
  const dueCount = users.filter((u) => u.role === "adherent" && !u.archived && (u.membershipStatus === "due" || !u.membershipStatus)).length;

  if (!user || !isStaffOrAdmin(user)) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Gestion des comptes</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {users.filter((u) => !u.archived).length} compte{users.filter((u) => !u.archived).length > 1 ? "s" : ""} actifs
            {pendingCount > 0 && (
              <span className="ml-2 text-[var(--gaspe-warm-500)] font-semibold">
                – {pendingCount} en attente
              </span>
            )}
          </p>
        </div>
        {user?.role === "admin" && isApiMode() && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouveau compte
          </button>
        )}
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

      {/* Adhesion stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
          <p className="text-2xl font-bold font-heading text-foreground">{adherentCount}</p>
          <p className="text-xs text-foreground-muted">Adhérents actifs</p>
        </div>
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
          <p className="text-2xl font-bold font-heading text-[var(--gaspe-green-500)]">{paidCount}</p>
          <p className="text-xs text-foreground-muted">Adhésions payées</p>
        </div>
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
          <p className="text-2xl font-bold font-heading text-[var(--gaspe-warm-500)]">{dueCount}</p>
          <p className="text-xs text-foreground-muted">Adhésions dues</p>
        </div>
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
          <p className="text-2xl font-bold font-heading text-foreground-muted">{archivedCount}</p>
          <p className="text-xs text-foreground-muted">Archivés</p>
        </div>
      </div>

      {/* Role filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "admin", "adherent", "candidat", "archived"] as const).map((f) => {
          const count = f === "all"
            ? users.filter((u) => !u.archived).length
            : f === "archived"
              ? archivedCount
              : users.filter((u) => u.role === f && !u.archived).length;
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
              {f === "all" ? "Tous" : f === "archived" ? "Archivés" : roleBadge[f].label}
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

      {/* Membership filter (visible when adherent filter) */}
      {(filter === "adherent" || filter === "all") && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider self-center mr-1">Adhésion :</span>
          {(["all", "paid", "pending", "due"] as const).map((ms) => (
            <button
              key={ms}
              onClick={() => setMembershipFilter(ms)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                membershipFilter === ms
                  ? "bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-600)] border border-[var(--gaspe-teal-200)]"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {ms === "all" ? "Toutes" : membershipBadge[ms].label}
            </button>
          ))}
        </div>
      )}

      {/* User table */}
      <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px_200px] gap-4 px-6 py-3 bg-[var(--gaspe-neutral-50)] border-b border-[var(--gaspe-neutral-200)] text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          <span>Utilisateur</span>
          <span>Rôle</span>
          <span>Statut</span>
          <span>Adhésion</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center py-12 text-foreground-muted">Aucun compte trouvé.</p>
        ) : (
          <div className="divide-y divide-[var(--gaspe-neutral-100)]">
            {filtered.map((u) => {
              const ms = u.membershipStatus ?? "due";
              const isArchived = u.archived;
              return (
                <div key={u.id} className={`px-6 py-4 flex flex-col sm:grid sm:grid-cols-[1fr_100px_100px_100px_200px] gap-3 sm:gap-4 sm:items-center transition-colors ${isArchived ? "bg-[var(--gaspe-neutral-50)] opacity-70" : "hover:bg-[var(--gaspe-neutral-50)]/50"}`}>
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gaspe-neutral-100)] text-[var(--gaspe-neutral-500)]">
                      {roleIcons[u.role]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-foreground-muted truncate">{u.email}</p>
                      {u.company && <p className="text-xs text-foreground-muted truncate">{u.company}</p>}
                      {u.companyRole && (
                        <p className="text-xs text-[var(--gaspe-teal-600)]">
                          {COMPANY_ROLES.find((r) => r.value === u.companyRole)?.label}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex flex-col gap-1">
                    <Badge variant={roleBadge[u.role].variant}>{roleBadge[u.role].label}</Badge>
                    {u.isMasterAdmin && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--gaspe-warm-700)]">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.4h7.6z"/>
                        </svg>
                        Master
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    {isArchived ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted">
                        <span className="h-2 w-2 rounded-full bg-[var(--gaspe-neutral-400)]" />
                        Archivé
                      </span>
                    ) : u.role === "adherent" && !u.approved ? (
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

                  {/* Membership */}
                  <div>
                    {u.role === "adherent" && !isArchived ? (
                      <select
                        value={ms}
                        onChange={(e) => handleSetMembership(u, e.target.value as MembershipStatus)}
                        className="rounded-lg border border-[var(--gaspe-neutral-200)] px-2 py-1 text-xs font-semibold focus:border-[var(--gaspe-teal-400)] focus:outline-none"
                      >
                        <option value="due">Due</option>
                        <option value="pending">En cours</option>
                        <option value="paid">Payée</option>
                      </select>
                    ) : (
                      <span className="text-xs text-foreground-muted">–</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 sm:justify-end flex-wrap">
                    {isArchived ? (
                      <button
                        onClick={() => handleUnarchive(u)}
                        className="rounded-lg bg-[var(--gaspe-teal-600)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
                      >
                        Restaurer
                      </button>
                    ) : (
                      <>
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
                        {u.role === "adherent" && u.approved && (
                          <button
                            onClick={() => handleArchive(u)}
                            className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-[var(--gaspe-warm-50)] hover:text-[var(--gaspe-warm-600)] hover:border-[var(--gaspe-warm-200)] transition-colors"
                          >
                            Archiver
                          </button>
                        )}
                        {user?.role === "admin" && isApiMode() && (
                          <button
                            onClick={() => void handleEditEmail(u)}
                            className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-[var(--gaspe-teal-50)] hover:text-[var(--gaspe-teal-600)] hover:border-[var(--gaspe-teal-200)] transition-colors"
                            title="Modifier l'email"
                          >
                            Email…
                          </button>
                        )}
                        {u.role !== "admin" && u.approved !== false && (
                          <button
                            onClick={() => handleReject(u.id)}
                            className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                        {/* Maître admin uniquement : promouvoir un user en staff GASPE + accorder des permissions granulaires */}
                        {user?.role === "admin" && u.id !== user.id && (u.role === "staff" || u.role === "candidat" || u.role === "adherent") && (
                          <button
                            onClick={() => setStaffEditing(u)}
                            className="rounded-lg border border-[var(--gaspe-teal-200)] px-3.5 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
                          >
                            {u.role === "staff" ? "Modifier accès staff" : "Promouvoir staff"}
                          </button>
                        )}
                        {/* C9 — actions master admin (transfert / promotion / rétrogradation) */}
                        {isCurrentUserMaster && u.id !== user.id && (u.role === "staff" || u.role === "adherent") && (
                          <button
                            onClick={() => handlePromoteAdmin(u)}
                            className="rounded-lg border border-[var(--gaspe-warm-200)] px-3.5 py-1.5 text-xs font-semibold text-[var(--gaspe-warm-700)] hover:bg-[var(--gaspe-warm-50)] transition-colors"
                            title="Promouvoir en admin secondaire"
                          >
                            Promouvoir admin
                          </button>
                        )}
                        {isCurrentUserMaster && u.id !== user.id && u.role === "admin" && !u.isMasterAdmin && (
                          <>
                            <button
                              onClick={() => handleTransferMaster(u)}
                              className="rounded-lg border border-[var(--gaspe-warm-300)] px-3.5 py-1.5 text-xs font-semibold text-[var(--gaspe-warm-700)] hover:bg-[var(--gaspe-warm-50)] transition-colors"
                              title="Transférer votre rôle master à cet admin"
                            >
                              Transférer master
                            </button>
                            <button
                              onClick={() => handleDemoteAdmin(u)}
                              className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                              title="Rétrograder en staff"
                            >
                              Rétrograder admin
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {staffEditing && (
        <StaffPermissionsModal
          user={staffEditing}
          onClose={() => setStaffEditing(null)}
          onSave={(updated) => {
            updateUser(updated);
            setStaffEditing(null);
          }}
        />
      )}

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            void refresh();
          }}
        />
      )}
    </div>
  );
}

/* ─────────── Modal création de compte ─────────── */

interface OrgOption { id: string; name: string }

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"adherent" | "candidat" | "staff">("adherent");
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [companyRole, setCompanyRole] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { modalRef } = useModalA11y(true, onClose);

  useEffect(() => {
    // Charge les organisations actives pour le select. /api/organizations
    // est public et renvoie déjà toutes les orgs non-archivées.
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/organizations`)
      .then((r) => r.json())
      .then((data: { organizations?: OrgOption[] }) => {
        setOrgs((data.organizations ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => setOrgs([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Prénom et nom sont obligatoires.");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      setError("Un numéro de téléphone valide est obligatoire (8 chiffres minimum).");
      return;
    }
    if (role === "adherent" && !organizationId) {
      setError("Sélectionnez une compagnie pour ce compte adhérent.");
      return;
    }

    setSubmitting(true);
    const payload: Parameters<typeof ApiAuthStore.adminCreateUser>[0] = {
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      role,
      organizationId: organizationId || undefined,
      isPrimary: role === "adherent" ? isPrimary : false,
      companyRole: companyRole || undefined,
      phone: phone.trim(),
    };
    const res = await ApiAuthStore.adminCreateUser(payload);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error ?? "Erreur inconnue.");
      return;
    }
    onCreated();
  }

  const inputClass = "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="create-user-title" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-[var(--gaspe-neutral-200)] px-5 py-3">
          <h2 id="create-user-title" className="font-heading text-base font-semibold text-foreground">Nouveau compte</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-foreground-muted hover:text-foreground">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <p className="text-xs text-foreground-muted">
            Le user recevra un email avec un lien pour définir son mot de passe (valide 1 heure). Pas besoin de saisir un mot de passe ici.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">Prénom *</label>
              <input required autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Jean" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">Nom *</label>
              <input required autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Dupont" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Email *</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="prenom@compagnie.fr" />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Rôle *</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "adherent" | "candidat" | "staff")} className={inputClass}>
              <option value="adherent">Adhérent (compagnie)</option>
              <option value="staff">Staff GASPE (permissions granulaires)</option>
              <option value="candidat">Candidat (marin)</option>
            </select>
          </div>

          {(role === "adherent" || role === "staff") && (
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">
                Compagnie {role === "adherent" ? "*" : "(optionnel pour staff)"}
              </label>
              <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className={inputClass}>
                <option value="">– sélectionner –</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}

          {role === "adherent" && organizationId && (
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-border-light text-primary focus:ring-primary"
              />
              <span>
                <span className="font-semibold">Titulaire de la compagnie</span>
                <span className="block text-xs text-foreground-muted">Échouera si une autre personne est déjà titulaire actif.</span>
              </span>
            </label>
          )}

          {role === "adherent" && (
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">Fonction dans la compagnie (optionnel)</label>
              <select value={companyRole} onChange={(e) => setCompanyRole(e.target.value)} className={inputClass}>
                <option value="">– aucune –</option>
                {COMPANY_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Téléphone *</label>
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="06 12 34 56 78" />
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <span className="font-semibold">Échec : </span>{error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--gaspe-neutral-100)]">
            <button type="button" onClick={onClose} className="text-sm font-heading font-semibold text-foreground-muted hover:text-foreground">Annuler</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] disabled:opacity-60">
              {submitting ? "Création…" : "Créer le compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────── Modal accès staff (Lot 9, session 39) ─────────── */

function StaffPermissionsModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (u: User) => void;
}) {
  const [perms, setPerms] = useState<StaffPermission[]>(
    Array.isArray(user.staffPermissions) ? user.staffPermissions : [],
  );
  const [makeStaff, setMakeStaff] = useState(user.role === "staff");

  function togglePerm(p: StaffPermission) {
    setPerms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);
  }

  function handleSave() {
    onSave({
      ...user,
      role: makeStaff ? "staff" : (user.role === "staff" ? "adherent" : user.role),
      staffPermissions: makeStaff ? perms : undefined,
      approved: true,
    });
  }

  // A11y : Escape, focus trap, restore focus (session 54)
  const { modalRef } = useModalA11y(true, onClose);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-permissions-title"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-2">
          <h3 id="staff-permissions-title" className="font-heading text-lg font-bold text-foreground">Accès staff GASPE</h3>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground" aria-label="Fermer">✕</button>
        </div>
        <p className="text-sm text-foreground-muted mb-4">
          {user.name} ({user.email}) — choisissez les permissions accordées. L&apos;admin maître bypasse toutes les permissions.
        </p>
        <label className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)]">
          <input
            type="checkbox"
            checked={makeStaff}
            onChange={(e) => setMakeStaff(e.target.checked)}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Activer le rôle staff GASPE</p>
            <p className="text-xs text-foreground-muted">Donne accès à la console admin avec les permissions cochées ci-dessous.</p>
          </div>
        </label>
        <div className="space-y-1.5">
          {ALL_STAFF_PERMISSIONS.map((p) => (
            <label key={p} className={`flex items-center gap-3 p-2.5 rounded-lg border ${perms.includes(p) ? "border-[var(--gaspe-teal-300)] bg-[var(--gaspe-teal-50)]" : "border-[var(--gaspe-neutral-200)]"} ${makeStaff ? "cursor-pointer hover:bg-[var(--gaspe-neutral-50)]" : "opacity-50"}`}>
              <input
                type="checkbox"
                checked={perms.includes(p)}
                onChange={() => togglePerm(p)}
                disabled={!makeStaff}
              />
              <span className="text-sm text-foreground">{STAFF_PERMISSION_LABELS[p]}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex gap-3 justify-end pt-4 border-t border-[var(--gaspe-neutral-100)]">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground">
            Annuler
          </button>
          <button onClick={handleSave} className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-heading font-semibold hover:bg-primary-hover shadow-teal-soft hover:shadow-teal">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
