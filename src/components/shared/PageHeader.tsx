import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="bg-background border-b border-border-light">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {breadcrumbs && (
          <nav className="mb-3 text-sm text-foreground-muted" aria-label="Fil d'Ariane">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Accueil
                </Link>
              </li>
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="text-border">/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-primary transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-lg text-foreground-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
