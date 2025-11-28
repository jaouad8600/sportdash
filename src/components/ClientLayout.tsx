"use client";

import React, { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);
    const pathname = usePathname();

    // Optional: Only show splash on home page or dashboard root
    // For now, show on initial load regardless of route, but we might want to persist state
    // so it doesn't show on every navigation if we were using a router that remounts layout (Next.js layout persists).
    // Since this is in layout, it should persist across client-side navigations.
    // It will only show on full refresh.

    return (
        <>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
            {children}
        </>
    );
}
