"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { members } from "@/data/members";
import { slugify } from "@/lib/utils";
import type { Job } from "@/data/jobs";

const ADMIN_OFFERS_KEY = "gaspe_admin_offers";

const contractTypes = ["CDI", "CDD", "Saisonnier", "Stage", "Alternance"];
const categories = [
  "Pont",
  "Machine",
  "Technique",
  "Personnel hôtelier",
  "Personnel à terre",
  "Direction",
  "Autre",
];

export default function AdminNewOffrePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    contractType: "",
    category: "",
    salaryRange: "",
    contactEmail: "",
    applicationUrl: "",
    profile: "",
    conditions: "",
  });

  if (!user || user.role !== "admin") {
    if (typeof window !== "undefined") router.push("/connexion");
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const slug = slugify(form.title);
    const id = `admin-${Date.now()}`;
    const companySlug = slugify(form.company);

    const newJob: Job = {
      id,
      slug,
      title: form.title,
      company: form.company,
      companySlug,
      location: form.location,
      zone: 'normandie',
      contractType: form.contractType as Job["contractType"],
      category: form.category || "Autre",
      description: form.description,
      profile: form.profile,
      conditions: form.conditions,
      contactEmail: form.contactEmail,
      salaryRange: form.salaryRange || undefined,
      publishedAt: new Date().toISOString().split("T")[0],
      published: true,
    };

    const raw = localStorage.getItem(ADMIN_OFFERS_KEY);
    const existing: Job[] = raw ? JSON.parse(raw) : [];
    existing.push(newJob);
    localStorage.setItem(ADMIN_OFFERS_KEY, JSON.stringify(existing));

    router.push("/admin/offres");
  }

  const inputClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary";

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

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg bg-background p-6 shadow-sm">
        {/* Titre */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Titre de l&apos;offre <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="Ex : Capitaine 500 UMS"
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
            placeholder="Décrivez le poste, les missions..."
            minHeight={200}
          />
        </div>

        {/* Profil recherché */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Profil recherché
          </label>
          <RichTextEditor
            value={form.profile}
            onChange={(html) => setForm((prev) => ({ ...prev, profile: html }))}
            placeholder="Brevets requis, expérience..."
            minHeight={150}
          />
        </div>

        {/* Conditions */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Conditions &amp; avantages
          </label>
          <RichTextEditor
            value={form.conditions}
            onChange={(html) => setForm((prev) => ({ ...prev, conditions: html }))}
            placeholder="Rémunération, régime social, rythme..."
            minHeight={150}
          />
        </div>

        {/* Entreprise + Lieu */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1">
              Entreprise <span className="text-red-500">*</span>
            </label>
            <select
              id="company"
              name="company"
              required
              value={form.company}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">S&eacute;lectionner un adh&eacute;rent...</option>
              {members.map((m) => (
                <option key={m.slug} value={m.name}>{m.name}</option>
              ))}
              <option value="__other">Autre...</option>
            </select>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
              Lieu <span className="text-red-500">*</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              value={form.location}
              onChange={handleChange}
              placeholder="Ex : Lorient, Bretagne"
              className={inputClass}
            />
          </div>
        </div>

        {/* Contrat + Cat&eacute;gorie */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contractType" className="block text-sm font-medium text-foreground mb-1">
              Type de contrat <span className="text-red-500">*</span>
            </label>
            <select
              id="contractType"
              name="contractType"
              required
              value={form.contractType}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">S&eacute;lectionner...</option>
              {contractTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
              Cat&eacute;gorie
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">S&eacute;lectionner...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Salaire */}
        <div>
          <label htmlFor="salaryRange" className="block text-sm font-medium text-foreground mb-1">
            Fourchette salariale
          </label>
          <input
            id="salaryRange"
            name="salaryRange"
            type="text"
            value={form.salaryRange}
            onChange={handleChange}
            placeholder="Ex : 35 000 - 45 000 EUR brut/an"
            className={inputClass}
          />
        </div>

        {/* Contact + URL */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground mb-1">
              Email de contact
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="recrutement@compagnie.fr"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="applicationUrl" className="block text-sm font-medium text-foreground mb-1">
              URL de candidature
            </label>
            <input
              id="applicationUrl"
              name="applicationUrl"
              type="url"
              value={form.applicationUrl}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
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
            {isSubmitting ? "Publication..." : "Publier l'offre"}
          </Button>
        </div>
      </form>
    </div>
  );
}
