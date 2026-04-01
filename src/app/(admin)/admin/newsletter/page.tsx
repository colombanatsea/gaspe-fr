"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { NEWSLETTER_CATEGORIES } from "@/lib/auth/types";

const inputClass =
  "mt-1 block w-full rounded-xl border border-border-light bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdminNewsletterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") router.push("/connexion");
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedCategory || !subject.trim() || !content.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setSending(true);
    // In production, this would call POST /api/newsletter/send
    // For now, show the UI and log
    console.warn("[Newsletter] Envoi simulé — connecter POST /api/newsletter/send en production");
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSent(true);
    setSubject("");
    setContent("");
    setTimeout(() => setSent(false), 5000);
  };

  const categoryInfo = NEWSLETTER_CATEGORIES.find((c) => c.key === selectedCategory);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Newsletter</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Envoyez des newsletters ciblées par catégorie aux abonnés.
        </p>
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

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}
          {sent && (
            <div className="rounded-xl bg-green-50 border border-green-500 p-3 text-sm text-green-600">
              Newsletter envoyée avec succès !
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
