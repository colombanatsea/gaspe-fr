"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";

export default function ConnexionPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error ?? "Erreur de connexion.");
      setLoading(false);
      return;
    }

    // Redirect based on role - read from localStorage since state may not have updated yet
    try {
      const stored = localStorage.getItem("gaspe_current_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.role === "admin") router.push("/admin");
        else if (u?.role === "adherent") router.push("/espace-adherent");
        else router.push("/espace-candidat");
      }
    } catch { router.push("/"); }
  };

  return (
    <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
      <h1 className="font-heading text-2xl font-bold text-foreground">Connexion</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Accédez à votre espace personnel GASPE.
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Votre mot de passe"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>

        <div className="text-right">
          <Link
            href="/mot-de-passe-oublie"
            className="text-xs text-foreground-muted hover:text-primary transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </form>

      <div className="mt-6 border-t border-border-light pt-4 space-y-2">
        <p className="text-sm text-foreground-muted text-center">Pas encore de compte ?</p>
        <div className="flex gap-3">
          <Link
            href="/inscription/adherent"
            className="flex-1 inline-flex items-center justify-center rounded-xl border-2 border-primary px-4 py-2.5 text-sm font-heading font-semibold text-primary hover:bg-surface-teal transition-colors text-center"
          >
            Espace Adhérent
          </Link>
          <Link
            href="/inscription/candidat"
            className="flex-1 inline-flex items-center justify-center rounded-xl border-2 border-primary px-4 py-2.5 text-sm font-heading font-semibold text-primary hover:bg-surface-teal transition-colors text-center"
          >
            Espace Candidat
          </Link>
        </div>
      </div>
    </div>
  );
}
