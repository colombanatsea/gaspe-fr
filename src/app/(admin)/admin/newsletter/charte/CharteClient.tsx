"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import {
  getPageContent,
  savePageContent,
  apiGetPageContent,
  apiSavePageContent,
  PAGE_DEFINITIONS,
  type PageSection,
} from "@/lib/cms-store";
import { isApiMode } from "@/lib/api-client";
import { getCmsDefault } from "@/data/cms-defaults";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

const PAGE_ID = "newsletter-charte";

export function CharteClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<PageSection[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") router.push("/connexion");
  }, [user, router]);

  useEffect(() => {
    const def = PAGE_DEFINITIONS.find((p) => p.id === PAGE_ID);
    if (!def) return;

    async function load() {
      const stored = isApiMode()
        ? await apiGetPageContent(PAGE_ID)
        : getPageContent(PAGE_ID);
      const storedMap = new Map((stored?.sections ?? []).map((s) => [s.id, s.content]));
      if (!def) return;
      const initial: PageSection[] = def.sections.map((s) => ({
        id: s.id,
        label: s.label,
        type: s.type,
        content: storedMap.get(s.id) ?? getCmsDefault(PAGE_ID, s.id),
      }));
      setSections(initial);
    }
    load();
  }, [user]);

  function update(id: string, value: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content: value } : s)));
  }

  async function save() {
    const payload = {
      pageId: PAGE_ID,
      sections,
      updatedAt: new Date().toISOString(),
    };
    if (isApiMode()) {
      await apiSavePageContent(payload);
    } else {
      savePageContent(payload);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function reset(id: string) {
    update(id, getCmsDefault(PAGE_ID, id));
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.id} className="rounded-2xl bg-background border border-border-light p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="font-heading text-sm font-semibold text-foreground">{s.label}</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => reset(s.id)} className="text-xs text-foreground-muted hover:text-primary underline">
                Réinitialiser
              </button>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase font-medium text-foreground-muted">
                {s.type}
              </span>
            </div>
          </div>
          {s.type === "richtext" ? (
            <RichTextEditor value={s.content} onChange={(html) => update(s.id, html)} minHeight={120} />
          ) : s.type === "image" ? (
            <div className="flex items-start gap-3">
              {s.content && (
                <Image
                  src={s.content}
                  alt="Logo"
                  width={56}
                  height={56}
                  unoptimized
                  loading="lazy"
                  className="h-14 w-14 rounded-lg object-contain border border-border-light"
                />
              )}
              <input
                type="url"
                value={s.content}
                onChange={(e) => update(s.id, e.target.value)}
                placeholder="URL du logo…"
                className="flex-1 rounded-xl border border-border-light bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ) : s.id.endsWith("-color") ? (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={s.content && /^#[0-9a-f]{6}$/i.test(s.content) ? s.content : "#1B7E8A"}
                onChange={(e) => update(s.id, e.target.value.toUpperCase())}
                className="h-10 w-14 rounded-lg border border-border-light cursor-pointer"
              />
              <input
                type="text"
                value={s.content}
                onChange={(e) => update(s.id, e.target.value)}
                placeholder="#1B7E8A"
                className="flex-1 rounded-xl border border-border-light bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ) : (
            <input
              type="text"
              value={s.content}
              onChange={(e) => update(s.id, e.target.value)}
              className="w-full rounded-xl border border-border-light bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>
      ))}

      {/* Aperçu simplifié de l'header newsletter */}
      <div className="rounded-2xl border border-border-light overflow-hidden">
        <div className="px-3 py-2 bg-surface text-xs font-semibold text-foreground-muted">Aperçu header newsletter</div>
        <div style={{ background: sections.find((s) => s.id === "background-color")?.content || "#F5F3F0", padding: 24 }}>
          <div style={{ background: sections.find((s) => s.id === "primary-color")?.content || "#1B7E8A", padding: 24, borderRadius: 12, textAlign: "center", color: "white" }}>
            <h2 style={{ fontFamily: "Exo 2,sans-serif", margin: 0 }}>{sections.find((s) => s.id === "sender-name")?.content || "GASPE"}</h2>
            <p style={{ fontFamily: "DM Sans,sans-serif", margin: "6px 0 0", fontSize: 13, opacity: 0.85 }}>
              {sections.find((s) => s.id === "tagline")?.content}
            </p>
          </div>
          <div
            style={{ marginTop: 24, padding: 16, borderTop: "1px solid #ddd", fontSize: 12, color: "#555" }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(sections.find((s) => s.id === "footer-html")?.content ?? "") }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-green-600 font-medium">Enregistré ✓</span>}
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Enregistrer la charte
        </button>
      </div>
    </div>
  );
}
