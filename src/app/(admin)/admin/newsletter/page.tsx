"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { NEWSLETTER_CATEGORIES } from "@/lib/auth/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const inputClass =
  "mt-1 block w-full rounded-xl border border-border-light bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function buildNewsletterHtml(content: string, categoryLabel: string): string {
  const bodyHtml = content
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#222221;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:24px;">GASPE</h1>
      <p style="margin:4px 0 0;color:#B2DFE3;font-family:'DM Sans',Helvetica,sans-serif;font-size:13px;">Localement ancrés. Socialement engagés.</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:12px;color:#6B6560;text-transform:uppercase;letter-spacing:0.5px;">${categoryLabel}</p>
      ${bodyHtml}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #DCD5CC;text-align:center;font-size:12px;color:#6B6560;">
      <p style="margin:0;">GASPE – Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau</p>
      <p style="margin:4px 0 0;">Pour modifier vos préférences de newsletter, connectez-vous sur votre espace.</p>
    </div>
  </div>
</body>
</html>`;
}

export default function AdminNewsletterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") router.push("/connexion");
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!selectedCategory || !subject.trim() || !content.trim()) {
      setResult({ type: "error", message: "Veuillez remplir tous les champs." });
      return;
    }

    const categoryInfo = NEWSLETTER_CATEGORIES.find((c) => c.key === selectedCategory);
    if (!categoryInfo) return;

    setSending(true);

    if (!API_URL) {
      // Demo mode – no API configured
      console.warn("[Newsletter] Mode démo – API_URL non configurée");
      await new Promise((r) => setTimeout(r, 1000));
      setSending(false);
      setResult({ type: "success", message: "Newsletter envoyée avec succès ! (mode démo)" });
      setSubject("");
      setContent("");
      return;
    }

    try {
      const token = localStorage.getItem("gaspe_api_token");
      const res = await fetch(`${API_URL}/api/newsletter/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category: selectedCategory,
          subject: subject.trim(),
          htmlContent: buildNewsletterHtml(content, categoryInfo.label),
        }),
      });

      const data = await res.json() as { success?: boolean; sent?: number; total?: number; error?: string; errors?: string[] };

      if (res.ok && data.success) {
        setResult({ type: "success", message: `Newsletter envoyée à ${data.sent}/${data.total} abonnés.` });
        setSubject("");
        setContent("");
      } else if (res.ok && data.sent) {
        setResult({ type: "error", message: `Envoi partiel : ${data.sent}/${data.total} abonnés. ${data.errors?.join(", ") ?? ""}` });
      } else {
        setResult({ type: "error", message: data.error ?? `Erreur HTTP ${res.status}` });
      }
    } catch {
      setResult({ type: "error", message: "Erreur de connexion au serveur." });
    } finally {
      setSending(false);
    }
  };

  const categoryInfo = NEWSLETTER_CATEGORIES.find((c) => c.key === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Newsletter – Envoi rapide</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Envoyez des newsletters texte ciblées par catégorie (v1).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/newsletter/abonnes"
            className="inline-flex items-center gap-2 rounded-xl border border-border-light bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface transition-colors"
          >
            Abonnés
          </Link>
          <Link
            href="/admin/newsletter/charte"
            className="inline-flex items-center gap-2 rounded-xl border border-border-light bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface transition-colors"
          >
            Charte
          </Link>
          <Link
            href="/admin/newsletter/drafts"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--gaspe-teal-200)] bg-[var(--gaspe-teal-50)] px-4 py-2 text-sm font-semibold text-[var(--gaspe-teal-700)] hover:bg-[var(--gaspe-teal-100)] transition-colors"
          >
            Éditeur blocs (v2 – beta)
          </Link>
        </div>
      </div>

      {/* Category selector */}
      <div>
        <h2 className="font-heading text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Catégorie</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NEWSLETTER_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`rounded-xl border p-4 text-left transition-all ${
                selectedCategory === cat.key
                  ? "border-primary bg-surface-teal ring-1 ring-primary"
                  : "border-border-light bg-background hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
                {cat.adherentOnly && (
                  <Badge variant="blue">Adhérents</Badge>
                )}
              </div>
              {!cat.adherentOnly && (
                <p className="mt-1 text-xs text-foreground-muted">Adhérents + Candidats</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Compose form */}
      {selectedCategory && (
        <form onSubmit={handleSend} className="rounded-2xl bg-background border border-border-light p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">Composer</h2>
            <Badge variant="teal">{categoryInfo?.label}</Badge>
          </div>

          {result?.type === "error" && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 [data-theme=dark]:bg-red-950/30 [data-theme=dark]:border-red-800 [data-theme=dark]:text-red-400">
              {result.message}
            </div>
          )}
          {result?.type === "success" && (
            <div className="rounded-xl bg-green-50 border border-green-500 p-3 text-sm text-green-600 [data-theme=dark]:bg-green-950/30 [data-theme=dark]:border-green-800 [data-theme=dark]:text-green-400">
              {result.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground">Objet</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
              placeholder="Objet de la newsletter..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Contenu</label>
            <textarea
              required
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={inputClass}
              placeholder="Rédigez le contenu de votre newsletter...

Vous pouvez utiliser du texte simple. Pour les veilles ADF, collez ici le contenu ou les liens à relayer."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-foreground-muted">
              Sera envoyé aux abonnés de la catégorie &quot;{categoryInfo?.label}&quot;
            </p>
            <Button type="submit" disabled={sending}>
              {sending ? "Envoi en cours..." : "Envoyer la newsletter"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
