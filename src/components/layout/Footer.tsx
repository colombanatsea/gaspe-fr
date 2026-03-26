import Link from "next/link";
import { footerNavigation } from "@/data/navigation";
import { SITE_NAME, SITE_FULL_NAME, SITE_TAGLINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-[var(--gaspe-neutral-900)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md gaspe-gradient">
                <span className="font-heading text-sm font-bold text-white">A</span>
              </div>
              <span className="font-heading text-lg font-bold">{SITE_NAME}</span>
            </div>
            <p className="text-sm text-[var(--gaspe-neutral-400)] leading-relaxed">
              {SITE_FULL_NAME}
            </p>
            <p className="mt-3 text-sm italic text-[var(--gaspe-teal-400)]">
              {SITE_TAGLINE}
            </p>
          </div>

          {/* Groupement */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-[var(--gaspe-neutral-400)] mb-4">
              Le Groupement
            </h4>
            <ul className="space-y-2">
              {footerNavigation.groupement.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--gaspe-neutral-300)] hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-[var(--gaspe-neutral-400)] mb-4">
              Ressources
            </h4>
            <ul className="space-y-2">
              {footerNavigation.ressources.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--gaspe-neutral-300)] hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-[var(--gaspe-neutral-400)] mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-[var(--gaspe-neutral-300)]">
              <li>contact@gaspe.fr</li>
              <li>
                <Link
                  href="/nos-compagnies-recrutent"
                  className="text-[var(--gaspe-teal-400)] hover:text-white transition-colors font-medium"
                >
                  Nos Compagnies Recrutent
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--gaspe-neutral-800)] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--gaspe-neutral-500)]">
            &copy; {new Date().getFullYear()} {SITE_NAME}. Tous droits réservés.
          </p>
          <div className="flex gap-4">
            {footerNavigation.legal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs text-[var(--gaspe-neutral-500)] hover:text-[var(--gaspe-neutral-300)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
