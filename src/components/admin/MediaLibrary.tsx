"use client";

import { useState, useRef, useCallback } from "react";
import { getMedia, addMedia, deleteMedia, type MediaItem } from "@/lib/cms-store";

interface MediaLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (item: MediaItem) => void;
}

const MAX_FILE_SIZE = 5_000_000; // 5 MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function isImage(type: string) {
  return type.startsWith("image/");
}

export function MediaLibrary({ open, onClose, onSelect }: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>(() => getMedia());
  const [filter, setFilter] = useState<"all" | "images" | "documents">("all");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshItems = useCallback(() => setItems(getMedia()), []);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const promises = Array.from(files).map((file) => {
      return new Promise<void>((resolve) => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`"${file.name}" dépasse 5 Mo.`);
          resolve();
          return;
        }
        if (!ACCEPTED_TYPES.includes(file.type)) {
          alert(`Type non accepté : ${file.type}`);
          resolve();
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          addMedia({
            id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: file.type,
            data: reader.result as string,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(() => {
      refreshItems();
      setUploading(false);
    });
  }

  function handleDelete(id: string) {
    deleteMedia(id);
    refreshItems();
  }

  const filtered = items.filter((item) => {
    if (filter === "images") return isImage(item.type);
    if (filter === "documents") return !isImage(item.type);
    return true;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="rounded-2xl bg-white shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--gaspe-neutral-200)] px-6 py-4">
          <h2 className="font-heading text-xl font-bold text-foreground">Bibliothèque de médias</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-surface" aria-label="Fermer">
            <svg className="h-5 w-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-[var(--gaspe-neutral-200)] px-6 py-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Uploader
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="flex gap-1 ml-auto">
            {(["all", "images", "documents"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === f ? "bg-primary text-white" : "bg-surface text-foreground-muted hover:bg-surface-teal"
                }`}
              >
                {f === "all" ? "Tous" : f === "images" ? "Images" : "Documents"}
              </button>
            ))}
          </div>
          <span className="text-xs text-foreground-muted">{filtered.length} fichier{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Content */}
        <div
          className={`flex-1 overflow-y-auto p-6 ${dragOver ? "bg-[var(--gaspe-teal-50)]" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          {uploading && (
            <div className="mb-4 rounded-xl bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-teal-200)] p-3 text-sm text-[var(--gaspe-teal-600)] text-center">
              Upload en cours...
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="h-16 w-16 text-[var(--gaspe-neutral-300)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <p className="font-heading text-lg font-semibold text-foreground">Aucun média</p>
              <p className="text-sm text-foreground-muted mt-1">Glissez-déposez des fichiers ici ou cliquez sur Uploader</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-[var(--gaspe-neutral-200)] overflow-hidden hover:border-[var(--gaspe-teal-300)] transition-colors cursor-pointer"
                  onClick={() => onSelect?.(item)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-[var(--gaspe-neutral-50)] flex items-center justify-center overflow-hidden">
                    {isImage(item.type) ? (
                      <img src={item.data} alt={item.alt ?? item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4">
                        <svg className="h-10 w-10 text-[var(--gaspe-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <span className="text-xs text-foreground-muted text-center truncate max-w-full px-2">{item.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Info bar */}
                  <div className="px-2 py-1.5 bg-white border-t border-[var(--gaspe-neutral-100)]">
                    <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-foreground-muted">{formatBytes(item.size)}</p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="absolute top-1.5 right-1.5 rounded-lg bg-white/90 p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                    aria-label="Supprimer"
                  >
                    <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>

                  {/* Select overlay */}
                  {onSelect && (
                    <div className="absolute inset-0 bg-[var(--gaspe-teal-600)]/0 group-hover:bg-[var(--gaspe-teal-600)]/10 transition-colors flex items-center justify-center">
                      <span className="hidden group-hover:inline-flex items-center gap-1 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] shadow-sm">
                        Sélectionner
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
