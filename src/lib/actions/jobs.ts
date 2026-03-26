"use server";

import { eq, desc, and, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { jobSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { auth } from "@/lib/auth";

interface JobFilters {
  contractType?: string;
  category?: string;
  search?: string;
}

export async function getJobs(filters?: JobFilters) {
  const db = getDb();
  const conditions = [eq(jobs.published, true)];

  if (filters?.contractType) {
    conditions.push(
      eq(jobs.contractType, filters.contractType as "CDI" | "CDD" | "Stage" | "Alternance"),
    );
  }
  if (filters?.category) {
    conditions.push(eq(jobs.category, filters.category));
  }
  if (filters?.search) {
    conditions.push(like(jobs.title, `%${filters.search}%`));
  }

  return db
    .select()
    .from(jobs)
    .where(and(...conditions))
    .orderBy(desc(jobs.publishedAt));
}

export async function getJobBySlug(slug: string) {
  const db = getDb();
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.slug, slug))
    .limit(1);
  return job ?? null;
}

export async function createJob(data: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorise");

  const db = getDb();
  const parsed = jobSchema.parse(data);
  const slug = slugify(parsed.title);

  await db.insert(jobs).values({
    ...parsed,
    slug,
    publishedAt: parsed.published ? new Date().toISOString() : null,
  });

  revalidatePath("/nos-compagnies-recrutent");
}

export async function updateJob(id: number, data: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorise");

  const db = getDb();
  const parsed = jobSchema.parse(data);

  await db
    .update(jobs)
    .set({
      ...parsed,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobs.id, id));

  revalidatePath("/nos-compagnies-recrutent");
}

export async function deleteJob(id: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorise");

  await getDb().delete(jobs).where(eq(jobs.id, id));
  revalidatePath("/nos-compagnies-recrutent");
}

export async function toggleJobPublished(id: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorise");

  const db = getDb();
  const [existing] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);

  if (!existing) throw new Error("Offre introuvable");

  const newPublished = !existing.published;

  await db
    .update(jobs)
    .set({
      published: newPublished,
      publishedAt: newPublished ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobs.id, id));

  revalidatePath("/nos-compagnies-recrutent");
}
