import HeroSection from "@/components/HeroSection";
import HomeSections from "@/components/HomeSections";
import NewArrivals from "@/components/NewArrivals";
import PromotionModalViewer from "@/components/PromotionModalViewer";

export default function Home() {
  return (
    <div>
      <PromotionModalViewer />
      <HeroSection />
      <NewArrivals />
      <HomeSections />
    </div>
  );
}