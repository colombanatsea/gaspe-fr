"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

const AGENDA_KEY = "gaspe_agenda";

interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  eventUrl: string;
  published: boolean;
}

const SEED_EVENTS: AgendaEvent[] = [
  {
    id: "event-seed-1",
    title: "AGE du GASPE",
    description: "Assembl\u00e9e G\u00e9n\u00e9rale Extraordinaire du GASPE, r\u00e9unissant l\u2019ensemble des adh\u00e9rents pour les d\u00e9cisions statutaires et strat\u00e9giques du groupement.",
    startDate: "2026-05-19",
    endDate: "2026-05-19",
    location: "Nantes",
    eventUrl: "",
    published: true,
  },
  {
    id: "event-seed-2",
    title: "Assises de la Mer",
    description: "Les Assises de l\u2019\u00e9conomie de la mer sont le rendez-vous annuel majeur des acteurs de l\u2019\u00e9conomie maritime fran\u00e7aise, organis\u00e9 par Le Marin et le Cluster Maritime Fran\u00e7ais.",
    startDate: "2026-11-24",
    endDate: "2026-11-25",
    location: "La Rochelle",
    eventUrl: "",
    published: true,
  },
];

function getEvents(): AgendaEvent[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(AGENDA_KEY);
  if (!raw) {
    localStorage.setItem(AGENDA_KEY, JSON.stringify(SEED_EVENTS));
    return SEED_EVENTS;
  }
  return JSON.parse(raw);
}

export default function AdminAgendaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    eventUrl: "",
    published: true,
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    setEvents(getEvents());
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  function resetForm() {
    setForm({ title: "", description: "", startDate: "", endDate: "", location: "", eventUrl: "", published: true });
    setEditId(null);
    setShowForm(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let updated: AgendaEvent[];

    if (editId) {
      updated = events.map((ev) =>
        ev.id === editId ? { ...ev, ...form } : ev
      );
    } else {
      const newEvent: AgendaEvent = {
        id: `event-${Date.now()}`,
        ...form,
      };
      updated = [...events, newEvent];
    }

    localStorage.setItem(AGENDA_KEY, JSON.stringify(updated));
    setEvents(updated);
    resetForm();
  }

  function startEdit(ev: AgendaEvent) {
    setForm({
      title: ev.title,
      description: ev.description,
      startDate: ev.startDate,
      endDate: ev.endDate,
      location: ev.location,
      eventUrl: ev.eventUrl,
      published: ev.published,
    });
    setEditId(ev.id);
    setShowForm(true);
  }

  function deleteEvent(id: string) {
    if (!confirm("Supprimer cet \u00e9v\u00e9nement ?")) return;
    const updated = events.filter((ev) => ev.id !== id);
    localStorage.setItem(AGENDA_KEY, JSON.stringify(updated));
    setEvents(updated);
  }

  function togglePublish(id: string) {
    const updated = events.map((ev) =>
      ev.id === id ? { ...ev, published: !ev.published } : ev
    );
    localStorage.setItem(AGENDA_KEY, JSON.stringify(updated));
    setEvents(updated);
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Agenda</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {events.length} &eacute;v&eacute;nement{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusIcon className="h-4 w-4" />
          Nouvel &eacute;v&eacute;nement
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--gaspe-neutral-200)] border-l-[3px] border-l-[var(--gaspe-teal-600)] bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {editId ? "Modifier l'\u00e9v\u00e9nement" : "Nouvel \u00e9v\u00e9nement"}
          </h2>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">Titre <span className="text-red-500">*</span></label>
            <input id="title" name="title" type="text" required value={form.title} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea id="description" name="description" rows={3} value={form.description} onChange={handleChange} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">Date de d&eacute;but <span className="text-red-500">*</span></label>
              <input id="startDate" name="startDate" type="date" required value={form.startDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">Date de fin</label>
              <input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">Lieu <span className="text-red-500">*</span></label>
              <input id="location" name="location" type="text" required value={form.location} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="eventUrl" className="block text-sm font-medium text-foreground mb-1">URL</label>
            <input id="eventUrl" name="eventUrl" type="url" value={form.eventUrl} onChange={handleChange} placeholder="https://..." className={inputClass} />
          </div>
          <div className="flex items-center gap-3">
            <input id="published" name="published" type="checkbox" checked={form.published} onChange={handleChange} className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)] focus:ring-[var(--gaspe-teal-400)]" />
            <label htmlFor="published" className="text-sm font-medium text-foreground">Publi&eacute;</label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--gaspe-neutral-100)]">
            <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors">
              Annuler
            </button>
            <Button type="submit">{editId ? "Mettre \u00e0 jour" : "Cr\u00e9er"}</Button>
          </div>
        </form>
      )}

      {/* Events list */}
      {events.length === 0 ? (
        <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-12 text-center">
          <h3 className="font-heading text-lg font-semibold text-foreground">Aucun &eacute;v&eacute;nement</h3>
          <p className="mt-2 text-sm text-foreground-muted">Cr&eacute;ez votre premier &eacute;v&eacute;nement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .map((ev) => (
              <div key={ev.id} className="flex items-start justify-between rounded-2xl border border-[var(--gaspe-neutral-200)] border-l-[3px] border-l-[var(--gaspe-teal-600)] bg-white p-5 shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading text-base font-semibold text-foreground">{ev.title}</h3>
                    <Badge variant={ev.published ? "green" : "warm"}>
                      {ev.published ? "Publi\u00e9" : "Brouillon"}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground-muted">{ev.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-foreground-muted">
                    <span>{formatDate(ev.startDate)}{ev.endDate && ev.endDate !== ev.startDate ? ` \u2013 ${formatDate(ev.endDate)}` : ""}</span>
                    <span>{ev.location}</span>
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(ev)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors">Modifier</button>
                  <button onClick={() => togglePublish(ev.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors">
                    {ev.published ? "D\u00e9publier" : "Publier"}
                  </button>
                  <button onClick={() => deleteEvent(ev.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors">Supprimer</button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
