"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";

const POSITIONS_KEY = "gaspe_positions";

const categoryOptions = ["Position", "Communiqu\u00e9 de presse", "Actualit\u00e9"];

export default function AdminNewPositionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    coverImageUrl: "",
    published: true,
    tags: "",
  });

  if (!user || user.role !== "admin") {
    if (typeof window !== "undefined") router.push("/connexion");
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const newPosition = {
      id: `position-${Date.now()}`,
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      category: form.category,
      date: form.date,
      coverImageUrl: form.coverImageUrl,
      published: form.published,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const raw = localStorage.getItem(POSITIONS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(newPosition);
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(existing));

    router.push("/admin/positions");
  }

  const inputClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Nouvelle position / article</h1>
        <p className="mt-1 text-sm text-foreground-muted">Publiez une position, un communiqu&eacute; de presse ou une actualit&eacute;.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg bg-background p-6 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Titre <span className="text-red-500">*</span>
          </label>
          <input id="title" name="title" type="text" required value={form.title} onChange={handleChange} placeholder="Titre de l'article" className={inputClass} />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-foreground mb-1">R&eacute;sum&eacute;</label>
          <textarea id="excerpt" name="excerpt" rows={2} value={form.excerpt} onChange={handleChange} placeholder="Court r&eacute;sum&eacute; de l'article..." className={inputClass} />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">
            Contenu <span className="text-red-500">*</span>
          </label>
          <textarea id="content" name="content" rows={10} required value={form.content} onChange={handleChange} placeholder="Contenu complet de l'article..." className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
              Cat&eacute;gorie <span className="text-red-500">*</span>
            </label>
            <select id="category" name="category" required value={form.category} onChange={handleChange} className={inputClass}>
              <option value="">S&eacute;lectionner...</option>
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
          <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-1">Tags (s&eacute;par&eacute;s par des virgules)</label>
          <input id="tags" name="tags" type="text" value={form.tags} onChange={handleChange} placeholder="maritime, social, r&eacute;glementation" className={inputClass} />
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
          <label htmlFor="published" className="text-sm font-medium text-foreground">Publier imm&eacute;diatement</label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light">
          <Link href="/admin/positions" className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors">
            Annuler
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Publication..." : "Publier"}
          </Button>
        </div>
      </form>
    </div>
  );
}
