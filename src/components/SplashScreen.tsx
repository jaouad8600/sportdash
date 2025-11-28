"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [phase, setPhase] = useState(1);

    useEffect(() => {
        // Phase 1: Logo Reveal (0s - 1.5s)
        // Phase 2: Shimmer (1.5s - 2.5s)
        // Phase 3: Color Transition (2.5s - 3.5s)
        // Phase 4: Slide Up (3.5s - 4.5s)

        const timer1 = setTimeout(() => setPhase(2), 1500);
        const timer2 = setTimeout(() => setPhase(3), 2500);
        const timer3 = setTimeout(() => {
            setPhase(4);
            setTimeout(onComplete, 1000); // Complete after slide up
        }, 3500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
            initial={{ y: 0 }}
            animate={phase === 4 ? { y: "-100%" } : { y: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} // Custom cubic-bezier for premium feel
        >
            {/* Background Layer */}
            <motion.div
                className="absolute inset-0 bg-[#140D4D]" // Brand Blue
                animate={phase >= 3 ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.5 }}
            />
            <motion.div
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0 }}
                animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5 }}
            />

            {/* Logo Container */}
            <div className="relative w-64 h-64 md:w-96 md:h-96">
                {/* White Logo (Phase 1 & 2) */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={
                        phase < 3
                            ? { scale: 1, opacity: 1 }
                            : { scale: 1.1, opacity: 0 }
                    }
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <div className="relative w-full h-full overflow-hidden">
                        <Image
                            src="/logo-white-blue.jpg"
                            alt="Teylingereind Logo White"
                            fill
                            className="object-contain"
                            priority
                        />
                        {/* Shimmer Effect */}
                        {phase === 2 && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                                initial={{ x: "-100%" }}
                                animate={{ x: "200%" }}
                                transition={{ duration: 1, ease: "easeInOut" }}
                            />
                        )}
                    </div>
                </motion.div>

                {/* Orange Logo (Phase 3) */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Image
                        src="/logo-orange-white.jpg"
                        alt="Teylingereind Logo Orange"
                        fill
                        className="object-contain"
                        priority
                    />
                </motion.div>
            </div>
        </motion.div>
    );
}
