"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

const DOCUMENTS_KEY = "gaspe_documents";

interface GaspeDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  uploadDate: string;
  isPublic: boolean;
}

const CATEGORIES = [
  "Documents institutionnels",
  "Social (CCN 3228, accords de branche)",
  "Réglementaire",
  "Rapports",
];

const SEED_DOCUMENTS: GaspeDocument[] = [
  {
    id: "doc-seed-1",
    title: "CCN 3228 - Convention Collective Nationale",
    description: "Convention Collective Nationale des personnels navigants des entreprises de transport et services maritimes",
    category: "Social (CCN 3228, accords de branche)",
    fileUrl: "#",
    uploadDate: "2026-01-15",
    isPublic: false,
  },
  {
    id: "doc-seed-2",
    title: "Accord de branche - Salaires 2026",
    description: "Accord de branche relatif aux salaires minima pour l'année 2026",
    category: "Social (CCN 3228, accords de branche)",
    fileUrl: "#",
    uploadDate: "2026-02-01",
    isPublic: false,
  },
  {
    id: "doc-seed-3",
    title: "Statuts du GASPE",
    description: "Statuts de l'association GASPE mis à jour lors de la dernière AGE",
    category: "Documents institutionnels",
    fileUrl: "#",
    uploadDate: "2025-06-15",
    isPublic: true,
  },
  {
    id: "doc-seed-4",
    title: "Règlement intérieur",
    description: "Règlement intérieur du GASPE",
    category: "Documents institutionnels",
    fileUrl: "#",
    uploadDate: "2025-06-15",
    isPublic: false,
  },
];

function getDocuments(): GaspeDocument[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(DOCUMENTS_KEY);
  if (!raw) {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(SEED_DOCUMENTS));
    return SEED_DOCUMENTS;
  }
  try { return JSON.parse(raw); } catch { return []; }
}

export default function AdminDocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<GaspeDocument[]>(getDocuments);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    fileUrl: "#",
    isPublic: false,
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  function resetForm() {
    setForm({ title: "", description: "", category: "", fileUrl: "#", isPublic: false });
    setEditId(null);
    setShowForm(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let updated: GaspeDocument[];

    if (editId) {
      updated = documents.map((d) =>
        d.id === editId ? { ...d, ...form, uploadDate: d.uploadDate } : d
      );
    } else {
      const newDoc: GaspeDocument = {
        id: `doc-${Date.now()}`,
        ...form,
        uploadDate: new Date().toISOString().split("T")[0],
      };
      updated = [...documents, newDoc];
    }

    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updated));
    setDocuments(updated);
    resetForm();
  }

  function startEdit(doc: GaspeDocument) {
    setForm({
      title: doc.title,
      description: doc.description,
      category: doc.category,
      fileUrl: doc.fileUrl,
      isPublic: doc.isPublic,
    });
    setEditId(doc.id);
    setShowForm(true);
  }

  function deleteDocument(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    const updated = documents.filter((d) => d.id !== id);
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updated));
    setDocuments(updated);
  }

  const filtered = documents.filter((d) => !filterCat || d.category === filterCat);

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusIcon className="h-4 w-4" />
          Nouveau document
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">Toutes les cat&eacute;gories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Inline form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--gaspe-neutral-200)] border-l-[3px] border-l-[var(--gaspe-teal-600)] bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {editId ? "Modifier le document" : "Nouveau document"}
          </h2>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">Titre <span className="text-red-500">*</span></label>
            <input id="title" name="title" type="text" required value={form.title} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea id="description" name="description" rows={2} value={form.description} onChange={handleChange} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">Cat&eacute;gorie <span className="text-red-500">*</span></label>
              <select id="category" name="category" required value={form.category} onChange={handleChange} className={inputClass}>
                <option value="">S&eacute;lectionner...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fileUrl" className="block text-sm font-medium text-foreground mb-1">URL du fichier</label>
              <input id="fileUrl" name="fileUrl" type="text" value={form.fileUrl} onChange={handleChange} placeholder="https://..." className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input id="isPublic" name="isPublic" type="checkbox" checked={form.isPublic} onChange={handleChange} className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)] focus:ring-[var(--gaspe-teal-400)]" />
            <label htmlFor="isPublic" className="text-sm font-medium text-foreground">Visible par tous (sinon adh&eacute;rents uniquement)</label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--gaspe-neutral-100)]">
            <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors">
              Annuler
            </button>
            <Button type="submit">{editId ? "Mettre à jour" : "Créer"}</Button>
          </div>
        </form>
      )}

      {/* Documents grouped by category */}
      {CATEGORIES.map((cat) => {
        const catDocs = filtered.filter((d) => d.category === cat);
        if (catDocs.length === 0) return null;
        return (
          <div key={cat}>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">{cat}</h2>
            <div className="space-y-2">
              {catDocs.map((doc) => (
                <div key={doc.id} className="flex items-start justify-between rounded-2xl border border-[var(--gaspe-neutral-200)] border-l-[3px] border-l-[var(--gaspe-teal-600)] bg-white p-4 shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileIcon className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-heading text-sm font-semibold text-foreground">{doc.title}</h3>
                      <Badge variant={doc.isPublic ? "green" : "neutral"}>
                        {doc.isPublic ? "Public" : "Adhérents"}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground-muted ml-6">{doc.description}</p>
                    <p className="text-xs text-foreground-muted ml-6 mt-1">Ajout&eacute; le {formatDate(doc.uploadDate)}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(doc)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors">Modifier</button>
                    <button onClick={() => deleteDocument(doc.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-12 text-center">
          <h3 className="font-heading text-lg font-semibold text-foreground">Aucun document</h3>
          <p className="mt-2 text-sm text-foreground-muted">Ajoutez votre premier document.</p>
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

function FileIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
