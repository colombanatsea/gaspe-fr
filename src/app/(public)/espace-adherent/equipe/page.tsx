"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiAuthStore } from "@/lib/auth/api-auth-store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isApiMode } from "@/lib/auth/auth-store";
import type { User, Invitation } from "@/lib/auth/types";

const inputClass =
  "mt-1 block w-full rounded-xl border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function EquipePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", orgRole: "" });
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [loading, setLoading] = useState(() => isApiMode());

  const orgId = user?.organizationId;
  const isPrimary = user?.isPrimary;

  const refresh = useCallback(async () => {
    if (!orgId) return;
    const { contacts: c } = await ApiAuthStore.fetchOrganization(orgId);
    setContacts(c);
    if (isPrimary) {
      const inv = await ApiAuthStore.fetchInvitations(orgId);
      setInvitations(inv);
    }
    setLoading(false);
  }, [orgId, isPrimary]);

  useEffect(() => {
    if (!user || user.role !== "adherent") { router.push("/connexion"); }
  }, [user, router]);

  useEffect(() => {
    if (!isApiMode() || !orgId) return;
    let cancelled = false;
    ApiAuthStore.fetchOrganization(orgId).then(({ contacts: c }) => {
      if (cancelled) return;
      setContacts(c);
      if (!isPrimary) { setLoading(false); return; }
      ApiAuthStore.fetchInvitations(orgId).then((inv) => {
        if (!cancelled) { setInvitations(inv); setLoading(false); }
      });
    });
    return () => { cancelled = true; };
  }, [orgId, isPrimary]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setInviteError("");
    setInviteSuccess("");

    const result = await ApiAuthStore.inviteContact(orgId, {
      email: inviteForm.email,
      name: inviteForm.name || undefined,
      orgRole: inviteForm.orgRole || undefined,
    });

    if (!result.success) {
      setInviteError(result.error ?? "Erreur lors de l'envoi.");
      return;
    }

    setInviteSuccess(`Invitation envoyée à ${inviteForm.email}`);
    setInviteForm({ email: "", name: "", orgRole: "" });
    setShowInviteForm(false);
    refresh();
  };

  if (!user || user.role !== "adherent") return null;

  if (!isApiMode()) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Mon équipe</h1>
        <div className="rounded-2xl bg-background border border-border-light p-8 text-center">
          <p className="text-foreground-muted">La gestion d&apos;équipe nécessite le mode API (production).</p>
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Mon équipe</h1>
        <div className="rounded-2xl bg-background border border-border-light p-8 text-center">
          <p className="text-foreground-muted">Votre compte n&apos;est pas encore rattaché à une organisation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mon équipe</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {contacts.length} contact{contacts.length > 1 ? "s" : ""} dans votre compagnie
          </p>
        </div>
        {isPrimary && (
          <Button onClick={() => setShowInviteForm(!showInviteForm)}>
            {showInviteForm ? "Annuler" : "Inviter un contact"}
          </Button>
        )}
      </div>

      {/* Invite form */}
      {showInviteForm && isPrimary && (
        <div className="rounded-2xl bg-background border border-border-light p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Inviter un nouveau contact</h2>

          {inviteError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{inviteError}</div>
          )}
          {inviteSuccess && (
            <div className="mb-4 rounded-xl bg-green-50 border border-green-500 p-3 text-sm text-green-600">{inviteSuccess}</div>
          )}

          <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-foreground">Email *</label>
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className={inputClass}
                placeholder="contact@compagnie.fr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Nom</label>
              <input
                type="text"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                className={inputClass}
                placeholder="Prénom Nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Fonction</label>
              <select
                value={inviteForm.orgRole}
                onChange={(e) => setInviteForm({ ...inviteForm, orgRole: e.target.value })}
                className={inputClass}
              >
                <option value="">— Choisir —</option>
                <option value="dirigeant">Dirigeant</option>
                <option value="exploitation">Exploitation</option>
                <option value="armement">Armement</option>
                <option value="paie">Paie</option>
                <option value="technique">Technique</option>
                <option value="logistique">Logistique</option>
                <option value="achats">Achats</option>
                <option value="formation">Formation</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <Button type="submit">Envoyer l&apos;invitation</Button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts list */}
      <div className="rounded-2xl bg-background border border-border-light overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-foreground-muted">Chargement...</div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-foreground-muted">Aucun contact enregistré.</div>
        ) : (
          <div className="divide-y divide-border-light">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface/50 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-teal text-primary font-heading font-bold text-sm">
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-sm font-semibold text-foreground truncate">{c.name}</p>
                    {c.isPrimary && <Badge variant="teal">Responsable</Badge>}
                  </div>
                  <p className="text-xs text-foreground-muted truncate">{c.email}</p>
                  {c.companyRole && (
                    <p className="text-xs text-primary capitalize">{c.companyRole}</p>
                  )}
                </div>
                <div className="text-right text-xs text-foreground-muted">
                  {c.phone && <p>{c.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {isPrimary && invitations.filter((i) => !i.accepted).length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Invitations en attente</h2>
          <div className="rounded-2xl bg-background border border-border-light divide-y divide-border-light">
            {invitations.filter((i) => !i.accepted).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.name || inv.email}</p>
                  <p className="text-xs text-foreground-muted">{inv.email}</p>
                </div>
                <Badge variant="warm">En attente</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
