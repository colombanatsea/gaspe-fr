import type { Metadata } from "next";
import Link from "next/link";
import { CharteClient } from "./CharteClient";

export const metadata: Metadata = {
  title: "Charte newsletter — Admin GASPE",
  robots: { index: false, follow: false },
};

export default function CharteNewsletterPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Charte newsletter</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Identité graphique appliquée aux emails : expéditeur, logo, couleurs,
            footer (mentions, adresse, liens). Injectée dans le renderer HTML lors de l&apos;envoi.
          </p>
        </div>
        <Link
          href="/admin/newsletter"
          className="text-sm text-foreground-muted hover:text-primary underline"
        >
          ← Retour
        </Link>
      </div>
      <CharteClient />
    </div>
  );
}
