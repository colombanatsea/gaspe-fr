"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { FormationModality, FormationDay } from "../page";

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
    modality: "presentiel" as FormationModality,
  });

  const [schedule, setSchedule] = useState<FormationDay[]>([]);
  const [newDay, setNewDay] = useState<FormationDay>({ date: "", location: "", visioLink: "" });

  if (!user || !(user.role === "admin" || user.role === "staff")) {
    if (typeof window !== "undefined") router.push("/connexion");
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function addDay() {
    if (!newDay.date) return;
    setSchedule((prev) => [...prev, { ...newDay }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewDay({ date: "", location: "", visioLink: "" });
  }

  function removeDay(idx: number) {
    setSchedule((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const newFormation = {
      id: `formation-${Date.now()}`,
      ...form,
      capacity: Number(form.capacity) || 0,
      status: "open" as const,
      schedule: schedule.length > 0 ? schedule : undefined,
    };

    const raw = localStorage.getItem(FORMATIONS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(newFormation);
    localStorage.setItem(FORMATIONS_KEY, JSON.stringify(existing));

    router.push("/admin/formations");
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Nouvelle formation</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Remplissez les informations pour créer une formation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[var(--gaspe-neutral-200)] bg-surface p-6">
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
          <RichTextEditor
            value={form.description}
            onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
            placeholder="Contenu de la formation..."
            minHeight={200}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="organizer" className="block text-sm font-medium text-foreground mb-1">
              Organisateur <span className="text-red-500">*</span>
            </label>
            <input id="organizer" name="organizer" type="text" required value={form.organizer} onChange={handleChange} placeholder="Ex : ENSM" className={inputClass} />
          </div>
          <div>
            <label htmlFor="modality" className="block text-sm font-medium text-foreground mb-1">
              Modalité <span className="text-red-500">*</span>
            </label>
            <select id="modality" name="modality" value={form.modality} onChange={handleChange} className={inputClass}>
              <option value="presentiel">Présentiel</option>
              <option value="distanciel">Distanciel</option>
              <option value="hybride">Hybride</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
              Lieu principal <span className="text-red-500">*</span>
            </label>
            <input id="location" name="location" type="text" required value={form.location} onChange={handleChange} placeholder="Ex : Nantes" className={inputClass} />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground mb-1">Email de contact</label>
            <input id="contactEmail" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} placeholder="formation@exemple.fr" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">
              Date de début <span className="text-red-500">*</span>
            </label>
            <input id="startDate" name="startDate" type="date" required value={form.startDate} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">Date de fin</label>
            <input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-foreground mb-1">Durée</label>
            <input id="duration" name="duration" type="text" value={form.duration} onChange={handleChange} placeholder="Ex : 3 jours" className={inputClass} />
          </div>
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-foreground mb-1">Capacité</label>
            <input id="capacity" name="capacity" type="number" value={form.capacity} onChange={handleChange} placeholder="Ex : 20" className={inputClass} />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1">Tarif</label>
            <input id="price" name="price" type="text" value={form.price} onChange={handleChange} placeholder="Ex : 500 €" className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium text-foreground mb-1">Public cible</label>
          <input id="targetAudience" name="targetAudience" type="text" value={form.targetAudience} onChange={handleChange} placeholder="Ex : Officiers pont et machine" className={inputClass} />
        </div>

        <div>
          <label htmlFor="prerequisites" className="block text-sm font-medium text-foreground mb-1">Prérequis</label>
          <textarea id="prerequisites" name="prerequisites" rows={2} value={form.prerequisites} onChange={handleChange} placeholder="Conditions d'accès..." className={inputClass} />
        </div>

        {/* Schedule per day */}
        <div className="border-t border-[var(--gaspe-neutral-100)] pt-4">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Calendrier par jour (optionnel)</h3>
          {schedule.length > 0 && (
            <div className="space-y-1 mb-3">
              {schedule.map((day, i) => (
                <div key={i} className="flex items-center gap-3 text-xs rounded-lg bg-[var(--gaspe-neutral-50)] px-3 py-2">
                  <span className="font-medium text-foreground w-24 shrink-0">{day.date}</span>
                  {day.location && <span className="text-foreground-muted truncate">{day.location}</span>}
                  {day.visioLink && <span className="text-[var(--gaspe-blue-600)] truncate">{day.visioLink}</span>}
                  <button type="button" onClick={() => removeDay(i)} className="ml-auto text-red-500 hover:underline shrink-0">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="date"
              value={newDay.date}
              onChange={(e) => setNewDay((p) => ({ ...p, date: e.target.value }))}
              className={inputClass}
            />
            <input
              type="text"
              value={newDay.location ?? ""}
              onChange={(e) => setNewDay((p) => ({ ...p, location: e.target.value }))}
              placeholder="Lieu"
              className={inputClass}
            />
            <input
              type="url"
              value={newDay.visioLink ?? ""}
              onChange={(e) => setNewDay((p) => ({ ...p, visioLink: e.target.value }))}
              placeholder="Lien visio"
              className={inputClass}
            />
            <button
              type="button"
              onClick={addDay}
              disabled={!newDay.date}
              className="rounded-xl bg-[var(--gaspe-teal-50)] px-4 py-2.5 text-sm font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-100)] disabled:opacity-50 transition-colors"
            >
              + Jour
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--gaspe-neutral-100)]">
          <Link href="/admin/formations" className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors">
            Annuler
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer la formation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
