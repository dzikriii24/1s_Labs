"use client";
import React from "react";
import { motion } from "framer-motion";
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
                {/* Badge */}
                <div className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-full mb-8 shadow-sm">
                   <span className="text-yellow-500">⭐</span>
                   <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">From Strategy to Success</span>
                </div>
                
                {/* Heading */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-slate-800 dark:text-white mb-6 font-serif">
                    Build and <span className="font-serif italic text-slate-600">Growth</span> with <br/> Scalable Tools
                </h1>
                
                {/* Subtitle */}
                <p className="text-slate-500 dark:text-slate-300 text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
                    Easily adapt to changes and scale your operations with our flexible infrastructure, designed to support your business growth.
                </p>
                
                {/* Buttons */}
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button className="px-8 py-3.5 rounded-full bg-[#1A1A1A] hover:bg-black text-white text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                        Get Started
                    </button>
                    <button className="px-8 py-3.5 rounded-full bg-white hover:bg-gray-50 text-slate-800 border border-gray-200 text-sm font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                        Learn More
                    </button>
                </div>
            </motion.div>
        </div>
    );
};