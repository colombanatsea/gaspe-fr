import Link from "next/link";
import { members } from "@/data/members";

export function MapPreview() {
  const metroMembers = members.filter((m) => m.territory === "metropole");
  const domTomMembers = members.filter((m) => m.territory === "dom-tom");

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-foreground">
            Nos adhérents sur le territoire
          </h2>
          <p className="mt-2 text-foreground-muted max-w-xl mx-auto">
            {members.length} armateurs assurent les liaisons maritimes de service
            public en métropole et outre-mer.
          </p>
        </div>

        {/* Static preview — links to the full interactive map */}
        <Link
          href="/nos-adherents"
          className="group block relative rounded-xl overflow-hidden bg-background border border-border-light hover:border-primary transition-colors"
        >
          <div className="aspect-[2/1] sm:aspect-[3/1] bg-surface-teal flex items-center justify-center relative">
            {/* Stylized France outline placeholder */}
            <div className="text-center p-8">
              <div className="inline-flex items-center gap-6 flex-wrap justify-center">
                <div className="text-center">
                  <p className="font-heading text-3xl font-bold text-primary">
                    {metroMembers.length}
                  </p>
                  <p className="text-xs text-foreground-muted uppercase tracking-wide">
                    Métropole
                  </p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="font-heading text-3xl font-bold text-secondary">
                    {domTomMembers.length}
                  </p>
                  <p className="text-xs text-foreground-muted uppercase tracking-wide">
                    Outre-mer
                  </p>
                </div>
              </div>
              <p className="mt-6 text-sm text-foreground-muted group-hover:text-primary transition-colors">
                Voir la carte interactive &rarr;
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
