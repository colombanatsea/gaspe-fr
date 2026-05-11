"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { PositionForm, type PositionFormValues } from "@/components/admin/PositionForm";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import { createPosition } from "@/lib/positions-store";

export default function AdminNewPositionPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user || !isStaffOrAdmin(user)) {
    if (typeof window !== "undefined") router.push("/connexion");
    return null;
  }

  async function handleSubmit(values: PositionFormValues) {
    if (!values.category) throw new Error("Catégorie requise");
    await createPosition({
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
      category: values.category,
      date: values.date,
      coverImageUrl: values.coverImageUrl,
      published: values.published,
      tags: values.tags,
    });
    router.push("/admin/positions");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Nouvelle position / article</h1>
        <p className="mt-1 text-sm text-foreground-muted">Publiez une position, un communiqué de presse ou une actualité.</p>
      </div>
      <PositionForm mode="new" onSubmit={handleSubmit} />
    </div>
  );
}
