"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { members } from "@/data/members";
import { slugify } from "@/lib/utils";
import { ZONE_LABELS, START_DATE_OPTIONS } from "@/data/jobs";
import type { Job, Zone } from "@/data/jobs";

const ADMIN_OFFERS_KEY = "gaspe_admin_offers";

const contractTypes = ["CDI", "CDD", "Saisonnier", "Stage", "Alternance", "Autres"];
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
    zone: "normandie",
    contractType: "",
    category: "",
    salaryRange: "",
    contactEmail: "",
    contactPhone: "",
    applicationUrl: "",
    reference: "",
    startDate: "Immédiat",
    profile: "",
    conditions: "",
    handiAccessible: false,
  });

  if (!user || user.role !== "admin") {
    if (typeof window !== "undefined") router.push("/connexion");
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
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
      zone: form.zone as Zone,
      contractType: form.contractType as Job["contractType"],
      category: form.category || "Autre",
      description: form.description,
      profile: form.profile,
      conditions: form.conditions,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone || undefined,
      applicationUrl: form.applicationUrl || undefined,
      reference: form.reference || undefined,
      startDate: form.startDate || undefined,
      salaryRange: form.salaryRange || undefined,
      handiAccessible: form.handiAccessible || undefined,
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

        {/* Référence */}
        <div>
          <label htmlFor="reference" className="block text-sm font-medium text-foreground mb-1">
            Référence de l&apos;offre
          </label>
          <input
            id="reference"
            name="reference"
            type="text"
            value={form.reference}
            onChange={handleChange}
            placeholder="Ex : RH-2026-042"
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
              <option value="">Sélectionner un adhérent...</option>
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

        {/* Zone + Début */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="zone" className="block text-sm font-medium text-foreground mb-1">
              Zone géographique <span className="text-red-500">*</span>
            </label>
            <select
              id="zone"
              name="zone"
              required
              value={form.zone}
              onChange={handleChange}
              className={inputClass}
            >
              {Object.entries(ZONE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">
              Début de la mission
            </label>
            <select
              id="startDate"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className={inputClass}
            >
              {START_DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contrat + Catégorie */}
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
              <option value="">Sélectionner...</option>
              {contractTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
              Catégorie
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputClass}
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

        {/* Contact */}
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
            <label htmlFor="contactPhone" className="block text-sm font-medium text-foreground mb-1">
              Téléphone de contact
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              value={form.contactPhone}
              onChange={handleChange}
              placeholder="02 00 00 00 00"
              className={inputClass}
            />
          </div>
        </div>

        {/* URL candidature */}
        <div>
          <label htmlFor="applicationUrl" className="block text-sm font-medium text-foreground mb-1">
            URL de candidature externe
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

        {/* Handi-accessible */}
        <div className="flex items-center gap-2">
          <input
            id="handiAccessible"
            name="handiAccessible"
            type="checkbox"
            checked={form.handiAccessible}
            onChange={handleChange}
            className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"
          />
          <label htmlFor="handiAccessible" className="text-sm text-foreground">
            Offre handi-accueillante
          </label>
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
