"use client";
import React from "react";
import { motion } from "framer-motion";
import SpecularButton from "../ui/SpecularButton";
import GradientWaves from "../ui/GradientWaves";
import { useTheme } from "../../hooks/useTheme";

export const HeroParallax = () => {
    const ref = React.useRef(null);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div
            ref={ref}
            id="home"
            className="h-[100vh] flex items-center justify-center overflow-hidden antialiased relative w-full"
        >
            {/* Background 3D Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <GradientWaves
                    horizonColor={isDark ? "#f0f0f0" : "#0f172a"} // Sangat gelap (slate-900)
                    waveColor={isDark ? "#e8e8e8" : "#1e293b"}    // slate-800
                    crestColor={isDark ? "#ffffff" : "#475569"}   // slate-600
                    speed={0.4}
                    amplitude={isDark ? 2.5 : 3.5}
                    waveScale={0.6}
                    waveRatio={0.9}
                    swell={35}
                    turbulence={20}
                    tilt={1.11}
                    zoom={1}
                    height={isDark ? 5.5 : 2.5}
                    fogDepth={isDark ? 15 : 40}
                    detail="medium"
                    brightness={1}
                    opacity={1}
                    mouseInteraction
                    parallaxStrength={0.5}
                    grain
                    grainIntensity={0.05}
                />
            </div>

            {/* Foreground Content */}
            <div className="z-10 w-full">
                <HeroText />
            </div>
        </div>
    );
};

export const HeroText = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 mt-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="flex flex-col items-center text-center"
            >

                {/* Heading (Amoresa + Perandory Style Replica) */}
                <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-bold text-slate-900 dark:text-white mb-6 leading-[0.9] drop-shadow-sm flex flex-col md:flex-row items-center justify-center gap-x-6 flex-wrap">
                    <div className="flex items-center">
                        <span className="font-['Pinyon_Script',_cursive] text-[1.5em] font-normal tracking-normal -mr-3">B</span>
                        <span className="font-['Cormorant_Garamond',_serif] uppercase tracking-normal">UILD</span>
                    </div>
                    <span className="font-['Pinyon_Script',_cursive] text-5xl md:text-6xl font-normal lowercase my-2 md:my-0">and</span>
                    <div className="flex items-center">
                        <span className="font-['Pinyon_Script',_cursive] text-[1.5em] font-normal tracking-normal -mr-3">G</span>
                        <span className="font-['Cormorant_Garamond',_serif] uppercase tracking-normal">ROW</span>
                    </div>
                </h1>
                
                {/* Secondary Heading text */}
                <div className="text-3xl md:text-4xl lg:text-5xl font-['Cormorant_Garamond',_serif] uppercase tracking-widest text-slate-900 dark:text-white mb-10 font-semibold drop-shadow-sm text-center">
                    With A Website Built For Life
                </div>

                {/* Subtitle */}
                <p className="font-['Plus_Jakarta_Sans',_sans-serif] text-slate-800 dark:text-slate-100 text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-medium">
                    Stop paying endless subscriptions. <br/>We craft premium, high-performing websites designed to elevate your brand and scale your business.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <SpecularButton
                      size="lg"
                      radius={9999} // Pill shape
                      tint="#000000"
                      tintOpacity={0.8}
                      blur={10}
                      textColor="#ffffff"
                      lineColor="#ffffff"
                      baseColor="#1a1a1a"
                      intensity={1}
                      shineSize={20}
                      shineFade={60}
                      thickness={1}
                      speed={0.5}
                      followMouse
                      proximity={200}
                      autoAnimate={true}
                      onClick={() => window.open('https://wa.me/6285156296580', '_blank')}
                    >
                      Book Now
                    </SpecularButton>
                    <button className="px-8 py-3.5 rounded-full bg-white hover:bg-gray-50 text-slate-800 border border-gray-200 text-sm font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                        <a href="#about">Learn More</a>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};