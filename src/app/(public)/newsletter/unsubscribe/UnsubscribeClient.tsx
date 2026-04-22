"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { NEWSLETTER_CATEGORIES } from "@/lib/auth/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Result {
  success?: boolean;
  email?: string;
  categoriesDisabled?: string[];
  error?: string;
}

export function UnsubscribeClient() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [selected, setSelected] = useState<Set<string>>(new Set(NEWSLETTER_CATEGORIES.map((c) => c.key)));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Décodage léger pour afficher l'email ciblé (sans vérifier la signature côté client)
  const detectedEmail = useMemo(() => {
    if (!token) return "";
    try {
      const [emailB64] = token.split(".");
      return atob(emailB64 ?? "");
    } catch {
      return "";
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setResult({ error: "Lien de désinscription invalide ou expiré." });
    }
  }, [token]);

  async function submit(categories: string[] | null) {
    if (!token || !API_URL) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, categories }),
      });
      const json = (await res.json()) as Result;
      setResult(json);
    } catch {
      setResult({ error: "Erreur réseau. Merci de réessayer." });
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  if (!token || !API_URL) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Désinscription</h1>
        <p className="mt-4 text-foreground-muted">
          {!token
            ? "Ce lien de désinscription est invalide ou a expiré. Contactez-nous à contact@gaspe.fr."
            : "Mode démo – fonctionnalité disponible uniquement en production."}
        </p>
      </main>
    );
  }

  if (result?.success) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Désinscription confirmée</h1>
        <p className="mt-4 text-foreground-muted">
          {result.email ? (
            <>L&apos;adresse <strong>{result.email}</strong> a été désinscrite des catégories suivantes :</>
          ) : "Vos préférences ont été mises à jour."}
        </p>
        {result.categoriesDisabled && result.categoriesDisabled.length > 0 && (
          <ul className="mt-3 list-disc list-inside text-sm text-foreground-muted">
            {result.categoriesDisabled.map((k) => {
              const cat = NEWSLETTER_CATEGORIES.find((c) => c.key === k);
              return <li key={k}>{cat?.label ?? k}</li>;
            })}
          </ul>
        )}
        <div className="mt-8">
          <Link href="/" className="text-primary hover:underline">← Retour à l&apos;accueil</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">Désinscription de la newsletter</h1>
      {detectedEmail && (
        <p className="mt-2 text-foreground-muted">
          Email concerné : <strong>{detectedEmail}</strong>
        </p>
      )}
      <p className="mt-4 text-sm text-foreground-muted">
        Décochez les catégories que vous ne souhaitez plus recevoir, puis validez. Pour tout désabonner d&apos;un clic, utilisez le bouton en bas.
      </p>

      {result?.error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      <div className="mt-6 space-y-2">
        {NEWSLETTER_CATEGORIES.map((cat) => (
          <label key={cat.key} className="flex items-center gap-3 rounded-xl border border-border-light bg-background p-3 hover:border-primary/30">
            <input
              type="checkbox"
              checked={selected.has(cat.key)}
              onChange={() => toggle(cat.key)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-foreground">{cat.label}</span>
          </label>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => submit(Array.from(selected))}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Traitement…" : "Confirmer la désinscription sélective"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => submit(null)}
          className="rounded-xl border border-border-light bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50"
        >
          Tout désabonner
        </button>
      </div>
    </main>
  );
}
