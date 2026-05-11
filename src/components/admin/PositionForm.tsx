"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { ContentPreview } from "@/components/admin/ContentPreview";

const categoryOptions = ["Position", "Communiqué de presse", "Actualité"] as const;
export type PositionCategory = (typeof categoryOptions)[number];

export interface PositionFormValues {
  title: string;
  excerpt: string;
  content: string;
  category: PositionCategory | "";
  date: string;
  coverImageUrl: string;
  published: boolean;
  tags: string[];
}

interface PositionFormProps {
  initialValues?: PositionFormValues;
  mode: "new" | "edit";
  onSubmit: (values: PositionFormValues) => Promise<void>;
}

const EMPTY: PositionFormValues = {
  title: "",
  excerpt: "",
  content: "",
  category: "",
  date: new Date().toISOString().split("T")[0],
  coverImageUrl: "",
  published: true,
  tags: [],
};

export function PositionForm({ initialValues, mode, onSubmit }: PositionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState<PositionFormValues & { tagsRaw: string }>(() => {
    const base = initialValues ?? EMPTY;
    return { ...base, tagsRaw: base.tags.join(", ") };
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        date: form.date,
        coverImageUrl: form.coverImageUrl,
        published: form.published,
        tags: form.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
      });
    } catch {
      setIsSubmitting(false);
      alert(
        mode === "new"
          ? "Erreur lors de la création de la position. Réessayez."
          : "Erreur lors de la mise à jour de la position. Réessayez.",
      );
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg bg-background p-6 shadow-sm">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
          Titre <span className="text-red-500">*</span>
        </label>
        <input id="title" name="title" type="text" required value={form.title} onChange={handleChange} placeholder="Titre de l'article" className={inputClass} />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-foreground mb-1">Résumé</label>
        <textarea id="excerpt" name="excerpt" rows={2} value={form.excerpt} onChange={handleChange} placeholder="Court résumé de l'article..." className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Contenu <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={form.content}
          onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
          placeholder="Contenu complet de l'article..."
          minHeight={250}
          onMediaLibraryOpen={() => setShowMedia(true)}
        />
        {showPreview && form.content && (
          <div className="mt-4">
            <ContentPreview html={form.content} title={form.title} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
            Catégorie <span className="text-red-500">*</span>
          </label>
          <select id="category" name="category" required value={form.category} onChange={handleChange} className={inputClass}>
            <option value="">Sélectionner...</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-foreground mb-1">Date</label>
          <input id="date" name="date" type="date" value={form.date} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="coverImageUrl" className="block text-sm font-medium text-foreground mb-1">URL image de couverture</label>
        <input id="coverImageUrl" name="coverImageUrl" type="url" value={form.coverImageUrl} onChange={handleChange} placeholder="https://..." className={inputClass} />
      </div>

      <div>
        <label htmlFor="tagsRaw" className="block text-sm font-medium text-foreground mb-1">Tags (séparés par des virgules)</label>
        <input id="tagsRaw" name="tagsRaw" type="text" value={form.tagsRaw} onChange={handleChange} placeholder="maritime, social, réglementation" className={inputClass} />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="published"
          name="published"
          type="checkbox"
          checked={form.published}
          onChange={handleChange}
          className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"
        />
        <label htmlFor="published" className="text-sm font-medium text-foreground">
          {mode === "new" ? "Publier immédiatement" : "Publié"}
        </label>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border-light">
        <button type="button" onClick={() => setShowPreview(!showPreview)} className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${showPreview ? "bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-600)]" : "text-foreground-muted hover:text-foreground"}`}>
          {showPreview ? "Masquer l'aperçu" : "Aperçu"}
        </button>
      </div>

      <MediaLibrary open={showMedia} onClose={() => setShowMedia(false)} />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light">
        <Link href="/admin/positions" className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors">
          Annuler
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? (mode === "new" ? "Publication..." : "Enregistrement...")
            : (mode === "new" ? "Publier" : "Enregistrer")}
        </Button>
      </div>
    </form>
  );
}
