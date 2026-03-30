"use client";

import { useRef, useCallback, useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Toolbar button definitions                                         */
/* ------------------------------------------------------------------ */

interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  command?: string;
  value?: string;
  group: "format" | "heading" | "list" | "insert" | "align";
  action?: "link" | "image" | "table" | "hr" | "columns";
}

const TOOLBAR: ToolbarAction[] = [
  // Format
  { id: "bold", label: "Gras", icon: "B", command: "bold", group: "format" },
  { id: "italic", label: "Italique", icon: "I", command: "italic", group: "format" },
  { id: "underline", label: "Souligné", icon: "U", command: "underline", group: "format" },
  { id: "strikethrough", label: "Barré", icon: "S", command: "strikeThrough", group: "format" },
  // Headings
  { id: "h2", label: "Titre 2", icon: "H2", command: "formatBlock", value: "h2", group: "heading" },
  { id: "h3", label: "Titre 3", icon: "H3", command: "formatBlock", value: "h3", group: "heading" },
  { id: "h4", label: "Titre 4", icon: "H4", command: "formatBlock", value: "h4", group: "heading" },
  { id: "p", label: "Paragraphe", icon: "¶", command: "formatBlock", value: "p", group: "heading" },
  // Lists
  { id: "ul", label: "Liste à puces", icon: "•", command: "insertUnorderedList", group: "list" },
  { id: "ol", label: "Liste numérotée", icon: "1.", command: "insertOrderedList", group: "list" },
  { id: "blockquote", label: "Citation", icon: "❝", command: "formatBlock", value: "blockquote", group: "list" },
  // Align
  { id: "left", label: "Aligner à gauche", icon: "⫷", command: "justifyLeft", group: "align" },
  { id: "center", label: "Centrer", icon: "⫸", command: "justifyCenter", group: "align" },
  { id: "right", label: "Aligner à droite", icon: "⫹", command: "justifyRight", group: "align" },
  // Insert
  { id: "link", label: "Lien", icon: "🔗", group: "insert", action: "link" },
  { id: "image", label: "Image", icon: "🖼", group: "insert", action: "image" },
  { id: "table", label: "Tableau", icon: "⊞", group: "insert", action: "table" },
  { id: "hr", label: "Ligne horizontale", icon: "—", group: "insert", action: "hr" },
  { id: "columns", label: "Colonnes", icon: "⫼", group: "insert", action: "columns" },
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  onMediaLibraryOpen?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Commencez à écrire...",
  minHeight = 300,
  onMediaLibraryOpen,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const isInitialized = useRef(false);

  // Set initial content
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value;
      isInitialized.current = true;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  function exec(command: string, val?: string) {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  }

  function handleToolbarClick(action: ToolbarAction) {
    if (action.command) {
      exec(action.command, action.value ? `<${action.value}>` : undefined);
    } else if (action.action === "link") {
      const sel = window.getSelection();
      setLinkText(sel?.toString() ?? "");
      setLinkUrl("");
      setShowLinkModal(true);
    } else if (action.action === "image") {
      setImageUrl("");
      setImageAlt("");
      setShowImageModal(true);
    } else if (action.action === "table") {
      setTableRows(3);
      setTableCols(3);
      setShowTableModal(true);
    } else if (action.action === "hr") {
      exec("insertHTML", "<hr />");
    } else if (action.action === "columns") {
      const html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div><p>Colonne 1</p></div><div><p>Colonne 2</p></div></div>`;
      exec("insertHTML", html);
    }
  }

  function insertLink() {
    if (!linkUrl) return;
    const html = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText || linkUrl}</a>`;
    exec("insertHTML", html);
    setShowLinkModal(false);
  }

  function insertImage() {
    if (!imageUrl) return;
    const html = `<figure><img src="${imageUrl}" alt="${imageAlt}" style="max-width:100%;border-radius:8px;" />${imageAlt ? `<figcaption style="text-align:center;font-size:0.875rem;color:var(--gaspe-neutral-600);margin-top:0.5rem;">${imageAlt}</figcaption>` : ""}</figure>`;
    exec("insertHTML", html);
    setShowImageModal(false);
  }

  function insertTable() {
    let html = '<table style="width:100%;border-collapse:collapse;margin:1rem 0;">';
    // Header
    html += "<thead><tr>";
    for (let c = 0; c < tableCols; c++) {
      html += `<th style="border:1px solid var(--gaspe-neutral-300);padding:8px 12px;background:var(--gaspe-neutral-100);text-align:left;font-weight:600;">En-tête ${c + 1}</th>`;
    }
    html += "</tr></thead><tbody>";
    // Body rows
    for (let r = 0; r < tableRows - 1; r++) {
      html += "<tr>";
      for (let c = 0; c < tableCols; c++) {
        html += '<td style="border:1px solid var(--gaspe-neutral-300);padding:8px 12px;">Cellule</td>';
      }
      html += "</tr>";
    }
    html += "</tbody></table>";
    exec("insertHTML", html);
    setShowTableModal(false);
  }

  const btnBase = "flex items-center justify-center h-8 w-8 rounded-lg text-xs font-semibold transition-colors text-[var(--gaspe-neutral-700)] hover:bg-[var(--gaspe-teal-100)] hover:text-[var(--gaspe-teal-700)]";
  const btnActive = "bg-[var(--color-surface-teal)] text-[var(--color-primary)]";
  const inputClass = "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-surface px-3 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

  const groups = ["format", "heading", "list", "align", "insert"] as const;

  return (
    <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-surface overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-100)] px-2 py-1.5">
        {groups.map((group, gi) => (
          <div key={group} className="flex items-center">
            {gi > 0 && <div className="mx-1 h-5 w-px bg-[var(--gaspe-neutral-300)]" />}
            {TOOLBAR.filter((a) => a.group === group).map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleToolbarClick(action)}
                className={btnBase}
                title={action.label}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        ))}

        {/* Media library button */}
        {onMediaLibraryOpen && (
          <>
            <div className="mx-1 h-5 w-px bg-[var(--gaspe-neutral-300)]" />
            <button
              type="button"
              onClick={onMediaLibraryOpen}
              className={`${btnBase} px-2 w-auto gap-1 text-[var(--color-primary)]`}
              title="Bibliothèque de médias"
              aria-label="Bibliothèque de médias"
            >
              📁 Médias
            </button>
          </>
        )}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted prose-li:text-foreground-muted prose-strong:text-foreground prose-a:text-[var(--gaspe-teal-600)] max-w-none px-5 py-4 focus:outline-none"
        style={{
          minHeight: `${minHeight}px`,
        }}
        suppressContentEditableWarning
      />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" onClick={() => setShowLinkModal(false)}>
          <div className="rounded-2xl bg-white p-6 shadow-xl w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Insérer un lien</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">URL</label>
                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className={inputClass} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Texte du lien</label>
                <input type="text" value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Texte affiché" className={inputClass} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLinkModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface">Annuler</button>
                <button type="button" onClick={insertLink} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">Insérer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" onClick={() => setShowImageModal(false)}>
          <div className="rounded-2xl bg-white p-6 shadow-xl w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Insérer une image</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">URL de l&apos;image</label>
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className={inputClass} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Texte alternatif</label>
                <input type="text" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Description de l'image" className={inputClass} />
              </div>
              {onMediaLibraryOpen && (
                <button type="button" onClick={() => { setShowImageModal(false); onMediaLibraryOpen(); }} className="w-full rounded-xl border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-surface-teal">
                  📁 Choisir depuis la bibliothèque
                </button>
              )}
              {imageUrl && (
                <div className="rounded-xl border border-[var(--gaspe-neutral-200)] p-2">
                  <img src={imageUrl} alt={imageAlt} className="max-h-32 rounded-lg object-contain mx-auto" />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowImageModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface">Annuler</button>
                <button type="button" onClick={insertImage} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">Insérer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" onClick={() => setShowTableModal(false)}>
          <div className="rounded-2xl bg-white p-6 shadow-xl w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Insérer un tableau</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Lignes</label>
                  <input type="number" min={2} max={20} value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value, 10))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Colonnes</label>
                  <input type="number" min={2} max={10} value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value, 10))} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTableModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface">Annuler</button>
                <button type="button" onClick={insertTable} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">Insérer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state placeholder styling */}
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: var(--gaspe-neutral-400);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
