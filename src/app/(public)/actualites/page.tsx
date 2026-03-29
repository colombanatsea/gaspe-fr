import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Actualités",
  description:
    "Retrouvez nos actualités dans la page Positions.",
};

export default function ActualitesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
        Page déplacée
      </h1>
      <p className="text-foreground-muted mb-6">
        Retrouvez nos actualités dans la page Positions.
      </p>
      <Link
        href="/positions"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
      >
        Voir les Positions &rarr;
      </Link>
    </div>
  );
}
