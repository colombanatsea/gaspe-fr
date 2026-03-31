"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ApiAuthStore } from "@/lib/auth/api-auth-store";
import { isApiMode } from "@/lib/auth/auth-store";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isApiMode()) {
      setError("La réinitialisation par email nécessite le mode API (production).");
      setLoading(false);
      return;
    }

    const result = await ApiAuthStore.forgotPassword(email);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Erreur lors de l'envoi.");
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-teal">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Email envoyé</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un email avec un lien de réinitialisation.
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            Le lien est valide pendant 1 heure.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/connexion"
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
      <h1 className="font-heading text-2xl font-bold text-foreground">Mot de passe oublié</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Saisissez votre adresse email pour recevoir un lien de réinitialisation.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="vous@exemple.fr"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Envoi en cours..." : "Envoyer le lien"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/connexion"
          className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
