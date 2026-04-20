"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { getStoredMembers, saveMembers, type StoredMember } from "@/lib/members-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const inputClass =
  "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

const categoryBadge: Record<string, { label: string; variant: "teal" | "blue" | "warm" | "green" | "neutral" }> = {
  titulaire: { label: "Titulaire", variant: "teal" },
  associe: { label: "Associé", variant: "blue" },
};

type FilterMode = "all" | "titulaire" | "associe" | "archived";

const emptyForm: StoredMember = {
  name: "",
  slug: "",
  city: "",
  latitude: 0,
  longitude: 0,
  region: "",
  territory: "metropole",
  category: "titulaire",
  description: "",
  logoUrl: "",
  websiteUrl: "",
  employeeCount: undefined,
  shipCount: undefined,
  archived: false,
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminMembresPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<StoredMember[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<StoredMember>({ ...emptyForm });

  const refresh = useCallback(async () => {
    setMembers(await getStoredMembers());
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") router.push("/connexion");
    else startTransition(() => { void refresh(); });
  }, [user, router, refresh]);

  // ------- Filters -------
  const filtered = members
    .filter((m) => {
      if (filter === "archived") return m.archived;
      if (filter === "all") return !m.archived;
      return m.category === filter && !m.archived;
    })
    .filter((m) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(s) ||
        m.city.toLowerCase().includes(s) ||
        m.region.toLowerCase().includes(s)
      );
    });

  const activeCount = members.filter((m) => !m.archived).length;
  const titulaireCount = members.filter((m) => m.category === "titulaire" && !m.archived).length;
  const associeCount = members.filter((m) => m.category === "associe" && !m.archived).length;
  const archivedCount = members.filter((m) => m.archived).length;

  // ------- CRUD -------
  function openAdd() {
    setEditingSlug(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(m: StoredMember) {
    setEditingSlug(m.slug);
    setForm({ ...m });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const list = await getStoredMembers();
    const slug = form.slug || slugify(form.name);
    const entry: StoredMember = { ...form, slug };

    if (editingSlug) {
      const idx = list.findIndex((m) => m.slug === editingSlug);
      if (idx !== -1) list[idx] = entry;
    } else {
      // check duplicate slug
      if (list.some((m) => m.slug === slug)) {
        alert("Un membre avec ce slug existe déjà.");
        return;
      }
      list.push(entry);
    }
    saveMembers(list);
    setShowForm(false);
    refresh();
  }

  async function handleArchive(m: StoredMember) {
    if (!confirm(`Archiver ${m.name} ?`)) return;
    const list = (await getStoredMembers()).map((x) => (x.slug === m.slug ? { ...x, archived: true } : x));
    saveMembers(list);
    refresh();
  }

  async function handleUnarchive(m: StoredMember) {
    const list = (await getStoredMembers()).map((x) => (x.slug === m.slug ? { ...x, archived: false } : x));
    saveMembers(list);
    refresh();
  }

  async function handleDelete(m: StoredMember) {
    if (!confirm(`Supprimer définitivement ${m.name} ? Cette action est irréversible.`)) return;
    const list = (await getStoredMembers()).filter((x) => x.slug !== m.slug);
    saveMembers(list);
    refresh();
  }

  function updateField<K extends keyof StoredMember>(key: K, value: StoredMember[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Gestion des membres</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {activeCount} membre{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""}
            {archivedCount > 0 && (
              <span className="ml-2 text-foreground-muted">
                — {archivedCount} archivé{archivedCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-full sm:w-72">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white pl-10 pr-4 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            />
          </div>
          <button
            onClick={openAdd}
            className="shrink-0 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
          <p className="text-2xl font-bold font-heading text-foreground">{activeCount}</p>
          <p className="text-xs text-foreground-muted">Membres actifs</p>
        </div>
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
          <p className="text-2xl font-bold font-heading text-[var(--gaspe-teal-600)]">{titulaireCount}</p>
          <p className="text-xs text-foreground-muted">Titulaires</p>
        </div>
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
          <p className="text-2xl font-bold font-heading text-[var(--gaspe-blue-500)]">{associeCount}</p>
          <p className="text-xs text-foreground-muted">Associés</p>
        </div>
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
          <p className="text-2xl font-bold font-heading text-foreground-muted">{archivedCount}</p>
          <p className="text-xs text-foreground-muted">Archivés</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "titulaire", "associe", "archived"] as const).map((f) => {
          const count =
            f === "all"
              ? activeCount
              : f === "archived"
                ? archivedCount
                : f === "titulaire"
                  ? titulaireCount
                  : associeCount;
          const label =
            f === "all" ? "Tous" : f === "archived" ? "Archivés" : categoryBadge[f].label + "s";
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
                filter === f
                  ? "bg-[var(--gaspe-teal-600)] text-white shadow-sm"
                  : "bg-white border border-[var(--gaspe-neutral-200)] text-foreground-muted hover:bg-[var(--gaspe-neutral-50)]"
              }`}
            >
              {label}
              <span
                className={`text-xs rounded-lg px-1.5 py-0.5 font-bold ${
                  filter === f ? "bg-white/20 text-white" : "bg-[var(--gaspe-neutral-100)] text-foreground-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1fr_120px_140px_80px_80px_80px_80px_180px] gap-4 px-6 py-3 bg-[var(--gaspe-neutral-50)] border-b border-[var(--gaspe-neutral-200)] text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          <span>Membre</span>
          <span>Ville</span>
          <span>Région</span>
          <span>Catégorie</span>
          <span>Navires</span>
          <span>Employés</span>
          <span>Statut</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center py-12 text-foreground-muted">Aucun membre trouvé.</p>
        ) : (
          <div className="divide-y divide-[var(--gaspe-neutral-100)]">
            {filtered.map((m) => (
              <div
                key={m.slug}
                className={`px-6 py-4 flex flex-col lg:grid lg:grid-cols-[1fr_120px_140px_80px_80px_80px_80px_180px] gap-3 lg:gap-4 lg:items-center transition-colors ${
                  m.archived ? "bg-[var(--gaspe-neutral-50)] opacity-70" : "hover:bg-[var(--gaspe-neutral-50)]/50"
                }`}
              >
                {/* Name */}
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-foreground truncate">{m.name}</p>
                  {m.websiteUrl && (
                    <a
                      href={m.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--gaspe-teal-600)] hover:underline truncate block"
                    >
                      {m.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                </div>

                {/* City */}
                <div className="text-sm text-foreground truncate">
                  <span className="lg:hidden text-xs font-semibold text-foreground-muted mr-1">Ville :</span>
                  {m.city}
                </div>

                {/* Region */}
                <div className="text-sm text-foreground-muted truncate">
                  <span className="lg:hidden text-xs font-semibold text-foreground-muted mr-1">Région :</span>
                  {m.region}
                </div>

                {/* Category */}
                <div>
                  <Badge variant={categoryBadge[m.category]?.variant ?? "neutral"}>
                    {categoryBadge[m.category]?.label ?? m.category}
                  </Badge>
                </div>

                {/* Ship count */}
                <div className="text-sm text-foreground">
                  <span className="lg:hidden text-xs font-semibold text-foreground-muted mr-1">Navires :</span>
                  {m.shipCount ?? "—"}
                </div>

                {/* Employee count */}
                <div className="text-sm text-foreground">
                  <span className="lg:hidden text-xs font-semibold text-foreground-muted mr-1">Employés :</span>
                  {m.employeeCount ?? "—"}
                </div>

                {/* Archived status */}
                <div>
                  {m.archived ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted">
                      <span className="h-2 w-2 rounded-full bg-[var(--gaspe-neutral-400)]" />
                      Archivé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gaspe-green-500)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--gaspe-green-400)]" />
                      Actif
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 lg:justify-end flex-wrap">
                  {m.archived ? (
                    <>
                      <button
                        onClick={() => handleUnarchive(m)}
                        className="rounded-lg bg-[var(--gaspe-teal-600)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
                      >
                        Restaurer
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        Supprimer
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openEdit(m)}
                        className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-[var(--gaspe-teal-50)] hover:text-[var(--gaspe-teal-600)] hover:border-[var(--gaspe-teal-200)] transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleArchive(m)}
                        className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-[var(--gaspe-warm-50)] hover:text-[var(--gaspe-warm-600)] hover:border-[var(--gaspe-warm-200)] transition-colors"
                      >
                        Archiver
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--gaspe-neutral-200)] bg-white px-6 py-4 rounded-t-2xl">
              <h2 className="font-heading text-lg font-bold text-foreground">
                {editingSlug ? "Modifier le membre" : "Ajouter un membre"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-foreground-muted hover:bg-[var(--gaspe-neutral-100)] transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Nom *</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => {
                    updateField("name", e.target.value);
                    if (!editingSlug) updateField("slug", slugify(e.target.value));
                  }}
                  placeholder="Nom de la compagnie"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Slug</label>
                <input
                  className={inputClass}
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="nom-de-la-compagnie"
                />
              </div>

              {/* City + Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Ville *</label>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Ville"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Région *</label>
                  <input
                    className={inputClass}
                    value={form.region}
                    onChange={(e) => updateField("region", e.target.value)}
                    placeholder="Région"
                  />
                </div>
              </div>

              {/* Latitude + Longitude */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={form.latitude}
                    onChange={(e) => updateField("latitude", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={form.longitude}
                    onChange={(e) => updateField("longitude", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Territory + Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Territoire</label>
                  <select
                    className={inputClass}
                    value={form.territory}
                    onChange={(e) => updateField("territory", e.target.value as "metropole" | "dom-tom")}
                  >
                    <option value="metropole">Métropole</option>
                    <option value="dom-tom">Outre-mer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Catégorie</label>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value as "titulaire" | "associe")}
                  >
                    <option value="titulaire">Titulaire</option>
                    <option value="associe">Associé</option>
                  </select>
                </div>
              </div>

              {/* Logo URL + Website URL */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">URL du logo</label>
                <input
                  className={inputClass}
                  value={form.logoUrl ?? ""}
                  onChange={(e) => updateField("logoUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Site web</label>
                <input
                  className={inputClass}
                  value={form.websiteUrl ?? ""}
                  onChange={(e) => updateField("websiteUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Employee count + Ship count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre d&apos;employés</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.employeeCount ?? ""}
                    onChange={(e) =>
                      updateField("employeeCount", e.target.value ? parseInt(e.target.value, 10) : undefined)
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre de navires</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.shipCount ?? ""}
                    onChange={(e) =>
                      updateField("shipCount", e.target.value ? parseInt(e.target.value, 10) : undefined)
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
                <textarea
                  className={inputClass + " min-h-[80px] resize-y"}
                  value={form.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Description courte du membre..."
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-[var(--gaspe-neutral-200)] bg-white px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-[var(--gaspe-neutral-200)] px-5 py-2.5 text-sm font-semibold text-foreground-muted hover:bg-[var(--gaspe-neutral-50)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.city.trim()}
                className="rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {editingSlug ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
