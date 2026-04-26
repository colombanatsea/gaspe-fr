"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import VoteDetailClient from "./VoteDetailClient";

function Inner() {
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  return <VoteDetailClient id={id} />;
}

export default function VoteDetailPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><p className="text-sm text-foreground-muted">Chargement…</p></div>}>
      <Inner />
    </Suspense>
  );
}
