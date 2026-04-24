import HeroSection from "@/components/HeroSection";
import HomeSections from "@/components/HomeSections";
import PromotionModalViewer from "@/components/PromotionModalViewer";

export default function Home() {
  return (
    <div>
      <PromotionModalViewer />
      <HeroSection />
      <HomeSections />
    </div>
  );
}