"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ApiAuthStore } from "@/lib/auth/api-auth-store";
import { useAuth } from "@/lib/auth/AuthContext";

const inputClass =
  "mt-1 block w-full rounded-xl border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function InvitationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ name: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-red-500">
        <h1 className="font-heading text-2xl font-bold text-foreground">Lien invalide</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Ce lien d&apos;invitation est invalide ou a expiré.
        </p>
        <div className="mt-6">
          <Link href="/connexion" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Le nom est requis."); return; }
    if (form.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }

    setLoading(true);
    const result = await ApiAuthStore.acceptInvitation(token, {
      name: form.name,
      password: form.password,
      phone: form.phone || undefined,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Erreur lors de l'acceptation.");
      return;
    }

    // Redirect to adherent space
    router.push("/espace-adherent");
  };

  return (
    <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
      <h1 className="font-heading text-2xl font-bold text-foreground">Rejoindre votre compagnie</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Vous avez été invité(e) à rejoindre l&apos;espace adhérent GASPE. Complétez vos informations pour activer votre compte.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Prénom et nom
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            placeholder="Jean Dupont"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            Téléphone <span className="text-foreground-muted">(optionnel)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
            placeholder="06 12 34 56 78"
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
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
            placeholder="6 caractères minimum"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Activation..." : "Activer mon compte"}
        </Button>
      </form>
    </div>
  );
}

export default function InvitationPage() {
  return (
    <Suspense fallback={
      <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-2/3" />
          <div className="h-4 bg-surface rounded w-full" />
        </div>
      </div>
    }>
      <InvitationForm />
    </Suspense>
  );
}
