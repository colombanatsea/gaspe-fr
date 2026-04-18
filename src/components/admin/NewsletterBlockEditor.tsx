"use client";

import { Badge } from "@/components/ui/Badge";
import type { NewsletterBlock } from "@/lib/newsletter/types";

const BLOCK_LABELS: Record<NewsletterBlock["type"], string> = {
  header: "En-tête (logo)",
  heading: "Titre",
  paragraph: "Paragraphe",
  image: "Image",
  button: "Bouton",
  divider: "Séparateur",
  columns: "2 colonnes",
  spacer: "Espaceur",
  footer: "Pied de page",
};

interface BlockEditorProps {
  block: NewsletterBlock;
  onChange: (block: NewsletterBlock) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const inputClass =
  "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

export function NewsletterBlockEditor({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: BlockEditorProps) {
  return (
    <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--gaspe-neutral-100)] bg-[var(--gaspe-neutral-50)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{BLOCK_LABELS[block.type]}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="Monter"
            className="px-2 py-1 text-xs text-foreground-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="Descendre"
            className="px-2 py-1 text-xs text-foreground-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Supprimer"
            className="px-2 py-1 text-xs text-red-500 hover:text-red-600 ml-1"
          >
            ×
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {block.type === "header" && (
          <>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted">Variante</span>
              <select
                value={block.variant}
                onChange={(e) => onChange({ ...block, variant: e.target.value as "gradient" | "white" })}
                className={inputClass}
              >
                <option value="gradient">Gradient teal (fond coloré)</option>
                <option value="white">Blanc (logo sur fond blanc)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted">Sous-titre (optionnel)</span>
              <input
                type="text"
                value={block.subtitle ?? ""}
                onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
                placeholder="Localement ancrés. Socialement engagés."
                className={inputClass}
              />
            </label>
          </>
        )}

        {block.type === "heading" && (
          <>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted">Texte</span>
              <input
                type="text"
                value={block.text}
                onChange={(e) => onChange({ ...block, text: e.target.value })}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-foreground-muted">Niveau</span>
                <select
                  value={block.level}
                  onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 1 | 2 | 3 })}
                  className={inputClass}
                >
                  <option value={1}>H1 (grand)</option>
                  <option value={2}>H2 (moyen)</option>
                  <option value={3}>H3 (petit)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-foreground-muted">Alignement</span>
                <select
                  value={block.align}
                  onChange={(e) => onChange({ ...block, align: e.target.value as "left" | "center" | "right" })}
                  className={inputClass}
                >
                  <option value="left">Gauche</option>
                  <option value="center">Centré</option>
                  <option value="right">Droite</option>
                </select>
              </label>
            </div>
          </>
        )}

        {block.type === "paragraph" && (
          <label className="block">
            <span className="text-xs font-medium text-foreground-muted">Contenu HTML</span>
            <textarea
              value={block.html}
              onChange={(e) => onChange({ ...block, html: e.target.value })}
              rows={6}
              placeholder="<p>Votre texte ici. HTML simple : &lt;strong&gt;, &lt;em&gt;, &lt;a href&gt;, &lt;ul&gt;, &lt;li&gt;</p>"
              className={`${inputClass} font-mono text-xs`}
            />
          </label>
        )}

        {block.type === "image" && (
          <>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted">URL de l&apos;image</span>
              <input
                type="url"
                value={block.url}
                onChange={(e) => onChange({ ...block, url: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted">Texte alternatif (alt)</span>
              <input
                type="text"
                value={block.alt}
                onChange={(e) => onChange({ ...block, alt: e.target.value })}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-foreground-muted">Largeur</span>
                <select
                  value={block.width}
                  onChange={(e) => onChange({ ...block, width: e.target.value as "full" | "half" })}
                  className={inputClass}
                >
                  <option value="full">100%</option>
                  <option value="half">50%</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-foreground-muted">Lien (optionnel)</span>
                <input
                  type="url"
                  value={block.link ?? ""}
                  onChange={(e) => onChange({ ...block, link: e.target.value || undefined })}
                  placeholder="https://..."
                  className={inputClass}
                />
              </label>
            </div>
          </>
        )}

        {block.type === "button" && (
          <>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted">Libellé</span>
              <input
                type="text"
                value={block.label}
                onChange={(e) => onChange({ ...block, label: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted">URL</span>
              <input
                type="url"
                value={block.url}
                onChange={(e) => onChange({ ...block, url: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-foreground-muted">Couleur</span>
                <select
                  value={block.color}
                  onChange={(e) => onChange({ ...block, color: e.target.value as "teal" | "neutral" })}
                  className={inputClass}
                >
                  <option value="teal">Teal GASPE</option>
                  <option value="neutral">Neutre (gris)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-foreground-muted">Alignement</span>
                <select
                  value={block.align}
                  onChange={(e) => onChange({ ...block, align: e.target.value as "left" | "center" | "right" })}
                  className={inputClass}
                >
                  <option value="left">Gauche</option>
                  <option value="center">Centré</option>
                  <option value="right">Droite</option>
                </select>
              </label>
            </div>
          </>
        )}

        {block.type === "divider" && (
          <label className="block">
            <span className="text-xs font-medium text-foreground-muted">Style</span>
            <select
              value={block.style}
              onChange={(e) => onChange({ ...block, style: e.target.value as "solid" | "dashed" | "gradient" })}
              className={inputClass}
            >
              <option value="solid">Ligne fine</option>
              <option value="dashed">Pointillés</option>
              <option value="gradient">Dégradé GASPE</option>
            </select>
          </label>
        )}

        {block.type === "spacer" && (
          <label className="block">
            <span className="text-xs font-medium text-foreground-muted">Hauteur (px)</span>
            <input
              type="number"
              min={4}
              max={100}
              value={block.height}
              onChange={(e) => onChange({ ...block, height: parseInt(e.target.value, 10) || 20 })}
              className={inputClass}
            />
          </label>
        )}

        {block.type === "columns" && (
          <>
            <p className="text-xs text-foreground-muted">Max 2 colonnes. Chaque colonne accepte du HTML et une image optionnelle.</p>
            {block.items.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--gaspe-neutral-100)] p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Colonne {idx + 1}</p>
                <input
                  type="url"
                  value={item.image ?? ""}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[idx] = { ...items[idx], image: e.target.value || undefined };
                    onChange({ ...block, items });
                  }}
                  placeholder="URL image (optionnel)"
                  className={inputClass}
                />
                <textarea
                  value={item.html}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[idx] = { ...items[idx], html: e.target.value };
                    onChange({ ...block, items });
                  }}
                  rows={3}
                  placeholder="<p>Texte de la colonne</p>"
                  className={`${inputClass} font-mono text-xs`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const items = block.items.filter((_, i) => i !== idx);
                    onChange({ ...block, items });
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Supprimer cette colonne
                </button>
              </div>
            ))}
            {block.items.length < 2 && (
              <button
                type="button"
                onClick={() => onChange({ ...block, items: [...block.items, { html: "<p>Texte</p>" }] })}
                className="text-sm text-primary hover:underline font-medium"
              >
                + Ajouter une colonne
              </button>
            )}
          </>
        )}

        {block.type === "footer" && (
          <>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block.showUnsub}
                onChange={(e) => onChange({ ...block, showUnsub: e.target.checked })}
              />
              <span className="text-sm">Afficher le lien de désinscription (obligatoire RGPD)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block.showContactAddress}
                onChange={(e) => onChange({ ...block, showContactAddress: e.target.checked })}
              />
              <span className="text-sm">Afficher l&apos;adresse postale du GASPE</span>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
