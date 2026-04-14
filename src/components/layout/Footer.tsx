import Link from "next/link";
import { footerNavigation } from "@/data/navigation";
import { SITE_NAME, SITE_FULL_NAME, SITE_TAGLINE, SITE_VERSION } from "@/lib/constants";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { GaspeLogoWhite } from "@/components/shared/GaspeLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Footer() {
  return (
    <footer className="relative">
      {/* Wave separator */}
      <div className="bg-surface">
        <svg
          viewBox="0 0 1440 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 0h1440v32C1200 64 960 16 720 40S240 64 0 32z"
            fill="var(--gaspe-neutral-900)"
          />
        </svg>
      </div>

      <div className="bg-[var(--gaspe-neutral-900)] text-white">
        {/* Newsletter CTA strip */}
        <div className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-white">
                  Restez informé des actualités maritimes
                </h3>
                <p className="mt-1 text-sm text-[var(--gaspe-neutral-400)]">
                  Positions, événements, offres d&apos;emploi — directement dans votre boîte mail.
                </p>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            {/* Brand — wider column */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gaspe-gradient shadow-lg shadow-[var(--gaspe-teal-600)]/20">
                  <GaspeLogoWhite size={26} />
                </div>
                <div>
                  <span className="font-heading text-xl font-bold block leading-tight">{SITE_NAME}</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--gaspe-neutral-500)]">
                    Depuis 1951
                  </span>
                </div>
              </div>
              <p className="text-sm text-[var(--gaspe-neutral-400)] leading-relaxed max-w-xs">
                {SITE_FULL_NAME}
              </p>
              <p className="mt-4 font-heading text-sm font-medium italic text-[var(--gaspe-teal-400)]">
                {SITE_TAGLINE}
              </p>

              {/* Social icons */}
              <div className="mt-6 flex gap-3">
                {[
                  {
                    label: "LinkedIn",
                    href: "https://www.linkedin.com/company/gaspe-groupement-des-armateurs-de-services-publics-maritimes/",
                    icon: (
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    ),
                  },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-[var(--gaspe-neutral-400)] hover:bg-[var(--gaspe-teal-600)] hover:text-white transition-all duration-200"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      {social.icon}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Groupement */}
            <div className="md:col-span-2 md:col-start-6">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-widest text-[var(--gaspe-teal-400)] mb-5">
                Le Groupement
              </h4>
              <ul className="space-y-3">
                {footerNavigation.groupement.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-[var(--gaspe-neutral-400)] hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div className="md:col-span-2">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-widest text-[var(--gaspe-teal-400)] mb-5">
                Ressources
              </h4>
              <ul className="space-y-3">
                {footerNavigation.ressources.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-[var(--gaspe-neutral-400)] hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-2">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-widest text-[var(--gaspe-teal-400)] mb-5">
                Contact
              </h4>
              <ul className="space-y-3 text-sm text-[var(--gaspe-neutral-400)]">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[var(--gaspe-teal-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  contact@gaspe.fr
                </li>
                <li className="mt-4">
                  <Link
                    href="/nos-compagnies-recrutent"
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--gaspe-teal-600)]/20 px-3 py-2 text-[var(--gaspe-teal-400)] hover:bg-[var(--gaspe-teal-600)]/30 transition-colors font-medium"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    Nos Compagnies Recrutent
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[var(--gaspe-neutral-500)]">
              &copy; {new Date().getFullYear()} {SITE_NAME}. Tous droits réservés. <span className="ml-2 text-[var(--gaspe-neutral-600)]">v{SITE_VERSION}</span>
            </p>
            <div className="flex items-center gap-6">
              {footerNavigation.legal.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs text-[var(--gaspe-neutral-500)] hover:text-[var(--gaspe-neutral-300)] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-4 text-center text-[10px] text-[var(--gaspe-neutral-600)]">
            Concu par{" "}
            <a href="https://colombanatsea.com" target="_blank" rel="noopener noreferrer" className="text-[var(--gaspe-neutral-400)] hover:text-white transition-colors">
              Colomban
            </a>
            {" "}·{" "}Protege par{" "}
            <a href="https://vaiata-dynamics.com/fr/cyber/" target="_blank" rel="noopener noreferrer" className="text-[var(--gaspe-neutral-400)] hover:text-white transition-colors">
              VAIATA Cyber
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
