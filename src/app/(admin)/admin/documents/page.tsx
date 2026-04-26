"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { formatDate } from "@/lib/utils";
import { isApiMode } from "@/lib/api-client";
import type { MediaItem, ApiMediaItem } from "@/lib/cms-store";
import {
  listDocuments,
  saveDocument,
  deleteDocument as deleteDocumentApi,
} from "@/lib/documents-store";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
  type GaspeDocument,
} from "@/data/documents-seed";

const emptyForm: GaspeDocument = {
  id: "",
  title: "",
  description: "",
  category: "institutionnels",
  fileUrl: "#",
  fileName: "",
  publishedAt: null,
  sortOrder: 0,
  isPublic: true,
  published: true,
};

export default function AdminDocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<GaspeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<DocumentCategory | "">("");
  const [form, setForm] = useState<GaspeDocument>(emptyForm);
  const [showMedia, setShowMedia] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !(user.role === "admin" || user.role === "staff")) router.push("/connexion");
  }, [user, router]);

  useEffect(() => {
    if (!user || !(user.role === "admin" || user.role === "staff")) return;
    startTransition(() => {
      setLoading(true);
      listDocuments(true).then((docs) => {
        setDocuments(docs);
        setLoading(false);
      });
    });
  }, [user]);

  async function refresh() {
    const docs = await listDocuments(true);
    setDocuments(docs);
  }

  function resetForm() {
    setForm({ ...emptyForm, id: "" });
    setEditId(null);
    setShowForm(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
    } else if (target instanceof HTMLInputElement && target.type === "number") {
      setForm((prev) => ({ ...prev, [target.name]: Number(target.value) || 0 }));
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveDocument({ ...form, id: editId ?? form.id });
      await refresh();
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(doc: GaspeDocument) {
    setForm({ ...doc });
    setEditId(doc.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    await deleteDocumentApi(id);
    await refresh();
  }

  function handleMediaSelect(media: MediaItem | ApiMediaItem) {
    const apiBase =
      typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL ?? "" : "";
    const url =
      "data" in media
        ? media.data
        : isApiMode() && apiBase
          ? `${apiBase}/api/media/raw/${(media as ApiMediaItem).r2Key}`
          : "";
    if (url) {
      setForm((prev) => ({
        ...prev,
        fileUrl: url,
        fileName: prev.fileName || media.name,
      }));
    }
    setShowMedia(false);
  }

  if (!user || !(user.role === "admin" || user.role === "staff")) return null;

  const filtered = documents.filter(
    (d) => !filterCat || d.category === filterCat,
  );

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Documents
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {loading
              ? "Chargement…"
              : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ ...emptyForm, id: "" });
            setEditId(null);
            setShowForm(true);
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Nouveau document
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as DocumentCategory | "")}
          className="rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">Toutes les catégories</option>
          {DOCUMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {DOCUMENT_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--gaspe-neutral-200)] border-l-[3px] border-l-[var(--gaspe-teal-600)] bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {editId ? "Modifier le document" : "Nouveau document"}
          </h2>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={form.description}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {DOCUMENT_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="publishedAt"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Date de publication
              </label>
              <input
                id="publishedAt"
                name="publishedAt"
                type="date"
                value={form.publishedAt ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    publishedAt: e.target.value || null,
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="fileUrl"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Fichier
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="fileUrl"
                name="fileUrl"
                type="text"
                value={form.fileUrl}
                onChange={handleChange}
                placeholder="https://… ou /assets/… ou /api/media/raw/…"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => setShowMedia(true)}
                className="shrink-0 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
              >
                Depuis la Media Library
              </button>
            </div>
            <p className="mt-1.5 text-xs text-foreground-muted">
              URL du PDF. Upload d&apos;abord le fichier via{" "}
              <a
                href="/admin/pages"
                className="text-primary underline-offset-2 hover:underline"
              >
                Media Library
              </a>{" "}
              (ou directement ici), puis colle l&apos;URL. Laisser <code>#</code>{" "}
              si pas encore disponible.
            </p>
          </div>

          <div>
            <label
              htmlFor="fileName"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Nom du fichier affiché
            </label>
            <input
              id="fileName"
              name="fileName"
              type="text"
              value={form.fileName}
              onChange={handleChange}
              placeholder="NAO-2026.pdf"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Ordre d&apos;affichage
              </label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="isPublic"
                  name="isPublic"
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)] focus:ring-[var(--gaspe-teal-400)]"
                />
                <span className="text-sm font-medium text-foreground">
                  Visible par tous
                </span>
              </label>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="published"
                  name="published"
                  type="checkbox"
                  checked={form.published}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)] focus:ring-[var(--gaspe-teal-400)]"
                />
                <span className="text-sm font-medium text-foreground">
                  Publié
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--gaspe-neutral-100)]">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Enregistrement…"
                : editId
                  ? "Mettre à jour"
                  : "Créer"}
            </Button>
          </div>
        </form>
      )}

      {/* Documents grouped by category */}
      {DOCUMENT_CATEGORIES.map((cat) => {
        const catDocs = filtered
          .filter((d) => d.category === cat)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (catDocs.length === 0) return null;
        return (
          <div key={cat}>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              {DOCUMENT_CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-2">
              {catDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between rounded-2xl border border-[var(--gaspe-neutral-200)] border-l-[3px] border-l-[var(--gaspe-teal-600)] bg-white p-4 shadow-sm"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <FileIcon className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-heading text-sm font-semibold text-foreground">
                        {doc.title}
                      </h3>
                      <Badge variant={doc.isPublic ? "green" : "neutral"}>
                        {doc.isPublic ? "Public" : "Adhérents"}
                      </Badge>
                      {!doc.published && (
                        <Badge variant="warm">Brouillon</Badge>
                      )}
                      {doc.fileUrl === "#" && (
                        <Badge variant="neutral">Pas de PDF</Badge>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-foreground-muted ml-6">
                        {doc.description}
                      </p>
                    )}
                    <p className="text-xs text-foreground-muted ml-6 mt-1">
                      {doc.publishedAt
                        ? `Publié le ${formatDate(doc.publishedAt)}`
                        : "Sans date"}
                      {doc.fileUrl && doc.fileUrl !== "#" && (
                        <>
                          {" · "}
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline underline-offset-2"
                          >
                            Aperçu
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(doc)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => void handleDelete(doc.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {!loading && documents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--gaspe-neutral-300)] bg-surface p-10 text-center">
          <p className="text-sm text-foreground-muted">
            Aucun document pour l&apos;instant. Clique sur{" "}
            <strong>Nouveau document</strong> pour commencer.
          </p>
        </div>
      )}

      <MediaLibrary
        open={showMedia}
        onClose={() => setShowMedia(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────── */

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}
