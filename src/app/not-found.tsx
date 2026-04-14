import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GaspeLogo } from "@/components/shared/GaspeLogo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <div className="mb-6">
        <GaspeLogo size={64} />
      </div>
      <h1 className="font-heading text-5xl font-bold text-foreground">404</h1>
      <p className="mt-3 text-lg text-foreground-muted">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <div className="mt-8">
        <Button href="/">Retour à l&apos;accueil</Button>
      </div>

      {/* Liens utiles */}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {[
          { label: "Nos adhérents", href: "/nos-adherents" },
          { label: "Recrutement", href: "/nos-compagnies-recrutent" },
          { label: "Formations", href: "/formations" },
          { label: "Contact", href: "/contact" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-border-light px-4 py-2 text-sm font-medium text-foreground-muted hover:text-primary hover:border-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
