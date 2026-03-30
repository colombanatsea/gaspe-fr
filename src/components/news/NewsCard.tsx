import Link from "next/link";
import { cn } from "@/lib/utils";

type NewsCategory = "actualite" | "position" | "presse";

interface NewsCardProps {
  title: string;
  excerpt: string;
  category: NewsCategory;
  date: string;
  slug: string;
  coverImageUrl?: string;
}

const categoryConfig: Record<
  NewsCategory,
  { label: string; borderClass: string; badgeClass: string }
> = {
  actualite: {
    label: "Actualité",
    borderClass: "border-l-primary",
    badgeClass: "bg-primary/10 text-primary",
  },
  position: {
    label: "Position",
    borderClass: "border-l-warm",
    badgeClass: "bg-warm/20 text-[var(--gaspe-warm-600)]",
  },
  presse: {
    label: "Presse",
    borderClass: "border-l-secondary",
    badgeClass: "bg-secondary/10 text-secondary",
  },
};

const categoryRoutes: Record<NewsCategory, string> = {
  actualite: "/actualites",
  position: "/positions",
  presse: "/presse",
};

export function NewsCard({
  title,
  excerpt,
  category,
  date,
  slug,
  coverImageUrl,
}: NewsCardProps) {
  const config = categoryConfig[category];
  const href = `${categoryRoutes[category]}/${slug}`;

  return (
    <Link href={href} className="group block">
      <article
        className={cn(
          "rounded-lg bg-background p-6 shadow-sm border-l-[3px] transition-shadow hover:shadow-md",
          config.borderClass,
        )}
      >
        {coverImageUrl && (
          <div className="mb-4 overflow-hidden rounded-md">
            <img
              src={coverImageUrl}
              alt={title}
              loading="lazy"
              className="h-40 w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}

        <span
          className={cn(
            "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
            config.badgeClass,
          )}
        >
          {config.label}
        </span>

        <h3 className="mt-3 font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        <p className="mt-2 text-sm text-foreground-muted line-clamp-2">
          {excerpt}
        </p>

        <time className="mt-4 block text-xs text-foreground-muted">{date}</time>
      </article>
    </Link>
  );
}
