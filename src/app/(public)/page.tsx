import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { MapPreview } from "@/components/home/MapPreview";
import { LatestNews } from "@/components/home/LatestNews";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <MapPreview />
      <LatestNews />
      <CTASection />
    </>
  );
}
