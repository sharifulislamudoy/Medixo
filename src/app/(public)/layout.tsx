import MarqueeSection from "@/components/MarqueeSection";
import Navbar from "@/components/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarqueeSection />
      <Navbar />
      {children}
    </>
  );
}