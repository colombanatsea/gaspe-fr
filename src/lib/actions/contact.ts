"use server";

import { getDb } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { contactSchema } from "@/lib/validations";

export async function submitContact(data: unknown) {
  const parsed = contactSchema.parse(data);

  await getDb().insert(contactSubmissions).values(parsed);

  return { success: true };
}
