"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiAuthStore } from "@/lib/auth/api-auth-store";
import { isApiMode } from "@/lib/auth/auth-store";
import { apiFetch } from "@/lib/api-client";

interface NewsletterCategory {
  key: string;
  label: string;
  description?: string;
  audienceFilter: string;
  isPublic: boolean;
  sortOrder: number;
}

export default function PreferencesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<NewsletterCategory[]>([]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "adherent") { router.push("/connexion"); return; }
    if (!isApiMode()) {
      setLoading(false);
      return;
    }
    // Refonte session 56b : fetch dynamique des catégories filtrées par
    // audience (le Worker filtre selon social3228 / collège du user). Les
    // préférences arrivent déjà alignées sur les catégories renvoyées.
    Promise.all([
      apiFetch<{ categories?: NewsletterCategory[] }>("/api/newsletter/categories")
        .then((r) => r.categories ?? [])
        .catch(() => []),
      ApiAuthStore.fetchPreferences(),
    ]).then(([cats, p]) => {
      setCategories(cats);
      setPrefs(((p ?? {}) as Record<string, boolean>));
      setLoading(false);
    });
  }, [user, router]);

  if (!user || user.role !== "adherent") return null;

  if (!isApiMode()) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Préférences newsletter</h1>
        <div className="rounded-2xl bg-background border border-border-light p-8 text-center">
          <p className="text-foreground-muted">Les préférences newsletter nécessitent le mode API (production).</p>
        </div>
      </div>
    );
  }

  async function handleToggle(key: string) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);
    try {
      await ApiAuthStore.updatePreferences({ [key]: updated[key] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Préférences newsletter</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Choisissez les communications que vous souhaitez recevoir par email.
          </p>
        </div>
        {saving && <span className="text-xs text-foreground-muted">Enregistrement...</span>}
        {saved && <span className="text-xs text-green-600 font-medium">Enregistré</span>}
      </div>

      {loading ? (
        <div className="rounded-2xl bg-background border border-border-light p-8 text-center text-foreground-muted">
          Chargement...
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl bg-background border border-border-light p-8 text-center text-foreground-muted">
          Aucune catégorie de newsletter disponible pour votre profil.
        </div>
      ) : (
        <div className="rounded-2xl bg-background border border-border-light divide-y divide-border-light overflow-hidden">
          {categories.map((cat) => (
            <label
              key={cat.key}
              className="flex items-start justify-between gap-4 px-6 py-4 cursor-pointer hover:bg-surface/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
                {cat.description && (
                  <p className="mt-1 text-xs text-foreground-muted">{cat.description}</p>
                )}
              </div>
              <div className="relative shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={!!prefs[cat.key]}
                  onChange={() => handleToggle(cat.key)}
                  className="sr-only peer"
                />
                <div className="h-6 w-11 rounded-full bg-border peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
