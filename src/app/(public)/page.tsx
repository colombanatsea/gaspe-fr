import { HeroSection } from "@/components/home/HeroSection";
import { SearchBar } from "@/components/home/SearchBar";
import { StatsSection } from "@/components/home/StatsSection";
import { MapPreview } from "@/components/home/MapPreview";
import { LatestNews } from "@/components/home/LatestNews";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <section className="relative z-10 -mt-8 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </section>
      <StatsSection />
      <MapPreview />
      <LatestNews />
      <CTASection />
    </>
  );
}
