"use client";

/**
 * Éditeur CMS pour une section de type `video` — voir `PageSection.type === "video"`.
 * Stocke le payload en JSON dans `section.content` (format VideoSectionPayload).
 * Expose : URL de la vidéo (obligatoire), URL du poster (optionnel), toggles
 * autoplay / loop / muted.
 *
 * Le rendu côté public doit parser le JSON via `parseVideoPayload()` et rendre
 * un `<video>` natif (ou `<iframe>` pour YouTube/Vimeo si l'URL matche).
 */
import { useMemo } from "react";
import { parseVideoPayload, type VideoSectionPayload } from "@/lib/cms-store";

interface VideoSectionEditorProps {
  content: string;
  onChange: (json: string) => void;
}

export function VideoSectionEditor({ content, onChange }: VideoSectionEditorProps) {
  const payload = useMemo<VideoSectionPayload>(
    () =>
      parseVideoPayload(content) ?? {
        url: "",
        poster: "",
        autoplay: false,
        loop: false,
        muted: true,
      },
    [content],
  );

  function update(partial: Partial<VideoSectionPayload>) {
    const next: VideoSectionPayload = { ...payload, ...partial };
    // Normalise les champs vides : on évite de stocker `poster: ""` → undefined
    if (!next.poster || !next.poster.trim()) delete next.poster;
    onChange(JSON.stringify(next));
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-foreground-muted mb-1">
          URL de la vidéo (MP4 / WebM ou embed YouTube/Vimeo)
        </label>
        <input
          type="url"
          value={payload.url}
          onChange={(e) => update({ url: e.target.value })}
          placeholder="/assets/video.mp4 ou https://..."
          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground-muted mb-1">
          URL du poster (image de remplacement pendant le chargement)
        </label>
        <input
          type="url"
          value={payload.poster ?? ""}
          onChange={(e) => update({ poster: e.target.value })}
          placeholder="/og-image.png"
          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-4 pt-1">
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={Boolean(payload.autoplay)}
            onChange={(e) => update({ autoplay: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)] focus:ring-[var(--gaspe-teal-400)]"
          />
          Lecture automatique
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={Boolean(payload.loop)}
            onChange={(e) => update({ loop: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)] focus:ring-[var(--gaspe-teal-400)]"
          />
          Lecture en boucle
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={Boolean(payload.muted)}
            onChange={(e) => update({ muted: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)] focus:ring-[var(--gaspe-teal-400)]"
          />
          Coupé (muted) – requis pour l&apos;autoplay sur mobile
        </label>
      </div>

      {payload.url && (
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] p-3">
          <p className="text-xs font-medium text-foreground-muted mb-2">Aperçu</p>
          <video
            src={payload.url}
            poster={payload.poster || undefined}
            controls
            muted={payload.muted ?? true}
            loop={payload.loop ?? false}
            playsInline
            preload="metadata"
            className="w-full max-h-48 rounded-lg bg-black"
          />
        </div>
      )}
    </div>
  );
}
