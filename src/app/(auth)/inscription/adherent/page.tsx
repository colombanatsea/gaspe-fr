"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { members } from "@/data/members";

const GASPE_MEMBERS = [
  ...members.map((m) => m.name).sort((a, b) => a.localeCompare(b, "fr")),
  "Autre (préciser)",
];

const inputClass =
  "mt-1 block w-full rounded-xl border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function InscriptionAdherentPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    company: "",
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setSubmitting(true);

    const result = await register({
      role: "adherent",
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      company: form.company,
    });

    if (!result.success) {
      setError(result.error ?? "Erreur lors de l'inscription.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-teal mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Inscription enregistrée</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Votre demande de compte adhérent a été enregistrée. Elle sera validée par l&apos;administrateur GASPE dans les meilleurs délais. Vous recevrez une confirmation par email.
        </p>
        <Link
          href="/connexion"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading font-semibold text-sm text-white hover:bg-primary-hover transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
      <h1 className="font-heading text-2xl font-bold text-foreground">Inscription Adhérent</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Créez un compte pour votre compagnie membre du GASPE.
      </p>

      <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
        Votre compte sera validé par l&apos;administrateur avant activation.
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-foreground">
            Compagnie membre
          </label>
          <select
            id="company"
            required
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            className={inputClass}
          >
            <option value="">Sélectionnez votre compagnie</option>
            {GASPE_MEMBERS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Nom du contact
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            placeholder="Jean Dupont"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Adresse email professionnelle
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
            placeholder="contact@compagnie.fr"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            Téléphone
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className={inputClass}
            placeholder="01 23 45 67 89"
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
            onChange={(e) => update("password", e.target.value)}
            className={inputClass}
            placeholder="Minimum 6 caractères"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Inscription en cours...
            </span>
          ) : (
            "Créer mon compte adhérent"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-foreground-muted">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-primary hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
