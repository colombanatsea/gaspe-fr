"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";

const FORMATIONS_KEY = "gaspe_formations";

export default function AdminNewFormationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    organizer: "",
    startDate: "",
    endDate: "",
    location: "",
    duration: "",
    capacity: "",
    targetAudience: "",
    prerequisites: "",
    price: "",
    contactEmail: "",
  });

  if (!user || user.role !== "admin") {
    if (typeof window !== "undefined") router.push("/connexion");
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const newFormation = {
      id: `formation-${Date.now()}`,
      ...form,
      capacity: Number(form.capacity) || 0,
      status: "open" as const,
    };

    const raw = localStorage.getItem(FORMATIONS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(newFormation);
    localStorage.setItem(FORMATIONS_KEY, JSON.stringify(existing));

    router.push("/admin/formations");
  }

  const inputClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Nouvelle formation</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Remplissez les informations pour cr&eacute;er une formation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg bg-background p-6 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Titre <span className="text-red-500">*</span>
          </label>
          <input id="title" name="title" type="text" required value={form.title} onChange={handleChange} placeholder="Ex : Formation STCW" className={inputClass} />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea id="description" name="description" rows={4} required value={form.description} onChange={handleChange} placeholder="Contenu de la formation..." className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="organizer" className="block text-sm font-medium text-foreground mb-1">
              Organisateur <span className="text-red-500">*</span>
            </label>
            <input id="organizer" name="organizer" type="text" required value={form.organizer} onChange={handleChange} placeholder="Ex : ENSM" className={inputClass} />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
              Lieu <span className="text-red-500">*</span>
            </label>
            <input id="location" name="location" type="text" required value={form.location} onChange={handleChange} placeholder="Ex : Nantes" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">
              Date de d&eacute;but <span className="text-red-500">*</span>
            </label>
            <input id="startDate" name="startDate" type="date" required value={form.startDate} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">
              Date de fin
            </label>
            <input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-foreground mb-1">Dur&eacute;e</label>
            <input id="duration" name="duration" type="text" value={form.duration} onChange={handleChange} placeholder="Ex : 3 jours" className={inputClass} />
          </div>
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-foreground mb-1">Capacit&eacute;</label>
            <input id="capacity" name="capacity" type="number" value={form.capacity} onChange={handleChange} placeholder="Ex : 20" className={inputClass} />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1">Tarif</label>
            <input id="price" name="price" type="text" value={form.price} onChange={handleChange} placeholder="Ex : 500 EUR" className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium text-foreground mb-1">Public cible</label>
          <input id="targetAudience" name="targetAudience" type="text" value={form.targetAudience} onChange={handleChange} placeholder="Ex : Officiers pont et machine" className={inputClass} />
        </div>

        <div>
          <label htmlFor="prerequisites" className="block text-sm font-medium text-foreground mb-1">Pr&eacute;requis</label>
          <textarea id="prerequisites" name="prerequisites" rows={2} value={form.prerequisites} onChange={handleChange} placeholder="Conditions d'acc&egrave;s..." className={inputClass} />
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground mb-1">Email de contact</label>
          <input id="contactEmail" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} placeholder="formation@exemple.fr" className={inputClass} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light">
          <Link href="/admin/formations" className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors">
            Annuler
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Cr\u00e9ation..." : "Cr\u00e9er la formation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
