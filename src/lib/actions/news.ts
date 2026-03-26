"use server";

import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { articleSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { auth } from "@/lib/auth";

const ARTICLES_PER_PAGE = 12;

export async function getArticles(category?: string, page: number = 1) {
  const db = getDb();
  const conditions = [eq(articles.published, true)];

  if (category) {
    conditions.push(
      eq(articles.category, category as "actualite" | "position" | "presse"),
    );
  }

  const offset = (page - 1) * ARTICLES_PER_PAGE;

  return db
    .select()
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.publishedAt))
    .limit(ARTICLES_PER_PAGE)
    .offset(offset);
}

export async function getArticleBySlug(slug: string) {
  const db = getDb();
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);
  return article ?? null;
}

export async function createArticle(data: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorise");

  const db = getDb();
  const parsed = articleSchema.parse(data);
  const slug = slugify(parsed.title);

  await db.insert(articles).values({
    ...parsed,
    slug,
    publishedAt: parsed.published ? new Date().toISOString() : null,
  });

  revalidatePath("/actualites");
}

export async function updateArticle(id: number, data: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorise");

  const db = getDb();
  const parsed = articleSchema.parse(data);

  await db
    .update(articles)
    .set({
      ...parsed,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(articles.id, id));

  revalidatePath("/actualites");
}

export async function deleteArticle(id: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorise");

  await getDb().delete(articles).where(eq(articles.id, id));
  revalidatePath("/actualites");
}
