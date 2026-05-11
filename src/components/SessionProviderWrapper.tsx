"use client";

import { SessionProvider } from "next-auth/react";
import Tracker from "./Tracker";

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>
    <Tracker />
    {children}
    </SessionProvider>;
}