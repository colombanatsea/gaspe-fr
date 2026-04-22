"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getDraft, saveDraft } from "@/lib/newsletter/drafts-store";
import { renderNewsletter } from "@/lib/newsletter/render";
import { NewsletterBlockEditor } from "@/components/admin/NewsletterBlockEditor";
import type {
  NewsletterDraft,
  NewsletterBlock,
  BlockHeader,
  BlockHeading,
  BlockParagraph,
  BlockImage,
  BlockButton,
  BlockDivider,
  BlockColumns,
  BlockSpacer,
  BlockFooter,
} from "@/lib/newsletter/types";

const inputClass =
  "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

function newBlock(type: NewsletterBlock["type"]): NewsletterBlock {
  switch (type) {
    case "header": return { type: "header", variant: "gradient" } as BlockHeader;
    case "heading": return { type: "heading", text: "Titre", level: 2, align: "left" } as BlockHeading;
    case "paragraph": return { type: "paragraph", html: "<p>Écrivez votre paragraphe ici.</p>" } as BlockParagraph;
    case "image": return { type: "image", url: "", alt: "", width: "full" } as BlockImage;
    case "button": return { type: "button", label: "En savoir plus", url: "https://gaspe.fr", color: "teal", align: "center" } as BlockButton;
    case "divider": return { type: "divider", style: "solid" } as BlockDivider;
    case "columns": return { type: "columns", items: [{ html: "<p>Colonne 1</p>" }, { html: "<p>Colonne 2</p>" }] } as BlockColumns;
    case "spacer": return { type: "spacer", height: 20 } as BlockSpacer;
    case "footer": return { type: "footer", showUnsub: true, showContactAddress: true } as BlockFooter;
  }
}

const BLOCK_PALETTE: { type: NewsletterBlock["type"]; label: string; icon: string }[] = [
  { type: "header", label: "En-tête", icon: "🎨" },
  { type: "heading", label: "Titre", icon: "H" },
  { type: "paragraph", label: "Paragraphe", icon: "¶" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "button", label: "Bouton", icon: "▶" },
  { type: "divider", label: "Séparateur", icon: "–" },
  { type: "columns", label: "2 colonnes", icon: "▥" },
  { type: "spacer", label: "Espace", icon: "↕" },
  { type: "footer", label: "Pied de page", icon: "⬛" },
];

function EditorContent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id") ?? "";
  const { user } = useAuth();
  const router = useRouter();

  const [draft, setDraft] = useState<NewsletterDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    getDraft(draftId).then((d) => {
      setDraft(d);
      setLoading(false);
    });
  }, [draftId, user, router]);

  const previewHtml = useMemo(() => {
    if (!draft) return "";
    return renderNewsletter(draft.blocks, {
      subject: draft.subject,
      preheader: draft.preheader,
      vars: { firstname: "Prénom", unsubscribe_url: "#unsub", webversion_url: "#web" },
    });
  }, [draft]);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    const ok = await saveDraft(draft);
    setSaving(false);
    if (ok) setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
  }, [draft]);

  if (!user || user.role !== "admin") return null;

  if (loading) {
    return <p className="text-sm text-foreground-muted py-8 text-center">Chargement…</p>;
  }

  if (!draft) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--gaspe-neutral-300)] p-12 text-center">
        <p className="font-heading text-lg font-semibold text-foreground">Brouillon introuvable</p>
        <Link href="/admin/newsletter/drafts" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Retour aux brouillons
        </Link>
      </div>
    );
  }

  function updateDraft(changes: Partial<NewsletterDraft>) {
    setDraft((prev) => prev ? { ...prev, ...changes } : prev);
  }

  function addBlock(type: NewsletterBlock["type"]) {
    if (!draft) return;
    const blocks = [...draft.blocks, newBlock(type)];
    updateDraft({ blocks });
  }

  function updateBlock(idx: number, block: NewsletterBlock) {
    if (!draft) return;
    const blocks = [...draft.blocks];
    blocks[idx] = block;
    updateDraft({ blocks });
  }

  function removeBlock(idx: number) {
    if (!draft) return;
    const blocks = draft.blocks.filter((_, i) => i !== idx);
    updateDraft({ blocks });
  }

  function moveBlock(idx: number, direction: -1 | 1) {
    if (!draft) return;
    const target = idx + direction;
    if (target < 0 || target >= draft.blocks.length) return;
    const blocks = [...draft.blocks];
    [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
    updateDraft({ blocks });
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/newsletter/drafts"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            ← Brouillons
          </Link>
          <h1 className="font-heading text-xl font-bold text-foreground">{draft.title}</h1>
          <Badge variant={draft.status === "sent" ? "teal" : "warm"}>
            {draft.status === "sent" ? "Envoyé" : "Brouillon"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs text-foreground-muted">Enregistré à {savedAt}</span>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Meta fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-4">
        <label className="block md:col-span-1">
          <span className="text-xs font-medium text-foreground-muted">Titre (interne)</span>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => updateDraft({ title: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-medium text-foreground-muted">Objet (sujet de l&apos;email)</span>
          <input
            type="text"
            value={draft.subject}
            onChange={(e) => updateDraft({ subject: e.target.value })}
            placeholder="Objet visible dans la boîte de réception"
            maxLength={80}
            className={inputClass}
          />
        </label>
        <label className="block md:col-span-3">
          <span className="text-xs font-medium text-foreground-muted">Preheader (aperçu masqué)</span>
          <input
            type="text"
            value={draft.preheader}
            onChange={(e) => updateDraft({ preheader: e.target.value })}
            placeholder="Texte d'aperçu affiché après l'objet (100 char max)"
            maxLength={100}
            className={inputClass}
          />
        </label>
      </div>

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        {/* Editor column */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-4">
            <p className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
              Ajouter un bloc
            </p>
            <div className="flex flex-wrap gap-2">
              {BLOCK_PALETTE.map((b) => (
                <button
                  key={b.type}
                  type="button"
                  onClick={() => addBlock(b.type)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] px-3 py-1.5 text-xs font-medium text-foreground hover:border-[var(--gaspe-teal-400)] hover:text-[var(--gaspe-teal-600)] transition-colors"
                >
                  <span className="font-heading">{b.icon}</span>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {draft.blocks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--gaspe-neutral-300)] p-8 text-center text-sm text-foreground-muted">
                Cliquez sur un bloc ci-dessus pour commencer.
              </p>
            ) : (
              draft.blocks.map((block, idx) => (
                <NewsletterBlockEditor
                  key={idx}
                  block={block}
                  onChange={(b) => updateBlock(idx, b)}
                  onRemove={() => removeBlock(idx)}
                  onMoveUp={() => moveBlock(idx, -1)}
                  onMoveDown={() => moveBlock(idx, 1)}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < draft.blocks.length - 1}
                />
              ))
            )}
          </div>
        </div>

        {/* Preview column */}
        <div className="space-y-3">
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider">
                Aperçu live
              </p>
              <div className="flex items-center rounded-lg border border-[var(--gaspe-neutral-200)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`px-3 py-1 text-xs font-medium ${previewMode === "desktop" ? "bg-[var(--gaspe-teal-600)] text-white" : "bg-white text-foreground-muted hover:text-foreground"}`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`px-3 py-1 text-xs font-medium ${previewMode === "mobile" ? "bg-[var(--gaspe-teal-600)] text-white" : "bg-white text-foreground-muted hover:text-foreground"}`}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] overflow-hidden bg-[var(--gaspe-neutral-100)] p-4">
              <div
                className="mx-auto bg-white rounded-lg overflow-hidden transition-all"
                style={{
                  maxWidth: previewMode === "mobile" ? 375 : 640,
                  width: "100%",
                }}
              >
                <iframe
                  srcDoc={previewHtml}
                  title="Aperçu newsletter"
                  className="w-full block"
                  style={{ height: "80vh", border: 0 }}
                />
              </div>
            </div>
            <p className="text-[11px] text-foreground-muted italic">
              L&apos;aperçu se met à jour automatiquement. Variables remplacées : {"{{firstname}} → Prénom"}, {"{{unsubscribe_url}}"}, {"{{webversion_url}}"}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNewsletterEditPage() {
  return (
    <Suspense fallback={<p className="text-sm text-foreground-muted py-8 text-center">Chargement…</p>}>
      <EditorContent />
    </Suspense>
  );
}
