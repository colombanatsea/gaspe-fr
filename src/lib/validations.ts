import { z } from "zod";

export const jobSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caracteres"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caracteres"),
  companyName: z.string().optional(),
  memberId: z.number().optional(),
  location: z.string().optional(),
  contractType: z.enum(["CDI", "CDD", "Stage", "Alternance"]).optional(),
  category: z.string().optional(),
  salaryRange: z.string().optional(),
  contactEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  applicationUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export const articleSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caracteres"),
  excerpt: z.string().optional(),
  content: z
    .string()
    .min(10, "Le contenu doit contenir au moins 10 caracteres"),
  coverImageUrl: z
    .string()
    .url("URL invalide")
    .optional()
    .or(z.literal("")),
  category: z.enum(["actualite", "position", "presse"]).optional(),
  authorName: z.string().optional(),
  published: z.boolean().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
  email: z.string().email("Email invalide"),
  company: z.string().optional(),
  subject: z.string().min(3, "Le sujet doit contenir au moins 3 caracteres"),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caracteres"),
});

export const eventSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caracteres"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.coerce.date({ message: "La date de debut est requise" }),
  endDate: z.coerce.date().optional(),
  allDay: z.boolean().optional(),
  eventUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export type JobInput = z.infer<typeof jobSchema>;
export type ArticleInput = z.infer<typeof articleSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type EventInput = z.infer<typeof eventSchema>;
