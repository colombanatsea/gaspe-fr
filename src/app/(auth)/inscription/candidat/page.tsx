"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";

export default function InscriptionCandidatPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    currentPosition: "",
    desiredPosition: "",
  });
  const [error, setError] = useState("");

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    const result = register({
      role: "candidat",
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      currentPosition: form.currentPosition,
      desiredPosition: form.desiredPosition,
    });

    if (!result.success) {
      setError(result.error ?? "Erreur lors de l'inscription.");
      return;
    }

    router.push("/espace-candidat");
  };

  return (
    <div className="rounded-lg bg-background p-8 shadow-sm border-l-[3px] border-l-primary">
      <h1 className="font-heading text-2xl font-bold text-foreground">Inscription Candidat</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Créez votre profil pour postuler aux offres d&apos;emploi maritime.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Nom complet
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Jean Dupont"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="vous@exemple.fr"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            Téléphone
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="06 12 34 56 78"
          />
        </div>

        <div>
          <label htmlFor="currentPosition" className="block text-sm font-medium text-foreground">
            Poste actuel
          </label>
          <input
            id="currentPosition"
            type="text"
            value={form.currentPosition}
            onChange={(e) => update("currentPosition", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Ex: Matelot, Officier mécanicien..."
          />
        </div>

        <div>
          <label htmlFor="desiredPosition" className="block text-sm font-medium text-foreground">
            Poste recherché
          </label>
          <input
            id="desiredPosition"
            type="text"
            value={form.desiredPosition}
            onChange={(e) => update("desiredPosition", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Ex: Capitaine, Second mécanicien..."
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
            className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Minimum 6 caractères"
          />
        </div>

        <Button type="submit" className="w-full">
          Créer mon compte
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
