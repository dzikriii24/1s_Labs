"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpecularButton from "../ui/SpecularButton";
import GradientWaves from "../ui/GradientWaves";
import { useTheme } from "../../hooks/useTheme";
import lazismuImg from "../assets/lazismu.png";
import himatifImg from "../assets/himatif.png";

export const HeroParallax = () => {
    const ref = React.useRef(null);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div
            ref={ref}
            id="home"
            className="min-h-[85vh] md:h-[100vh] py-10 md:py-0 flex items-center justify-center overflow-hidden antialiased relative w-full"
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
    const phrases = ["a website", "an App", "an AI", "a System"];
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % phrases.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [phrases.length]);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 mt-8 sm:mt-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="flex flex-col items-center text-center"
            >

                {/* Heading */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-['Mori',_sans-serif] tracking-tight text-slate-900 dark:text-white mb-1 leading-[1.15] flex flex-wrap justify-center gap-x-2 sm:gap-x-4">
                    <span>Grow</span>
                    <span>Your</span>
                    <span>Business</span>
                </h1>

                <div className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-['Mori',_sans-serif] tracking-tight text-slate-600 dark:text-slate-300 mb-3 sm:mb-5 font-normal text-center flex flex-wrap justify-center items-center gap-x-1.5 sm:gap-x-3">
                    <span>With</span>
                    <div className="inline-flex justify-center items-center w-[120px] sm:w-[170px] md:w-[220px] h-[1.2em] overflow-hidden font-medium text-slate-800 dark:text-slate-100">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={phrases[index]}
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -30, opacity: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="whitespace-nowrap inline-block"
                            >
                                {phrases[index]}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <span>built for life.</span>
                </div>

                {/* Subtitle with Primary SEO Keywords */}
                <p className="font-['Inter',_sans-serif] text-slate-800 dark:text-slate-100 text-xs sm:text-base md:text-lg max-w-2xl mb-6 sm:mb-8 leading-relaxed font-medium px-2">
                    Jasa Pembuatan Website, Custom Software &amp; IT Consulting berkualitas tinggi. Solusi digital tepat guna untuk akselerasi bisnis Anda tanpa langganan berulang.
                </p>

                {/* Buttons */}
                <div className="flex flex-row items-center justify-center space-x-3 mb-6 sm:mb-8">
                    <SpecularButton
                        size="md"
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
                    <a
                        href="#services"
                        className="px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-gray-200 dark:border-slate-700 text-xs sm:text-sm font-medium transition-all shadow-xs hover:shadow-md"
                    >
                        Explore Services
                    </a>
                </div>

                {/* Glassmorphism Cards: 2 Columns on Mobile */}
                <div className="flex flex-row items-stretch justify-center gap-2 sm:gap-4 md:gap-5 w-full max-w-3xl mx-auto px-1 sm:px-4">
                    {/* Card 1: Top Notch Company */}
                    <div className="flex-1 w-full flex items-center p-2 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg relative overflow-hidden group hover:bg-white/30 dark:hover:bg-slate-900/30 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        <img 
                            src="https://i.pinimg.com/736x/05/c2/13/05c213954aab8dbdd4e10dcf0634e0f1.jpg" 
                            alt="DPD RI Jawa Barat" 
                            className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-lg sm:rounded-xl shadow-xs border border-white/20 relative z-10 shrink-0"
                        />
                        <div className="ml-2 sm:ml-4 text-left flex-1 relative z-10">
                            <h3 className="text-[11px] sm:text-base md:text-lg font-bold text-slate-900 dark:text-white font-['Mori',_sans-serif] tracking-tight line-clamp-1">DPD RI Jabar</h3>
                            <p className="text-[9px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300 mt-0.5 font-['Inter',_sans-serif] line-clamp-2 leading-tight sm:leading-relaxed">
                                Platform legislasi &amp; aspirasi digital.
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Clients */}
                    <div className="flex-1 w-full p-2 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg flex flex-col justify-center relative overflow-hidden group hover:bg-white/30 dark:hover:bg-slate-900/30 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        <div className="flex -space-x-1.5 sm:-space-x-3 mb-1 sm:mb-2 relative z-10">
                            <img className="inline-block h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full ring-2 ring-white/50 dark:ring-slate-800 object-cover bg-white shadow-xs" src={lazismuImg} alt="Lazismu" />
                            <img className="inline-block h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full ring-2 ring-white/50 dark:ring-slate-800 object-cover bg-white shadow-xs" src="https://i.pinimg.com/736x/b1/36/9c/b1369cb4d78299ff69c8b7eaf014420b.jpg" alt="Kominfo" />
                            <img className="inline-block h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full ring-2 ring-white/50 dark:ring-slate-800 object-cover bg-white shadow-xs" src={himatifImg} alt="Himatif" />
                            <div className="inline-flex h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full ring-2 ring-white/50 dark:ring-slate-800 bg-white dark:bg-slate-800 shadow-xs">
                                <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-slate-800 dark:text-white">80+</span>
                            </div>
                        </div>
                        <p className="text-[10px] sm:text-xs md:text-sm text-slate-800 dark:text-slate-100 font-medium font-['Inter',_sans-serif] text-left relative z-10 leading-tight sm:leading-snug line-clamp-2">
                            200+ klien &amp; proyek terverifikasi
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};