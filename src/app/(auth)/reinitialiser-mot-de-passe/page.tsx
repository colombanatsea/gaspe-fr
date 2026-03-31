"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ApiAuthStore } from "@/lib/auth/api-auth-store";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-red-500">
        <h1 className="font-heading text-2xl font-bold text-foreground">Lien invalide</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <div className="mt-6">
          <Link
            href="/mot-de-passe-oublie"
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-green-500">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mot de passe modifié</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Votre mot de passe a été réinitialisé avec succès.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link href="/connexion">
            <Button className="w-full">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const result = await ApiAuthStore.resetPassword(token, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Erreur lors de la réinitialisation.");
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
      <h1 className="font-heading text-2xl font-bold text-foreground">Nouveau mot de passe</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Choisissez votre nouveau mot de passe.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="6 caractères minimum"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-foreground">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm"
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Confirmez votre mot de passe"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-2/3" />
          <div className="h-4 bg-surface rounded w-full" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
