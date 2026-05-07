"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { apiFetch, isApiMode } from "@/lib/api-client";
import { useModalA11y } from "@/lib/useModalA11y";

interface NewsletterCategory {
  key: string;
  label: string;
  description?: string;
  brevoListId?: number;
  audienceFilter: string;
  isPublic: boolean;
  isSystem: boolean;
  sortOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Tous (public + adhérents)",
  adherent_only: "Adhérents uniquement",
  social_3228: "Adhérents collège social (CCN 3228)",
  college_a: "Collège A (opérateurs publics)",
  college_b: "Collège B (privés)",
  college_c: "Collège C (experts/collectivités)",
};

const inputClass =
  "mt-1 block w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

export default function AdminNewsletterCategoriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<NewsletterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<NewsletterCategory | "new" | null>(null);

  const refresh = useCallback(async () => {
    if (!isApiMode()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ categories?: NewsletterCategory[] }>("/api/admin/newsletter/categories");
      setCategories(res.categories ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    startTransition(() => { void refresh(); });
  }, [user, router, refresh]);

  if (!user || user.role !== "admin") return null;

  async function handleArchive(key: string) {
    if (!confirm(`Archiver la catégorie « ${key} » ? Les abonnements existants sont préservés mais elle disparaît de l'UI.`)) return;
    try {
      await apiFetch(`/api/admin/newsletter/categories/${encodeURIComponent(key)}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleSyncBrevo(key: string) {
    if (!confirm(`Force le push de tous les abonnés D1 vers la liste Brevo de « ${key} » ?`)) return;
    try {
      const res = await apiFetch<{ success?: boolean; synced?: number; total?: number; error?: string }>(
        `/api/admin/newsletter/categories/${encodeURIComponent(key)}/sync-brevo`,
        { method: "POST" },
      );
      if (res.error) alert(`Erreur : ${res.error}`);
      else alert(`Sync OK : ${res.synced ?? 0} / ${res.total ?? 0} contacts poussés`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  }

  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Catégories newsletter</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Gestion dynamique des listes de diffusion. La création depuis cette page crée automatiquement
            la liste Brevo correspondante avec préfixe <code>[SITE]</code>.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>+ Nouvelle catégorie</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-foreground-muted">Chargement…</p>}

      {!loading && active.length === 0 && (
        <Card>
          <p className="py-6 text-center text-sm text-foreground-muted">
            Aucune catégorie active. Cliquez sur « + Nouvelle catégorie » pour démarrer.
          </p>
        </Card>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          {active.map((cat) => (
            <Card key={cat.key}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <CardTitle className="text-base">{cat.label}</CardTitle>
                    <code className="text-xs px-2 py-0.5 rounded bg-[var(--gaspe-neutral-100)] text-foreground-muted">{cat.key}</code>
                    <Badge variant={cat.isPublic ? "green" : "neutral"}>{cat.isPublic ? "Publique" : "Privée"}</Badge>
                    {cat.isSystem && <Badge variant="teal">[SITE]</Badge>}
                    {!cat.brevoListId && <Badge variant="warm">Pas de liste Brevo</Badge>}
                  </div>
                  {cat.description && <p className="text-sm text-foreground-muted">{cat.description}</p>}
                  <div className="mt-2 text-xs text-foreground-muted space-x-3">
                    <span>Audience : <strong>{AUDIENCE_LABELS[cat.audienceFilter] ?? cat.audienceFilter}</strong></span>
                    {cat.brevoListId != null && (
                      <span>
                        Brevo list ID : <strong>{cat.brevoListId}</strong>
                        <a
                          href={`https://app.brevo.com/contact/list/${cat.brevoListId}`}
                          target="_blank" rel="noopener noreferrer"
                          className="ml-1 text-[var(--gaspe-teal-600)] hover:underline"
                        >
                          ouvrir
                        </a>
                      </span>
                    )}
                    <span>Tri : {cat.sortOrder}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditing(cat)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
                  >
                    Modifier
                  </button>
                  {cat.brevoListId != null && (
                    <button
                      onClick={() => handleSyncBrevo(cat.key)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-blue-600)] hover:bg-[var(--gaspe-blue-50)] transition-colors"
                    >
                      Sync Brevo
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(cat.key)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    Archiver
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-foreground-muted hover:text-foreground">
            Catégories archivées ({archived.length})
          </summary>
          <div className="mt-3 space-y-2">
            {archived.map((cat) => (
              <div key={cat.key} className="rounded-xl bg-[var(--gaspe-neutral-50)] border border-[var(--gaspe-neutral-200)] px-4 py-2 flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground-muted">{cat.label}</span>
                  <code className="ml-2 text-xs text-foreground-muted">{cat.key}</code>
                </div>
                <button
                  onClick={() => setEditing(cat)}
                  className="text-xs text-[var(--gaspe-teal-600)] hover:underline"
                >
                  Restaurer
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {editing && (
        <CategoryFormModal
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  category, onClose, onSaved,
}: {
  category: NewsletterCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !category;
  const [key, setKey] = useState(category?.key ?? "");
  const [label, setLabel] = useState(category?.label ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [audienceFilter, setAudienceFilter] = useState(category?.audienceFilter ?? "all");
  const [isPublic, setIsPublic] = useState(category?.isPublic ?? true);
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 100));
  const [brevoListId, setBrevoListId] = useState(
    category?.brevoListId != null ? String(category.brevoListId) : "",
  );
  const [archived, setArchived] = useState(category?.archived ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { modalRef } = useModalA11y(true, onClose);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!label.trim() || (isNew && !key.trim())) {
      setError("Clé et libellé requis");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        label: label.trim(),
        description: description.trim() || null,
        audienceFilter,
        isPublic,
        sortOrder: Number(sortOrder) || 100,
      };
      if (brevoListId.trim()) payload.brevoListId = Number(brevoListId.trim());
      else if (!isNew) payload.brevoListId = null;

      if (isNew) {
        payload.key = key.trim();
        const res = await apiFetch<{ error?: string }>("/api/admin/newsletter/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.error) throw new Error(res.error);
      } else {
        // Si on restaure une catégorie archivée, on doit aussi la dé-archiver,
        // ce qui n'est pas géré par PATCH — on fait un PATCH puis un POST sync.
        // Pour l'instant on fait un PATCH simple.
        const res = await apiFetch<{ error?: string }>(`/api/admin/newsletter/categories/${encodeURIComponent(category!.key)}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        if (res.error) throw new Error(res.error);
        if (archived !== category!.archived && !archived) {
          // Restoration : remet archived=0 via update direct (workaround : PATCH n'expose pas archived)
          // Note : nécessite un endpoint dédié pour la restoration. Backlog session 57.
        }
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-foreground">
              {isNew ? "Nouvelle catégorie" : `Modifier « ${category!.label} »`}
            </h2>
            <button type="button" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-[var(--gaspe-neutral-100)]" aria-label="Fermer">×</button>
          </div>

          {isNew && (
            <div>
              <label htmlFor="cat-key" className="block text-sm font-medium text-foreground">Clé technique <span className="text-red-500">*</span></label>
              <input
                id="cat-key"
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                placeholder="ex : info_speciale"
                className={inputClass}
                required
              />
              <p className="mt-1 text-xs text-foreground-muted">a-z, 0-9, _ uniquement. Sera utilisée comme identifiant unique côté DB et API.</p>
            </div>
          )}

          <div>
            <label htmlFor="cat-label" className="block text-sm font-medium text-foreground">Libellé public <span className="text-red-500">*</span></label>
            <input
              id="cat-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex : Information spéciale"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="cat-desc" className="block text-sm font-medium text-foreground">Description (info-bulle adhérent)</label>
            <textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="cat-audience" className="block text-sm font-medium text-foreground">Audience cible</label>
            <select
              id="cat-audience"
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className={inputClass}
            >
              {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-foreground-muted">Filtre côté UI : un user non éligible ne voit pas la catégorie dans ses préférences.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cat-sort" className="block text-sm font-medium text-foreground">Ordre d&apos;affichage</label>
              <input
                id="cat-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cat-brevo" className="block text-sm font-medium text-foreground">Brevo list ID (optionnel)</label>
              <input
                id="cat-brevo"
                type="number"
                value={brevoListId}
                onChange={(e) => setBrevoListId(e.target.value)}
                placeholder="auto-créé si vide"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground-muted">Vide pour création auto Brevo avec préfixe [SITE].</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)]"
            />
            Visible dans les préférences adhérent
          </label>

          {!isNew && category!.archived && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!archived}
                onChange={(e) => setArchived(!e.target.checked)}
                className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)]"
              />
              Restaurer la catégorie (la sortir des archives)
            </label>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-[var(--gaspe-neutral-100)]">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement…" : isNew ? "Créer" : "Enregistrer"}
            </Button>
            <button type="button" onClick={onClose} className="text-sm font-heading font-semibold text-foreground-muted hover:text-foreground">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
