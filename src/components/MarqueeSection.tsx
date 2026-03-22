"use client";

import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";

interface MarqueeItem {
  id: string;
  text: string;
}

export default function MarqueeSection() {
  const [items, setItems] = useState<MarqueeItem[]>([]);

  useEffect(() => {
    fetch("/api/marquee/visible")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error("Failed to fetch marquee items", err));
  }, []);

  if (items.length === 0) return null;

  const marqueeText = items.map((item) => item.text).join(" | ");

  return (
    <div className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white lg:py-2 py-1 overflow-hidden">
      <Marquee
        speed={40}        // Adjust speed (lower = slower)
        gradient={false}  // Remove gradient fade on edges
        pauseOnHover={true}
        loop={0}          // Infinite loop
        delay={0}
      >
        <span className="text-xs lg:text-sm font-medium mx-4">{marqueeText}</span>
      </Marquee>
    </div>
  );
}