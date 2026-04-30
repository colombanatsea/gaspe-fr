"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AttestationClient from "./AttestationClient";

function Inner() {
  const sp = useSearchParams();
  const slug = sp.get("slug") ?? "";
  const yearStr = sp.get("year") ?? "";
  const year = Number(yearStr);
  if (!slug || !Number.isFinite(year) || year <= 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-sm text-foreground-muted">
          Parametres invalides. URL attendue : /admin/campagnes/attestation?slug=X&amp;year=YYYY
        </p>
      </div>
    );
  }
  return <AttestationClient slug={slug} year={year} />;
}

export default function AttestationPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <p className="text-sm text-foreground-muted">Chargement...</p>
        </div>
      }
    >
      <Inner />
    </Suspense>
  );
}
