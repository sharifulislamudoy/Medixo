import MarqueeSection from "@/components/MarqueeSection";
import Navbar from "@/components/Navbar";
import ReviewModal from "@/components/ReviewModal";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ReviewModal />
      <MarqueeSection />
      <Navbar />
      {children}
    </>
  );
}