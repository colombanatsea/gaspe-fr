import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth.js tables ─────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  password: text("password"),
  role: text("role").default("editor").notNull(),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ─── Domain tables ──────────────────────────────────────────────

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  city: text("city"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  region: text("region"),
  territory: text("territory").$type<"metropole" | "dom-tom">(),
  category: text("category").$type<"titulaire" | "associe">(),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  employeeCount: integer("employee_count"),
  shipCount: integer("ship_count"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description").notNull(),
  companyName: text("company_name"),
  memberId: integer("member_id").references(() => members.id, {
    onDelete: "set null",
  }),
  location: text("location"),
  contractType: text("contract_type").$type<
    "CDI" | "CDD" | "Stage" | "Alternance"
  >(),
  category: text("category"),
  salaryRange: text("salary_range"),
  published: integer("published", { mode: "boolean" }).default(false).notNull(),
  publishedAt: text("published_at"),
  expiresAt: text("expires_at"),
  contactEmail: text("contact_email"),
  applicationUrl: text("application_url"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImageUrl: text("cover_image_url"),
  category: text("category").$type<"actualite" | "position" | "presse">(),
  published: integer("published", { mode: "boolean" }).default(false).notNull(),
  publishedAt: text("published_at"),
  authorName: text("author_name"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  location: text("location"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  allDay: integer("all_day", { mode: "boolean" }).default(false).notNull(),
  eventUrl: text("event_url"),
  published: integer("published", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const contactSubmissions = sqliteTable("contact_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  read: integer("read", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// ─── Inferred types ─────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type DbMember = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

export type DbEvent = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
