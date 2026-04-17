"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiAuthStore } from "@/lib/auth/api-auth-store";
import { isApiMode } from "@/lib/auth/auth-store";
import { NEWSLETTER_CATEGORIES, type NewsletterPreferences } from "@/lib/auth/types";

export default function PreferencesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState<NewsletterPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "adherent") { router.push("/connexion"); return; }
    if (!isApiMode()) return;
    ApiAuthStore.fetchPreferences().then((p) => {
      setPrefs(p);
      setLoading(false);
    });
  }, [user, router]);

  const [initialized, setInitialized] = useState(false);
  if (!initialized && user?.role === "adherent" && !isApiMode()) {
    setInitialized(true);
    setLoading(false);
  }

  const handleToggle = async (key: string) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key as keyof NewsletterPreferences] };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);
    await ApiAuthStore.updatePreferences({ [key]: updated[key as keyof NewsletterPreferences] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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

  // Adherents see all 10 categories
  const categories = NEWSLETTER_CATEGORIES;

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
      ) : (
        <div className="rounded-2xl bg-background border border-border-light divide-y divide-border-light overflow-hidden">
          {categories.map((cat) => (
            <label
              key={cat.key}
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-surface/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
                {cat.adherentOnly && (
                  <p className="text-xs text-foreground-muted">Réservé aux adhérents</p>
                )}
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={prefs?.[cat.key as keyof NewsletterPreferences] ?? false}
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
