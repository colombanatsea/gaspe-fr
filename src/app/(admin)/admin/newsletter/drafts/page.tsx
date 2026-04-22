"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { listDrafts, createDraft, deleteDraft } from "@/lib/newsletter/drafts-store";
import type { NewsletterDraft } from "@/lib/newsletter/types";

export default function AdminNewsletterDraftsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [drafts, setDrafts] = useState<NewsletterDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listDrafts();
    setDrafts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    startTransition(() => { void refresh(); });
  }, [user, router, refresh]);

  if (!user || user.role !== "admin") return null;

  async function handleCreate() {
    setCreating(true);
    const draft = await createDraft("Nouveau brouillon", user?.id ?? "admin");
    setCreating(false);
    if (draft) router.push(`/admin/newsletter/edit?id=${encodeURIComponent(draft.id)}`);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Supprimer le brouillon « ${title} » ?`)) return;
    await deleteDraft(id);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Newsletter – Brouillons</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Éditeur blocs chartés (v2 beta). Créez, modifiez et prévisualisez vos newsletters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/newsletter"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--gaspe-neutral-200)] px-4 py-2 text-sm font-semibold text-foreground-muted hover:text-foreground hover:border-[var(--gaspe-neutral-300)]"
          >
            ← Envoi rapide (v1)
          </Link>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Création…" : "+ Nouveau brouillon"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--gaspe-warm-50)] border border-[var(--gaspe-warm-200)] p-4 text-sm text-[var(--gaspe-warm-700)]">
        <strong>⚠ Phase beta.</strong> L&apos;envoi vers Brevo n&apos;est pas encore activé –
        seule la sauvegarde des brouillons fonctionne. Les IDs de listes Brevo
        doivent être configurés par l&apos;équipe technique avant activation.
      </div>

      {loading ? (
        <p className="text-sm text-foreground-muted py-8 text-center">Chargement…</p>
      ) : drafts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--gaspe-neutral-300)] p-16 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">Aucun brouillon</p>
          <p className="mt-2 text-sm text-foreground-muted">
            Créez votre premier brouillon pour commencer à rédiger.
          </p>
          <Button className="mt-6" onClick={handleCreate} disabled={creating}>
            Créer un brouillon
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-5 hover:border-[var(--gaspe-teal-300)] transition-colors"
            >
              <Link
                href={`/admin/newsletter/edit?id=${encodeURIComponent(draft.id)}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading text-base font-semibold text-foreground truncate">
                    {draft.title}
                  </h3>
                  <Badge variant={draft.status === "sent" ? "teal" : draft.status === "archived" ? "neutral" : "warm"}>
                    {draft.status === "sent" ? "Envoyé" : draft.status === "archived" ? "Archivé" : "Brouillon"}
                  </Badge>
                </div>
                <p className="text-sm text-foreground-muted truncate">
                  {draft.subject || <em>Sans objet</em>} · {draft.blocks.length} bloc{draft.blocks.length > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Modifié {new Date(draft.updatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(draft.id, draft.title)}
                className="text-xs text-red-500 hover:text-red-600 hover:underline font-medium"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
