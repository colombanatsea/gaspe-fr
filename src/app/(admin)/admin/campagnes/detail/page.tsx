"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CampaignDashboardClient from "./CampaignDashboardClient";

function Inner() {
  const sp = useSearchParams();
  const idStr = sp.get("id") ?? "";
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <p className="text-sm text-foreground-muted">
          Identifiant de campagne invalide.
        </p>
      </div>
    );
  }
  return <CampaignDashboardClient id={id} />;
}

export default function CampaignDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <p className="text-sm text-foreground-muted">Chargement...</p>
        </div>
      }
    >
      <Inner />
    </Suspense>
  );
}
