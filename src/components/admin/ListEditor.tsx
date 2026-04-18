"use client";

import { useMemo } from "react";
import { RichTextEditor } from "./RichTextEditor";

type FieldType = "text" | "richtext" | "url";

interface ListField {
  id: string;
  label: string;
  type: FieldType;
}

interface ListEditorProps {
  /** JSON-stringified array of items */
  value: string;
  onChange: (json: string) => void;
  fields: ListField[];
}

type Item = Record<string, string>;

function parseItems(value: string, fields: ListField[]): Item[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      const normalized: Item = {};
      for (const f of fields) normalized[f.id] = String(item?.[f.id] ?? "");
      return normalized;
    });
  } catch {
    return [];
  }
}

function emptyItem(fields: ListField[]): Item {
  const item: Item = {};
  for (const f of fields) item[f.id] = "";
  return item;
}

export function ListEditor({ value, onChange, fields }: ListEditorProps) {
  const items = useMemo(() => parseItems(value, fields), [value, fields]);

  function update(next: Item[]) {
    onChange(JSON.stringify(next));
  }

  function updateItem(index: number, fieldId: string, fieldValue: string) {
    const next = items.map((item, i) =>
      i === index ? { ...item, [fieldId]: fieldValue } : item
    );
    update(next);
  }

  function addItem() {
    update([...items, emptyItem(fields)]);
  }

  function removeItem(index: number) {
    update(items.filter((_, i) => i !== index));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--gaspe-neutral-300)] p-6 text-center text-sm text-foreground-muted">
          Aucun élément. Cliquez sur &laquo; Ajouter &raquo; pour commencer.
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Élément {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="rounded-lg p-1.5 text-foreground-muted hover:bg-white hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Monter"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                className="rounded-lg p-1.5 text-foreground-muted hover:bg-white hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Descendre"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                aria-label="Supprimer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-xs font-medium text-foreground-muted">
                  {field.label}
                </label>
                {field.type === "richtext" ? (
                  <RichTextEditor
                    value={item[field.id] || ""}
                    onChange={(html) => updateItem(index, field.id, html)}
                    minHeight={100}
                  />
                ) : (
                  <input
                    type={field.type === "url" ? "url" : "text"}
                    value={item[field.id] || ""}
                    onChange={(e) => updateItem(index, field.id, e.target.value)}
                    placeholder={field.label}
                    className="w-full rounded-lg border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-xl border-2 border-dashed border-[var(--gaspe-neutral-300)] px-4 py-3 text-sm font-medium text-foreground-muted hover:border-[var(--gaspe-teal-400)] hover:text-[var(--gaspe-teal-600)] transition-colors"
      >
        + Ajouter un élément
      </button>
    </div>
  );
}
