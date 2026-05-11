"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Tracker() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const trackPageView = async () => {
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: pathname }),
        });
      } catch (error) {
        // silently fail
      }
    };

    trackPageView();
  }, [pathname, session]);

  return null;
}