"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { PositionForm, type PositionFormValues, type PositionCategory } from "@/components/admin/PositionForm";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import { getPosition, updatePosition, type StoredPosition } from "@/lib/positions-store";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminEditPositionPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [position, setPosition] = useState<StoredPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!isStaffOrAdmin(user)) {
      router.push("/connexion");
      return;
    }
    getPosition(id)
      .then((p) => {
        if (!p) setError("Position introuvable.");
        setPosition(p);
      })
      .catch(() => setError("Erreur lors du chargement."))
      .finally(() => setLoading(false));
  }, [user, id, router]);

  if (!user || !isStaffOrAdmin(user)) return null;

  if (loading) {
    return <p className="py-12 text-center text-sm text-foreground-muted">Chargement…</p>;
  }

  if (error || !position) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-red-600">{error ?? "Position introuvable."}</p>
      </div>
    );
  }

  const initialValues: PositionFormValues = {
    title: position.title,
    excerpt: position.excerpt,
    content: position.content,
    category: position.category as PositionCategory,
    date: position.date,
    coverImageUrl: position.coverImageUrl ?? "",
    published: position.published,
    tags: position.tags ?? [],
  };

  async function handleSubmit(values: PositionFormValues) {
    if (!values.category) throw new Error("Catégorie requise");
    const updated = await updatePosition(id, {
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
      category: values.category,
      date: values.date,
      coverImageUrl: values.coverImageUrl,
      published: values.published,
      tags: values.tags,
    });
    if (!updated) throw new Error("Échec de la mise à jour");
    router.push("/admin/positions");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Modifier la position</h1>
        <p className="mt-1 text-sm text-foreground-muted">{position.title}</p>
      </div>
      <PositionForm mode="edit" initialValues={initialValues} onSubmit={handleSubmit} />
    </div>
  );
}
