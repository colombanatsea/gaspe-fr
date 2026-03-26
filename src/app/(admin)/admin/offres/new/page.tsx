"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const contractTypes = ["CDI", "CDD", "Stage", "Alternance"];

const categories = [
  "Pont",
  "Machine",
  "Personnel hôtelier",
  "Personnel à terre",
  "Direction",
  "Autre",
];

export default function AdminNewOffrePage() {
  const [isSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Nouvelle offre d&apos;emploi
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Remplissez les informations ci-dessous pour publier une offre.
        </p>
      </div>

      <form className="space-y-5 rounded-lg bg-background p-6 shadow-sm">
        {/* Titre */}
        <div>
          <label htmlFor="titre" className="block text-sm font-medium text-foreground mb-1">
            Titre de l&apos;offre <span className="text-red-500">*</span>
          </label>
          <input
            id="titre"
            name="titre"
            type="text"
            required
            placeholder="Ex : Capitaine 500 UMS"
            className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            placeholder="Décrivez le poste, les missions et le profil recherché..."
            className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Entreprise + Lieu */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="entreprise" className="block text-sm font-medium text-foreground mb-1">
              Entreprise <span className="text-red-500">*</span>
            </label>
            <input
              id="entreprise"
              name="entreprise"
              type="text"
              required
              placeholder="Ex : Compagnie Océane"
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="lieu" className="block text-sm font-medium text-foreground mb-1">
              Lieu <span className="text-red-500">*</span>
            </label>
            <input
              id="lieu"
              name="lieu"
              type="text"
              required
              placeholder="Ex : Lorient, Bretagne"
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Contrat + Catégorie */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contrat" className="block text-sm font-medium text-foreground mb-1">
              Type de contrat <span className="text-red-500">*</span>
            </label>
            <select
              id="contrat"
              name="contrat"
              required
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Sélectionner...</option>
              {contractTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="categorie" className="block text-sm font-medium text-foreground mb-1">
              Catégorie
            </label>
            <select
              id="categorie"
              name="categorie"
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Sélectionner...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Salaire */}
        <div>
          <label htmlFor="salaire" className="block text-sm font-medium text-foreground mb-1">
            Fourchette salariale
          </label>
          <input
            id="salaire"
            name="salaire"
            type="text"
            placeholder="Ex : 35 000 - 45 000 EUR brut/an"
            className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Contact + URL */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email de contact
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="recrutement@compagnie.fr"
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-foreground mb-1">
              URL de candidature
            </label>
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://..."
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light">
          <Link
            href="/admin/offres"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors"
          >
            Annuler
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Publication..." : "Publier l\u2019offre"}
          </Button>
        </div>
      </form>
    </div>
  );
}
